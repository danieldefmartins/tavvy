import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface EnrichmentStats {
  missingCount: number;
  staleCount: number;
  totalPlaces: number;
}

interface BatchResult {
  processed: number;
  succeeded: number;
  failed: number;
  failedIds: string[];
  remaining: number;
}

export function useCountyEnrichment() {
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<EnrichmentStats | null>(null);
  const [lastResult, setLastResult] = useState<BatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('enrich-county', {
        body: { action: 'get_stats' },
      });
      if (error) throw error;
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setIsLoading(false);
    }
  };

  const enrichSinglePlace = async (placeId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('enrich-county', {
        body: { action: 'enrich_single', placeId },
      });
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enrich place');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const backfillMissing = async (batchSize = 50) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('enrich-county', {
        body: { action: 'backfill_missing', batchSize },
      });
      if (error) throw error;
      setLastResult(data);
      await fetchStats();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to backfill');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const reEnrichStale = async (batchSize = 50, staleThresholdDays = 180) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('enrich-county', {
        body: { action: 're_enrich_stale', batchSize, staleThresholdDays },
      });
      if (error) throw error;
      setLastResult(data);
      await fetchStats();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to re-enrich stale');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    stats,
    lastResult,
    error,
    fetchStats,
    enrichSinglePlace,
    backfillMissing,
    reEnrichStale,
  };
}