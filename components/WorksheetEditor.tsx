import React, { useState, useEffect } from 'react';
import type { SavedWorksheet } from '../types';
import { EditableWorksheetDisplay } from './EditableWorksheetDisplay';
import { refineWorksheet } from '../services/aiService';
import { searchPictograms } from '../services/pictogramService';
import { Spinner } from './Spinner';
import { Wand2Icon, SaveIcon } from './Icons';
import { produce } from 'immer';
import { normalizeWorksheet } from '../services/worksheetNormalizer';

interface WorksheetEditorProps {
  worksheet: SavedWorksheet;
  setWorksheet: (worksheet: SavedWorksheet) => void;
  onSave: () => void;
  onCancel: () => void;
}

const getFallbackImageUrl = (seed: string) => `https://picsum.photos/seed/${encodeURIComponent(seed)}/200`;

export const WorksheetEditor: React.FC<WorksheetEditorProps> = ({ worksheet, setWorksheet, onSave, onCancel }) => {
  const [refinementInstruction, setRefinementInstruction] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [refinementError, setRefinementError] = useState<string | null>(null);
  const [isMigrating, setIsMigrating] = useState(true);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  useEffect(() => {
    const migrateWorksheet = async () => {
      const needsStructureMigration = worksheet.sections.some(
        section => !section.exercise || !section.exerciseType || !section.items || !section.layout
      );
      const normalizedWorksheet = needsStructureMigration ? normalizeWorksheet(worksheet) : worksheet;

      // Check if migration is needed (e.g., old data structure without picto options)
      if (typeof normalizedWorksheet.selectedPictoUrl !== 'undefined') {
        if (needsStructureMigration) {
          setWorksheet(normalizedWorksheet);
        }
        setIsMigrating(false);
        return;
      }

      setIsMigrating(true);
      const searchTerms: { type: 'main' | 'item'; path: (number | string)[]; term: string }[] = [];
      searchTerms.push({ type: 'main', path: [], term: normalizedWorksheet.pictogramSearchTerm });
      normalizedWorksheet.sections.forEach((section, sectionIndex) => {
        (section.items || []).forEach((item, itemIndex) => {
          if (item.type === 'image') {
            searchTerms.push({ type: 'item', path: [sectionIndex, itemIndex], term: item.content });
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
            draft.selectedPictoUrl = urls.length > 0 ? urls[0] : getFallbackImageUrl(st.term);
          } else {
            const [sectionIndex, itemIndex] = st.path;
            const item = draft.sections[sectionIndex as number].items[itemIndex as number];
            item.searchTerm = st.term;
            item.pictoOptions = urls;
            item.selectedPictoUrl = urls.length > 0 ? urls[0] : getFallbackImageUrl(st.term);
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
          if (item.type === 'image') {
            searchTerms.push({ type: 'item', path: [sectionIndex, itemIndex], term: item.content });
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
            draft.selectedPictoUrl = urls.length > 0 ? urls[0] : getFallbackImageUrl(st.term);
          } else {
            const [sectionIndex, itemIndex] = st.path;
            const item = draft.sections[sectionIndex as number].items[itemIndex as number];
            item.searchTerm = st.term;
            item.pictoOptions = urls;
            item.selectedPictoUrl = urls.length > 0 ? urls[0] : getFallbackImageUrl(st.term);
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
      <div className="flex items-center justify-center h-96">
        <Spinner />
        <p className="ml-4 text-gray-600">Actualizando formato de la ficha...</p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="bg-white p-4 sm:p-5 rounded-xl shadow-lg border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold">Modo Edición</h3>
            <p className="text-sm text-gray-500 mt-1">
              La ficha se mantiene con proporción A4 y centrada. El asistente de IA se abre desde el botón flotante para no molestar mientras editas.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button 
              onClick={onSave}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700"
            >
              <SaveIcon className="w-5 h-5"/>
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-3 sm:p-5 rounded-xl shadow-lg border border-gray-200 overflow-auto">
        <div className="max-w-[920px] mx-auto">
          <EditableWorksheetDisplay worksheet={worksheet} onWorksheetChange={setWorksheet} />
        </div>
      </div>

      <div className="fixed right-4 bottom-4 z-30 sm:right-6 sm:bottom-6">
        <div className="flex items-end gap-3">
          <div
            className={`w-[320px] sm:w-[380px] rounded-2xl border border-gray-200 bg-white shadow-2xl transition-all duration-300 origin-bottom-right ${
              isAssistantOpen ? 'translate-x-0 opacity-100 pointer-events-auto' : 'translate-x-6 opacity-0 pointer-events-none'
            }`}
          >
            <div className="p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Wand2Icon className="h-5 w-5 text-indigo-500" />
                    <h4 className="text-lg font-bold text-gray-800">Asistente IA</h4>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Describe el cambio y la IA ajustará la ficha actual.
                  </p>
                </div>
                <button
                  onClick={() => setIsAssistantOpen(false)}
                  className="h-8 w-8 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center"
                  aria-label="Cerrar asistente IA"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              <textarea
                value={refinementInstruction}
                onChange={(e) => setRefinementInstruction(e.target.value)}
                placeholder="Ej: 'Cambia la primera actividad para que sea de repasar números del 1 al 5'"
                className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-sm"
                disabled={isRefining}
              />
              <button
                onClick={handleRefineWithAI}
                disabled={isRefining}
                className="w-full mt-3 h-12 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300"
              >
                {isRefining ? <><Spinner/> Refinando...</> : 'Refinar con IA'}
              </button>
              {refinementError && <p className="text-red-600 text-xs mt-3">{refinementError}</p>}
            </div>
          </div>

          <button
            onClick={() => setIsAssistantOpen((current) => !current)}
            className="h-16 w-16 rounded-full bg-indigo-600 text-white shadow-2xl hover:bg-indigo-700 flex items-center justify-center"
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
