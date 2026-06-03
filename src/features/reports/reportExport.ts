import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function exportElementToPdf(element: HTMLElement, fileName = "cloud-insure-report-preview.pdf") {
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: "#ffffff",
  });
  const image = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: canvas.width > canvas.height ? "landscape" : "portrait",
    unit: "px",
    format: [canvas.width, canvas.height],
  });

  pdf.addImage(image, "PNG", 0, 0, canvas.width, canvas.height);
  pdf.save(fileName);
}
