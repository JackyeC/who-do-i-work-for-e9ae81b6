import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getOGImageUrl } from "@/lib/social-share";

interface CompanySEOProps {
  name: string;
  industry: string;
  state: string;
  description?: string | null;
  slug: string;
  score?: number;
}

export function useCompanySEO({ name, industry, state, description, slug, score }: CompanySEOProps) {
  useEffect(() => {
    const title = `Company Influence Profile: ${name} | Who Do I Work For?`;
    const desc = description
      ? `${description.slice(0, 120)}… Review political spending, lobbying, and influence signals.`
      : `Review ${name}'s political spending, lobbying activity, executive donations, and influence network. ${industry} company based in ${state}.`;
    const url = `https://wdiwf.jackyeclayton.com/company/${slug}`;

    const ogImage = getOGImageUrl({
      type: "company",
      companyA: name,
      scoreA: score,
      slugA: slug,
      industry,
    });

    // Title
    document.title = title;

    // Meta tags
    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("name", "description", desc);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:url", url);
    setMeta("property", "og:type", "profile");
    setMeta("property", "og:image", ogImage);
    setMeta("property", "og:image:width", "1200");
    setMeta("property", "og:image:height", "630");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", desc);
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:image", ogImage);

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);

    // JSON-LD
    const existingLd = document.querySelector('script[data-company-ld]');
    if (existingLd) existingLd.remove();

    const ldScript = document.createElement("script");
    ldScript.type = "application/ld+json";
    ldScript.setAttribute("data-company-ld", "true");
    ldScript.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      name,
      description: desc,
      url,
      industry,
      image: ogImage,
      address: { "@type": "PostalAddress", addressRegion: state, addressCountry: "US" },
    });
    document.head.appendChild(ldScript);

    // Pre-generate OG card for social crawlers (best-effort)
    if (score != null) {
      supabase.functions.invoke("generate-og-card", {
        body: { type: "company", companyA: name, scoreA: score, industryA: industry },
      }).catch(() => {});
    }

    return () => {
      document.title = "Who Do I Work For? — Know Before You Go by Jackye Clayton";
      const companyLd = document.querySelector('script[data-company-ld]');
      if (companyLd) companyLd.remove();
    };
  }, [name, industry, state, description, slug, score]);
}
