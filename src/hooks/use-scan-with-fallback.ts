import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  classifyFirecrawlError,
  recordFirecrawlFailure,
  logScanError,
} from "@/lib/firecrawl-circuit-breaker";
import type { IntelligenceSection } from "@/lib/intelligence-provider";
import { isSectionStale } from "@/lib/intelligence-provider";

interface UseScanOptions {
  functionName: string;
  companyId?: string;
  companyName?: string;
  extraBody?: Record<string, any>;
  onSuccess?: (data: any) => void;
  onError?: (reason: 'firecrawl_error' | 'other_error', message: string) => void;
  setLoading?: (v: boolean) => void;
  section?: IntelligenceSection;
  lastUpdated?: string | null;
}

/**
 * Returns a scan trigger that always attempts the edge function.
 * Edge functions now have built-in Gemini fallback, so we never hard-block.
 */
export function useScanWithFallback({
  functionName,
  companyId,
  companyName,
  extraBody,
  onSuccess,
  onError,
  setLoading,
  section,
  lastUpdated,
}: UseScanOptions) {
  const { toast } = useToast();

  const runScan = useCallback(async (_eventOrForce?: React.MouseEvent | boolean) => {
    const forceRefresh = typeof _eventOrForce === 'boolean' ? _eventOrForce : false;

    if (!forceRefresh && section && lastUpdated && !isSectionStale(lastUpdated, section)) {
      toast({
        title: "Intelligence is current",
        description: "This data was recently updated. No refresh needed.",
      });
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
          // Don't block — function may have used Gemini fallback
          toast({
            title: "Using AI research mode",
            description: "Live web scraping unavailable. Results powered by AI research.",
          });
          onError?.('firecrawl_error', classified.message);
          return;
        }
        throw error;
      }

      if (data?.success) {
        const source = data?.source;
        if (source === 'gemini_fallback') {
          toast({
            title: "AI-powered results",
            description: "Results generated via AI research (web scraping unavailable).",
          });
        }
        onSuccess?.(data);
      } else {
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
            title: "Using AI research mode",
            description: "Showing AI-powered intelligence where available.",
          });
          onError?.('firecrawl_error', classified.message);
          return;
        }
        throw new Error(data?.error || "Scan failed");
      }
    } catch (e: any) {
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
          title: "Using AI research mode",
          description: "Showing AI-powered intelligence where available.",
        });
        onError?.('firecrawl_error', classified.message);
      } else {
        toast({ title: "Scan failed", description: e.message || "Could not complete scan.", variant: "destructive" });
        onError?.('other_error', e.message);
      }
    } finally {
      setLoading?.(false);
    }
  }, [companyId, companyName, functionName, extraBody, onSuccess, onError, setLoading, toast, section, lastUpdated]);

  return {
    runScan,
    isFirecrawlDown: false, // Never hard-block — functions have Gemini fallback
    firecrawlErrorType: null,
    cooldownMinutes: 0,
  };
}
