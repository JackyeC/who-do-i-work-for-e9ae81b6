import { useEffect } from "react";

interface CompanySEOProps {
  name: string;
  industry: string;
  state: string;
  description?: string | null;
  slug: string;
}

export function useCompanySEO({ name, industry, state, description, slug }: CompanySEOProps) {
  useEffect(() => {
    const title = `Company Influence Profile: ${name} | Who Do I Work For?`;
    const desc = description
      ? `${description.slice(0, 120)}… Review political spending, lobbying, and influence signals.`
      : `Review ${name}'s political spending, lobbying activity, executive donations, and influence network. ${industry} company based in ${state}.`;
    const url = `https://civic-align.lovable.app/company/${slug}`;

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
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", desc);

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
      address: { "@type": "PostalAddress", addressRegion: state, addressCountry: "US" },
    });
    document.head.appendChild(ldScript);

    return () => {
      document.title = "Who Do I Work For? — Career Intelligence by Jackye Clayton";
      const companyLd = document.querySelector('script[data-company-ld]');
      if (companyLd) companyLd.remove();
    };
  }, [name, industry, state, description, slug]);
}
