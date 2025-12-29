-- MUVO API Platform - Additional Schema for B2B API
-- Run this AFTER the main supabase-schema.sql

-- ============================================
-- 1. API PARTNERS TABLE
-- ============================================
CREATE TABLE api_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  company TEXT,
  website TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'cancelled')),
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'starter', 'pro', 'enterprise')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_api_partners_status ON api_partners(status);
CREATE INDEX idx_api_partners_email ON api_partners(email);

-- ============================================
-- 2. API KEYS TABLE
-- ============================================
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES api_partners(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL UNIQUE, -- SHA-256 hash of the actual key
  key_prefix TEXT NOT NULL, -- First 8 chars for display (e.g., "muvo_pk_12345678...")
  name TEXT NOT NULL, -- User-friendly name (e.g., "Production Key", "Test Key")
  environment TEXT NOT NULL DEFAULT 'production' CHECK (environment IN ('test', 'production')),
  permissions JSONB NOT NULL DEFAULT '{"read": true, "write": true}'::jsonb,
  rate_limit_per_hour INTEGER DEFAULT 1000,
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_api_keys_partner_id ON api_keys(partner_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_is_active ON api_keys(is_active);

-- ============================================
-- 3. API USAGE TRACKING
-- ============================================
CREATE TABLE api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES api_partners(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partition by month for performance
CREATE INDEX idx_api_usage_partner_id ON api_usage(partner_id, created_at DESC);
CREATE INDEX idx_api_usage_api_key_id ON api_usage(api_key_id, created_at DESC);
CREATE INDEX idx_api_usage_created_at ON api_usage(created_at DESC);

-- ============================================
-- 4. WEBHOOKS TABLE
-- ============================================
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES api_partners(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL, -- ['review.created', 'review.updated', 'place.created', etc.]
  secret TEXT NOT NULL, -- For HMAC signature verification
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_webhooks_partner_id ON webhooks(partner_id);
CREATE INDEX idx_webhooks_is_active ON webhooks(is_active);

-- ============================================
-- 5. WEBHOOK DELIVERIES (Audit Log)
-- ============================================
CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  delivered_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id, created_at DESC);
CREATE INDEX idx_webhook_deliveries_event_type ON webhook_deliveries(event_type);

-- ============================================
-- 6. PARTNER ATTRIBUTION (Track Review Sources)
-- ============================================
-- Add partner_id to reviews table to track which partner submitted it
ALTER TABLE reviews ADD COLUMN partner_id UUID REFERENCES api_partners(id);
ALTER TABLE reviews ADD COLUMN source TEXT DEFAULT 'web'; -- 'web', 'api', 'mobile'

CREATE INDEX idx_reviews_partner_id ON reviews(partner_id);
CREATE INDEX idx_reviews_source ON reviews(source);

-- ============================================
-- 7. API RATE LIMITING (Redis-style in Postgres)
-- ============================================
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  request_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(api_key_id, window_start)
);

CREATE INDEX idx_rate_limits_api_key_window ON rate_limits(api_key_id, window_start);

-- Auto-cleanup old rate limit records (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. API TIERS & LIMITS
-- ============================================
CREATE TABLE api_tiers (
  tier TEXT PRIMARY KEY CHECK (tier IN ('free', 'starter', 'pro', 'enterprise')),
  rate_limit_per_hour INTEGER NOT NULL,
  rate_limit_per_day INTEGER NOT NULL,
  max_api_keys INTEGER NOT NULL,
  webhook_enabled BOOLEAN DEFAULT false,
  priority_support BOOLEAN DEFAULT false,
  price_per_month DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed tier data
INSERT INTO api_tiers (tier, rate_limit_per_hour, rate_limit_per_day, max_api_keys, webhook_enabled, priority_support, price_per_month) VALUES
('free', 100, 1000, 1, false, false, 0),
('starter', 1000, 10000, 3, true, false, 29),
('pro', 10000, 100000, 10, true, true, 99),
('enterprise', 100000, 1000000, 50, true, true, 499);

-- ============================================
-- 9. FUNCTIONS FOR API KEY MANAGEMENT
-- ============================================

-- Function to generate API key prefix
CREATE OR REPLACE FUNCTION generate_api_key_prefix()
RETURNS TEXT AS $$
BEGIN
  RETURN 'muvo_' || CASE 
    WHEN NEW.environment = 'test' THEN 'test_'
    ELSE 'live_'
  END || substring(md5(random()::text) from 1 for 24);
END;
$$ LANGUAGE plpgsql;

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_api_key_id UUID,
  p_limit INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
  v_window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Round down to current hour
  v_window_start := date_trunc('hour', NOW());
  
  -- Get or create rate limit record
  INSERT INTO rate_limits (api_key_id, window_start, request_count)
  VALUES (p_api_key_id, v_window_start, 1)
  ON CONFLICT (api_key_id, window_start)
  DO UPDATE SET request_count = rate_limits.request_count + 1
  RETURNING request_count INTO v_count;
  
  RETURN v_count <= p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE api_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

-- Partners can only see their own data
CREATE POLICY "Partners can view their own data" ON api_partners
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Partners can update their own data" ON api_partners
  FOR UPDATE USING (created_by = auth.uid());

-- API keys policies
CREATE POLICY "Partners can view their own API keys" ON api_keys
  FOR SELECT USING (
    partner_id IN (SELECT id FROM api_partners WHERE created_by = auth.uid())
  );

CREATE POLICY "Partners can create API keys" ON api_keys
  FOR INSERT WITH CHECK (
    partner_id IN (SELECT id FROM api_partners WHERE created_by = auth.uid())
  );

CREATE POLICY "Partners can delete their own API keys" ON api_keys
  FOR DELETE USING (
    partner_id IN (SELECT id FROM api_partners WHERE created_by = auth.uid())
  );

-- ============================================
-- 11. TRIGGERS
-- ============================================

-- Update updated_at on api_partners
CREATE TRIGGER update_api_partners_updated_at BEFORE UPDATE ON api_partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at on api_keys
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update last_used_at on API key usage
CREATE OR REPLACE FUNCTION update_api_key_last_used()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE api_keys 
  SET last_used_at = NOW() 
  WHERE id = NEW.api_key_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_api_key_last_used_trigger
AFTER INSERT ON api_usage
FOR EACH ROW EXECUTE FUNCTION update_api_key_last_used();

-- ============================================
-- 12. VIEWS FOR ANALYTICS
-- ============================================

-- Partner usage summary
CREATE VIEW partner_usage_summary AS
SELECT 
  p.id AS partner_id,
  p.name AS partner_name,
  p.tier,
  COUNT(DISTINCT k.id) AS api_key_count,
  COUNT(u.id) AS total_requests,
  COUNT(CASE WHEN u.created_at > NOW() - INTERVAL '24 hours' THEN 1 END) AS requests_last_24h,
  COUNT(CASE WHEN u.created_at > NOW() - INTERVAL '1 hour' THEN 1 END) AS requests_last_hour,
  COUNT(CASE WHEN u.status_code >= 400 THEN 1 END) AS error_count,
  AVG(u.response_time_ms) AS avg_response_time_ms,
  COUNT(DISTINCT r.id) AS reviews_contributed
FROM api_partners p
LEFT JOIN api_keys k ON k.partner_id = p.id
LEFT JOIN api_usage u ON u.partner_id = p.id
LEFT JOIN reviews r ON r.partner_id = p.id
GROUP BY p.id, p.name, p.tier;

-- ============================================
-- NOTES FOR IMPLEMENTATION
-- ============================================

-- 1. API Key Generation:
--    - Generate: openssl rand -hex 32
--    - Store hash: SHA-256(key)
--    - Show key once to user, then only show prefix
--
-- 2. Rate Limiting:
--    - Check rate_limits table before processing request
--    - Use check_rate_limit() function
--    - Return 429 Too Many Requests if exceeded
--
-- 3. Webhooks:
--    - Sign payload with HMAC-SHA256 using webhook.secret
--    - Include signature in X-MUVO-Signature header
--    - Retry failed deliveries up to 3 times
--
-- 4. Partner Attribution:
--    - Always set partner_id and source when review comes via API
--    - Use for analytics and revenue sharing (if applicable)
