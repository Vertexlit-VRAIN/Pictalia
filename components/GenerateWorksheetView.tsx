import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useWorksheetGenerator } from '../hooks/useWorksheetGenerator';
import { useDynamicLibraries } from '../hooks/useDynamicLibraries';
import { exportWorksheetAsPdf } from '../lib/worksheetExport';
import { Spinner } from './Spinner';
import { FileTextIcon } from './Icons';
import { useAppDataManager } from '../hooks/useProfileManager';
import type { SavedWorksheet } from '../types';
import { WorksheetEditor } from './WorksheetEditor';

export const GenerateWorksheetView: React.FC = () => {
  const [topic, setTopic] = useState<string>('');
  const [goal, setGoal] = useState<string>('');
  const [extraDetails, setExtraDetails] = useState<string>('');
  const { worksheet, isLoading, error, generate, status } = useWorksheetGenerator();
  const { libsReady } = useDynamicLibraries(['jspdf', 'html2canvas']);
  const { saveWorksheet, activeProfile } = useAppDataManager();
  const [language, setLanguage] = useState<'es' | 'val' | 'en'>('es');
  const [isCurrentWorksheetSaved, setIsCurrentWorksheetSaved] = useState(false);
  const worksheetRef = useRef<HTMLDivElement>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [localWorksheet, setLocalWorksheet] = useState<SavedWorksheet | null>(null);

  useEffect(() => {
    if (activeProfile?.defaultLanguage) {
      setLanguage(activeProfile.defaultLanguage);
    }
  }, [activeProfile?.id, activeProfile?.defaultLanguage]);

  useEffect(() => {
    if (worksheet) {
      setLocalWorksheet({
        ...worksheet,
        id: 'temp-preview',
        createdAt: new Date().toISOString(),
        sourceDescription: `Ficha generada sobre: ${topic}`,
      });
      setIsCurrentWorksheetSaved(false);
    } else {
      setLocalWorksheet(null);
    }
  }, [worksheet, topic]);

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) {
      setValidationError('Por favor, introduce un tema para la ficha.');
      return;
    }
    setIsCurrentWorksheetSaved(false);
    setValidationError(null);
    await generate({
      topic: topic.trim(),
      goal: goal.trim() || undefined,
      extraDetails: extraDetails.trim() || undefined,
      language: language,
    });
  }, [topic, goal, extraDetails, language, generate]);

  const handleDownload = useCallback(async () => {
    if (worksheetRef.current && localWorksheet) {
      setIsDownloading(true);
      setValidationError(null);
      const fileName = `ficha_${localWorksheet.title.replace(/\s+/g, '_').toLowerCase()}.pdf`;
      try {
        await exportWorksheetAsPdf(worksheetRef.current, fileName);
      } catch (err: any) {
        setValidationError(err.message || 'No se pudo generar el PDF.');
      } finally {
        setIsDownloading(false);
      }
    }
  }, [localWorksheet]);

  const handleSave = useCallback((wsToSave: SavedWorksheet) => {
    saveWorksheet(wsToSave, topic);
    setIsCurrentWorksheetSaved(true);
    setLocalWorksheet(wsToSave);
  }, [saveWorksheet, topic]);

  return (
    <div className="mx-auto max-w-5xl">
      <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
        <div
          className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-sky-100 via-cyan-50 to-white"
          aria-hidden="true"
        />
        <div className="relative">
          <div className="mb-8 max-w-3xl">
            <h2 className="text-3xl font-black tracking-tight text-slate-900">Generar nueva ficha</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Define el tema principal y, si quieres, añade un objetivo concreto o instrucciones extra para condicionar mejor la generación.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
            <div className="rounded-[24px] border border-slate-200 bg-white/80 p-5 shadow-sm">
              <div className="mb-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-rose-700">Obligatorio</p>
                  <h3 className="text-xl font-black text-slate-900">Tema principal</h3>
                </div>
              </div>

              <label htmlFor="topic-input" className="mb-2 block text-sm font-semibold text-slate-700">
                Tema de la ficha
              </label>
              <input
                id="topic-input"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ej: Animales de la granja"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                disabled={isLoading}
                aria-describedby="topic-help"
              />
              <p id="topic-help" className="mt-3 text-sm text-slate-500">
                Ejemplos: "animales de la granja", "partes de una planta" o "los oficios".
              </p>

              <div className="mt-4 border-t border-slate-100 pt-4">
                <label htmlFor="worksheet-lang-select" className="mb-2 block text-sm font-semibold text-slate-700">
                  Idioma de la ficha
                </label>
                <select
                  id="worksheet-lang-select"
                  value={language}
                  onChange={(e: any) => setLanguage(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 font-bold text-slate-700"
                  disabled={isLoading}
                >
                  <option value="es">Castellano (es)</option>
                  <option value="val">Valenciano (val)</option>
                  <option value="en">Inglés (en)</option>
                </select>
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">Generación</p>
              <h3 className="mt-1 text-xl font-black text-slate-900">Acción principal</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Cuando tengas el tema listo, la IA generará una ficha completa usando también la información opcional que añadas debajo.
              </p>

              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="mt-6 inline-flex min-w-[200px] items-center justify-center gap-3 rounded-2xl bg-sky-600 px-5 py-3 font-semibold text-white shadow-lg shadow-sky-600/25 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-600"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                  <FileTextIcon className="h-5 w-5" />
                </span>
                <span>Generar ficha</span>
              </button>
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50/80 p-5 shadow-sm">
            <div className="mb-4">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">Opcional</p>
              <h3 className="mt-1 text-xl font-black text-slate-900">Condiciones opcionales</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Añade aquí objetivos concretos o indicaciones para orientar mejor la generación.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-[20px] border border-slate-200 bg-white p-4">
                <label htmlFor="goal-input" className="mb-2 block text-sm font-semibold text-slate-700">
                  Objetivo de la ficha
                </label>
                <textarea
                  id="goal-input"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Ej: Diferenciar entre animales vertebrados e invertebrados."
                  className="min-h-[120px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                  disabled={isLoading}
                />
              </div>

              <div className="rounded-[20px] border border-slate-200 bg-white p-4">
                <label htmlFor="extra-details-input" className="mb-2 block text-sm font-semibold text-slate-700">
                  Indicaciones adicionales
                </label>
                <textarea
                  id="extra-details-input"
                  value={extraDetails}
                  onChange={(e) => setExtraDetails(e.target.value)}
                  placeholder="Ej: Un ejercicio de unir asociaciones entre cada animal y el producto que genera."
                  className="min-h-[120px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
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

      {localWorksheet && (
        <WorksheetEditor
          worksheet={localWorksheet}
          setWorksheet={setLocalWorksheet}
          onSave={handleSave}
          onCancel={() => setLocalWorksheet(null)}
          onDownload={handleDownload}
          isDownloadReady={libsReady}
          isDownloading={isDownloading}
          searchLanguage={language}
          onSearchLanguageChange={setLanguage}
          worksheetRef={worksheetRef}
          isSaved={isCurrentWorksheetSaved}
        />
      )}
    </div>
  );
};
