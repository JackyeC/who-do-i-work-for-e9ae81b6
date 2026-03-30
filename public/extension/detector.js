(() => {
  // src/content/company-extractors.js
  function extractFromLinkedIn() {
    const selectors = [
      ".job-details-jobs-unified-top-card__company-name a",
      ".jobs-unified-top-card__company-name a",
      ".topcard__org-name-link",
      ".job-details-jobs-unified-top-card__primary-description-without-tagline a",
      '[data-tracking-control-name="public_jobs_topcard-org-name"]'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el?.textContent?.trim()) {
        return { name: el.textContent.trim(), platform: "LinkedIn", confidence: "high" };
      }
    }
    return null;
  }
  function extractFromIndeed() {
    const selectors = [
      '[data-testid="inlineHeader-companyName"] a',
      ".jobsearch-InlineCompanyRating a",
      ".icl-u-lg-mr--sm a"
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el?.textContent?.trim()) {
        return { name: el.textContent.trim(), platform: "Indeed", confidence: "high" };
      }
    }
    return null;
  }
  function extractFromGreenhouse() {
    const pathMatch = window.location.pathname.match(/^\/([^/]+)/);
    if (pathMatch) {
      const raw = pathMatch[1].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      return { name: raw, platform: "Greenhouse", confidence: "medium" };
    }
    return null;
  }
  function extractFromLever() {
    const pathMatch = window.location.pathname.match(/^\/([^/]+)/);
    if (pathMatch) {
      const raw = pathMatch[1].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      return { name: raw, platform: "Lever", confidence: "medium" };
    }
    return null;
  }
  function extractFromWorkday() {
    const hostMatch = window.location.hostname.match(/^([^.]+)\.myworkdayjobs\.com/);
    if (hostMatch) {
      const raw = hostMatch[1].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      return { name: raw, platform: "Workday", confidence: "medium" };
    }
    return null;
  }
  function extractFromICIMS() {
    const el = document.querySelector(".iCIMS_Header .company-name, .iCIMS_MainWrapper h1");
    if (el?.textContent?.trim()) {
      return { name: el.textContent.trim(), platform: "iCIMS", confidence: "medium" };
    }
    return null;
  }
  function extractFromTaleo() {
    const el = document.querySelector(".brand-logo img, #headerCompanyName");
    const alt = el?.getAttribute("alt") || el?.textContent?.trim();
    if (alt) {
      return { name: alt, platform: "Taleo", confidence: "medium" };
    }
    return null;
  }
  function extractFromSmartRecruiters() {
    const el = document.querySelector(".company-name, .posting-company-name");
    if (el?.textContent?.trim()) {
      return { name: el.textContent.trim(), platform: "SmartRecruiters", confidence: "high" };
    }
    return null;
  }
  function extractFromAshby() {
    const el = document.querySelector('[data-testid="company-name"], .ashby-job-posting-company-name');
    if (el?.textContent?.trim()) {
      return { name: el.textContent.trim(), platform: "Ashby", confidence: "high" };
    }
    return null;
  }
  function extractFromBambooHR() {
    const el = document.querySelector(".BambooHR-ATS-Company-Name, .fab-Company__name");
    if (el?.textContent?.trim()) {
      return { name: el.textContent.trim(), platform: "BambooHR", confidence: "high" };
    }
    return null;
  }
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

  // src/content/detector.js
  var PLATFORM_EXTRACTORS = {
    "linkedin.com": extractFromLinkedIn,
    "indeed.com": extractFromIndeed,
    "greenhouse.io": extractFromGreenhouse,
    "lever.co": extractFromLever,
    "myworkdayjobs.com": extractFromWorkday,
    "icims.com": extractFromICIMS,
    "taleo.net": extractFromTaleo,
    "smartrecruiters.com": extractFromSmartRecruiters,
    "ashbyhq.com": extractFromAshby,
    "bamboohr.com": extractFromBambooHR
  };
  var lastDetected = null;
  function detect() {
    const host = window.location.hostname;
    for (const [domain, extractor] of Object.entries(PLATFORM_EXTRACTORS)) {
      if (host.includes(domain)) {
        const result = extractor();
        if (result)
          return result;
      }
    }
    return extractFromJsonLd() || extractFromMeta() || null;
  }
  function tryDetect() {
    const result = detect();
    if (result && result.name !== lastDetected) {
      lastDetected = result.name;
      chrome.runtime.sendMessage({
        type: "COMPANY_DETECTED",
        ...result
      });
    }
  }
  tryDetect();
  var observer = new MutationObserver(() => {
    clearTimeout(observer._timer);
    observer._timer = setTimeout(tryDetect, 800);
  });
  observer.observe(document.body, { childList: true, subtree: true });
  var lastUrl = window.location.href;
  setInterval(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      lastDetected = null;
      setTimeout(tryDetect, 500);
    }
  }, 1e3);
})();
