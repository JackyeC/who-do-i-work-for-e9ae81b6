(() => {
  // src/sidepanel/panel.js
  var SITE_BASE = "https://wdiwf.jackyeclayton.com";
  var LOGO_URL = typeof chrome !== "undefined" && chrome.runtime ? chrome.runtime.getURL("icons/icon-128.png") : "icons/icon-128.png";
  var RECEIPTS_SLUGS = /* @__PURE__ */ new Set([
    "meta",
    "google",
    "amazon",
    "microsoft",
    "boeing",
    "booz-allen-hamilton",
    "accenture",
    "verizon",
    "t-mobile",
    "att"
  ]);
  var COMPANY_SLUG_MAP = {
    "alphabet": "google",
    "alphabet inc": "google",
    "meta platforms": "meta",
    "facebook": "meta",
    "at&t": "att",
    "booz allen": "booz-allen-hamilton",
    "booz allen hamilton": "booz-allen-hamilton"
  };
  var PILLAR_CONFIG = [
    { key: "integrity_gap", label: "Integrity Gap", color: "#F0C040", icon: "\u2696\uFE0F" },
    { key: "labor_impact", label: "Labor Impact", color: "#EF4444", icon: "\u{1F477}" },
    { key: "safety_alert", label: "Safety Alert", color: "#F97316", icon: "\u26A0\uFE0F" },
    { key: "connected_dots", label: "Connected Dots", color: "#3B82F6", icon: "\u{1F517}" }
  ];
  var state = {
    view: "waiting",
    // waiting | loading | results | error | saved
    companyName: null,
    platform: null,
    data: null,
    error: null,
    saved: false
  };
  var app = document.getElementById("app");
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "COMPANY_DETECTED_FORWARD") {
      state = { ...state, view: "loading", companyName: msg.name, platform: msg.platform, data: null, error: null, saved: false };
      render();
    }
    if (msg.type === "COMPANY_DATA") {
      if (msg.data?.error) {
        state = { ...state, view: "error", error: msg.data.error };
      } else {
        state = { ...state, view: "results", data: msg.data };
      }
      render();
    }
    if (msg.type === "DOSSIER_ERROR") {
      state = { ...state, view: "error", error: msg.error };
      render();
    }
  });
  var PERCENTILE_TABLE = [
    [0, 0],
    [10, 8],
    [15, 15],
    [20, 22],
    [25, 32],
    [30, 42],
    [35, 52],
    [40, 60],
    [45, 68],
    [50, 74],
    [55, 80],
    [60, 85],
    [65, 89],
    [70, 92],
    [75, 95],
    [80, 97],
    [85, 98],
    [90, 99],
    [100, 100]
  ];
  function getPercentile(score) {
    if (score <= 0)
      return 0;
    if (score >= 100)
      return 100;
    for (let i = 1; i < PERCENTILE_TABLE.length; i++) {
      const [s1, p1] = PERCENTILE_TABLE[i - 1];
      const [s2, p2] = PERCENTILE_TABLE[i];
      if (score <= s2) {
        const t = (score - s1) / (s2 - s1);
        return Math.round(p1 + t * (p2 - p1));
      }
    }
    return 100;
  }
  function getCompositeContext(score) {
    const pct = getPercentile(score);
    if (pct <= 20)
      return `Better than ${100 - pct}% of employers analyzed`;
    if (pct <= 50)
      return `Middle of the pack among employers`;
    return `More flags than ${pct}% of employers`;
  }
  function getPillarContext(score) {
    const pct = getPercentile(score);
    if (pct <= 15)
      return "Lower concern than most";
    if (pct <= 40)
      return "Below average concern";
    if (pct <= 60)
      return "Average among employers";
    if (pct <= 80)
      return `Higher than ${pct}% of employers`;
    return `Top ${100 - pct}% most concerning`;
  }
  function computeScores(data) {
    if (!data)
      return { composite: 0, pillars: {} };
    const integrityGap = data.civic_footprint_score ?? data.integrity_gap_score ?? 0;
    const laborImpact = data.labor_impact_score ?? 0;
    const safetyAlert = data.safety_alert_score ?? 0;
    const connectedDots = data.insider_score ?? data.connected_dots_score ?? 0;
    const laborDerived = laborImpact || deriveLaborImpact(data);
    const safetyDerived = safetyAlert || deriveSafetyAlert(data);
    const pillars = {
      integrity_gap: Math.round(clamp(integrityGap, 0, 100)),
      labor_impact: Math.round(clamp(laborDerived, 0, 100)),
      safety_alert: Math.round(clamp(safetyDerived, 0, 100)),
      connected_dots: Math.round(clamp(connectedDots, 0, 100))
    };
    const composite = Math.round(
      0.3 * pillars.integrity_gap + 0.25 * pillars.labor_impact + 0.2 * pillars.safety_alert + 0.25 * pillars.connected_dots
    );
    return { composite, pillars };
  }
  function deriveLaborImpact(data) {
    let score = 0;
    if (data.glassdoor_rating) {
      score = Math.round((1 - data.glassdoor_rating / 5) * 60);
    }
    if (data.workforce_stability === "unstable")
      score += 30;
    else if (data.workforce_stability === "mixed")
      score += 15;
    if (data.glassdoor_trajectory === "declining")
      score += 10;
    return clamp(score, 0, 100);
  }
  function deriveSafetyAlert(data) {
    let score = 0;
    if (data.risk_level === "high")
      score = 60;
    else if (data.risk_level === "medium")
      score = 35;
    else if (data.risk_level === "low")
      score = 10;
    return score;
  }
  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }
  function extractFlags(data, maxFlags = 2) {
    if (!data)
      return [];
    const flags = [];
    if (data.reality_gap_evidence?.length) {
      for (const ev of data.reality_gap_evidence.slice(0, 2)) {
        flags.push({
          pillar: "Integrity Gap",
          color: "#F0C040",
          text: typeof ev === "string" ? ev : ev.summary || ev.description || JSON.stringify(ev),
          source: ev.source || "Public records"
        });
      }
    }
    if (data.civic_concerns?.length) {
      for (const c of data.civic_concerns.slice(0, 2)) {
        flags.push({
          pillar: "Connected Dots",
          color: "#3B82F6",
          text: typeof c === "string" ? c : c.summary || c.description || JSON.stringify(c),
          source: c.source || "FEC / Lobbying"
        });
      }
    }
    if (data.insider_score_evidence?.length) {
      for (const ev of data.insider_score_evidence.slice(0, 2)) {
        flags.push({
          pillar: "Connected Dots",
          color: "#3B82F6",
          text: typeof ev === "string" ? ev : ev.summary || ev.description || JSON.stringify(ev),
          source: ev.source || "Insider data"
        });
      }
    }
    if (data.glassdoor_trajectory === "declining") {
      flags.push({
        pillar: "Labor Impact",
        color: "#EF4444",
        text: `Glassdoor rating trending downward (${data.glassdoor_rating ?? "?"}/5)`,
        source: "Glassdoor"
      });
    }
    if (data.risk_level === "high") {
      flags.push({
        pillar: "Safety Alert",
        color: "#F97316",
        text: "High overall risk level detected across available data sources",
        source: "Risk assessment"
      });
    }
    return flags.slice(0, maxFlags);
  }
  function companyToSlug(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
  function getReceiptSlug(name) {
    const lower = name.toLowerCase().trim();
    const mapped = COMPANY_SLUG_MAP[lower];
    if (mapped && RECEIPTS_SLUGS.has(mapped))
      return mapped;
    const slug = companyToSlug(name);
    if (RECEIPTS_SLUGS.has(slug))
      return slug;
    return null;
  }
  function getDossierUrl(name) {
    return `${SITE_BASE}/dossier/${companyToSlug(name)}`;
  }
  function getReceiptsUrl(slug) {
    return `${SITE_BASE}/receipts/${slug}`;
  }
  async function saveCompany(name) {
    const result = await chrome.storage.local.get({ savedCompanies: [] });
    const list = result.savedCompanies;
    const slug = companyToSlug(name);
    if (!list.find((c) => c.slug === slug)) {
      list.push({ name, slug, savedAt: (/* @__PURE__ */ new Date()).toISOString() });
      await chrome.storage.local.set({ savedCompanies: list });
    }
    state.saved = true;
    render();
  }
  async function unsaveCompany(name) {
    const result = await chrome.storage.local.get({ savedCompanies: [] });
    const slug = companyToSlug(name);
    const list = result.savedCompanies.filter((c) => c.slug !== slug);
    await chrome.storage.local.set({ savedCompanies: list });
    state.saved = false;
    render();
  }
  function render() {
    switch (state.view) {
      case "waiting":
        return renderWaiting();
      case "loading":
        return renderLoading();
      case "results":
        return renderResults();
      case "error":
        return renderError();
      default:
        return renderWaiting();
    }
  }
  function renderWaiting() {
    app.innerHTML = `
    <div class="panel">
      <header class="header">
        <img class="logo-img" src="${LOGO_URL}" alt="WDIWF" />
        <div class="header-text">
          <h1 class="header-title">Who Do I Work For?</h1>
          <p class="header-subtitle">Career intelligence at the moment of decision</p>
        </div>
      </header>
      <div class="waiting-state">
        <div class="waiting-icon">\u{1F50D}</div>
        <p class="waiting-text">Navigate to a job listing to see this company's integrity profile.</p>
        <p class="waiting-hint">Works on LinkedIn, Indeed, Greenhouse, Lever, Workday, and more.</p>
      </div>
      <footer class="footer">
        <a href="${SITE_BASE}" target="_blank" class="footer-link">wdiwf.jackyeclayton.com</a>
      </footer>
    </div>
  `;
  }
  function renderLoading() {
    app.innerHTML = `
    <div class="panel">
      <header class="header">
        <img class="logo-img" src="${LOGO_URL}" alt="WDIWF" />
        <div class="header-text">
          <h1 class="header-title">Who Do I Work For?</h1>
        </div>
      </header>
      <div class="loading-state">
        <div class="spinner"></div>
        <p class="loading-company">${escapeHtml(state.companyName)}</p>
        <p class="loading-text">Running integrity check...</p>
        <p class="loading-platform">Detected on ${escapeHtml(state.platform || "this page")}</p>
      </div>
    </div>
  `;
  }
  function renderResults() {
    const data = state.data;
    const { composite, pillars } = computeScores(data);
    const flags = extractFlags(data, 2);
    const receiptSlug = getReceiptSlug(state.companyName);
    const dossierUrl = getDossierUrl(state.companyName);
    const confidence = data?.data_confidence || "unknown";
    const scoreColor = composite >= 60 ? "#EF4444" : composite >= 35 ? "#F97316" : "#22C55E";
    const flagsHtml = flags.length > 0 ? flags.map((f) => `
    <div class="flag-card">
      <span class="flag-badge" style="background: ${f.color}20; color: ${f.color}; border: 1px solid ${f.color}40">${escapeHtml(f.pillar)}</span>
      <p class="flag-text">${escapeHtml(truncate(f.text, 120))}</p>
      <span class="flag-source">${escapeHtml(f.source)}</span>
    </div>
  `).join("") : '<p class="no-flags">No significant flags detected.</p>';
    const receiptsLink = receiptSlug ? `
    <a href="${getReceiptsUrl(receiptSlug)}" target="_blank" class="receipts-link">
      <span class="receipts-icon">\u{1F4CB}</span>
      Read the Receipts \u2192
    </a>
  ` : "";
    app.innerHTML = `
    <div class="panel">
      <header class="header">
        <img class="logo-img" src="${LOGO_URL}" alt="WDIWF" />
        <div class="header-text">
          <h1 class="header-title">${escapeHtml(state.companyName)}</h1>
          <p class="header-subtitle">${escapeHtml(state.platform || "")} \xB7 ${escapeHtml(confidence)} confidence</p>
        </div>
      </header>

      <!-- Composite Integrity Score -->
      <section class="score-hero">
        <div class="score-ring" style="--score-color: ${scoreColor}; --score-pct: ${composite}">
          <span class="score-value">${composite}</span>
        </div>
        <div class="score-label">Integrity Score <span class="preliminary-tag">Preliminary</span></div>
        <div class="score-context">${getCompositeContext(composite)}</div>
        <div class="score-explainer">Higher = more concern \xB7 Full analysis on dossier page</div>
      </section>

      <!-- 4 Pillar Mini Scores -->
      <section class="pillars">
        ${PILLAR_CONFIG.map((p) => {
      const val = pillars[p.key] ?? 0;
      return `
          <div class="pillar">
            <div class="pillar-bar-track">
              <div class="pillar-bar-fill" style="width: ${val}%; background: ${p.color}"></div>
            </div>
            <div class="pillar-info">
              <span class="pillar-icon">${p.icon}</span>
              <span class="pillar-name">${p.label}</span>
              <span class="pillar-value" style="color: ${p.color}">${val}</span>
            </div>
            <div class="pillar-context">${getPillarContext(val)}</div>
          </div>`;
    }).join("")}
      </section>

      <!-- Top Flags -->
      <section class="flags-section">
        <h2 class="section-title">Top Flags</h2>
        ${flagsHtml}
      </section>

      <!-- CTAs -->
      <section class="ctas">
        <a href="${dossierUrl}" target="_blank" class="cta-gold">
          View Full Dossier \u2192
        </a>
        ${receiptsLink}
        <button class="cta-save" id="save-btn">
          ${state.saved ? "\u2713 Saved" : "\u2295 Save this company"}
        </button>
      </section>

      <footer class="footer">
        <a href="${SITE_BASE}" target="_blank" class="footer-link">wdiwf.jackyeclayton.com</a>
      </footer>
    </div>
  `;
    document.getElementById("save-btn")?.addEventListener("click", () => {
      if (state.saved) {
        unsaveCompany(state.companyName);
      } else {
        saveCompany(state.companyName);
      }
    });
  }
  function renderError() {
    app.innerHTML = `
    <div class="panel">
      <header class="header">
        <img class="logo-img" src="${LOGO_URL}" alt="WDIWF" />
        <div class="header-text">
          <h1 class="header-title">${escapeHtml(state.companyName || "WDIWF")}</h1>
        </div>
      </header>
      <div class="error-state">
        <div class="error-icon">\u26A1</div>
        <p class="error-text">Could not retrieve data for this company.</p>
        <p class="error-detail">${escapeHtml(state.error || "Unknown error")}</p>
        <button class="cta-retry" id="retry-btn">Try Again</button>
      </div>
      <footer class="footer">
        <a href="${SITE_BASE}" target="_blank" class="footer-link">wdiwf.jackyeclayton.com</a>
      </footer>
    </div>
  `;
    document.getElementById("retry-btn")?.addEventListener("click", () => {
      if (state.companyName) {
        state.view = "loading";
        render();
        chrome.runtime.sendMessage({ type: "CHECK_COMPANY", company_name: state.companyName });
      }
    });
  }
  function escapeHtml(str) {
    if (!str)
      return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function truncate(str, max) {
    if (!str)
      return "";
    return str.length > max ? str.slice(0, max - 1) + "\u2026" : str;
  }
  render();
  chrome.runtime.sendMessage({ type: "PANEL_READY" });
})();
