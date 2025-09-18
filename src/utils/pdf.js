import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function exportPdf(el, filename = "document.pdf") {
  const canvas = await html2canvas(el, { scale: 2, useCORS: true });
  const img = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = (canvas.height * pageW) / canvas.width;
  pdf.addImage(img, "PNG", 0, 0, pageW, pageH);
  pdf.save(filename);
}
