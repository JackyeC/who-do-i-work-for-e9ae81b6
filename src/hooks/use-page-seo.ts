import { useEffect } from "react";

const BASE_URL = "https://wdiwf.jackyeclayton.com";
const SITE_NAME = "Who Do I Work For?";
const DEFAULT_DESC = "Employer Intelligence platform. Know who you're really working for before you sign. Company intelligence, offer analysis, career strategy by Jackye Clayton.";

interface PageSEOProps {
  title: string;
  description?: string;
  path?: string;
  type?: string;
  jsonLd?: Record<string, any>;
}

export function usePageSEO({ title, description, path, type = "website", jsonLd }: PageSEOProps) {
  useEffect(() => {
    const fullTitle = `${title} | ${SITE_NAME}`;
    const desc = description || DEFAULT_DESC;
    const url = path ? `${BASE_URL}${path}` : BASE_URL;

    document.title = fullTitle;

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
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:url", url);
    setMeta("property", "og:type", type);
    setMeta("property", "og:site_name", SITE_NAME);
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", desc);
    setMeta("name", "twitter:card", "summary_large_image");

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);

    // JSON-LD
    const existingLd = document.querySelector('script[data-page-ld]');
    if (existingLd) existingLd.remove();

    if (jsonLd) {
      const ldScript = document.createElement("script");
      ldScript.type = "application/ld+json";
      ldScript.setAttribute("data-page-ld", "true");
      ldScript.textContent = JSON.stringify({ "@context": "https://schema.org", ...jsonLd });
      document.head.appendChild(ldScript);
    }

    return () => {
      document.title = `${SITE_NAME} — Employer Intelligence by Jackye Clayton`;
      const pageLd = document.querySelector('script[data-page-ld]');
      if (pageLd) pageLd.remove();
    };
  }, [title, description, path, type, jsonLd]);
}
