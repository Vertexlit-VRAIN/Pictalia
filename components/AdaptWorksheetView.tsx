import React, { useState, useCallback, useRef } from 'react';
import { useWorksheetGenerator } from '../hooks/useWorksheetGenerator';
import { useDynamicLibraries } from '../hooks/useDynamicLibraries';
import { processPdfFile, exportWorksheetAsPdf } from '../lib/pdfUtils';
import { FileUploadDropzone } from './FileUploadDropzone';
import { WorksheetResult } from './WorksheetResult';
import { Spinner } from './Spinner';
import { Wand2Icon } from './Icons';
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
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-1">Adaptar una Ficha Existente</h2>
        <p className="text-sm text-gray-500 mb-4">
          Sube un archivo PDF de la ficha que tienes. La IA analizará todas las páginas y creará una versión adaptada para el niño.
        </p>
        
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
                className="flex-1 rounded-lg border border-gray-200 bg-gray-50 p-4 text-left hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">PDF procesado correctamente</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {isPreviewExpanded ? 'Ocultar vista previa completa' : 'Mostrar vista previa completa'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <span className="text-xs font-medium">{isPreviewExpanded ? 'Ocultar' : 'Ver'}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${isPreviewExpanded ? 'rotate-180' : ''}`}>
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                </div>
              </button>
              <button onClick={clearFile} disabled={isLoading} className="h-12 w-12 flex-shrink-0 bg-white border border-gray-200 rounded-full text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            {isPreviewExpanded && (
              <div className="mt-3 relative">
                <img src={previewUrl} alt="Vista previa de la ficha" className="w-full rounded-md border border-gray-300" />
              </div>
            )}
            {extractedText && (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-900">
                  {extractedTextSource === 'ocr' ? 'Texto detectado mediante OCR' : 'Texto detectado en el PDF'}
                </p>
                <p className="text-xs text-emerald-700 mt-1">
                  {extractedTextSource === 'ocr'
                    ? 'El PDF parecía escaneado o sin texto embebido. Se ha aplicado OCR básico para poder transformar ejercicios textuales en pictogramas.'
                    : 'Se ha extraído texto real del documento. La adaptación intentará convertir esos ejercicios textuales en actividades con pictogramas.'}
                </p>
                <div className="mt-3 max-h-40 overflow-y-auto rounded-md border border-emerald-200 bg-white p-3 text-xs text-gray-700 whitespace-pre-wrap">
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
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500"
          >
            <Wand2Icon className="h-5 w-5" />
            <span>Adaptar con IA</span>
          </button>
        </div>
        {isAdapting && (
          <div className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
            <div className="flex items-center gap-3">
              <Spinner className="text-indigo-600" />
              <div>
                <p className="text-sm font-semibold text-indigo-900">{status.message}</p>
                {status.detail && <p className="text-xs text-indigo-700 mt-1">{status.detail}</p>}
              </div>
            </div>
          </div>
        )}
        {error && <p className="text-red-600 text-sm mt-3 bg-red-50 p-3 rounded-md">{error}</p>}
      </div>

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
