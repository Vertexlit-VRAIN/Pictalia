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
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [adaptationImageData, setAdaptationImageData] = useState<{ mimeType: string; data: string } | null>(null);
  const [sourceFileName, setSourceFileName] = useState<string>('');
  
  const { worksheet, isLoading: isAdapting, error: adaptationError, generate: adaptWorksheet } = useWorksheetGenerator();
  const { libsReady: pdfJsReady } = useDynamicLibraries(['pdfjsLib']);
  const { libsReady: exportReady } = useDynamicLibraries(['jspdf', 'html2canvas']);
  const { saveWorksheet } = useAppDataManager();
  const [isCurrentWorksheetSaved, setIsCurrentWorksheetSaved] = useState(false);
  
  const worksheetRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);


  const clearFile = useCallback(() => {
    setPreviewUrl(null);
    setProcessingError(null);
    setAdaptationImageData(null);
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
    setAdaptationImageData(null);
    setIsProcessingFile(true);
    setSourceFileName(selectedFile.name);

    try {
      const { previewUrl, imageData } = await processPdfFile(selectedFile);
      setPreviewUrl(previewUrl);
      setAdaptationImageData(imageData);
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
    await adaptWorksheet({ adaptationImage: adaptationImageData });
  }, [adaptationImageData, adaptWorksheet]);

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
            isReady={pdfJsReady}
          />
        ) : (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700">Vista previa de todas las páginas:</p>
            <div className="mt-2 relative">
              <img src={previewUrl} alt="Vista previa de la ficha" className="w-full rounded-md border border-gray-300" />
              <button onClick={clearFile} disabled={isLoading} className="absolute top-2 right-2 bg-white/70 backdrop-blur-sm rounded-full p-1.5 text-gray-700 hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
          </div>
        )}

        <div className="mt-5">
          <button
            onClick={handleAdapt}
            disabled={isLoading || !adaptationImageData}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500"
          >
            {isAdapting ? (
              <>
                <Spinner />
                <span>Adaptando con IA...</span>
              </>
            ) : (
              <>
                <Wand2Icon className="h-5 w-5" />
                <span>Adaptar con IA</span>
              </>
            )}
          </button>
        </div>
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