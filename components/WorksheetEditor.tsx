import React, { useState, useEffect } from 'react';
import type { SavedWorksheet } from '../types';
import { EditableWorksheetDisplay } from './EditableWorksheetDisplay';
import { refineWorksheet } from '../services/geminiService';
import { searchPictograms, getPictogramUrl } from '../services/arasaacService';
import { Spinner } from './Spinner';
import { Wand2Icon, SaveIcon } from './Icons';
import { produce } from 'immer';

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

  useEffect(() => {
    const migrateWorksheet = async () => {
      // Check if migration is needed (e.g., old data structure without picto options)
      if (typeof worksheet.selectedPictoUrl !== 'undefined') {
        setIsMigrating(false);
        return;
      }

      setIsMigrating(true);
      const searchTerms: { type: 'main' | 'item'; path: (number | string)[]; term: string }[] = [];
      searchTerms.push({ type: 'main', path: [], term: worksheet.pictogramSearchTerm });
      worksheet.sections.forEach((section, sectionIndex) => {
        section.items.forEach((item, itemIndex) => {
          if (item.type === 'image') {
            searchTerms.push({ type: 'item', path: [sectionIndex, itemIndex], term: item.content });
          }
        });
      });

      const pictogramPromises = searchTerms.map(st => searchPictograms(st.term));
      const pictogramResults = await Promise.all(pictogramPromises);

      const migratedWorksheet = produce(worksheet, draft => {
        searchTerms.forEach((st, index) => {
          const pictos = pictogramResults[index];
          const urls = pictos.map(p => getPictogramUrl(p._id));
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
      const newBaseWorksheet = { ...worksheet, ...refinedPartial };

      // After refining, re-process the pictograms for any new/changed items
      const searchTerms: { type: 'main' | 'item'; path: (number | string)[]; term: string }[] = [];
      if (newBaseWorksheet.pictogramSearchTerm) {
        searchTerms.push({ type: 'main', path: [], term: newBaseWorksheet.pictogramSearchTerm });
      }
      newBaseWorksheet.sections.forEach((section, sectionIndex) => {
        section.items.forEach((item, itemIndex) => {
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
          const urls = pictos.map(p => getPictogramUrl(p._id));
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
    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Modo Edición</h3>
            <div className="flex gap-2">
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
        <div className="bg-white p-2">
          <EditableWorksheetDisplay worksheet={worksheet} onWorksheetChange={setWorksheet} />
        </div>
      </div>
      <div className="md:col-span-1">
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 sticky top-24">
          <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Wand2Icon className="h-5 w-5 text-indigo-500" />
            Asistente IA
          </h4>
          <p className="text-sm text-gray-500 mt-1 mb-3">
            Describe los cambios que quieres hacer y la IA modificará la ficha.
          </p>
          <textarea
            value={refinementInstruction}
            onChange={(e) => setRefinementInstruction(e.target.value)}
            placeholder="Ej: 'Cambia la primera actividad para que sea de repasar números del 1 al 5'"
            className="w-full h-28 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-sm"
            disabled={isRefining}
          />
          <button
            onClick={handleRefineWithAI}
            disabled={isRefining}
            className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300"
          >
            {isRefining ? <><Spinner/> Refinando...</> : 'Refinar con IA'}
          </button>
          {refinementError && <p className="text-red-600 text-xs mt-2">{refinementError}</p>}
        </div>
      </div>
    </div>
  );
};
