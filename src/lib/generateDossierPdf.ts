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
  candidates: Array<{ name: string; party: string; amount: number; flagged: boolean }>;
}

/* ─── Brand palette (RGB) ─── */
const C = {
  navy:     [15, 23, 42]   as [number, number, number],
  charcoal: [30, 41, 59]   as [number, number, number],
  slate:    [71, 85, 105]  as [number, number, number],
  muted:    [148, 163, 184] as [number, number, number],
  subtle:   [226, 232, 240] as [number, number, number],
  fog:      [241, 245, 249] as [number, number, number],
  white:    [255, 255, 255] as [number, number, number],
  indigo:   [99, 91, 255]  as [number, number, number],
  teal:     [20, 184, 166] as [number, number, number],
  amber:    [245, 158, 11] as [number, number, number],
  red:      [239, 68, 68]  as [number, number, number],
  green:    [34, 197, 94]  as [number, number, number],
};

const PW = 210; // page width mm
const PH = 297; // page height mm
const ML = 18;  // margin left
const MR = 18;  // margin right
const CW = PW - ML - MR; // content width

const fmt$ = (n: number) => `$${n.toLocaleString("en-US")}`;

/* ─── Utility drawing helpers ─── */

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
  const tw = doc.getStringUnitWidth(text) * 6 / doc.internal.scaleFactor + 4;
  doc.setFillColor(...color);
  doc.roundedRect(x, y - 3.5, tw, 5, 1.2, 1.2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(...C.white);
  doc.text(text, x + 2, y);
}

/* ─── Page builders ─── */

function buildCoverPage(doc: jsPDF, data: DossierPdfData) {
  const { company } = data;

  // Full bleed navy background
  doc.setFillColor(...C.navy);
  doc.rect(0, 0, PW, PH, "F");

  // Accent stripe at top
  doc.setFillColor(...C.indigo);
  doc.rect(0, 0, PW, 4, "F");

  // Classification label
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...C.indigo);
  doc.text("CONFIDENTIAL", ML, 22);

  // Thin separator
  doc.setDrawColor(255, 255, 255, 0.15);
  doc.setLineWidth(0.2);
  doc.line(ML, 27, PW - MR, 27);

  // Report type
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...C.muted);
  doc.text("CORPORATE INTELLIGENCE DOSSIER", ML, 70);

  // Company name — large
  doc.setFont("helvetica", "bold");
  doc.setFontSize(36);
  doc.setTextColor(...C.white);
  const nameLines = doc.splitTextToSize(company.name, CW);
  doc.text(nameLines, ML, 90);
  const nameEndY = 90 + nameLines.length * 14;

  // Subtitle description
  if (company.description) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...C.muted);
    const descLines = doc.splitTextToSize(company.description, CW - 20);
    doc.text(descLines.slice(0, 4), ML, nameEndY + 10);
  }

  // Metadata grid — bottom left
  const metaY = 200;
  const metaItems = [
    ["INDUSTRY", company.industry],
    ["HEADQUARTERS", company.state],
    ["EMPLOYEES", company.employee_count || "—"],
    ["REVENUE", company.revenue || "—"],
  ];
  if (company.parent_company) metaItems.push(["PARENT COMPANY", company.parent_company]);

  metaItems.forEach((item, i) => {
    const y = metaY + i * 12;
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
  doc.rect(0, PH - 28, PW, 28, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...C.indigo);
  doc.text("WHO DO I WORK FOR?", ML, PH - 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...C.muted);
  doc.text("Career Intelligence by Jackye Clayton", ML, PH - 10);

  const genDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  doc.text(`Generated ${genDate}`, PW - MR, PH - 10, { align: "right" });
}

function buildExecutiveSummary(doc: jsPDF, data: DossierPdfData) {
  doc.addPage();
  const { company, benchmarks, executives, contracts, warnNotices, partyBreakdown } = data;

  // Page header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...C.muted);
  doc.text("EXECUTIVE SUMMARY", ML, 18);
  doc.setFontSize(20);
  doc.setTextColor(...C.navy);
  doc.text("At a Glance", ML, 30);
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

  // Benchmarks row
  if (benchmarks) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...C.slate);
    doc.text("INDUSTRY BENCHMARKS", ML, y);
    y += 6;
    const benchItems = [];
    if (benchmarks.industry_rank && benchmarks.industry_total) benchItems.push(`Rank: #${benchmarks.industry_rank} of ${benchmarks.industry_total}`);
    if (benchmarks.transparency_grade) benchItems.push(`Transparency: ${benchmarks.transparency_grade}`);
    if (benchmarks.cpa_zicklin_score != null) benchItems.push(`CPA-Zicklin: ${benchmarks.cpa_zicklin_score}`);
    if (benchmarks.peer_avg_pac_spending != null) benchItems.push(`Peer Avg PAC: ${fmt$(benchmarks.peer_avg_pac_spending)}`);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...C.navy);
    doc.text(benchItems.join("   ·   "), ML, y);
    y += 10;
  }

  drawRule(doc, y);
  y += 8;

  // Party breakdown summary
  if (partyBreakdown.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...C.slate);
    doc.text("POLITICAL SPENDING BY PARTY", ML, y);
    y += 6;

    const total = partyBreakdown.reduce((s, p) => s + p.amount, 0) || 1;
    const barW = CW;
    let bx = ML;
    for (const p of partyBreakdown) {
      const w = (p.amount / total) * barW;
      const color = p.party.toLowerCase().includes("rep") ? C.red : p.party.toLowerCase().includes("dem") ? [59, 130, 246] as [number, number, number] : C.muted;
      doc.setFillColor(...color);
      doc.roundedRect(bx, y, Math.max(w, 2), 6, 1, 1, "F");
      bx += w;
    }
    y += 10;

    // Legend
    for (const p of partyBreakdown) {
      const color = p.party.toLowerCase().includes("rep") ? C.red : p.party.toLowerCase().includes("dem") ? [59, 130, 246] as [number, number, number] : C.muted;
      doc.setFillColor(...color);
      doc.circle(ML + 1.5, y + 1.5, 1.5, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...C.navy);
      doc.text(`${p.party}: ${fmt$(p.amount)} (${Math.round((p.amount / total) * 100)}%)`, ML + 5, y + 2.5);
      y += 6;
    }
    y += 4;
    drawRule(doc, y);
    y += 8;
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
    const topExec = donatingExecs.sort((a, b) => b.total_donations - a.total_donations)[0];
    findings.push(`${donatingExecs.length} executive(s) with documented political donations. Top donor: ${topExec.name} (${topExec.title}) — ${fmt$(topExec.total_donations)}.`);
  }
  if (contracts.length > 0) {
    const totalVal = contracts.reduce((s, c) => s + (c.contract_value || 0), 0);
    findings.push(`${contracts.length} federal contract(s) on record totaling ${fmt$(totalVal)}.`);
  }
  if (warnNotices.length > 0) {
    const totalAffected = warnNotices.reduce((s, w) => s + w.employees_affected, 0);
    findings.push(`${warnNotices.length} WARN Act notice(s) affecting ${totalAffected.toLocaleString()} workers.`);
  }
  if (data.darkMoney.length > 0) findings.push(`${data.darkMoney.length} dark-money or opaque-channel connection(s) identified.`);
  if (data.revolvingDoor.length > 0) findings.push(`${data.revolvingDoor.length} revolving-door movement(s) between company and government.`);
  if (data.lobbyingIssues.length > 0) findings.push(`Active lobbying across ${data.lobbyingIssues.length} issue area(s).`);
  if (data.publicStances.length > 0) {
    const conflicts = data.publicStances.filter(s => s.gap.toLowerCase() !== "aligned" && s.gap.toLowerCase() !== "none");
    if (conflicts.length > 0) findings.push(`${conflicts.length} public stance(s) with documented spending contradictions.`);
  }
  if (findings.length === 0) findings.push("No high-priority signals detected in current public records.");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...C.navy);
  findings.forEach((f, i) => {
    y = safeY(doc, y, 8);
    doc.setFillColor(...C.indigo);
    doc.circle(ML + 1.5, y + 1, 1, "F");
    const fLines = doc.splitTextToSize(f, CW - 8);
    doc.text(fLines, ML + 6, y + 2);
    y += fLines.length * 4 + 3;
  });
}

function sectionHeader(doc: jsPDF, y: number, layerNum: number, title: string, subtitle: string): number {
  y = safeY(doc, y, 20);
  doc.setFillColor(...C.navy);
  doc.roundedRect(ML, y, CW, 14, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...C.indigo);
  doc.text(`LAYER ${layerNum}`, ML + 5, y + 5.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...C.white);
  doc.text(title, ML + 28, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...C.muted);
  doc.text(subtitle, ML + 28, y + 11.5);

  return y + 20;
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
    columnStyles: {},
    tableLineColor: C.subtle,
  };
}

/* ─── Section builders ─── */

function buildInfluenceSection(doc: jsPDF, data: DossierPdfData): number {
  doc.addPage();
  let y = 18;
  y = sectionHeader(doc, y, 4, "Influence & Policy", "PAC spending, executive donations, lobbying activity, candidate support");

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
      body: donatingExecs
        .sort((a, b) => b.total_donations - a.total_donations)
        .slice(0, 20)
        .map(e => [e.name, e.title, fmt$(e.total_donations)]),
      columnStyles: { 2: { halign: "right" as const, cellWidth: 32 } },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // Top candidates
  if (data.candidates.length > 0) {
    y = safeY(doc, y, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...C.navy);
    doc.text("Top Supported Candidates", ML, y);
    y += 4;

    doc.autoTable({
      ...tableStyle(y),
      head: [["Candidate", "Party", "Amount", "Flagged"]],
      body: data.candidates
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 20)
        .map(c => [c.name, c.party, fmt$(c.amount), c.flagged ? "⚠ Yes" : "—"]),
      columnStyles: { 2: { halign: "right" as const, cellWidth: 28 } },
      didParseCell: (d: any) => {
        if (d.column.index === 3 && d.cell.raw === "⚠ Yes") {
          d.cell.styles.textColor = C.red;
          d.cell.styles.fontStyle = "bold";
        }
      },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // Lobbying issues
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

  return y;
}

function buildContractsSection(doc: jsPDF, data: DossierPdfData): number {
  if (data.contracts.length === 0) return 0;
  doc.addPage();
  let y = 18;
  y = sectionHeader(doc, y, 3, "Government Ecosystem", "Federal contracts, agency relationships, and fiscal commitments");

  const totalVal = data.contracts.reduce((s, c) => s + (c.contract_value || 0), 0);
  drawKpiBox(doc, ML, y, 60, "Total Contract Value", fmt$(totalVal), C.teal);
  drawKpiBox(doc, ML + 64, y, 50, "Active Contracts", `${data.contracts.length}`, C.indigo);
  y += 30;

  doc.autoTable({
    ...tableStyle(y),
    head: [["Agency", "Value", "Description", "Year"]],
    body: data.contracts.slice(0, 25).map(c => [
      c.agency_name,
      c.contract_value ? fmt$(c.contract_value) : "—",
      (c.contract_description || "—").substring(0, 80),
      c.fiscal_year?.toString() || "—",
    ]),
    columnStyles: { 1: { halign: "right" as const, cellWidth: 26 }, 3: { cellWidth: 14 } },
  });
  return doc.lastAutoTable.finalY + 10;
}

function buildDarkMoneySection(doc: jsPDF, data: DossierPdfData): number {
  if (data.darkMoney.length === 0 && data.revolvingDoor.length === 0) return 0;
  doc.addPage();
  let y = 18;
  y = sectionHeader(doc, y, 5, "Patterns & Synthesis", "Dark-money channels, revolving-door movements, hypocrisy index");

  if (data.darkMoney.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...C.navy);
    doc.text("Opaque Funding Channels", ML, y);
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

  // Hypocrisy / stance conflicts
  if (data.publicStances.length > 0) {
    y = safeY(doc, y, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...C.navy);
    doc.text("Public Stance vs. Spending Reality", ML, y);
    y += 4;

    doc.autoTable({
      ...tableStyle(y),
      head: [["Topic", "Public Position", "Spending Reality", "Gap"]],
      body: data.publicStances.slice(0, 15).map(s => [
        s.topic, s.public_position.substring(0, 50), s.spending_reality.substring(0, 50), s.gap,
      ]),
      didParseCell: (d: any) => {
        if (d.column.index === 3 && d.cell.raw && d.cell.raw.toLowerCase() !== "aligned") {
          d.cell.styles.textColor = C.red;
          d.cell.styles.fontStyle = "bold";
        }
      },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  return y;
}

function buildWorkforceSection(doc: jsPDF, data: DossierPdfData): number {
  if (data.warnNotices.length === 0 && data.sentiment.length === 0 && data.payEquity.length === 0) return 0;
  doc.addPage();
  let y = 18;
  y = sectionHeader(doc, y, 6, "Talent Context", "Workforce stability, WARN notices, worker sentiment, pay equity signals");

  if (data.warnNotices.length > 0) {
    const totalAffected = data.warnNotices.reduce((s, w) => s + w.employees_affected, 0);
    drawKpiBox(doc, ML, y, 60, "Total Layoff Notices", `${data.warnNotices.length}`, C.red);
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

  if (data.sentiment.length > 0 && data.sentiment[0].ai_summary) {
    y = safeY(doc, y, 40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...C.navy);
    doc.text("Worker Sentiment Analysis", ML, y);
    y += 5;

    // Sentiment box
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

  return y;
}

function buildValuesSection(doc: jsPDF, data: DossierPdfData): number {
  if (data.valuesSignals.length === 0) return 0;
  doc.addPage();
  let y = 18;
  y = sectionHeader(doc, y, 7, "Values & Alignment Signals", "ESG signals, equity, environmental, and social responsibility indicators");

  doc.autoTable({
    ...tableStyle(y),
    head: [["Category", "Signal Summary"]],
    body: data.valuesSignals.slice(0, 30).map(s => [
      s.issue_category || s.signal_category || "General",
      (s.signal_summary || s.evidence_text || "—").substring(0, 140),
    ]),
    columnStyles: { 0: { cellWidth: 36 } },
  });

  return doc.lastAutoTable.finalY + 10;
}

function buildDisclaimerPage(doc: jsPDF, companyName: string) {
  doc.addPage();

  // Header bar
  doc.setFillColor(...C.navy);
  doc.rect(0, 0, PW, 40, "F");
  doc.setFillColor(...C.indigo);
  doc.rect(0, 0, PW, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...C.indigo);
  doc.text("WHO DO I WORK FOR?", ML, 16);
  doc.setFont("helvetica", "bold");
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
        "Yahoo Finance — historical stock performance data",
        "OpenCorporates — corporate structure and subsidiaries",
        "Public ESG, sustainability, and DEI reports published by the company",
      ],
    },
    {
      title: "CONFIDENCE METHODOLOGY",
      items: [
        "Strong — directly sourced from official government filings with exact match",
        "Some — cross-referenced from multiple credible secondary sources",
        "Weak — inferred from partial matches or single-source reporting; flagged for review",
      ],
    },
    {
      title: "IMPORTANT DISCLAIMER",
      items: [
        "This report surfaces signals from public records and documented disclosures.",
        "It does not assign moral, legal, or political judgments. Interpretation is left to the reader.",
        "All data is subject to filing delays and corrections by originating agencies.",
        `Report generated: ${new Date().toISOString().split("T")[0]}`,
      ],
    },
  ];

  sections.forEach((section) => {
    y = safeY(doc, y, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...C.indigo);
    doc.text(section.title, ML, y);
    y += 5;
    drawRule(doc, y, C.subtle);
    y += 5;

    section.items.forEach((item) => {
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

function addPageNumbers(doc: jsPDF) {
  const total = doc.getNumberOfPages();
  for (let i = 2; i <= total; i++) { // skip cover page
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...C.muted);

    // Left: brand
    doc.text("WHO DO I WORK FOR? · Intelligence Dossier", ML, PH - 8);
    // Right: page number
    doc.text(`${i} / ${total}`, PW - MR, PH - 8, { align: "right" });

    // Top rule
    doc.setDrawColor(...C.subtle);
    doc.setLineWidth(0.2);
    doc.line(ML, 12, PW - MR, 12);
  }
}

/* ─── Main export function ─── */
export function generateDossierPdf(data: DossierPdfData): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  buildCoverPage(doc, data);
  buildExecutiveSummary(doc, data);
  buildInfluenceSection(doc, data);
  buildContractsSection(doc, data);
  buildDarkMoneySection(doc, data);
  buildWorkforceSection(doc, data);
  buildValuesSection(doc, data);
  buildDisclaimerPage(doc, data.company.name);
  addPageNumbers(doc);

  return doc;
}
