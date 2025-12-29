import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MapPin, RefreshCw, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useCountyEnrichment } from '@/hooks/useCountyEnrichment';
import { useIsAdmin } from '@/hooks/useAdmin';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function AdminDataEnrichment() {
  const navigate = useNavigate();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const {
    isLoading,
    stats,
    lastResult,
    error,
    fetchStats,
    backfillMissing,
    reEnrichStale,
  } = useCountyEnrichment();

  const [isRunningBackfill, setIsRunningBackfill] = useState(false);
  const [isRunningStale, setIsRunningStale] = useState(false);
  const [totalProcessed, setTotalProcessed] = useState(0);
  const [totalSucceeded, setTotalSucceeded] = useState(0);
  const [totalFailed, setTotalFailed] = useState(0);
  const [allFailedIds, setAllFailedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleBackfillMissing = async () => {
    setIsRunningBackfill(true);
    setTotalProcessed(0);
    setTotalSucceeded(0);
    setTotalFailed(0);
    setAllFailedIds([]);

    try {
      let remaining = stats?.missingCount || 0;
      while (remaining > 0) {
        const result = await backfillMissing(50);
        setTotalProcessed(prev => prev + result.processed);
        setTotalSucceeded(prev => prev + result.succeeded);
        setTotalFailed(prev => prev + result.failed);
        setAllFailedIds(prev => [...prev, ...result.failedIds]);
        remaining = result.remaining;
        
        if (result.processed === 0) break;
      }
      toast.success('County backfill complete!');
    } catch (err) {
      toast.error('Backfill failed');
    } finally {
      setIsRunningBackfill(false);
    }
  };

  const handleReEnrichStale = async () => {
    setIsRunningStale(true);
    setTotalProcessed(0);
    setTotalSucceeded(0);
    setTotalFailed(0);
    setAllFailedIds([]);

    try {
      let remaining = stats?.staleCount || 0;
      while (remaining > 0) {
        const result = await reEnrichStale(50, 180);
        setTotalProcessed(prev => prev + result.processed);
        setTotalSucceeded(prev => prev + result.succeeded);
        setTotalFailed(prev => prev + result.failed);
        setAllFailedIds(prev => [...prev, ...result.failedIds]);
        remaining = result.remaining;

        if (result.processed === 0) break;
      }
      toast.success('Stale county re-enrichment complete!');
    } catch (err) {
      toast.error('Re-enrichment failed');
    } finally {
      setIsRunningStale(false);
    }
  };

  const downloadFailedIds = () => {
    if (allFailedIds.length === 0) return;
    const content = allFailedIds.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `failed-county-enrichment-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto py-8 px-4">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const isRunning = isRunningBackfill || isRunningStale;
  const progressPercent = stats?.missingCount
    ? Math.round((totalProcessed / (stats.missingCount + totalProcessed)) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-4xl mx-auto py-6 px-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Data Enrichment</h1>
          <p className="text-muted-foreground">Manage automated data enrichment tasks</p>
        </div>

        {/* Stats Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  County Enrichment
                </CardTitle>
                <CardDescription>
                  Auto-fill county using reverse geocoding from place coordinates
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchStats}
                disabled={isLoading || isRunning}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-muted rounded-lg text-center">
                <div className="text-2xl font-bold">{stats?.totalPlaces || 0}</div>
                <div className="text-sm text-muted-foreground">Total Places</div>
              </div>
              <div className="p-4 bg-amber-500/10 rounded-lg text-center">
                <div className="text-2xl font-bold text-amber-600">{stats?.missingCount || 0}</div>
                <div className="text-sm text-muted-foreground">Missing County</div>
              </div>
              <div className="p-4 bg-blue-500/10 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{stats?.staleCount || 0}</div>
                <div className="text-sm text-muted-foreground">Stale (180+ days)</div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {/* Progress */}
            {isRunning && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing...</span>
                  <span>{totalProcessed} processed</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
                <div className="flex gap-4 text-sm">
                  <span className="text-green-600">
                    <CheckCircle2 className="h-3 w-3 inline mr-1" />
                    {totalSucceeded} succeeded
                  </span>
                  {totalFailed > 0 && (
                    <span className="text-destructive">
                      <AlertCircle className="h-3 w-3 inline mr-1" />
                      {totalFailed} failed
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Last result */}
            {!isRunning && lastResult && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="font-medium">Last Batch Result</div>
                <div className="flex gap-4 text-sm">
                  <Badge variant="outline">{lastResult.processed} processed</Badge>
                  <Badge variant="default" className="bg-green-600">{lastResult.succeeded} succeeded</Badge>
                  {lastResult.failed > 0 && (
                    <Badge variant="destructive">{lastResult.failed} failed</Badge>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleBackfillMissing}
                disabled={isRunning || !stats?.missingCount}
              >
                {isRunningBackfill && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                Backfill Missing County
              </Button>
              <Button
                variant="outline"
                onClick={handleReEnrichStale}
                disabled={isRunning || !stats?.staleCount}
              >
                {isRunningStale && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                Re-Enrich Stale (180+ days)
              </Button>
              {allFailedIds.length > 0 && (
                <Button variant="ghost" onClick={downloadFailedIds}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Failed IDs ({allFailedIds.length})
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Backfill Missing County:</strong> Finds all places with coordinates but no county,
              and uses Mapbox reverse geocoding to fill in the county name.
            </p>
            <p>
              <strong>Re-Enrich Stale:</strong> Updates county data for places where the enrichment
              is older than 180 days, ensuring data stays fresh.
            </p>
            <p>
              <strong>Auto-enrichment:</strong> New places are automatically enriched when created
              if they have coordinates but no county specified.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}