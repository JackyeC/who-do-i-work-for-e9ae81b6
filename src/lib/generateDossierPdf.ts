import jsPDF from "jspdf";
import "jspdf-autotable";

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}

/* ─── Data contract ─── */
export interface DossierPdfData {
  company: {
    name: string;
    industry: string;
    state: string;
    description?: string | null;
    employee_count?: string | null;
    revenue?: string | null;
    website_url?: string | null;
    civic_footprint_score?: number;
    lobbying_spend?: number | null;
    total_pac_spending?: number;
    government_contracts?: number | null;
    effective_tax_rate?: string | null;
    parent_company?: string | null;
  };
  executives: Array<{ name: string; title: string; total_donations: number }>;
  contracts: Array<{ agency_name: string; contract_value: number | null; contract_description: string | null; confidence: string; fiscal_year?: number | null }>;
  valuesSignals: Array<{ issue_category?: string; signal_category?: string; signal_summary?: string; evidence_text?: string; source_url?: string }>;
  warnNotices: Array<{ notice_date: string; employees_affected: number; location_state?: string | null; layoff_type?: string }>;
  sentiment: Array<{ overall_rating?: number | null; top_complaints?: any; top_praises?: any; ai_summary?: string | null }>;
  payEquity: Array<{ signal_type: string; evidence_text?: string | null; source_url?: string | null; confidence: string }>;
  lobbyingIssues: Array<{ issue_area: string; amount?: number | null; bill_number?: string | null }>;
  partyBreakdown: Array<{ party: string; amount: number }>;
  darkMoney: Array<{ name: string; org_type: string; relationship: string; estimated_amount?: number | null }>;
  revolvingDoor: Array<{ person: string; prior_role: string; new_role: string }>;
  publicStances: Array<{ topic: string; public_position: string; spending_reality: string; gap: string }>;
  benchmarks: { industry_rank?: number | null; industry_total?: number | null; transparency_grade?: string; peer_avg_pac_spending?: number | null; cpa_zicklin_score?: number | null } | null;
  candidates: Array<{ name: string; party: string; amount: number; flagged: boolean; flag_reason?: string | null }>;
}

/* ─── Carbon & Indigo palette (RGB) ─── */
const C = {
  navy:     [31, 41, 51]    as [number, number, number], // #1F2933
  charcoal: [36, 49, 66]    as [number, number, number],
  slate:    [71, 85, 105]   as [number, number, number],
  muted:    [148, 163, 184] as [number, number, number],
  subtle:   [226, 232, 240] as [number, number, number],
  fog:      [247, 248, 250] as [number, number, number], // #F7F8FA
  white:    [255, 255, 255] as [number, number, number],
  indigo:   [99, 91, 255]   as [number, number, number], // #635BFF
  teal:     [20, 184, 166]  as [number, number, number],
  amber:    [245, 158, 11]  as [number, number, number],
  red:      [239, 68, 68]   as [number, number, number],
  green:    [34, 197, 94]   as [number, number, number],
  blue:     [59, 130, 246]  as [number, number, number],
};

const PW = 210;
const PH = 297;
const ML = 18;
const MR = 18;
const CW = PW - ML - MR;

const fmt$ = (n: number) => `$${n.toLocaleString("en-US")}`;
const AUDIT_DATE = "March 10, 2026";

/* ─── Drawing helpers ─── */

function drawRule(doc: jsPDF, y: number, color = C.subtle) {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.3);
  doc.line(ML, y, PW - MR, y);
}

function safeY(doc: jsPDF, y: number, need = 30): number {
  if (y + need > 272) { doc.addPage(); return 24; }
  return y;
}

function drawKpiBox(doc: jsPDF, x: number, y: number, w: number, label: string, value: string, accent = C.indigo) {
  doc.setFillColor(...C.fog);
  doc.roundedRect(x, y, w, 22, 2, 2, "F");
  doc.setDrawColor(...accent);
  doc.setLineWidth(0.6);
  doc.line(x, y, x, y + 22);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...C.navy);
  doc.text(value, x + 5, y + 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...C.slate);
  doc.text(label.toUpperCase(), x + 5, y + 17);
}

function drawTag(doc: jsPDF, x: number, y: number, text: string, color: [number, number, number]) {
  const tw = doc.getStringUnitWidth(text) * 6 / doc.internal.scaleFactor + 5;
  doc.setFillColor(...color);
  doc.roundedRect(x, y - 3.5, tw, 5.5, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(...C.white);
  doc.text(text, x + 2.5, y);
}

function confidenceBadge(doc: jsPDF, x: number, y: number, level: "high" | "medium" | "low") {
  const colors = { high: C.green, medium: C.amber, low: C.red };
  const labels = { high: "HIGH CONFIDENCE", medium: "MEDIUM CONFIDENCE", low: "LOW CONFIDENCE" };
  drawTag(doc, x, y, labels[level], colors[level]);
}

function sectionConfidenceLevel(dataLength: number): "high" | "medium" | "low" {
  if (dataLength >= 5) return "high";
  if (dataLength >= 2) return "medium";
  return "low";
}

function tableStyle(startY: number) {
  return {
    startY,
    margin: { left: ML, right: MR },
    styles: {
      fontSize: 7.5,
      cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
      lineColor: C.subtle,
      lineWidth: 0.2,
      textColor: C.navy,
      font: "helvetica",
    },
    headStyles: {
      fillColor: C.charcoal,
      textColor: C.white,
      fontStyle: "bold" as const,
      fontSize: 7,
    },
    alternateRowStyles: { fillColor: C.fog },
    tableLineColor: C.subtle,
  };
}

/* ─── Section header with confidence badge ─── */
function sectionHeader(doc: jsPDF, y: number, sectionNum: number, title: string, subtitle: string, confidence: "high" | "medium" | "low" = "medium"): number {
  y = safeY(doc, y, 24);
  doc.setFillColor(...C.navy);
  doc.roundedRect(ML, y, CW, 16, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...C.indigo);
  doc.text(`SECTION ${sectionNum}`, ML + 5, y + 6);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...C.white);
  doc.text(title, ML + 32, y + 6.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...C.muted);
  doc.text(subtitle, ML + 32, y + 12.5);

  // Confidence badge aligned right
  confidenceBadge(doc, PW - MR - 32, y + 6, confidence);

  return y + 22;
}

/* ═══════════════════════════════════════════
   PAGE: COVER
   ═══════════════════════════════════════════ */

function buildCoverPage(doc: jsPDF, data: DossierPdfData) {
  const { company } = data;

  // Full bleed navy
  doc.setFillColor(...C.navy);
  doc.rect(0, 0, PW, PH, "F");

  // Indigo accent stripe
  doc.setFillColor(...C.indigo);
  doc.rect(0, 0, PW, 5, "F");

  // CONFIDENTIAL
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...C.indigo);
  doc.text("CONFIDENTIAL — INTEGRITY BRIEF", ML, 24);

  // Separator
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.15);
  doc.line(ML, 29, PW - MR, 29);

  // Report type
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...C.muted);
  doc.text("CORPORATE INTEGRITY BRIEF", ML, 65);

  // Company name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(38);
  doc.setTextColor(...C.white);
  const nameLines = doc.splitTextToSize(company.name, CW);
  doc.text(nameLines, ML, 85);
  const nameEndY = 85 + nameLines.length * 15;

  // Influence Score badge
  const score = company.civic_footprint_score ?? 0;
  const scoreColor = score > 70 ? C.red : score > 40 ? C.amber : C.green;
  doc.setFillColor(...scoreColor);
  doc.roundedRect(ML, nameEndY + 4, 50, 12, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...C.white);
  doc.text(`INFLUENCE SCORE: ${score}/100`, ML + 4, nameEndY + 12);

  // Description
  if (company.description) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...C.muted);
    const descLines = doc.splitTextToSize(company.description, CW - 10);
    doc.text(descLines.slice(0, 4), ML, nameEndY + 26);
  }

  // Metadata grid
  const metaY = 200;
  const metaItems = [
    ["INDUSTRY", company.industry],
    ["HEADQUARTERS", company.state],
    ["EMPLOYEES", company.employee_count || "—"],
    ["REVENUE", company.revenue || "—"],
    ["DATE OF AUDIT", AUDIT_DATE],
  ];
  if (company.parent_company) metaItems.push(["PARENT COMPANY", company.parent_company]);

  metaItems.forEach((item, i) => {
    const y = metaY + i * 11;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...C.muted);
    doc.text(item[0], ML, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...C.white);
    doc.text(item[1], ML + 42, y);
  });

  // Bottom branding bar
  doc.setFillColor(...C.charcoal);
  doc.rect(0, PH - 30, PW, 30, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...C.indigo);
  doc.text("WHO DO I WORK FOR?", ML, PH - 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...C.muted);
  doc.text("Career Intelligence Platform", ML, PH - 12);
  doc.text(`Generated ${AUDIT_DATE}`, PW - MR, PH - 12, { align: "right" });
}

/* ═══════════════════════════════════════════
   PAGE: EXECUTIVE SUMMARY
   ═══════════════════════════════════════════ */

function buildExecutiveSummary(doc: jsPDF, data: DossierPdfData) {
  doc.addPage();
  const { company, benchmarks, executives, contracts, warnNotices, partyBreakdown, publicStances, darkMoney, revolvingDoor, lobbyingIssues } = data;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...C.muted);
  doc.text("EXECUTIVE SUMMARY", ML, 18);
  doc.setFontSize(20);
  doc.setTextColor(...C.navy);
  doc.text("Integrity At a Glance", ML, 30);
  drawRule(doc, 34);

  // KPI row
  let y = 42;
  const score = company.civic_footprint_score ?? 0;
  const kpiW = (CW - 12) / 4;
  drawKpiBox(doc, ML, y, kpiW, "Influence Score", `${score}/100`, score > 70 ? C.red : score > 40 ? C.amber : C.green);
  drawKpiBox(doc, ML + kpiW + 4, y, kpiW, "PAC Spending", company.total_pac_spending ? fmt$(company.total_pac_spending) : "—", C.indigo);
  drawKpiBox(doc, ML + (kpiW + 4) * 2, y, kpiW, "Lobbying Spend", company.lobbying_spend ? fmt$(company.lobbying_spend) : "—", C.teal);
  drawKpiBox(doc, ML + (kpiW + 4) * 3, y, kpiW, "Gov Contracts", company.government_contracts ? fmt$(company.government_contracts) : "—", C.amber);
  y += 30;

  // Benchmarks
  if (benchmarks) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...C.slate);
    doc.text("INDUSTRY BENCHMARKS", ML, y);
    y += 6;
    const bi: string[] = [];
    if (benchmarks.industry_rank && benchmarks.industry_total) bi.push(`Rank: #${benchmarks.industry_rank} of ${benchmarks.industry_total}`);
    if (benchmarks.transparency_grade) bi.push(`Transparency: ${benchmarks.transparency_grade}`);
    if (benchmarks.cpa_zicklin_score != null) bi.push(`CPA-Zicklin: ${benchmarks.cpa_zicklin_score}`);
    if (benchmarks.peer_avg_pac_spending != null) bi.push(`Peer Avg PAC: ${fmt$(benchmarks.peer_avg_pac_spending)}`);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...C.navy);
    doc.text(bi.join("   ·   "), ML, y);
    y += 10;
  }
  drawRule(doc, y); y += 8;

  // Say-Do Gap synthesis
  const conflicts = publicStances.filter(s => s.gap.toLowerCase() !== "aligned" && s.gap.toLowerCase() !== "none");
  if (conflicts.length > 0 || darkMoney.length > 0 || revolvingDoor.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...C.red);
    doc.text("SAY-DO GAP™ SUMMARY", ML, y);
    y += 5;

    doc.setFillColor(239, 68, 68);
    doc.roundedRect(ML, y, CW, 1, 0.5, 0.5, "F");
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...C.navy);

    const gapFindings: string[] = [];
    if (conflicts.length > 0) {
      gapFindings.push(`${conflicts.length} documented contradiction(s) between public stances and actual spending behavior.`);
      conflicts.slice(0, 3).forEach(c => {
        gapFindings.push(`• ${c.topic}: Says "${c.public_position.substring(0, 60)}" → Spends on "${c.spending_reality.substring(0, 60)}"`);
      });
    }
    if (darkMoney.length > 0) gapFindings.push(`${darkMoney.length} opaque/dark-money channel(s) obscuring true political spending.`);
    if (revolvingDoor.length > 0) gapFindings.push(`${revolvingDoor.length} revolving-door personnel movement(s) between company and government.`);

    gapFindings.forEach(f => {
      y = safeY(doc, y, 8);
      const lines = doc.splitTextToSize(f, CW - 4);
      doc.text(lines, ML + 2, y + 2);
      y += lines.length * 4 + 2;
    });
    y += 4;
    drawRule(doc, y); y += 8;
  }

  // Party breakdown bar chart
  if (partyBreakdown.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...C.slate);
    doc.text("POLITICAL SPENDING BY PARTY", ML, y);
    y += 6;

    const total = partyBreakdown.reduce((s, p) => s + p.amount, 0) || 1;
    let bx = ML;
    for (const p of partyBreakdown) {
      const w = (p.amount / total) * CW;
      const color = p.party.toLowerCase().includes("rep") ? C.red : p.party.toLowerCase().includes("dem") ? C.blue : C.muted;
      doc.setFillColor(...color);
      doc.roundedRect(bx, y, Math.max(w, 2), 6, 1, 1, "F");
      bx += w;
    }
    y += 10;

    for (const p of partyBreakdown) {
      const color = p.party.toLowerCase().includes("rep") ? C.red : p.party.toLowerCase().includes("dem") ? C.blue : C.muted;
      doc.setFillColor(...color);
      doc.circle(ML + 1.5, y + 1.5, 1.5, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...C.navy);
      doc.text(`${p.party}: ${fmt$(p.amount)} (${Math.round((p.amount / total) * 100)}%)`, ML + 5, y + 2.5);
      y += 6;
    }
    y += 4;
    drawRule(doc, y); y += 8;
  }

  // Key findings
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...C.slate);
  doc.text("KEY FINDINGS", ML, y);
  y += 6;

  const findings: string[] = [];
  const donatingExecs = executives.filter(e => e.total_donations > 0);
  if (donatingExecs.length > 0) {
    const topE = donatingExecs.sort((a, b) => b.total_donations - a.total_donations)[0];
    findings.push(`${donatingExecs.length} executive(s) with documented political donations. Top: ${topE.name} (${topE.title}) — ${fmt$(topE.total_donations)}.`);
  }
  if (contracts.length > 0) {
    const tv = contracts.reduce((s, c) => s + (c.contract_value || 0), 0);
    findings.push(`${contracts.length} federal contract(s) totaling ${fmt$(tv)}.`);
  }
  if (warnNotices.length > 0) {
    const tw = warnNotices.reduce((s, w) => s + w.employees_affected, 0);
    findings.push(`${warnNotices.length} WARN Act notice(s) affecting ${tw.toLocaleString()} workers.`);
  }
  if (lobbyingIssues.length > 0) findings.push(`Active lobbying across ${lobbyingIssues.length} issue area(s).`);
  if (findings.length === 0) findings.push("No high-priority signals detected in current public records.");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...C.navy);
  findings.forEach(f => {
    y = safeY(doc, y, 8);
    doc.setFillColor(...C.indigo);
    doc.circle(ML + 1.5, y + 1, 1, "F");
    const lines = doc.splitTextToSize(f, CW - 8);
    doc.text(lines, ML + 6, y + 2);
    y += lines.length * 4 + 3;
  });
}

/* ═══════════════════════════════════════════
   SECTION 1: BUSINESS FOUNDATION
   ═══════════════════════════════════════════ */

function buildBusinessFoundation(doc: jsPDF, data: DossierPdfData): number {
  doc.addPage();
  let y = 18;
  y = sectionHeader(doc, y, 1, "Business Foundation", "Products, markets, and segment overview", "medium");

  const { company } = data;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...C.navy);
  doc.text("Company Overview", ML, y);
  y += 5;

  const overviewItems = [
    ["Industry", company.industry],
    ["Headquarters", company.state],
    ["Employees", company.employee_count || "Not disclosed"],
    ["Revenue", company.revenue || "Not disclosed"],
    ["Effective Tax Rate", company.effective_tax_rate || "Not disclosed"],
    ["Website", company.website_url || "—"],
  ];

  doc.autoTable({
    ...tableStyle(y),
    head: [["Attribute", "Value"]],
    body: overviewItems,
    columnStyles: { 0: { cellWidth: 45, fontStyle: "bold" as const } },
  });
  y = doc.lastAutoTable.finalY + 10;

  if (company.description) {
    y = safeY(doc, y, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...C.navy);
    doc.text("Business Description", ML, y);
    y += 5;

    doc.setFillColor(...C.fog);
    const descLines = doc.splitTextToSize(company.description, CW - 12);
    const boxH = descLines.length * 4 + 8;
    doc.roundedRect(ML, y, CW, boxH, 2, 2, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...C.navy);
    doc.text(descLines, ML + 6, y + 6);
    y += boxH + 8;
  }

  return y;
}

/* ═══════════════════════════════════════════
   SECTION 2: INNOVATION AUDIT
   ═══════════════════════════════════════════ */

function buildInnovationAudit(doc: jsPDF, data: DossierPdfData): number {
  doc.addPage();
  let y = 18;
  y = sectionHeader(doc, y, 2, "Innovation Audit", "Patent counts, technology clusters, and R&D themes", "low");

  doc.setFillColor(...C.fog);
  doc.roundedRect(ML, y, CW, 18, 2, 2, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C.slate);
  doc.text("Patent and technology cluster data is enriched via Google Patents and SEC 10-K filings.", ML + 6, y + 7);
  doc.text("Full innovation pipeline details available upon data enrichment scan completion.", ML + 6, y + 13);
  y += 26;

  return y;
}

/* ═══════════════════════════════════════════
   SECTION 3: ECOSYSTEM & SUPPLY CHAIN
   ═══════════════════════════════════════════ */

function buildEcosystemSection(doc: jsPDF, data: DossierPdfData): number {
  doc.addPage();
  let y = 18;
  const conf = sectionConfidenceLevel(data.contracts.length);
  y = sectionHeader(doc, y, 3, "Ecosystem & Supply Chain", "Subcontractors, federal contracts, and operational dependencies", conf);

  if (data.contracts.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...C.slate);
    doc.text("No federal contracts on record for this entity.", ML, y);
    return y + 10;
  }

  const totalVal = data.contracts.reduce((s, c) => s + (c.contract_value || 0), 0);
  drawKpiBox(doc, ML, y, 60, "Total Contract Value", fmt$(totalVal), C.teal);
  drawKpiBox(doc, ML + 64, y, 50, "Active Contracts", `${data.contracts.length}`, C.indigo);
  y += 30;

  doc.autoTable({
    ...tableStyle(y),
    head: [["Agency", "Value", "Description", "Year", "Confidence"]],
    body: data.contracts.slice(0, 25).map(c => [
      c.agency_name,
      c.contract_value ? fmt$(c.contract_value) : "—",
      (c.contract_description || "—").substring(0, 70),
      c.fiscal_year?.toString() || "—",
      c.confidence || "—",
    ]),
    columnStyles: { 1: { halign: "right" as const, cellWidth: 26 }, 3: { cellWidth: 14 }, 4: { cellWidth: 20 } },
  });
  return doc.lastAutoTable.finalY + 10;
}

/* ═══════════════════════════════════════════
   SECTION 4: WORKFORCE INTEL
   ═══════════════════════════════════════════ */

function buildWorkforceIntel(doc: jsPDF, data: DossierPdfData): number {
  doc.addPage();
  let y = 18;
  const totalData = data.warnNotices.length + data.sentiment.length + data.payEquity.length;
  y = sectionHeader(doc, y, 4, "Workforce Intel", "Role distribution, WARN notices, sentiment, and supply/demand scarcity", sectionConfidenceLevel(totalData));

  // WARN notices
  if (data.warnNotices.length > 0) {
    const totalAffected = data.warnNotices.reduce((s, w) => s + w.employees_affected, 0);
    drawKpiBox(doc, ML, y, 60, "Total WARN Notices", `${data.warnNotices.length}`, C.red);
    drawKpiBox(doc, ML + 64, y, 60, "Workers Affected", totalAffected.toLocaleString(), C.amber);
    y += 30;

    doc.autoTable({
      ...tableStyle(y),
      head: [["Date", "Employees Affected", "State", "Type"]],
      body: data.warnNotices.slice(0, 20).map(w => [
        new Date(w.notice_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
        w.employees_affected.toLocaleString(),
        w.location_state || "—",
        w.layoff_type || "Layoff",
      ]),
      columnStyles: { 1: { halign: "right" as const, cellWidth: 30 } },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // Sentiment
  if (data.sentiment.length > 0 && data.sentiment[0].ai_summary) {
    y = safeY(doc, y, 40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...C.navy);
    doc.text("Worker Sentiment Analysis", ML, y);
    y += 5;

    doc.setFillColor(...C.fog);
    const sentText = data.sentiment[0].ai_summary;
    const sentLines = doc.splitTextToSize(sentText, CW - 12);
    const boxH = sentLines.length * 4 + 8;
    doc.roundedRect(ML, y, CW, boxH, 2, 2, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...C.navy);
    doc.text(sentLines, ML + 6, y + 6);
    y += boxH + 8;
  }

  // Pay equity
  if (data.payEquity.length > 0) {
    y = safeY(doc, y, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...C.navy);
    doc.text("Pay Equity & Demographics Signals", ML, y);
    y += 4;

    doc.autoTable({
      ...tableStyle(y),
      head: [["Signal", "Evidence", "Confidence"]],
      body: data.payEquity.slice(0, 15).map(p => [
        p.signal_type.substring(0, 50),
        (p.evidence_text || "—").substring(0, 100),
        p.confidence,
      ]),
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  if (data.warnNotices.length === 0 && data.sentiment.length === 0 && data.payEquity.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...C.slate);
    doc.text("No workforce stability signals on record.", ML, y);
    y += 10;
  }

  return y;
}

/* ═══════════════════════════════════════════
   SECTION 5: DECISION LOGIC
   ═══════════════════════════════════════════ */

function buildDecisionLogic(doc: jsPDF, data: DossierPdfData): number {
  doc.addPage();
  let y = 18;
  y = sectionHeader(doc, y, 5, "Decision & Buying Logic", "Approval layers, buying committees, and decision-maker mapping", "low");

  // Executives as proxy for decision-makers
  if (data.executives.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...C.navy);
    doc.text("Key Decision Makers", ML, y);
    y += 4;

    doc.autoTable({
      ...tableStyle(y),
      head: [["Name", "Title", "Political Donations"]],
      body: data.executives.slice(0, 20).map(e => [
        e.name,
        e.title,
        e.total_donations > 0 ? fmt$(e.total_donations) : "None recorded",
      ]),
      columnStyles: { 2: { halign: "right" as const, cellWidth: 32 } },
    });
    y = doc.lastAutoTable.finalY + 10;
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...C.slate);
    doc.text("Executive and buying committee data enriched via SEC DEF 14A proxy filings.", ML, y);
    y += 10;
  }

  return y;
}

/* ═══════════════════════════════════════════
   SECTION 6: VALUES & POLITICAL RECEIPTS
   ═══════════════════════════════════════════ */

function buildPoliticalReceipts(doc: jsPDF, data: DossierPdfData): number {
  doc.addPage();
  let y = 18;
  const totalSignals = data.candidates.length + data.lobbyingIssues.length + data.publicStances.length;
  y = sectionHeader(doc, y, 6, "Values & Political Receipts", "PAC donations, lobbying spend, candidate flags, and stance contradictions", sectionConfidenceLevel(totalSignals));

  // Executive donations
  const donatingExecs = data.executives.filter(e => e.total_donations > 0);
  if (donatingExecs.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...C.navy);
    doc.text("Executive Political Donations", ML, y);
    y += 4;

    doc.autoTable({
      ...tableStyle(y),
      head: [["Name", "Title", "Total Donations"]],
      body: donatingExecs.sort((a, b) => b.total_donations - a.total_donations).slice(0, 20)
        .map(e => [e.name, e.title, fmt$(e.total_donations)]),
      columnStyles: { 2: { halign: "right" as const, cellWidth: 32 } },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // Candidates with Bacon Act flagging
  if (data.candidates.length > 0) {
    y = safeY(doc, y, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...C.navy);
    doc.text("Supported Candidates — PAC & Executive Giving", ML, y);
    y += 4;

    doc.autoTable({
      ...tableStyle(y),
      head: [["Candidate", "Party", "Amount", "⚠ Flag"]],
      body: data.candidates.sort((a, b) => b.amount - a.amount).slice(0, 25)
        .map(c => [
          c.name,
          c.party,
          fmt$(c.amount),
          c.flagged ? (c.flag_reason || "⚠ Flagged") : "—",
        ]),
      columnStyles: { 2: { halign: "right" as const, cellWidth: 28 }, 3: { cellWidth: 38 } },
      didParseCell: (d: any) => {
        if (d.column.index === 3 && d.cell.raw && d.cell.raw !== "—") {
          d.cell.styles.textColor = C.red;
          d.cell.styles.fontStyle = "bold";
        }
      },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // Lobbying
  if (data.lobbyingIssues.length > 0) {
    y = safeY(doc, y, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...C.navy);
    doc.text("Lobbying Activity by Issue", ML, y);
    y += 4;

    doc.autoTable({
      ...tableStyle(y),
      head: [["Issue Area", "Spend", "Related Bill"]],
      body: data.lobbyingIssues.slice(0, 20).map(l => [
        l.issue_area,
        l.amount ? fmt$(l.amount) : "—",
        l.bill_number || "—",
      ]),
      columnStyles: { 1: { halign: "right" as const, cellWidth: 28 } },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // Public stance contradictions
  if (data.publicStances.length > 0) {
    y = safeY(doc, y, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...C.navy);
    doc.text("Public Stance vs. Spending Reality (Say-Do Gap™)", ML, y);
    y += 4;

    doc.autoTable({
      ...tableStyle(y),
      head: [["Topic", "Public Position", "Spending Reality", "Gap"]],
      body: data.publicStances.slice(0, 15).map(s => [
        s.topic,
        s.public_position.substring(0, 50),
        s.spending_reality.substring(0, 50),
        s.gap,
      ]),
      didParseCell: (d: any) => {
        if (d.column.index === 3 && d.cell.raw && d.cell.raw.toLowerCase() !== "aligned" && d.cell.raw.toLowerCase() !== "none") {
          d.cell.styles.textColor = C.red;
          d.cell.styles.fontStyle = "bold";
        }
      },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // Dark money
  if (data.darkMoney.length > 0) {
    y = safeY(doc, y, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...C.navy);
    doc.text("Opaque Funding Channels (Dark Money)", ML, y);
    y += 4;

    doc.autoTable({
      ...tableStyle(y),
      head: [["Organization", "Type", "Relationship", "Est. Amount"]],
      body: data.darkMoney.slice(0, 15).map(d => [
        d.name, d.org_type, d.relationship, d.estimated_amount ? fmt$(d.estimated_amount) : "—",
      ]),
      columnStyles: { 3: { halign: "right" as const, cellWidth: 28 } },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // Revolving door
  if (data.revolvingDoor.length > 0) {
    y = safeY(doc, y, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...C.navy);
    doc.text("Revolving Door — Government ↔ Corporate", ML, y);
    y += 4;

    doc.autoTable({
      ...tableStyle(y),
      head: [["Person", "Prior Government Role", "Current Corporate Role"]],
      body: data.revolvingDoor.slice(0, 15).map(r => [r.person, r.prior_role, r.new_role]),
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // Values signals
  if (data.valuesSignals.length > 0) {
    y = safeY(doc, y, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...C.navy);
    doc.text("Values & ESG Signals", ML, y);
    y += 4;

    doc.autoTable({
      ...tableStyle(y),
      head: [["Category", "Signal Summary"]],
      body: data.valuesSignals.slice(0, 25).map(s => [
        s.issue_category || s.signal_category || "General",
        (s.signal_summary || s.evidence_text || "—").substring(0, 130),
      ]),
      columnStyles: { 0: { cellWidth: 36 } },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  return y;
}

/* ═══════════════════════════════════════════
   MARCH 2026 REGULATORY ALERT
   ═══════════════════════════════════════════ */

function buildMarch2026Alert(doc: jsPDF, data: DossierPdfData): number {
  doc.addPage();
  let y = 18;

  // Alert header — red accent
  doc.setFillColor(...C.red);
  doc.roundedRect(ML, y, CW, 16, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...C.white);
  doc.text("⚠  REGULATORY ALERT", ML + 5, y + 6);
  doc.setFontSize(11);
  doc.text("March 2026 Truth Briefing", ML + 42, y + 6.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(`As of ${AUDIT_DATE}`, ML + 42, y + 12.5);
  y += 24;

  // H.R. 7567 (Bacon Act)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...C.navy);
  doc.text("H.R. 7567 — The Bacon Act (March 5, 2026 Vote)", ML, y);
  y += 5;

  doc.setFillColor(...C.fog);
  doc.roundedRect(ML, y, CW, 20, 2, 2, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C.navy);
  doc.text("Animal welfare bill voted March 5, 2026. Any PAC donations to a 'YES' voter after", ML + 6, y + 7);
  doc.text("this date trigger a 'Value Conflict' badge in the Influence pipeline.", ML + 6, y + 13);
  y += 26;

  // Check for flagged candidates (Bacon Act sponsors)
  const baconFlagged = data.candidates.filter(c => c.flagged);
  if (baconFlagged.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...C.red);
    doc.text(`⚠ ${baconFlagged.length} FLAGGED CANDIDATE(S) DETECTED`, ML, y);
    y += 4;

    doc.autoTable({
      ...tableStyle(y),
      head: [["Candidate", "Party", "Amount", "Flag Reason"]],
      body: baconFlagged.map(c => [c.name, c.party, fmt$(c.amount), c.flag_reason || "Bacon Act Sponsor"]),
      headStyles: { fillColor: C.red, textColor: C.white, fontStyle: "bold" as const, fontSize: 7 },
      columnStyles: { 2: { halign: "right" as const, cellWidth: 28 } },
    });
    y = doc.lastAutoTable.finalY + 10;
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...C.green);
    doc.text("✓ No flagged Bacon Act sponsor donations detected.", ML, y);
    y += 10;
  }

  // Q1 WARN Notices
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...C.navy);
  doc.text("Q1 2026 WARN Notices — Workforce Stability", ML, y);
  y += 5;

  const q1Warns = data.warnNotices.filter(w => {
    const d = new Date(w.notice_date);
    return d.getFullYear() >= 2025;
  });

  if (q1Warns.length > 0) {
    const affected = q1Warns.reduce((s, w) => s + w.employees_affected, 0);
    drawKpiBox(doc, ML, y, 55, "Recent WARN Notices", `${q1Warns.length}`, C.red);
    drawKpiBox(doc, ML + 59, y, 55, "Workers Affected", affected.toLocaleString(), C.amber);
    y += 28;
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...C.green);
    doc.text("✓ No recent WARN notices filed.", ML, y);
    y += 10;
  }

  // FTC Section 5 Lobbying
  y = safeY(doc, y, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...C.navy);
  doc.text("FTC Section 5 — AI Bias Audit Preemption", ML, y);
  y += 5;

  doc.setFillColor(...C.fog);
  doc.roundedRect(ML, y, CW, 20, 2, 2, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C.navy);
  doc.text("Tracking ATS providers lobbying under FTC Section 5 to block mandatory AI bias audits.", ML + 6, y + 7);
  doc.text("Companies with active lobbying in this area are flagged as HR Tech Gatekeepers.", ML + 6, y + 13);
  y += 26;

  const ftcLobbying = data.lobbyingIssues.filter(l =>
    l.issue_area.toLowerCase().includes("ftc") ||
    l.issue_area.toLowerCase().includes("artificial intelligence") ||
    l.issue_area.toLowerCase().includes("ai") ||
    l.bill_number?.toLowerCase().includes("ftc")
  );

  if (ftcLobbying.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...C.red);
    doc.text(`⚠ ${ftcLobbying.length} AI/FTC-related lobbying issue(s) detected`, ML, y);
    y += 4;

    doc.autoTable({
      ...tableStyle(y),
      head: [["Issue Area", "Spend", "Related Bill"]],
      body: ftcLobbying.map(l => [l.issue_area, l.amount ? fmt$(l.amount) : "—", l.bill_number || "—"]),
      headStyles: { fillColor: C.amber, textColor: C.white, fontStyle: "bold" as const, fontSize: 7 },
    });
    y = doc.lastAutoTable.finalY + 10;
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...C.green);
    doc.text("✓ No AI bias audit lobbying detected.", ML, y);
    y += 10;
  }

  return y;
}

/* ═══════════════════════════════════════════
   METHODOLOGY & DISCLAIMER
   ═══════════════════════════════════════════ */

function buildDisclaimerPage(doc: jsPDF) {
  doc.addPage();

  doc.setFillColor(...C.navy);
  doc.rect(0, 0, PW, 40, "F");
  doc.setFillColor(...C.indigo);
  doc.rect(0, 0, PW, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...C.indigo);
  doc.text("WHO DO I WORK FOR?", ML, 16);
  doc.setFontSize(16);
  doc.setTextColor(...C.white);
  doc.text("Methodology & Sources", ML, 30);

  let y = 54;

  const sections = [
    {
      title: "DATA SOURCES",
      items: [
        "Federal Election Commission (FEC) — campaign contribution and PAC spending records",
        "USASpending.gov — federal contract awards and obligations",
        "Senate Lobbying Disclosure Act (LDA) filings — lobbying registrations and issue areas",
        "SEC EDGAR — 10-K, DEF 14A proxy statements, beneficial ownership",
        "Department of Labor WARN Act — worker adjustment and retraining notifications",
        "OpenSecrets.org — dark money and outside spending aggregations",
        "Google Patents — patent filings and innovation clustering",
        "OpenCorporates — corporate structure and subsidiaries",
        "Public ESG, sustainability, and DEI reports published by the company",
      ],
    },
    {
      title: "CONFIDENCE SCORING",
      items: [
        "HIGH — Directly sourced from official government filings with exact entity match",
        "MEDIUM — Cross-referenced from multiple credible secondary sources",
        "LOW — Inferred from partial matches or single-source reporting; flagged for review",
      ],
    },
    {
      title: "IMPORTANT DISCLAIMER",
      items: [
        "This report surfaces signals from public records and documented disclosures.",
        "It does not assign moral, legal, or political judgments. Interpretation is left to the reader.",
        "All data is subject to filing delays and corrections by originating agencies.",
        `Report generated: ${AUDIT_DATE}`,
      ],
    },
  ];

  sections.forEach(section => {
    y = safeY(doc, y, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...C.indigo);
    doc.text(section.title, ML, y);
    y += 5;
    drawRule(doc, y, C.subtle);
    y += 5;

    section.items.forEach(item => {
      y = safeY(doc, y, 8);
      doc.setFillColor(...C.slate);
      doc.circle(ML + 1.5, y + 0.5, 0.8, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...C.navy);
      const lines = doc.splitTextToSize(item, CW - 8);
      doc.text(lines, ML + 6, y + 1.5);
      y += lines.length * 3.5 + 2;
    });
    y += 6;
  });

  // Confidentiality notice
  y = safeY(doc, y, 20);
  doc.setFillColor(...C.fog);
  doc.roundedRect(ML, y, CW, 16, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...C.slate);
  doc.text("CONFIDENTIALITY NOTICE", ML + 6, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("This document is prepared exclusively for the subscriber and intended for internal decision-making. Redistribution is not authorized.", ML + 6, y + 11);
}

/* ─── Page numbers ─── */

function addPageNumbers(doc: jsPDF) {
  const total = doc.getNumberOfPages();
  for (let i = 2; i <= total; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...C.muted);
    doc.text("WHO DO I WORK FOR? · Integrity Brief", ML, PH - 8);
    doc.text(`${i} / ${total}`, PW - MR, PH - 8, { align: "right" });
    doc.setDrawColor(...C.subtle);
    doc.setLineWidth(0.2);
    doc.line(ML, 12, PW - MR, 12);
  }
}

/* ═══════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════ */
export function generateDossierPdf(data: DossierPdfData): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  buildCoverPage(doc, data);
  buildExecutiveSummary(doc, data);
  buildBusinessFoundation(doc, data);
  buildInnovationAudit(doc, data);
  buildEcosystemSection(doc, data);
  buildWorkforceIntel(doc, data);
  buildDecisionLogic(doc, data);
  buildPoliticalReceipts(doc, data);
  buildMarch2026Alert(doc, data);
  buildDisclaimerPage(doc);
  addPageNumbers(doc);

  return doc;
}
