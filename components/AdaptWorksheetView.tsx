import React, { useState, useCallback, useRef } from 'react';
import { useWorksheetGenerator } from '../hooks/useWorksheetGenerator';
import { useDynamicLibraries } from '../hooks/useDynamicLibraries';
import { processPdfFile, exportWorksheetAsPdf } from '../lib/pdfUtils';
import { FileUploadDropzone } from './FileUploadDropzone';
import { WorksheetResult } from './WorksheetResult';
import { Spinner } from './Spinner';
import { Wand2Icon, UploadCloudIcon, ChevronDownIcon, XIcon, SparklesIcon } from './Icons';
import { useAppDataManager } from '../hooks/useProfileManager';

export const AdaptWorksheetView: React.FC = () => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState<boolean>(false);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [adaptationImageData, setAdaptationImageData] = useState<{ mimeType: string; data: string } | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [extractedTextSource, setExtractedTextSource] = useState<'pdf_text' | 'ocr' | 'none'>('none');
  const [sourceFileName, setSourceFileName] = useState<string>('');
  
  const { worksheet, isLoading: isAdapting, error: adaptationError, generate: adaptWorksheet, status } = useWorksheetGenerator();
  const { libsReady: exportReady } = useDynamicLibraries(['jspdf', 'html2canvas']);
  const { saveWorksheet } = useAppDataManager();
  const [isCurrentWorksheetSaved, setIsCurrentWorksheetSaved] = useState(false);
  
  const worksheetRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);


  const clearFile = useCallback(() => {
    setPreviewUrl(null);
    setIsPreviewExpanded(false);
    setProcessingError(null);
    setAdaptationImageData(null);
    setExtractedText('');
    setExtractedTextSource('none');
    setSourceFileName('');
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }, []);

  const handleFileSelected = useCallback(async (selectedFile: File | null) => {
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf') {
      setProcessingError('Por favor, selecciona un archivo PDF.');
      clearFile();
      return;
    }

    setProcessingError(null);
    setDownloadError(null);
    setPreviewUrl(null);
    setIsPreviewExpanded(false);
    setAdaptationImageData(null);
    setExtractedText('');
    setExtractedTextSource('none');
    setIsProcessingFile(true);
    setSourceFileName(selectedFile.name);

    try {
      const { previewUrl, imageData, extractedText, extractedTextSource } = await processPdfFile(selectedFile);
      setPreviewUrl(previewUrl);
      setIsPreviewExpanded(false);
      setAdaptationImageData(imageData);
      setExtractedText(extractedText);
      setExtractedTextSource(extractedTextSource);
    } catch (err: any) {
      setProcessingError(err.message || 'No se pudo procesar el PDF.');
      clearFile();
    } finally {
      setIsProcessingFile(false);
    }
  }, [clearFile]);

  const handleAdapt = useCallback(async () => {
    if (!adaptationImageData) {
      setProcessingError('Por favor, sube un archivo PDF y espera a que se procese.');
      return;
    }
    setDownloadError(null);
    setIsCurrentWorksheetSaved(false);
    await adaptWorksheet({ adaptationImage: adaptationImageData, adaptationTextContent: extractedText });
  }, [adaptationImageData, extractedText, adaptWorksheet]);

  const handleDownload = useCallback(async () => {
    if (worksheetRef.current && worksheet) {
      setIsDownloading(true);
      setDownloadError(null);
      const fileName = `ficha_adaptada_${worksheet.title.replace(/\s+/g, '_').toLowerCase()}.pdf`;
      try {
        await exportWorksheetAsPdf(worksheetRef.current, fileName);
      } catch (err: any) {
        setDownloadError(err.message || 'No se pudo generar el PDF.');
      } finally {
        setIsDownloading(false);
      }
    }
  }, [worksheet]);

  const handleSave = useCallback(() => {
    if (worksheet) {
      saveWorksheet(worksheet, `Adaptación de ${sourceFileName}`);
      setIsCurrentWorksheetSaved(true);
    }
  }, [worksheet, saveWorksheet, sourceFileName]);


  const isLoading = isProcessingFile || isAdapting;
  const error = processingError || adaptationError || downloadError;

  return (
    <div className="mx-auto max-w-5xl">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">
              <UploadCloudIcon className="h-4 w-4" />
              Adaptación visual
            </div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900">Adaptar una ficha existente</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Sube un PDF y la aplicación extraerá texto cuando sea posible para rehacer la ficha en un formato más accesible y visual.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <SparklesIcon className="h-5 w-5 text-amber-500" />
            Vista previa, OCR y adaptación en el mismo flujo
          </div>
        </div>
        
        {!previewUrl ? (
          <FileUploadDropzone
            onFileSelect={handleFileSelected}
            isProcessing={isProcessingFile}
            isReady={true}
          />
        ) : (
            <div className="mt-4">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsPreviewExpanded((current) => !current)}
                className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-600"
                aria-expanded={isPreviewExpanded}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">PDF procesado correctamente</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {isPreviewExpanded ? 'Ocultar vista previa completa' : 'Mostrar vista previa completa'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <span className="text-xs font-medium">{isPreviewExpanded ? 'Ocultar' : 'Ver'}</span>
                    <ChevronDownIcon className={`h-4 w-4 transition-transform ${isPreviewExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </button>
              <button onClick={clearFile} disabled={isLoading} className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-600 disabled:opacity-50" aria-label="Quitar PDF seleccionado">
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            {isPreviewExpanded && (
              <div className="mt-3 relative">
                <img src={previewUrl} alt="Vista previa de la ficha" className="w-full rounded-2xl border border-slate-300 shadow-sm" />
              </div>
            )}
            {extractedText && (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-900">
                  {extractedTextSource === 'ocr' ? 'Texto detectado mediante OCR' : 'Texto detectado en el PDF'}
                </p>
                <p className="mt-1 text-xs text-emerald-700">
                  {extractedTextSource === 'ocr'
                    ? 'El PDF parecía escaneado o sin texto embebido. Se ha aplicado OCR básico para poder transformar ejercicios textuales en pictogramas.'
                    : 'Se ha extraído texto real del documento. La adaptación intentará convertir esos ejercicios textuales en actividades con pictogramas.'}
                </p>
                <div className="mt-3 max-h-40 overflow-y-auto rounded-xl border border-emerald-200 bg-white p-3 text-xs text-slate-700 whitespace-pre-wrap">
                  {extractedText}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-5">
          <button
            onClick={handleAdapt}
            disabled={isLoading || !adaptationImageData}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-600 sm:w-auto"
          >
            <Wand2Icon className="h-5 w-5" />
            <span>Adaptar con IA</span>
          </button>
        </div>
        {isAdapting && (
          <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 p-4" role="status" aria-live="polite">
            <div className="flex items-center gap-3">
              <Spinner className="text-sky-600" />
              <div>
                <p className="text-sm font-semibold text-sky-950">{status.message}</p>
                {status.detail && <p className="mt-1 text-xs text-sky-800">{status.detail}</p>}
              </div>
            </div>
          </div>
        )}
        {error && <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700" role="alert">{error}</p>}
      </section>

      {worksheet && (
        <WorksheetResult
          ref={worksheetRef}
          worksheet={worksheet}
          onDownload={handleDownload}
          isDownloadReady={exportReady}
          title="Ficha Adaptada"
          onSave={handleSave}
          isSaved={isCurrentWorksheetSaved}
          isDownloading={isDownloading}
        />
      )}
    </div>
  );
};
