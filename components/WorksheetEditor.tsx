import React, { useState, useEffect } from 'react';
import type { SavedWorksheet } from '../types';
import { EditableWorksheetDisplay } from './EditableWorksheetDisplay';
import { refineWorksheet } from '../services/aiService';
import { searchPictograms } from '../services/pictogramService';
import { Spinner } from './Spinner';
import { Wand2Icon, SaveIcon, XIcon, PencilRulerIcon } from './Icons';
import { produce } from 'immer';
import { normalizeWorksheet } from '../services/worksheetNormalizer';

interface WorksheetEditorProps {
  worksheet: SavedWorksheet;
  setWorksheet: (worksheet: SavedWorksheet) => void;
  onSave: () => void;
  onCancel: () => void;
}

const shouldResolveItemPictogram = (item: SavedWorksheet['sections'][number]['items'][number]) =>
  item.type === 'image' || item.type === 'traceable_text';

export const WorksheetEditor: React.FC<WorksheetEditorProps> = ({ worksheet, setWorksheet, onSave, onCancel }) => {
  const [refinementInstruction, setRefinementInstruction] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [refinementError, setRefinementError] = useState<string | null>(null);
  const [isMigrating, setIsMigrating] = useState(true);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  useEffect(() => {
    const migrateWorksheet = async () => {
      const normalizedWorksheet = normalizeWorksheet(worksheet);
      const needsStructureMigration = worksheet.sections.some(
        section => !section.exercise || !section.exerciseType || !section.items || !section.layout
      );
      const needsSectionSync = worksheet.sections.some((section, sectionIndex) => {
        const currentItems = JSON.stringify(section.items || []);
        const normalizedItems = JSON.stringify(normalizedWorksheet.sections[sectionIndex]?.items || []);
        return currentItems !== normalizedItems;
      });

      if (needsStructureMigration || needsSectionSync) {
        setWorksheet(normalizedWorksheet);
      }

      // Check if pictogram migration is needed.
      if (typeof normalizedWorksheet.selectedPictoUrl !== 'undefined') {
        setIsMigrating(false);
        return;
      }

      setIsMigrating(true);
      const searchTerms: { type: 'main' | 'item'; path: (number | string)[]; term: string }[] = [];
      searchTerms.push({ type: 'main', path: [], term: normalizedWorksheet.pictogramSearchTerm });
      normalizedWorksheet.sections.forEach((section, sectionIndex) => {
        (section.items || []).forEach((item, itemIndex) => {
          if (shouldResolveItemPictogram(item)) {
            searchTerms.push({ type: 'item', path: [sectionIndex, itemIndex], term: item.searchTerm || item.content });
          }
        });
      });

      const pictogramPromises = searchTerms.map(st => searchPictograms(st.term));
      const pictogramResults = await Promise.all(pictogramPromises);

      const migratedWorksheet = produce(normalizedWorksheet, draft => {
        searchTerms.forEach((st, index) => {
          const pictos = pictogramResults[index];
          const urls = pictos.map(p => p.url);
          if (st.type === 'main') {
            draft.pictoOptions = urls;
            draft.selectedPictoUrl = urls.length > 0 ? urls[0] : '';
          } else {
            const [sectionIndex, itemIndex] = st.path;
            const item = draft.sections[sectionIndex as number].items[itemIndex as number];
            item.searchTerm = st.term;
            item.pictoOptions = urls;
            item.selectedPictoUrl = urls.length > 0 ? urls[0] : '';
          }
        });
      });

      setWorksheet(migratedWorksheet);
      setIsMigrating(false);
    };

    migrateWorksheet();
  }, [worksheet, setWorksheet]);

  const handleRefineWithAI = async () => {
    if (!refinementInstruction.trim()) {
      setRefinementError('Por favor, escribe qué te gustaría cambiar.');
      return;
    }
    setIsRefining(true);
    setRefinementError(null);
    try {
      const refinedPartial = await refineWorksheet(worksheet, refinementInstruction);
      
      // Create a complete worksheet with the refinements before processing
      const newBaseWorksheet = normalizeWorksheet({ ...worksheet, ...refinedPartial });

      // After refining, re-process the pictograms for any new/changed items
      const searchTerms: { type: 'main' | 'item'; path: (number | string)[]; term: string }[] = [];
      if (newBaseWorksheet.pictogramSearchTerm) {
        searchTerms.push({ type: 'main', path: [], term: newBaseWorksheet.pictogramSearchTerm });
      }
      newBaseWorksheet.sections.forEach((section, sectionIndex) => {
        (section.items || []).forEach((item, itemIndex) => {
          if (shouldResolveItemPictogram(item)) {
            searchTerms.push({ type: 'item', path: [sectionIndex, itemIndex], term: item.searchTerm || item.content });
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
          } else {
            const [sectionIndex, itemIndex] = st.path;
            const item = draft.sections[sectionIndex as number].items[itemIndex as number];
            item.searchTerm = st.term;
            item.pictoOptions = urls;
            item.selectedPictoUrl = urls.length > 0 ? urls[0] : '';
          }
        });
      });

      setWorksheet(processedWorksheet);
      setRefinementInstruction('');
    } catch (err: any) {
      setRefinementError(err.message || 'Error al refinar la ficha.');
    } finally {
      setIsRefining(false);
    }
  };
  
  if (isMigrating) {
    return (
      <div className="flex h-96 items-center justify-center rounded-[28px] border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
        <Spinner className="text-sky-600" />
        <p className="ml-4 text-slate-600">Actualizando formato de la ficha...</p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
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
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={onCancel}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-200 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-600"
            >
              <XIcon className="h-5 w-5" />
              Cancelar
            </button>
            <button 
              onClick={onSave}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-600"
            >
              <SaveIcon className="w-5 h-5"/>
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-auto rounded-[28px] border border-slate-200 bg-white p-3 shadow-xl shadow-slate-200/50 sm:p-5">
        <div className="max-w-[920px] mx-auto">
          <EditableWorksheetDisplay worksheet={worksheet} onWorksheetChange={setWorksheet} />
        </div>
      </div>

      <div className="sticky bottom-4 z-40">
        <div className="mx-auto max-w-[960px] rounded-[24px] border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              Puedes guardar o cancelar desde aquí sin volver al inicio.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={onCancel}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-200 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-600"
              >
                <XIcon className="h-5 w-5" />
                Cancelar
              </button>
              <button
                onClick={onSave}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-600"
              >
                <SaveIcon className="w-5 h-5"/>
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-10 right-8 z-30 sm:bottom-12 sm:right-10">
        <div className="flex flex-col items-end gap-3">
          <div
            className={`origin-bottom-right w-[320px] rounded-[24px] border border-slate-200 bg-white shadow-2xl transition-all duration-300 sm:w-[380px] ${
              isAssistantOpen ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-4 opacity-0 pointer-events-none'
            }`}
          >
            <div className="p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
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
                  onClick={() => setIsAssistantOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-600"
                  aria-label="Cerrar asistente IA"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>

              <textarea
                value={refinementInstruction}
                onChange={(e) => setRefinementInstruction(e.target.value)}
                placeholder="Ej: 'Cambia la primera actividad para que sea de repasar números del 1 al 5'"
                className="h-32 w-full rounded-2xl border border-slate-300 p-3 text-sm transition focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                disabled={isRefining}
              />
              <button
                onClick={handleRefineWithAI}
                disabled={isRefining}
                className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 disabled:bg-slate-300"
              >
                {isRefining ? <><Spinner/> Refinando...</> : 'Refinar con IA'}
              </button>
              {refinementError && <p className="mt-3 text-xs text-rose-600">{refinementError}</p>}
            </div>
          </div>

          <button
            onClick={() => setIsAssistantOpen((current) => !current)}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 text-white shadow-2xl shadow-slate-900/30 transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-600"
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
