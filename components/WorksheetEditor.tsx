import React, { useState, useEffect } from 'react';
import type { SavedWorksheet, WorksheetOperation } from '../types';
import { EditableWorksheetDisplay } from './EditableWorksheetDisplay';
import { refineExercise } from '../services/aiService';
import { searchPictograms } from '../services/pictogramService';
import { Spinner } from './Spinner';
import { Wand2Icon, SaveIcon, XIcon, PencilRulerIcon, HistoryIcon, CheckCircleIcon } from './Icons';
import { produce } from 'immer';
import { useWorksheetHistory } from '../hooks/useWorksheetHistory';
import { applyWorksheetOperations } from '../services/worksheetOperations';

interface WorksheetEditorProps {
  worksheet: SavedWorksheet;
  setWorksheet: (worksheet: SavedWorksheet) => void;
  onSave: (worksheet: SavedWorksheet) => void;
  onCancel: () => void;
  searchLanguage: 'es' | 'val' | 'en';
  onSearchLanguageChange: (lang: 'es' | 'val' | 'en') => void;
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
  const [activeTab, setActiveTab] = useState<'editor' | 'history'>('editor');

  // Sincronizar el estado actual del historial con el componente padre
  useEffect(() => {
    setWorksheet({
      ...worksheet,
      editHistory: serializeHistory(),
      editHistoryIndex: currentIndex,
    });
  }, [worksheet, currentIndex, serializeHistory, setWorksheet]);

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

      const response = await refineExercise(worksheet, refinementInstruction, targetSectionId);
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
    setSuggestedWorksheet(null);
    setSuggestedOperations(null);
  };

  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-sky-800">
              <PencilRulerIcon className="h-4 w-4" />
              Edición manual
            </div>

            <h3 className="text-2xl font-black tracking-tight text-slate-900">Modo edición</h3>

            <p className="mt-1 text-sm text-slate-500">
              La ficha se mantiene con proporción A4 y centrada. El asistente de IA se abre desde el botón flotante para no molestar mientras editas.
            </p>
          </div>

          <div className="flex flex-col flex-wrap gap-2 sm:flex-row">
            <div className="mr-4 flex rounded-2xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                  activeTab === 'editor'
                    ? 'bg-white text-sky-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Editor
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
      </div>

      {activeTab === 'editor' ? (
        <div className="overflow-auto rounded-[28px] border border-slate-200 bg-white p-3 shadow-xl shadow-slate-200/50 sm:p-5">
          <div className="relative mx-auto max-w-[920px]">
            <EditableWorksheetDisplay
              worksheet={suggestedWorksheet || worksheet}
              highlightedSectionIds={suggestedWorksheet ? getHighlightedSectionIds() : []}
              onWorksheetChange={(operations, actionLabel) =>
                commitOperations(operations, actionLabel || 'Edición manual')
              }
              searchLanguage={searchLanguage}
              onSearchLanguageChange={onSearchLanguageChange}
            />
          </div>
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

      <div className="pointer-events-none sticky bottom-4 z-40">
        <div
          className={`pointer-events-auto mx-auto max-w-[960px] rounded-[24px] border p-3 shadow-xl backdrop-blur ${
            suggestedWorksheet
              ? 'border-sky-300 bg-sky-950/95'
              : 'border-slate-200 bg-white/95'
          }`}
        >
          {suggestedWorksheet ? (
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
                  className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 font-semibold text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white"
                >
                  <XIcon className="h-5 w-5" />
                  Rechazar
                </button>

                <button
                  type="button"
                  onClick={handleAcceptSuggestion}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 font-semibold text-sky-950 shadow-lg transition hover:bg-sky-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white"
                >
                  <CheckCircleIcon className="h-5 w-5" />
                  Aceptar Cambios
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">
                Puedes guardar o cancelar desde aquí sin volver al inicio.
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onCancel}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-200 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-600"
                >
                  <XIcon className="h-5 w-5" />
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onSave({
                      ...worksheet,
                      editHistory: serializeHistory(),
                      editHistoryIndex: currentIndex,
                    })
                  }
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-600"
                >
                  <SaveIcon className="h-5 w-5" />
                  Guardar Cambios
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="pointer-events-none fixed bottom-24 right-8 z-50 sm:bottom-24 sm:right-10">
        <div className="flex flex-col items-end gap-3">
          <div
            className={`pointer-events-auto w-[320px] origin-bottom-right rounded-[24px] border border-slate-200 bg-white shadow-2xl transition-all duration-300 sm:w-[380px] ${
              isAssistantOpen
                ? 'translate-y-0 opacity-100'
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
