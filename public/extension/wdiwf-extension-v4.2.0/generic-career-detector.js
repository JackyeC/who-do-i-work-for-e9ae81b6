(() => {
  // src/content/company-extractors.js
  function extractFromJsonLd() {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent);
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          if (item["@type"] === "JobPosting" && item.hiringOrganization?.name) {
            return { name: item.hiringOrganization.name, platform: "JSON-LD:JobPosting", confidence: "high" };
          }
        }
      } catch {
      }
    }
    return null;
  }
  function extractFromMeta() {
    const ogSite = document.querySelector('meta[property="og:site_name"]');
    if (ogSite?.content?.trim()) {
      return { name: ogSite.content.trim(), platform: "OG:site_name", confidence: "low" };
    }
    const titleMatch = document.title.match(/(?:at|@)\s+(.+?)(?:\s*[-–|]|$)/i);
    if (titleMatch) {
      return { name: titleMatch[1].trim(), platform: "PageTitle", confidence: "low" };
    }
    return null;
  }

  // src/content/generic-career-detector.js
  var CAREER_URL_PATTERNS = [
    /\/careers?\b/i,
    /\/jobs?\b/i,
    /\/openings?\b/i,
    /\/positions?\b/i,
    /\/opportunities?\b/i,
    /\/hiring\b/i,
    /\/work-with-us/i,
    /\/join-us/i,
    /\/join-our-team/i
  ];
  var CAREER_TITLE_SIGNALS = [
    /careers?\s/i,
    /job\s(?:openings?|listings?|opportunities?)/i,
    /we.re\s+hiring/i,
    /join\s+(?:our|the)\s+team/i,
    /open\s+(?:roles?|positions?)/i
  ];
  function looksLikeCareerPage() {
    const url = window.location.href;
    const title = document.title;
    for (const pattern of CAREER_URL_PATTERNS) {
      if (pattern.test(url))
        return true;
    }
    for (const pattern of CAREER_TITLE_SIGNALS) {
      if (pattern.test(title))
        return true;
    }
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent);
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          if (item["@type"] === "JobPosting")
            return true;
        }
      } catch {
      }
    }
    return false;
  }
  if (looksLikeCareerPage()) {
    const result = extractFromJsonLd() || extractFromMeta();
    if (result) {
      chrome.runtime.sendMessage({
        type: "COMPANY_DETECTED",
        ...result
      });
    }
  }
})();
