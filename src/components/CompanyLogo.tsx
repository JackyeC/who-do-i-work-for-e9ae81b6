import { useState } from "react";
import { Building2, Globe, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface CompanyLogoProps {
  companyId?: string;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  companyName: string;
  size?: "sm" | "md" | "lg";
  slug?: string;
}

const sizeClasses = {
  sm: "w-10 h-10 rounded-xl",
  md: "w-16 h-16 rounded-2xl",
  lg: "w-20 h-20 rounded-2xl",
};

const iconSizes = {
  sm: "w-5 h-5",
  md: "w-8 h-8",
  lg: "w-10 h-10",
};

export function CompanyLogo({ companyId, logoUrl, websiteUrl, companyName, size = "md", slug }: CompanyLogoProps) {
  const [imgError, setImgError] = useState(false);
  const [fetching, setFetching] = useState(false);
  const queryClient = useQueryClient();

  const showLogo = logoUrl && !imgError;

  const handleFetchLogo = async () => {
    if (!companyId || fetching) return;
    
    // Try to guess website if not provided
    const guessedUrl = websiteUrl || `https://www.${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
    
    setFetching(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-company-branding', {
        body: { companyId, websiteUrl: guessedUrl },
      });
      if (data?.success && data?.logoUrl) {
        // Invalidate to refetch company data
        queryClient.invalidateQueries({ queryKey: ["company-profile", slug] });
      }
    } catch (e) {
      console.error('Logo fetch failed:', e);
    } finally {
      setFetching(false);
    }
  };

  return (
    <div
      className={cn(
        sizeClasses[size],
        "bg-muted/60 flex items-center justify-center shrink-0 border border-border/60 overflow-hidden relative group",
        !showLogo && companyId && "cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-colors"
      )}
      onClick={!showLogo ? handleFetchLogo : undefined}
      title={!showLogo ? "Click to fetch company logo" : companyName}
    >
      {fetching ? (
        <Loader2 className={cn(iconSizes[size], "text-primary animate-spin")} />
      ) : showLogo ? (
        <img
          src={logoUrl!}
          alt={`${companyName} logo`}
          className="w-full h-full object-contain p-1.5"
          onError={() => setImgError(true)}
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      ) : (
        <>
          <Building2 className={cn(iconSizes[size], "text-muted-foreground/70 group-hover:hidden transition-opacity")} />
          <Globe className={cn(iconSizes[size], "text-primary/60 hidden group-hover:block transition-opacity")} />
        </>
      )}
    </div>
  );
}
