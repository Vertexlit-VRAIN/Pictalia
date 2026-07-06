/**
 * Exports a rendered worksheet element as a PDF file.
 */
export const exportWorksheetAsPdf = async (element: HTMLElement, fileName: string): Promise<void> => {
  const jspdf = (window as any).jspdf;
  const html2canvas = (window as any).html2canvas;

  if (!jspdf || !html2canvas) {
    throw new Error('No se pudo iniciar la descarga. Faltan librerías. Por favor, recarga la página.');
  }

  const { jsPDF } = jspdf;
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  let y = margin;

  const header = element.querySelector('header');
  const sections = element.querySelectorAll('main > *');

  const elementsToRender: Element[] = [];
  if (header) elementsToRender.push(header);
  sections.forEach(section => elementsToRender.push(section));

  for (const el of elementsToRender) {
    const canvas = await html2canvas(el as HTMLElement, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const ratio = canvas.width / (pdfWidth - margin * 2);
    const heightInPdf = canvas.height / ratio;

    if (y + heightInPdf > pdfHeight - margin) {
      pdf.addPage();
      y = margin;
    }

    pdf.addImage(imgData, 'PNG', margin, y, pdfWidth - margin * 2, heightInPdf);
    y += heightInPdf + 10;
  }

  pdf.save(fileName);
};
