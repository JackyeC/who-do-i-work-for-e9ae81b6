/**
 * Hook for triggering parallel OSINT scans across all data sources.
 * Uses the osint-parallel-scan edge function for maximum speed.
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface OsintScanResult {
  source: string;
  success: boolean;
  duration?: number;
  error?: string;
}

export function useOsintParallelScan() {
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<OsintScanResult[]>([]);
  const [lastScanTime, setLastScanTime] = useState<number | null>(null);
  const { toast } = useToast();

  const runParallelScan = useCallback(async (
    companyId: string,
    companyName: string,
    sources?: string[]
  ) => {
    if (!companyId) return;

    setScanning(true);
    setResults([]);
    const startTime = Date.now();

    try {
      const { data, error } = await supabase.functions.invoke('osint-parallel-scan', {
        body: { companyId, companyName, sources },
      });

      if (error) {
        toast({
          title: 'OSINT scan failed',
          description: 'Could not reach intelligence sources. Try again shortly.',
          variant: 'destructive',
        });
        return;
      }

      if (data?.success) {
        setResults(data.results || []);
        setLastScanTime(data.totalDuration);

        const { succeeded, failed, fresh } = data;
        if (failed === 0) {
          toast({
            title: 'Intelligence updated',
            description: `${succeeded} source${succeeded !== 1 ? 's' : ''} refreshed in ${(data.totalDuration / 1000).toFixed(1)}s${fresh?.length ? ` · ${fresh.length} already current` : ''}.`,
          });
        } else {
          const failedNames = (data.results || [])
            .filter((r: OsintScanResult) => !r.success)
            .map((r: OsintScanResult) => r.source)
            .join(', ');
          toast({
            title: 'Partial update',
            description: `${succeeded} succeeded, ${failed} unavailable${failedNames ? ` (${failedNames})` : ''}. Cached data preserved.`,
          });
        }
      }
    } catch (e: any) {
      toast({
        title: 'Scan error',
        description: e.message || 'Unexpected error during OSINT scan.',
        variant: 'destructive',
      });
    } finally {
      setScanning(false);
    }
  }, [toast]);

  return { scanning, results, lastScanTime, runParallelScan };
}
