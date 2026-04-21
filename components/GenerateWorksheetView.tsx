import React, { useState, useCallback, useRef } from 'react';
import { useWorksheetGenerator } from '../hooks/useWorksheetGenerator';
import { useDynamicLibraries } from '../hooks/useDynamicLibraries';
import { exportWorksheetAsPdf } from '../lib/pdfUtils';
import { Spinner } from './Spinner';
import { FileTextIcon } from './Icons';
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
    <div className="mx-auto max-w-5xl">
      <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
        <div
          className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-sky-100 via-cyan-50 to-white"
          aria-hidden="true"
        />
        <div className="relative">
          <div className="mb-6 max-w-2xl">
            <h2 className="text-3xl font-black tracking-tight text-slate-900">Generar nueva ficha</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Describe el concepto a trabajar y la IA montará una ficha visual adaptada al perfil del niño con actividades listas para revisar, guardar o editar.
            </p>
          </div>

          <label htmlFor="topic-input" className="mb-2 block text-sm font-semibold text-slate-700">
            Tema de la ficha
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="topic-input"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ej: El color rojo"
              className="w-full flex-grow rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
              disabled={isLoading}
              aria-describedby="topic-help"
            />
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="inline-flex min-w-[180px] items-center justify-center gap-3 rounded-2xl bg-sky-600 px-5 py-3 font-semibold text-white shadow-lg shadow-sky-600/25 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-600"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                <FileTextIcon className="h-5 w-5" />
              </span>
              <span>Generar ficha</span>
            </button>
          </div>
          <p id="topic-help" className="mt-3 text-sm text-slate-500">
            Ejemplos: "el número 5", "la vocal A" o "animales de la granja".
          </p>
        </div>
        {isLoading && (
          <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-4" role="status" aria-live="polite">
            <div className="flex items-center gap-3">
              <Spinner className="text-sky-600" />
              <div>
                <p className="text-sm font-semibold text-sky-950">{status.message}</p>
                {status.detail && <p className="mt-1 text-xs text-sky-800">{status.detail}</p>}
              </div>
            </div>
          </div>
        )}
        {(error || validationError) && <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700" role="alert">{error || validationError}</p>}
      </section>

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
