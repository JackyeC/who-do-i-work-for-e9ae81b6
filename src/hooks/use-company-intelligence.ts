/**
 * Cache-first intelligence loading hook.
 * 
 * Loads section-level cached reports from the database first,
 * then optionally triggers a refresh if data is stale.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  type IntelligenceSection,
  isSectionStale,
  getFreshnessLabel,
  SECTION_LABELS,
} from '@/lib/intelligence-provider';
import {
  isProviderUnavailable,
  getFirstAvailableProvider,
  classifyProviderError,
  recordProviderFailure,
  logScanError,
  type ProviderName,
} from '@/lib/firecrawl-circuit-breaker';

export interface SectionReport {
  section_type: IntelligenceSection;
  content: any;
  summary: string | null;
  source_urls: string[];
  provider_used: string | null;
  last_successful_update: string | null;
  last_error: string | null;
  confidence_score: number;
  isStale: boolean;
  freshnessLabel: string;
}

interface UseCompanyIntelligenceOptions {
  companyId?: string;
  companyName?: string;
  sections?: IntelligenceSection[];
  /** Auto-refresh stale sections on load (default false) */
  autoRefresh?: boolean;
}

export function useCompanyIntelligence({
  companyId,
  companyName,
  sections,
  autoRefresh = false,
}: UseCompanyIntelligenceOptions) {
  const [reports, setReports] = useState<Record<string, SectionReport>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const { toast } = useToast();
  const fetchedRef = useRef(false);

  // Load cached reports from DB
  const loadCachedReports = useCallback(async () => {
    if (!companyId) return;

    try {
      let query = supabase
        .from('company_report_sections')
        .select('*')
        .eq('company_id', companyId);

      if (sections?.length) {
        query = query.in('section_type', sections);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to load cached reports:', error);
        return;
      }

      const mapped: Record<string, SectionReport> = {};
      for (const row of data || []) {
        const sectionType = row.section_type as IntelligenceSection;
        mapped[sectionType] = {
          section_type: sectionType,
          content: row.content,
          summary: row.summary,
          source_urls: row.source_urls || [],
          provider_used: row.provider_used,
          last_successful_update: row.last_successful_update,
          last_error: row.last_error,
          confidence_score: Number(row.confidence_score) || 0.5,
          isStale: isSectionStale(row.last_successful_update, sectionType),
          freshnessLabel: getFreshnessLabel(row.last_successful_update),
        };
      }

      setReports(mapped);
    } finally {
      setLoading(false);
    }
  }, [companyId, sections]);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    loadCachedReports();
  }, [loadCachedReports]);

  // Refresh a specific section
  const refreshSection = useCallback(async (
    section: IntelligenceSection,
    edgeFunctionName: string,
    extraBody?: Record<string, any>
  ) => {
    if (!companyId) return;

    setRefreshing(section);

    try {
      const { data, error } = await supabase.functions.invoke(edgeFunctionName, {
        body: { companyId, companyName, section, ...extraBody },
      });

      if (error) {
        const classified = classifyProviderError(error);
        if (classified.isFirecrawl) {
          recordProviderFailure('firecrawl', classified.errorType, classified.message);
          logScanError({
            provider: 'firecrawl',
            errorType: classified.errorType,
            companyId,
            companyName,
            scanType: edgeFunctionName,
            section,
            rawError: classified.message,
          });
          toast({
            title: 'Live refresh unavailable',
            description: `Showing saved intelligence for ${SECTION_LABELS[section] || section}.`,
          });
          return;
        }
        throw error;
      }

      // Reload cached data after successful refresh
      await loadCachedReports();

      toast({
        title: 'Intelligence updated',
        description: `${SECTION_LABELS[section] || section} refreshed successfully.`,
      });
    } catch (e: any) {
      const classified = classifyProviderError(e);
      if (classified.isFirecrawl) {
        recordProviderFailure('firecrawl', classified.errorType, classified.message);
      }
      toast({
        title: 'Refresh unavailable',
        description: 'Showing the most recent saved intelligence.',
      });
    } finally {
      setRefreshing(null);
    }
  }, [companyId, companyName, loadCachedReports, toast]);

  /** Check if a section has any usable cached data */
  const hasCachedData = useCallback((section: IntelligenceSection): boolean => {
    const report = reports[section];
    if (!report) return false;
    const content = report.content;
    if (!content) return false;
    if (typeof content === 'object' && Object.keys(content).length === 0) return false;
    return true;
  }, [reports]);

  /** Get a section report */
  const getSection = useCallback((section: IntelligenceSection): SectionReport | null => {
    return reports[section] || null;
  }, [reports]);

  return {
    reports,
    loading,
    refreshing,
    refreshSection,
    hasCachedData,
    getSection,
    reload: loadCachedReports,
  };
}
