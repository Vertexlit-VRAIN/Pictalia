/**
 * Processes a PDF file by rendering all its pages into a single JPEG image.
 * @param file The PDF file to process.
 * @returns A promise that resolves with the preview URL and base64 image data.
 */
export const processPdfFile = async (file: File): Promise<{ previewUrl: string, imageData: { mimeType: string; data: string } }> => {
  const pdfjsLib = (window as any).pdfjsLib;
  if (!pdfjsLib) {
    throw new Error("La librería PDF.js no se ha cargado. Por favor, recarga la página.");
  }
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.js`;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    if (pdf.numPages === 0) {
      throw new Error("El PDF no contiene páginas.");
    }

    const pageCanvases: HTMLCanvasElement[] = [];
    let totalHeight = 0;
    let maxWidth = 0;
    const scale = 1.5;

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) continue;

      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await page.render({ canvasContext: context, viewport: viewport }).promise;
      
      pageCanvases.push(canvas);
      totalHeight += canvas.height;
      if (canvas.width > maxWidth) {
        maxWidth = canvas.width;
      }
    }

    if (pageCanvases.length === 0) {
      throw new Error('No se pudo renderizar ninguna página del PDF.');
    }

    const stitchedCanvas = document.createElement('canvas');
    stitchedCanvas.width = maxWidth;
    stitchedCanvas.height = totalHeight;
    const stitchedContext = stitchedCanvas.getContext('2d');
    if (!stitchedContext) {
      throw new Error('No se pudo crear el canvas para unir las páginas.');
    }

    stitchedContext.fillStyle = 'white';
    stitchedContext.fillRect(0, 0, stitchedCanvas.width, stitchedCanvas.height);

    let currentY = 0;
    for (const canvas of pageCanvases) {
      const xOffset = (maxWidth - canvas.width) / 2;
      stitchedContext.drawImage(canvas, xOffset, currentY);
      currentY += canvas.height;
    }

    const imageUrl = stitchedCanvas.toDataURL('image/jpeg', 0.9);
    const base64Data = imageUrl.split(',')[1];
    
    return {
      previewUrl: imageUrl,
      imageData: { mimeType: 'image/jpeg', data: base64Data }
    };

  } catch (err: any) {
    if (err.name === 'PasswordException') {
      throw new Error("El archivo PDF está protegido con contraseña y no se puede abrir.");
    }
    throw new Error(err.message || 'No se pudo procesar el PDF. Puede que esté dañado o no sea compatible.');
  }
};

/**
 * Exports a given HTML element as a PDF file.
 * @param element The HTML element to export.
 * @param fileName The desired name for the output PDF file.
 */
export const exportWorksheetAsPdf = async (element: HTMLElement, fileName: string): Promise<void> => {
  const jspdf = (window as any).jspdf;
  const html2canvas = (window as any).html2canvas;

  if (!jspdf || !html2canvas) {
    throw new Error("No se pudo iniciar la descarga. Faltan librerías. Por favor, recarga la página.");
  }

  const { jsPDF } = jspdf;
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: 'a4'
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const margin = 20; // px
  let y = margin;

  const header = element.querySelector('header');
  const sections = element.querySelectorAll('main > *');

  const elementsToRender = [];
  if (header) elementsToRender.push(header);
  sections.forEach(section => elementsToRender.push(section));

  for (const el of elementsToRender) {
    const canvas = await html2canvas(el as HTMLElement, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    const ratio = imgWidth / (pdfWidth - margin * 2);
    const heightInPdf = imgHeight / ratio;

    if (y + heightInPdf > pdfHeight - margin) {
      pdf.addPage();
      y = margin;
    }

    pdf.addImage(imgData, 'PNG', margin, y, pdfWidth - margin * 2, heightInPdf);
    y += heightInPdf + 10; // Add some space between sections
  }

  pdf.save(fileName);
};
