import { useState, useEffect } from 'react';
import { Copy, Eye, EyeOff, Trash2, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';

interface APIKey {
  id: string;
  name: string;
  key_prefix: string;
  environment: 'test' | 'production';
  permissions: {
    read: boolean;
    write: boolean;
  };
  rate_limit_per_hour: number;
  last_used_at: string | null;
  created_at: string;
  is_active: boolean;
}

interface Partner {
  id: string;
  name: string;
  tier: string;
  status: string;
}

export function APIKeyManagement() {
  const { toast } = useToast();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [apiKeys, setAPIKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyEnvironment, setNewKeyEnvironment] = useState<'test' | 'production'>('production');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState<{ [key: string]: boolean }>({});

  // Initialize Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchPartnerAndKeys();
  }, []);

  const fetchPartnerAndKeys = async () => {
    setLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Not authenticated',
          description: 'Please sign in to manage API keys',
          variant: 'destructive',
        });
        return;
      }

      // Get partner
      const { data: partnerData, error: partnerError } = await supabase
        .from('api_partners')
        .select('*')
        .eq('created_by', user.id)
        .single();

      if (partnerError || !partnerData) {
        // Create partner if doesn't exist
        const { data: newPartner, error: createError } = await supabase
          .from('api_partners')
          .insert({
            name: user.email?.split('@')[0] || 'Partner',
            email: user.email,
            status: 'active',
            tier: 'free',
            created_by: user.id,
          })
          .select()
          .single();

        if (createError) {
          throw createError;
        }
        setPartner(newPartner);
      } else {
        setPartner(partnerData);
      }

      // Get API keys
      const { data: keysData, error: keysError } = await supabase
        .from('api_keys')
        .select('*')
        .eq('partner_id', partnerData?.id || newPartner.id)
        .order('created_at', { ascending: false });

      if (keysError) throw keysError;
      setAPIKeys(keysData || []);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error loading API keys',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAPIKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a name for this API key',
        variant: 'destructive',
      });
      return;
    }

    if (!partner) return;

    try {
      // Generate random key
      const randomBytes = new Uint8Array(32);
      crypto.getRandomValues(randomBytes);
      const keyString = Array.from(randomBytes, byte => 
        byte.toString(16).padStart(2, '0')
      ).join('');

      const prefix = `muvo_${newKeyEnvironment === 'test' ? 'test' : 'live'}_`;
      const fullKey = prefix + keyString;

      // Hash the key for storage
      const keyHash = createHmac('sha256', process.env.NEXT_PUBLIC_API_KEY_SECRET!)
        .update(fullKey)
        .digest('hex');

      // Store in database
      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          partner_id: partner.id,
          key_hash: keyHash,
          key_prefix: prefix + keyString.substring(0, 8) + '...',
          name: newKeyName,
          environment: newKeyEnvironment,
          permissions: { read: true, write: true },
          rate_limit_per_hour: 1000, // Default for free tier
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      // Show the full key ONCE
      setGeneratedKey(fullKey);
      setAPIKeys([data, ...apiKeys]);
      setNewKeyName('');
      
      toast({
        title: 'API key created',
        description: 'Copy it now - you won\'t see it again!',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error creating API key',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const deleteAPIKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key? This cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId);

      if (error) throw error;

      setAPIKeys(apiKeys.filter(k => k.id !== keyId));
      toast({
        title: 'API key deleted',
        description: 'The key has been permanently deleted',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error deleting API key',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'API key copied to clipboard',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">API Keys</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your MUVO API keys for integration
          </p>
        </div>
        <Button onClick={() => setShowNewKeyDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create API Key
        </Button>
      </div>

      {/* Partner Info */}
      {partner && (
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Partner</div>
              <div className="font-semibold">{partner.name}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Tier</div>
              <div className="font-semibold capitalize">{partner.tier}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <div className="font-semibold capitalize">{partner.status}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">API Keys</div>
              <div className="font-semibold">{apiKeys.length}</div>
            </div>
          </div>
        </div>
      )}

      {/* New Key Dialog */}
      {showNewKeyDialog && (
        <div className="bg-card rounded-lg border border-border p-6 space-y-4">
          <h3 className="text-lg font-bold">Create New API Key</h3>
          
          <div className="space-y-2">
            <Label htmlFor="keyName">Key Name</Label>
            <Input
              id="keyName"
              placeholder="Production Key"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="environment">Environment</Label>
            <select
              id="environment"
              value={newKeyEnvironment}
              onChange={(e) => setNewKeyEnvironment(e.target.value as 'test' | 'production')}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
            >
              <option value="production">Production</option>
              <option value="test">Test</option>
            </select>
          </div>

          {generatedKey && (
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-semibold">
                <Check className="w-5 h-5" />
                API Key Created!
              </div>
              <p className="text-sm text-green-600 dark:text-green-500">
                Copy this key now - you won't be able to see it again!
              </p>
              <div className="flex items-center gap-2 mt-2">
                <code className="flex-1 bg-white dark:bg-gray-900 px-3 py-2 rounded border text-sm font-mono">
                  {generatedKey}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(generatedKey)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={generateAPIKey} disabled={!!generatedKey}>
              Generate Key
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowNewKeyDialog(false);
                setGeneratedKey(null);
                setNewKeyName('');
              }}
            >
              {generatedKey ? 'Done' : 'Cancel'}
            </Button>
          </div>
        </div>
      )}

      {/* API Keys List */}
      <div className="space-y-3">
        {apiKeys.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <p className="text-muted-foreground mb-4">No API keys yet</p>
            <Button onClick={() => setShowNewKeyDialog(true)}>
              Create Your First API Key
            </Button>
          </div>
        ) : (
          apiKeys.map((key) => (
            <div
              key={key.id}
              className="bg-card rounded-lg border border-border p-4 flex items-center justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-foreground">{key.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded ${
                    key.environment === 'production'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {key.environment}
                  </span>
                  {!key.is_active && (
                    <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">
                      Inactive
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <code className="bg-muted px-2 py-1 rounded font-mono">
                    {key.key_prefix}
                  </code>
                  <span>•</span>
                  <span>Created {formatDate(key.created_at)}</span>
                  {key.last_used_at && (
                    <>
                      <span>•</span>
                      <span>Last used {formatDate(key.last_used_at)}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteAPIKey(key.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Documentation Link */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Ready to integrate?
        </h3>
        <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
          Check out our API documentation to start sending reviews from your app.
        </p>
        <Button variant="outline" size="sm">
          View API Docs
        </Button>
      </div>
    </div>
  );
}
