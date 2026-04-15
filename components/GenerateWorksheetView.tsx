import React, { useState, useCallback, useRef } from 'react';
import { useWorksheetGenerator } from '../hooks/useWorksheetGenerator';
import { useDynamicLibraries } from '../hooks/useDynamicLibraries';
import { exportWorksheetAsPdf } from '../lib/pdfUtils';
import { Spinner } from './Spinner';
import { Wand2Icon } from './Icons';
import { WorksheetResult } from './WorksheetResult';
import { useAppDataManager } from '../hooks/useProfileManager';

export const GenerateWorksheetView: React.FC = () => {
  const [topic, setTopic] = useState<string>('');
  const { worksheet, isLoading, error, generate, status } = useWorksheetGenerator();
  const { libsReady } = useDynamicLibraries(['jspdf', 'html2canvas']);
  const { saveWorksheet } = useAppDataManager();
  const [isCurrentWorksheetSaved, setIsCurrentWorksheetSaved] = useState(false);
  const worksheetRef = useRef<HTMLDivElement>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) {
      setValidationError('Por favor, introduce un tema para la ficha.');
      return;
    }
    setIsCurrentWorksheetSaved(false);
    setValidationError(null);
    await generate({ topic });
  }, [topic, generate]);

  const handleDownload = useCallback(async () => {
    if (worksheetRef.current && worksheet) {
      setIsDownloading(true);
      setValidationError(null);
      const fileName = `ficha_${worksheet.title.replace(/\s+/g, '_').toLowerCase()}.pdf`;
      try {
        await exportWorksheetAsPdf(worksheetRef.current, fileName);
      } catch (err: any) {
        setValidationError(err.message || 'No se pudo generar el PDF.');
      } finally {
        setIsDownloading(false);
      }
    }
  }, [worksheet]);

  const handleSave = useCallback(() => {
    if (worksheet) {
      saveWorksheet(worksheet, topic);
      setIsCurrentWorksheetSaved(true);
    }
  }, [worksheet, saveWorksheet, topic]);


  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-1">Generar Nueva Ficha</h2>
        <p className="text-sm text-gray-500 mb-4">
          Describe el concepto que quieres trabajar (ej: "el número 5", "la vocal A", "animales de la granja"). La IA creará una ficha adaptada al perfil del niño.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ej: El color rojo"
            className="flex-grow w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            disabled={isLoading}
          />
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-5 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500"
          >
            <Wand2Icon className="h-5 w-5" />
            <span>Generar</span>
          </button>
        </div>
        {isLoading && (
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
        {(error || validationError) && <p className="text-red-600 text-sm mt-3 bg-red-50 p-3 rounded-md">{error || validationError}</p>}
      </div>

      {worksheet && (
        <WorksheetResult
          ref={worksheetRef}
          worksheet={worksheet}
          onDownload={handleDownload}
          isDownloadReady={libsReady}
          title="Ficha Generada"
          onSave={handleSave}
          isSaved={isCurrentWorksheetSaved}
          isDownloading={isDownloading}
        />
      )}
    </div>
  );
};
