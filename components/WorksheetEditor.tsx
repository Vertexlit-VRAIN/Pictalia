import React, { useState, useEffect } from 'react';
import type { SavedWorksheet, WorksheetOperation } from '../types';
import { EditableWorksheetDisplay } from './EditableWorksheetDisplay';
import { WorksheetDisplay } from './WorksheetDisplay';
import { refineExercise } from '../services/aiService';
import { searchPictograms } from '../services/pictogramService';
import { Spinner } from './Spinner';
import { Wand2Icon, SaveIcon, XIcon, PencilRulerIcon, HistoryIcon, CheckCircleIcon, DownloadIcon } from './Icons';
import { produce } from 'immer';
import { useWorksheetHistory } from '../hooks/useWorksheetHistory';
import { applyWorksheetOperations } from '../services/worksheetOperations';

const GamepadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="6" x2="10" y1="12" y2="12" />
    <line x1="8" x2="8" y1="10" y2="14" />
    <line x1="15" x2="15.01" y1="13" y2="13" />
    <line x1="18" x2="18.01" y1="11" y2="11" />
    <rect width="20" height="12" x="2" y="6" rx="3" />
  </svg>
);

const ArrowLeftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </svg>
);

interface WorksheetEditorProps {
  worksheet: SavedWorksheet;
  setWorksheet: (worksheet: SavedWorksheet) => void;
  onSave?: (worksheet: SavedWorksheet) => void;
  onCancel?: () => void;
  searchLanguage: 'es' | 'val' | 'en';
  onSearchLanguageChange: (lang: 'es' | 'val' | 'en') => void;
  onDownload?: () => void;
  isDownloadReady?: boolean;
  isDownloading?: boolean;
  onPlay?: () => void;
  isSaved?: boolean;
  worksheetRef?: React.RefObject<HTMLDivElement | null>;
}

const shouldResolveItemPictogram = (item: SavedWorksheet['sections'][number]['items'][number]) =>
  item.type === 'image' || item.type === 'traceable_text';

export const WorksheetEditor: React.FC<WorksheetEditorProps> = ({
  worksheet: initialWorksheet,
  setWorksheet,
  onSave,
  onCancel,
  searchLanguage,
  onSearchLanguageChange,
  onDownload,
  isDownloadReady,
  isDownloading,
  onPlay,
  isSaved,
  worksheetRef,
}) => {
  const {
    worksheet,
    history,
    currentIndex,
    commitChange,
    commitOperations,
    goToHistoryIndex,
    serializeHistory,
  } = useWorksheetHistory(initialWorksheet);

  const [refinementInstruction, setRefinementInstruction] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [refinementError, setRefinementError] = useState<string | null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [refinementContext, setRefinementContext] = useState<string>('all');
  const [suggestedWorksheet, setSuggestedWorksheet] = useState<SavedWorksheet | null>(null);
  const [suggestedOperations, setSuggestedOperations] = useState<WorksheetOperation[] | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'history'>('editor');

  // Sincronizar el estado actual del historial con el componente padre
  useEffect(() => {
    setWorksheet({
      ...worksheet,
      editHistory: serializeHistory(),
      editHistoryIndex: currentIndex,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worksheet, currentIndex, serializeHistory]);

  const getHighlightedSectionIds = (): string[] => {
    if (!suggestedOperations) return [];

    const originalIds = new Set(
      worksheet.sections
        .map(section => section.internalId)
        .filter(Boolean)
    );

    const highlightedIds = suggestedOperations.flatMap(operation => {
      if (
        operation.type === 'update_section' ||
        operation.type === 'delete_section' ||
        operation.type === 'move_section'
      ) {
        return operation.sectionId ? [operation.sectionId] : [];
      }

      if (operation.type === 'create_section') {
        return (suggestedWorksheet?.sections || [])
          .map(section => section.internalId)
          .filter((sectionId): sectionId is string => Boolean(sectionId && !originalIds.has(sectionId)));
      }

      return [];
    });

    return highlightedIds.filter(
      (sectionId, index, array) => array.indexOf(sectionId) === index
    );
  };

  const handleWorksheetChange = (operations: WorksheetOperation[], actionLabel?: string) => {
    const label = actionLabel || 'Edición manual';
    const labelLower = label.toLowerCase();
    const isPictoEdit = labelLower.includes('picto') || labelLower.includes('imagen') || labelLower.includes('pictograma');

    const nextWorksheet = produce(worksheet, draft => {
      if (!draft.telemetry) {
        draft.telemetry = {
          generationTimeMs: 0,
          adpTimeMs: 0,
          acTimeMs: 0,
          rejectionCount: 0,
          manualEditsCount: 0,
          pictoOverridesCount: 0,
          retryCount: 0,
          createdTimestamp: new Date().toISOString(),
        };
      }
      if (isPictoEdit) {
        draft.telemetry.pictoOverridesCount = (draft.telemetry.pictoOverridesCount || 0) + 1;
      } else {
        draft.telemetry.manualEditsCount = (draft.telemetry.manualEditsCount || 0) + 1;
      }
    });

    const nextBaseState = applyWorksheetOperations(nextWorksheet, operations);
    commitChange(nextBaseState, label, operations);
  };

  const handleRefineWithAI = async () => {
    if (!refinementInstruction.trim()) {
      setRefinementError('Por favor, escribe qué te gustaría cambiar.');
      return;
    }

    setIsRefining(true);
    setRefinementError(null);

    try {
      const targetSectionId = refinementContext === 'all'
        ? undefined
        : worksheet.sections[parseInt(refinementContext, 10)]?.internalId;

      const refineStartTime = Date.now();
      const response = await refineExercise(worksheet, refinementInstruction, targetSectionId);
      const callDurationMs = Date.now() - refineStartTime;
      const operations = response.operations;

      const newBaseWorksheet = applyWorksheetOperations(worksheet, operations);

      // After refining, re-process the pictograms for any new/changed items
      const searchTerms: { type: 'main' | 'item'; path: (number | string)[]; term: string }[] = [];

      if (newBaseWorksheet.pictogramSearchTerm) {
        searchTerms.push({
          type: 'main',
          path: [],
          term: newBaseWorksheet.pictogramSearchTerm,
        });
      }

      newBaseWorksheet.sections.forEach((section, sectionIndex) => {
        (section.items || []).forEach((item, itemIndex) => {
          if (shouldResolveItemPictogram(item)) {
            searchTerms.push({
              type: 'item',
              path: [sectionIndex, itemIndex],
              term: item.searchTerm || item.content,
            });
          }
        });
      });

      const pictogramPromises = searchTerms.map(st => searchPictograms(st.term));
      const pictogramResults = await Promise.all(pictogramPromises);

      const processedWorksheet = produce(newBaseWorksheet, draft => {
        searchTerms.forEach((st, index) => {
          const pictos = pictogramResults[index];
          const urls = pictos.map(p => p.url);

          if (st.type === 'main') {
            draft.pictoOptions = urls;
            draft.selectedPictoUrl = urls.length > 0 ? urls[0] : '';
            return;
          }

          const [sectionIndex, itemIndex] = st.path;
          const item = draft.sections[sectionIndex as number].items[itemIndex as number];

          item.searchTerm = st.term;
          item.pictoOptions = urls;
          item.selectedPictoUrl = urls.length > 0 ? urls[0] : '';
        });

        if (!draft.telemetry) {
          draft.telemetry = {
            generationTimeMs: 0,
            adpTimeMs: 0,
            acTimeMs: 0,
            rejectionCount: 0,
            manualEditsCount: 0,
            pictoOverridesCount: 0,
            retryCount: 0,
            createdTimestamp: new Date().toISOString(),
          };
        }
        draft.telemetry.generationTimeMs = (draft.telemetry.generationTimeMs || 0) + callDurationMs;
      });

      setSuggestedWorksheet(processedWorksheet);
      setSuggestedOperations(operations);
      setRefinementInstruction('');
      setIsAssistantOpen(false);
    } catch (err: any) {
      setRefinementError(err.message || 'Error al refinar la ficha.');
    } finally {
      setIsRefining(false);
    }
  };

  const handleAcceptSuggestion = () => {
    if (suggestedWorksheet && suggestedOperations) {
      commitChange(suggestedWorksheet, 'Sugerencia de IA', suggestedOperations);
      setSuggestedWorksheet(null);
      setSuggestedOperations(null);
    }
  };

  const handleRejectSuggestion = () => {
    const nextWorksheet = produce(worksheet, draft => {
      if (!draft.telemetry) {
        draft.telemetry = {
          generationTimeMs: 0,
          adpTimeMs: 0,
          acTimeMs: 0,
          rejectionCount: 0,
          manualEditsCount: 0,
          pictoOverridesCount: 0,
          retryCount: 0,
          createdTimestamp: new Date().toISOString(),
        };
      }
      draft.telemetry.rejectionCount = (draft.telemetry.rejectionCount || 0) + 1;
    });
    commitChange(nextWorksheet, 'Rechazo de sugerencia de IA');

    setSuggestedWorksheet(null);
    setSuggestedOperations(null);
  };

  return (
    <div className="mt-6 space-y-6">
      {/* Contenedor invisible para que html2canvas siempre pueda capturar el PDF en cualquier pestaña */}
      {worksheetRef && (
        <div className="absolute left-[-9999px] top-[-9999px] pointer-events-none" aria-hidden="true">
          <div ref={worksheetRef} className="w-[800px] p-8 bg-white">
            <WorksheetDisplay worksheet={worksheet} />
          </div>
        </div>
      )}

      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="mb-3.5 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition active:bg-slate-100 focus:outline-none"
              >
                <ArrowLeftIcon className="h-3.5 w-3.5 text-slate-500" />
                <span>Volver a la Biblioteca</span>
              </button>
            )}

            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-sky-800">
              <PencilRulerIcon className="h-4 w-4" />
              Espacio de Trabajo
            </div>

            <h3 className="text-2xl font-black tracking-tight text-slate-900">
              {worksheet.title || 'Ficha de Actividades'}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Edita los ejercicios directamente, revisa la vista de impresión en A4 o descarga el PDF listo para usar.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onPlay && (
              <button
                type="button"
                onClick={onPlay}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-black uppercase tracking-wider text-indigo-750 shadow-sm shadow-indigo-150/40 hover:bg-indigo-100 hover:text-indigo-800 transition active:bg-indigo-200 focus:outline-none"
              >
                <GamepadIcon className="h-4.5 w-4.5 text-indigo-600" />
                <span>Modo Alumno</span>
              </button>
            )}
            {onDownload && (
              <button
                type="button"
                onClick={onDownload}
                disabled={!isDownloadReady || isDownloading}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-black uppercase tracking-wider text-emerald-750 shadow-sm shadow-emerald-150/40 hover:bg-emerald-100 hover:text-emerald-800 transition active:bg-emerald-200 disabled:opacity-50 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200 focus:outline-none"
              >
                <DownloadIcon className="h-4.5 w-4.5 text-emerald-600" />
                <span>{isDownloading ? 'Descargando...' : 'Descargar PDF'}</span>
              </button>
            )}
            {onSave && !isSaved && (
              <button
                type="button"
                onClick={() => onSave(worksheet)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2 text-xs font-black uppercase tracking-wider text-sky-750 shadow-sm shadow-sky-150/40 hover:bg-sky-100 hover:text-sky-850 transition active:bg-sky-200 focus:outline-none"
              >
                <SaveIcon className="h-4.5 w-4.5 text-sky-600" />
                <span>Guardar Ficha</span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 border-t border-slate-100 pt-4 flex justify-between items-center flex-wrap gap-3">
          <div className="flex rounded-2xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                activeTab === 'editor'
                  ? 'bg-white text-sky-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Ejercicios
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                activeTab === 'preview'
                  ? 'bg-white text-sky-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Vista de Impresión
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                activeTab === 'history'
                  ? 'bg-white text-sky-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <HistoryIcon className="h-4 w-4" />
              Historial
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'editor' ? (
        <div className="overflow-auto rounded-[28px] border border-slate-200 bg-white p-3 shadow-xl shadow-slate-200/50 sm:p-5">
          <div className="relative mx-auto max-w-[920px]">
            <EditableWorksheetDisplay
              worksheet={suggestedWorksheet || worksheet}
              highlightedSectionIds={suggestedWorksheet ? getHighlightedSectionIds() : []}
              onWorksheetChange={handleWorksheetChange}
              searchLanguage={searchLanguage}
              onSearchLanguageChange={onSearchLanguageChange}
            />
          </div>
        </div>
      ) : activeTab === 'preview' ? (
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white p-3 shadow-xl shadow-slate-200/60 max-w-[920px] mx-auto">
          <WorksheetDisplay worksheet={suggestedWorksheet || worksheet} />
        </div>
      ) : (
        <div className="mx-auto max-w-[920px] rounded-[28px] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
              <HistoryIcon className="h-5 w-5" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900">Historial de Versiones</h3>
              <p className="text-sm text-slate-500">
                Navega por las distintas versiones de esta ficha durante tu sesión.
              </p>
            </div>
          </div>

          <div className="relative space-y-3 before:absolute before:inset-y-0 before:left-[19px] before:w-[2px] before:bg-slate-100">
            {history.map((entry, index) => {
              const isActive = index === currentIndex;

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => goToHistoryIndex(index)}
                  className={`relative flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all ${
                    isActive
                      ? 'border-sky-500 bg-sky-50 shadow-md shadow-sky-100'
                      : 'border-slate-200 bg-white hover:border-sky-300 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${
                      isActive
                        ? 'border-sky-500 bg-white text-sky-600'
                        : 'border-slate-200 bg-white text-slate-400'
                    }`}
                  >
                    {isActive ? (
                      <CheckCircleIcon className="h-5 w-5" />
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-slate-300" />
                    )}
                  </div>

                  <div>
                    <h4 className={`font-bold ${isActive ? 'text-sky-900' : 'text-slate-700'}`}>
                      {entry.actionLabel}
                    </h4>

                    <p className="text-xs text-slate-500">
                      {entry.timestamp.toLocaleTimeString()} - {entry.state.sections.length} ejercicio(s)
                    </p>
                  </div>

                  {isActive && (
                    <div className="ml-auto flex items-center text-xs font-bold uppercase tracking-wider text-sky-600">
                      Versión Actual
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Panel flotante de sugerencias de IA */}
      {suggestedWorksheet && (
        <div className="pointer-events-none sticky bottom-4 z-40">
          <div className="pointer-events-auto mx-auto max-w-[960px] rounded-[24px] border p-3 shadow-xl backdrop-blur border-sky-300 bg-sky-950/95">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-white">
                  <Wand2Icon className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm font-bold text-white">
                    Previsualizando sugerencia de la IA
                  </p>
                  <p className="text-xs text-sky-200">
                    Revisa los cambios antes de aplicarlos definitivamente.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={handleRejectSuggestion}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 font-semibold text-white transition hover:bg-white/20 focus:outline-none"
                >
                  <XIcon className="h-5 w-5" />
                  Rechazar
                </button>

                <button
                  type="button"
                  onClick={handleAcceptSuggestion}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 font-semibold text-sky-950 shadow-lg transition hover:bg-sky-50 focus:outline-none"
                >
                  <CheckCircleIcon className="h-5 w-5" />
                  Aceptar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="pointer-events-none fixed bottom-24 right-8 z-50 sm:bottom-24 sm:right-10">
        <div className="flex flex-col items-end gap-3">
          <div
            aria-hidden={!isAssistantOpen}
            className={`w-[320px] origin-bottom-right rounded-[24px] border border-slate-200 bg-white shadow-2xl transition-all duration-300 sm:w-[380px] ${
              isAssistantOpen
                ? 'pointer-events-auto translate-y-0 opacity-100'
                : 'pointer-events-none translate-y-4 opacity-0'
            }`}
          >
            <div className="p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Wand2Icon className="h-5 w-5 text-sky-600" />
                    <h4 className="text-lg font-bold text-slate-900">Asistente IA</h4>
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    Describe el cambio y la IA ajustará la ficha actual.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAssistantOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-600"
                  aria-label="Cerrar asistente IA"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-3">
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Contexto de edición:
                </label>

                <select
                  value={refinementContext}
                  onChange={(e) => setRefinementContext(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  disabled={isRefining || !!suggestedWorksheet}
                >
                  <option value="all">Toda la ficha</option>

                  {worksheet.sections.map((section, index) => {
                    const exerciseType = section.exercise?.type || section.exerciseType || 'ejercicio';
                    const title = section.instruction?.text || 'Sin título';

                    return (
                      <option key={index} value={index.toString()}>
                        Ejercicio {index + 1}: {exerciseType} - {title}
                      </option>
                    );
                  })}
                </select>
              </div>

              <textarea
                value={refinementInstruction}
                onChange={(e) => setRefinementInstruction(e.target.value)}
                placeholder="Ej: 'Cambia la primera actividad para que sea de repasar números del 1 al 5'"
                className="h-32 w-full rounded-2xl border border-slate-300 p-3 text-sm transition focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                disabled={isRefining || !!suggestedWorksheet}
              />

              <button
                type="button"
                onClick={handleRefineWithAI}
                disabled={isRefining || !!suggestedWorksheet}
                className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 disabled:bg-slate-300"
              >
                {isRefining ? (
                  <>
                    <Spinner />
                    Sugiriendo...
                  </>
                ) : (
                  'Pedir sugerencia a IA'
                )}
              </button>

              {refinementError && (
                <p className="mt-3 text-xs text-rose-600">{refinementError}</p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAssistantOpen(current => !current)}
            className="pointer-events-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 text-white shadow-2xl shadow-slate-900/30 transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-600"
            aria-label={isAssistantOpen ? 'Cerrar asistente IA' : 'Abrir asistente IA'}
            title={isAssistantOpen ? 'Cerrar asistente IA' : 'Abrir asistente IA'}
          >
            <Wand2Icon className="h-7 w-7" />
          </button>
        </div>
      </div>
    </div>
  );
};
