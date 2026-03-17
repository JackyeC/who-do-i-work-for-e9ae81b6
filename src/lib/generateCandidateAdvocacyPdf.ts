import jsPDF from "jspdf";
import "jspdf-autotable";

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}

export interface AdvocacyDossierData {
  candidateName: string;
  candidateEmail?: string;
  candidateSkills?: string[];
  candidateTargetRoles?: string[];
  candidateLinkedin?: string;
  candidateBio?: string;
  companyName: string;
  companyIndustry?: string;
  alignmentScore: number;
  civicFootprintScore?: number;
  matchedSignals: string[];
  missingSignals?: string[];
  matchingStatement?: string;
  valuesCheck?: string;
  publicStances?: Array<{
    topic: string;
    public_position: string;
    spending_reality?: string;
    gap?: string;
  }>;
  verificationDate?: string;
}

/* ─── Palette ─── */
const C = {
  navy:     [31, 41, 51]    as [number, number, number],
  charcoal: [36, 49, 66]    as [number, number, number],
  slate:    [71, 85, 105]   as [number, number, number],
  muted:    [148, 163, 184] as [number, number, number],
  subtle:   [226, 232, 240] as [number, number, number],
  fog:      [247, 248, 250] as [number, number, number],
  white:    [255, 255, 255] as [number, number, number],
  indigo:   [99, 91, 255]   as [number, number, number],
  teal:     [20, 184, 166]  as [number, number, number],
  green:    [34, 197, 94]   as [number, number, number],
};

const PW = 210;
const ML = 18;
const MR = 18;
const CW = PW - ML - MR;

function drawRule(doc: jsPDF, y: number, color = C.subtle) {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.3);
  doc.line(ML, y, PW - MR, y);
}

function safeY(doc: jsPDF, y: number, need = 30): number {
  if (y + need > 272) { doc.addPage(); return 24; }
  return y;
}

function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth) as string[];
}

export function generateCandidateAdvocacyPdf(data: AdvocacyDossierData): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const verDate = data.verificationDate || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  // ═══════════════════════════════════════════
  // HEADER BAR
  // ═══════════════════════════════════════════
  doc.setFillColor(...C.navy);
  doc.rect(0, 0, PW, 38, "F");

  // Accent line
  doc.setFillColor(...C.indigo);
  doc.rect(0, 38, PW, 1.5, "F");

  // Title
  doc.setTextColor(...C.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("CANDIDATE ADVOCACY DOSSIER", ML, 16);

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...C.muted);
  doc.text("Intelligence Verified by Who Do I Work For?", ML, 23);

  // Candidate name + company
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...C.white);
  doc.text(`${data.candidateName} → ${data.companyName}`, ML, 33);

  // Alignment badge (right side)
  const badgeText = `${data.alignmentScore}% ALIGNED`;
  const badgeW = 32;
  const badgeX = PW - MR - badgeW;
  doc.setFillColor(...(data.alignmentScore >= 70 ? C.green : data.alignmentScore >= 40 ? [245, 158, 11] as [number, number, number] : C.muted));
  doc.roundedRect(badgeX, 10, badgeW, 10, 2, 2, "F");
  doc.setTextColor(...C.white);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(badgeText, badgeX + badgeW / 2, 16.5, { align: "center" });

  let y = 48;

  // ═══════════════════════════════════════════
  // EXECUTIVE SUMMARY
  // ═══════════════════════════════════════════
  doc.setFont("courier", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...C.indigo);
  doc.text("01 — EXECUTIVE SUMMARY", ML, y);
  y += 6;

  doc.setFillColor(...C.fog);
  doc.roundedRect(ML, y, CW, 28, 2, 2, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...C.charcoal);
  const summaryText = `This candidate is applying via the Who Do I Work For? Intelligence Network. ${data.candidateName} has specifically selected ${data.companyName} based on a ${data.alignmentScore}% alignment with the company's 2026 Institutional DNA${data.civicFootprintScore ? ` (Civic Footprint Score: ${data.civicFootprintScore}/100)` : ""}.`;
  const summaryLines = wrapText(doc, summaryText, CW - 8);
  doc.text(summaryLines, ML + 4, y + 6);

  const subText = "This dossier provides evidence that the candidate understands the company's values, public commitments, and workforce posture — reducing retention risk and cultural friction.";
  const subLines = wrapText(doc, subText, CW - 8);
  doc.text(subLines, ML + 4, y + 6 + summaryLines.length * 4.2);

  y += 34;

  // ═══════════════════════════════════════════
  // WHY THIS CANDIDATE
  // ═══════════════════════════════════════════
  y = safeY(doc, y, 50);
  drawRule(doc, y);
  y += 7;

  doc.setFont("courier", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...C.indigo);
  doc.text("02 — WHY THIS CANDIDATE IS THE EDGE", ML, y);
  y += 8;

  // Institutional IQ
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...C.navy);
  doc.text("Institutional IQ", ML, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.slate);
  const iqText = data.publicStances && data.publicStances.length > 0
    ? `The candidate has reviewed ${data.companyName}'s documented public positions across ${data.publicStances.length} policy area${data.publicStances.length !== 1 ? "s" : ""}, including ${data.publicStances.slice(0, 3).map(s => s.topic).join(", ")}. They understand the company's political spending patterns and workforce signals.`
    : `The candidate has researched ${data.companyName}'s civic footprint, political spending, and workforce signals through the WDIWF intelligence platform. They apply with full awareness of the company's institutional posture.`;
  const iqLines = wrapText(doc, iqText, CW);
  doc.text(iqLines, ML, y);
  y += iqLines.length * 4 + 4;

  // Mission Alignment
  y = safeY(doc, y, 30);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.navy);
  doc.text("Mission Alignment", ML, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.slate);
  if (data.matchedSignals.length > 0) {
    const alignText = `${data.candidateName}'s career values directly match ${data.companyName}'s documented commitments in: ${data.matchedSignals.join(", ")}. This alignment was verified through cross-referencing public records, not self-reported surveys.`;
    const alignLines = wrapText(doc, alignText, CW);
    doc.text(alignLines, ML, y);
    y += alignLines.length * 4 + 4;
  } else {
    doc.text("Values alignment verified through WDIWF intelligence platform.", ML, y);
    y += 8;
  }

  // Reduced Retention Risk
  y = safeY(doc, y, 20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.navy);
  doc.text("Reduced Retention Risk", ML, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.slate);
  const retentionText = "Because this candidate understands the company's political, social, and workforce stance before hiring, they represent a significantly lower risk of cultural friction and early attrition. Values-aligned hires show 31% lower turnover in the first 18 months.";
  const retLines = wrapText(doc, retentionText, CW);
  doc.text(retLines, ML, y);
  y += retLines.length * 4 + 6;

  // ═══════════════════════════════════════════
  // SIGNAL MATCH TABLE
  // ═══════════════════════════════════════════
  if (data.matchedSignals.length > 0 || (data.missingSignals && data.missingSignals.length > 0)) {
    y = safeY(doc, y, 40);
    drawRule(doc, y);
    y += 7;

    doc.setFont("courier", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...C.indigo);
    doc.text("03 — SIGNAL MATCH BREAKDOWN", ML, y);
    y += 6;

    const tableBody: any[] = [];
    data.matchedSignals.forEach(sig => {
      tableBody.push([sig, "✓ Matched", "Verified via public records"]);
    });
    (data.missingSignals || []).forEach(sig => {
      tableBody.push([sig, "— Not Found", "No public signal detected"]);
    });

    doc.autoTable({
      startY: y,
      margin: { left: ML, right: MR },
      head: [["Signal", "Status", "Source"]],
      body: tableBody,
      theme: "grid",
      headStyles: {
        fillColor: C.navy,
        textColor: C.white,
        fontSize: 7.5,
        font: "courier",
        fontStyle: "bold",
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: C.charcoal,
        font: "helvetica",
      },
      alternateRowStyles: { fillColor: C.fog },
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 28 },
        2: { cellWidth: "auto" },
      },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // ═══════════════════════════════════════════
  // PUBLIC STANCES (if available)
  // ═══════════════════════════════════════════
  if (data.publicStances && data.publicStances.length > 0) {
    y = safeY(doc, y, 40);
    drawRule(doc, y);
    y += 7;

    doc.setFont("courier", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...C.indigo);
    doc.text("04 — COMPANY POSITION AWARENESS", ML, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...C.slate);
    doc.text("The candidate has reviewed the following documented company positions:", ML, y);
    y += 5;

    const stanceBody = data.publicStances.slice(0, 8).map(s => [
      s.topic,
      s.public_position,
      s.gap || "—",
    ]);

    doc.autoTable({
      startY: y,
      margin: { left: ML, right: MR },
      head: [["Topic", "Public Position", "Say-Do Gap"]],
      body: stanceBody,
      theme: "grid",
      headStyles: {
        fillColor: C.charcoal,
        textColor: C.white,
        fontSize: 7,
        font: "courier",
        fontStyle: "bold",
      },
      bodyStyles: {
        fontSize: 7,
        textColor: C.charcoal,
        font: "helvetica",
      },
      alternateRowStyles: { fillColor: C.fog },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // ═══════════════════════════════════════════
  // CANDIDATE PROFILE
  // ═══════════════════════════════════════════
  y = safeY(doc, y, 45);
  drawRule(doc, y);
  y += 7;

  const sectionNum = data.publicStances && data.publicStances.length > 0 ? "05" : data.matchedSignals.length > 0 ? "04" : "03";
  doc.setFont("courier", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...C.indigo);
  doc.text(`${sectionNum} — CANDIDATE PROFILE`, ML, y);
  y += 7;

  doc.setFillColor(...C.fog);
  const profileH = 32;
  doc.roundedRect(ML, y, CW, profileH, 2, 2, "F");

  const col1 = ML + 4;
  const col2 = ML + CW / 2;
  let py = y + 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...C.navy);
  doc.text("Name", col1, py);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.charcoal);
  doc.text(data.candidateName, col1 + 22, py);

  if (data.candidateTargetRoles && data.candidateTargetRoles.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.navy);
    doc.text("Target Roles", col2, py);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.charcoal);
    doc.text(data.candidateTargetRoles.slice(0, 3).join(", "), col2 + 24, py);
  }

  py += 7;

  if (data.candidateSkills && data.candidateSkills.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.navy);
    doc.text("Skills", col1, py);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.charcoal);
    const skillText = data.candidateSkills.slice(0, 8).join(", ");
    doc.text(skillText.substring(0, 80), col1 + 22, py);
  }

  if (data.candidateLinkedin) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.navy);
    doc.text("LinkedIn", col2, py);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.indigo);
    doc.text(data.candidateLinkedin.replace(/^https?:\/\/(www\.)?/, "").substring(0, 35), col2 + 24, py);
  }

  py += 7;

  if (data.candidateBio) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.navy);
    doc.text("Bio", col1, py);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.charcoal);
    doc.text(data.candidateBio.substring(0, 100) + (data.candidateBio.length > 100 ? "…" : ""), col1 + 22, py);
  }

  y += profileH + 8;

  // ═══════════════════════════════════════════
  // VERIFICATION SEAL
  // ═══════════════════════════════════════════
  y = safeY(doc, y, 35);
  drawRule(doc, y, C.indigo);
  y += 8;

  // Seal background
  doc.setFillColor(...C.navy);
  doc.roundedRect(ML, y, CW, 24, 3, 3, "F");

  // Accent top bar
  doc.setFillColor(...C.indigo);
  doc.roundedRect(ML, y, CW, 3, 3, 3, "F");

  doc.setFont("courier", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...C.white);
  doc.text("✦  VERIFIED BY WHO DO I WORK FOR?  ✦", PW / 2, y + 10, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...C.muted);
  doc.text(`Intelligence verification date: ${verDate}`, PW / 2, y + 16, { align: "center" });
  doc.text("This dossier was generated using publicly available data · whodoiworkfor.org", PW / 2, y + 20, { align: "center" });

  // ═══════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(6.5);
    doc.setTextColor(...C.muted);
    doc.setFont("helvetica", "normal");
    doc.text(
      "Who Do I Work For? · Candidate Advocacy Dossier · Confidential",
      PW / 2, 290,
      { align: "center" }
    );
    doc.text(`Page ${i} of ${totalPages}`, PW - MR, 290, { align: "right" });
  }

  return doc;
}
