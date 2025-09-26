// Pur jsPDF (sans html2canvas) — rendu A4 pour le template "project"
import jsPDF from "jspdf";

// Helpers de mise en page
function mmPage(pdf) {
  const w = pdf.internal.pageSize.getWidth();
  const h = pdf.internal.pageSize.getHeight();
  return { w, h };
}
function split(pdf, text, maxW) {
  return pdf.splitTextToSize(String(text ?? ""), maxW);
}
function addIfOverflow(pdf, y, lineHeight, bottomMargin = 15) {
  const { h } = mmPage(pdf);
  if (y + lineHeight > h - bottomMargin) {
    pdf.addPage();
    return 15; // top margin nouvelle page
  }
  return y;
}

export function exportPdfProject(data, opts = {}, filename = "document.pdf") {
  // Données brutes attendues (déjà validées/corrigées en amont)
  const project_name = data.project_name ?? "";
  const start_date = data.start_date ?? data?.project_timeline?.start_date ?? "";
  const end_date = data.end_date ?? data?.project_timeline?.end_date ?? "";
  const duration_months = data.duration_months ?? data?.project_timeline?.duration_months ?? "";
  const objectives = Array.isArray(data.project_objectives) ? data.project_objectives : [];

  const total = Number.isFinite(data.total_budget_xaf) ? data.total_budget_xaf : (Number(data.total_budget_xaf) || 0);
  const ask   = Number.isFinite(data.funding_requested_xaf) ? data.funding_requested_xaf : (Number(data.funding_requested_xaf) || 0);

  const accent = opts.accent || "#d32f2f";

  const pdf = new jsPDF("p", "mm", "a4");
  const { w } = mmPage(pdf);
  const margin = 15;
  let y = margin;

  // Police système sûre (Times)
  pdf.setFont("Times", "Normal");

  // Titre
  pdf.setFontSize(20);
  const title = "Résumé du Projet";
  const titleW = pdf.getTextWidth(title);
  pdf.text(title, (w - titleW) / 2, y);
  y += 6;

  // Barre d'accent
  pdf.setDrawColor(accent);
  pdf.setFillColor(accent);
  pdf.rect((w - 40) / 2, y, 40, 1.5, "F");
  y += 10;

  // Section: infos principales
  pdf.setFontSize(12);
  const lineH = 6;
  const maxTextW = w - margin * 2;

  const line1 = `Nom du projet : ${project_name}`;
  const line2 = `Période : du ${start_date} au ${end_date} (${duration_months} mois)`;

  for (const line of [line1, line2]) {
    const rows = split(pdf, line, maxTextW);
    rows.forEach((row) => {
      y = addIfOverflow(pdf, y, lineH);
      pdf.text(row, margin, y);
      y += lineH;
    });
  }

  // Objectifs
  y += 2;
  pdf.setFontSize(14);
  pdf.setFont("Times", "Bold");
  y = addIfOverflow(pdf, y, lineH);
  pdf.text("Objectifs", margin, y);
  pdf.setFont("Times", "Normal");
  pdf.setFontSize(12);
  y += 4;

  if (objectives.length === 0) {
    y = addIfOverflow(pdf, y, lineH);
    pdf.text("—", margin + 2, y);
    y += lineH;
  } else {
    const bulletIndent = 4;
    const textIndent = 8;
    const bulletX = margin + bulletIndent;
    const textX = margin + textIndent;
    const maxWList = w - textX - margin;

    for (const obj of objectives) {
      y = addIfOverflow(pdf, y, lineH);
      pdf.circle(bulletX, y - 2, 0.8, "F"); // puce
      const rows = split(pdf, obj, maxWList);
      rows.forEach((row, i) => {
        if (i > 0) y = addIfOverflow(pdf, y, lineH);
        pdf.text(row, textX, y);
        y += lineH;
      });
    }
  }

  // Cartouches budget (2 colonnes)
  y += 4;
  const boxW = (w - margin * 2 - 6) / 2; // 6mm gap entre les colonnes
  const boxH = 22;
  const boxY = y;

  const fmtXAF = (n) =>
    Number.isFinite(n) ? n.toLocaleString("fr-FR") + " XAF" : "";

  // Box gauche - Budget total
  pdf.setDrawColor(200);
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(margin, boxY, boxW, boxH, 3, 3, "S");
  pdf.setFont("Times", "Normal");
  pdf.setFontSize(9);
  pdf.setTextColor(80);
  pdf.text("Budget total", margin + 4, boxY + 8);
  pdf.setFont("Times", "Bold");
  pdf.setFontSize(16);
  pdf.setTextColor(0);
  pdf.text(fmtXAF(total), margin + 4, boxY + 18);

  // Box droite - Demande de financement
  const rightX = margin + boxW + 6;
  pdf.setDrawColor(200);
  pdf.roundedRect(rightX, boxY, boxW, boxH, 3, 3, "S");
  pdf.setFont("Times", "Normal");
  pdf.setFontSize(9);
  pdf.setTextColor(80);
  pdf.text("Demande de financement", rightX + 4, boxY + 8);
  pdf.setFont("Times", "Bold");
  pdf.setFontSize(16);
  pdf.setTextColor(0);
  pdf.text(fmtXAF(ask), rightX + 4, boxY + 18);

  // Finaliser
  pdf.save(filename);
}
