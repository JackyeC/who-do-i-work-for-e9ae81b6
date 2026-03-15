import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  isFirecrawlUnavailable,
  classifyFirecrawlError,
  recordFirecrawlFailure,
  logScanError,
  getCooldownMinutes,
} from "@/lib/firecrawl-circuit-breaker";

interface UseScanOptions {
  functionName: string;
  companyId?: string;
  companyName?: string;
  /** Extra body params beyond companyId/companyName */
  extraBody?: Record<string, any>;
  /** Called on success with response data */
  onSuccess?: (data: any) => void;
  /** Called when scan is blocked or fails */
  onError?: (reason: 'circuit_open' | 'firecrawl_error' | 'other_error', message: string) => void;
  /** Set loading state */
  setLoading?: (v: boolean) => void;
}

/**
 * Returns a scan trigger that respects the Firecrawl circuit breaker.
 * If the circuit is open, it won't call the edge function.
 */
export function useScanWithFallback({
  functionName,
  companyId,
  companyName,
  extraBody,
  onSuccess,
  onError,
  setLoading,
}: UseScanOptions) {
  const { toast } = useToast();

  const firecrawlState = isFirecrawlUnavailable();

  const runScan = useCallback(async () => {
    // Circuit breaker check
    const state = isFirecrawlUnavailable();
    if (state) {
      const mins = getCooldownMinutes();
      toast({
        title: "Live scan paused",
        description: `Web extraction is temporarily unavailable. Try again in ~${mins} minutes.`,
      });
      onError?.('circuit_open', state.errorMessage);
      return;
    }

    if (!companyId) {
      toast({ title: "No database ID", description: "This company isn't linked to live data yet.", variant: "destructive" });
      return;
    }

    setLoading?.(true);
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { companyId, companyName, ...extraBody },
      });

      if (error) {
        const classified = classifyFirecrawlError(error);
        if (classified.isFirecrawl) {
          recordFirecrawlFailure(classified.errorType, classified.message);
          logScanError({
            provider: 'firecrawl',
            errorType: classified.errorType,
            companyId,
            companyName,
            scanType: functionName,
            rawError: classified.message,
          });
          toast({
            title: "Live scan temporarily unavailable",
            description: "Showing saved intelligence where available.",
          });
          onError?.('firecrawl_error', classified.message);
          return;
        }
        throw error;
      }

      if (data?.success) {
        onSuccess?.(data);
      } else {
        // Check if the error in data body is Firecrawl-related
        const classified = classifyFirecrawlError(data?.error || data?.message || 'Scan failed');
        if (classified.isFirecrawl) {
          recordFirecrawlFailure(classified.errorType, classified.message);
          logScanError({
            provider: 'firecrawl',
            errorType: classified.errorType,
            companyId,
            companyName,
            scanType: functionName,
            rawError: classified.message,
          });
          toast({
            title: "Live scan temporarily unavailable",
            description: "Showing saved intelligence where available.",
          });
          onError?.('firecrawl_error', classified.message);
          return;
        }
        throw new Error(data?.error || "Scan failed");
      }
    } catch (e: any) {
      // Final catch — also check for Firecrawl errors
      const classified = classifyFirecrawlError(e);
      if (classified.isFirecrawl) {
        recordFirecrawlFailure(classified.errorType, classified.message);
        logScanError({
          provider: 'firecrawl',
          errorType: classified.errorType,
          companyId,
          companyName,
          scanType: functionName,
          rawError: classified.message,
        });
        toast({
          title: "Live scan temporarily unavailable",
          description: "Showing saved intelligence where available.",
        });
        onError?.('firecrawl_error', classified.message);
      } else {
        toast({ title: "Scan failed", description: e.message || "Could not complete scan.", variant: "destructive" });
        onError?.('other_error', e.message);
      }
    } finally {
      setLoading?.(false);
    }
  }, [companyId, companyName, functionName, extraBody, onSuccess, onError, setLoading, toast]);

  return {
    runScan,
    isFirecrawlDown: !!firecrawlState,
    firecrawlErrorType: firecrawlState?.errorType ?? null,
    cooldownMinutes: getCooldownMinutes(),
  };
}
