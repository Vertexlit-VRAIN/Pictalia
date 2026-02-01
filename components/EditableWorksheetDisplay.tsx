import React, { useState } from 'react';
import { SavedWorksheet, WorksheetItem } from '../types';
import { produce } from 'immer';
import { searchPictograms, getPictogramUrl } from '../services/arasaacService';

// Modal for changing the pictogram search term
const ImageEditModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  currentDisplayedTerm: string;
  currentPictoSearchTerm: string; // New prop for the pictogram search term
  onSave: (displayedTerm: string, pictoSearchTerm: string, applyToAll: boolean) => void;
}> = ({ isOpen, onClose, currentDisplayedTerm, currentPictoSearchTerm, onSave }) => {
  const [displayedTerm, setDisplayedTerm] = useState(currentDisplayedTerm);
  const [pictoSearchTerm, setPictoSearchTerm] = useState(currentPictoSearchTerm); // New state
  const [applyToAll, setApplyToAll] = useState(true); // New state for the checkbox, default to true

  if (!isOpen) return null;

  const handleSave = () => {
    if (displayedTerm.trim()) {
      onSave(displayedTerm.trim(), pictoSearchTerm.trim() || displayedTerm.trim(), applyToAll); // Pass applyToAll
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
        <h3 className="text-lg font-bold text-gray-800">Editar Término y Pictograma</h3>
        <p className="text-sm text-gray-500 mt-1">Modifica el texto que aparece en la ficha y el término de búsqueda del pictograma.</p>
        <label htmlFor="displayedTerm" className="block text-sm font-medium text-gray-700 mt-4">Texto en la ficha:</label>
        <input
          id="displayedTerm"
          type="text"
          value={displayedTerm}
          onChange={(e) => setDisplayedTerm(e.target.value)}
          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
        <label htmlFor="pictoSearchTerm" className="block text-sm font-medium text-gray-700 mt-4">Término de búsqueda del pictograma (opcional):</label>
        <input
          id="pictoSearchTerm"
          type="text"
          value={pictoSearchTerm}
          onChange={(e) => setPictoSearchTerm(e.target.value)}
          placeholder="Dejar en blanco para usar el texto de la ficha"
          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
        <div className="mt-4 flex items-center">
          <input
            id="applyToAll"
            name="applyToAll"
            type="checkbox"
            checked={applyToAll}
            onChange={(e) => setApplyToAll(e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="applyToAll" className="ml-2 block text-sm text-gray-900">
            Aplicar a todas las instancias
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300">Cancelar</button>
          <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700">Guardar</button>
        </div>
      </div>
    </div>
  );
};

// Modal for selecting a pictogram from multiple options
const PictoSelectionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  pictoOptions: string[];
  onSelect: (selectedUrl: string, applyToAll: boolean) => void;
}> = ({ isOpen, onClose, pictoOptions, onSelect }) => {
  if (!isOpen) return null;

  const [applyToAll, setApplyToAll] = useState(true); // New state for the checkbox

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-800 mb-4">Elige un Pictograma</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 max-h-96 overflow-y-auto">
          {pictoOptions.map((url) => (
            <button 
              key={url} 
              onClick={() => onSelect(url, applyToAll)} // Pass applyToAll
              className="p-2 border-2 border-transparent hover:border-indigo-500 focus:border-indigo-500 rounded-lg transition-all duration-150 bg-gray-50"
            >
              <img src={url} alt="Opción de pictograma" className="w-full h-full object-contain" loading="lazy" />
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-center">
          <input
            id="applyToAllPictoSelect"
            name="applyToAllPictoSelect"
            type="checkbox"
            checked={applyToAll}
            onChange={(e) => setApplyToAll(e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="applyToAllPictoSelect" className="ml-2 block text-sm text-gray-900">
            Aplicar a todas las instancias de este pictograma
          </label>
        </div>
      </div>
    </div>
  );
};



type EditableWorksheetProps = {
  worksheet: SavedWorksheet;
  onWorksheetChange: (newWorksheet: SavedWorksheet) => void;
};

export const EditableWorksheetDisplay: React.FC<EditableWorksheetProps> = ({ worksheet, onWorksheetChange }) => {
  const [editingSearchTerm, setEditingSearchTerm] = useState<{ sectionIndex: number; itemIndex: number } | null>(null);
  const [selectingPicto, setSelectingPicto] = useState<{ sectionIndex: number; itemIndex: number } | null>(null);
  const [selectingMainPicto, setSelectingMainPicto] = useState<boolean>(false);
  const [editingMainPictoSearchTerm, setEditingMainPictoSearchTerm] = useState<boolean>(false);
  const [editingInstructionPicto, setEditingInstructionPicto] = useState<{ sectionIndex: number; pictoIndex: number } | null>(null); // New state

  const handleTextChange = (path: (string | number)[], value: string) => {
    const newWorksheet = produce(worksheet, draft => {
      let current: any = draft;
      path.slice(0, -1).forEach(p => { current = current[p]; });
      current[path[path.length - 1]] = value;
    });
    onWorksheetChange(newWorksheet);
  };

  // Helper function to apply global pictogram updates
  const applyGlobalPictoUpdate = (
    draft: SavedWorksheet,
    oldPictoUrl: string,
    newPictoUrl: string,
    newPictoOptions: string[],
    oldDisplayedTerm: string,
    newDisplayedTerm: string
  ) => {
    // Update main pictogram
    if (draft.selectedPictoUrl === oldPictoUrl && draft.pictogramSearchTerm === oldDisplayedTerm) {
      draft.selectedPictoUrl = newPictoUrl;
      draft.pictoOptions = newPictoOptions;
      draft.pictogramSearchTerm = newDisplayedTerm;
    }

    // Update instruction pictograms
    draft.sections.forEach(section => {
      section.instruction.pictograms?.forEach(picto => {
        if (picto.url === oldPictoUrl && picto.searchTerm === oldDisplayedTerm) {
          picto.url = newPictoUrl;
          picto.searchTerm = newDisplayedTerm;
          picto.content = newDisplayedTerm;
        }
      });

      // Update item pictograms
      section.items.forEach(item => {
        if (item.type === 'image' && item.selectedPictoUrl === oldPictoUrl && (item.searchTerm === oldDisplayedTerm || item.content === oldDisplayedTerm)) {
          item.selectedPictoUrl = newPictoUrl;
          item.pictoOptions = newPictoOptions;
          item.searchTerm = newDisplayedTerm;
          item.content = newDisplayedTerm;
        }
      });
    });
  };
  
  const handleSearchTermSave = async (displayedTerm: string, pictoSearchTerm: string, applyToAll: boolean) => {
    if (editingSearchTerm) {
      const { sectionIndex, itemIndex } = editingSearchTerm;
      const currentItem = worksheet.sections[sectionIndex].items[itemIndex];
      const originalPictoUrl = currentItem.selectedPictoUrl || '';
      const originalDisplayedTerm = currentItem.searchTerm || currentItem.content || '';

      const pictos = await searchPictograms(pictoSearchTerm);
      const newPictoUrls = pictos.map(p => getPictogramUrl(p._id));
      const newSelectedPictoUrl = newPictoUrls.length > 0 ? newPictoUrls[0] : '';

      const newWorksheet = produce(worksheet, draft => {
        if (applyToAll) {
          applyGlobalPictoUpdate(
            draft,
            originalPictoUrl,
            newSelectedPictoUrl,
            newPictoUrls,
            originalDisplayedTerm,
            displayedTerm
          );
        } else {
          const item = draft.sections[sectionIndex].items[itemIndex];
          item.searchTerm = displayedTerm;
          item.content = displayedTerm;
          item.pictoOptions = newPictoUrls;
          item.selectedPictoUrl = newSelectedPictoUrl;
        }
      });
      onWorksheetChange(newWorksheet);
      setEditingSearchTerm(null);
    }
  };

  const handleMainSearchTermSave = async (displayedTerm: string, pictoSearchTerm: string, applyToAll: boolean) => {
    const originalPictoUrl = worksheet.selectedPictoUrl || '';
    const originalDisplayedTerm = worksheet.pictogramSearchTerm || '';

    const pictos = await searchPictograms(pictoSearchTerm);
    const newPictoUrls = pictos.map(p => getPictogramUrl(p._id));
    const newSelectedPictoUrl = newPictoUrls.length > 0 ? newPictoUrls[0] : '';

    const newWorksheet = produce(worksheet, draft => {
      // Always update the edited main pictogram first
      draft.pictogramSearchTerm = displayedTerm;
      draft.pictoOptions = newPictoUrls;
      draft.selectedPictoUrl = newSelectedPictoUrl;

      if (applyToAll) {
        // Now apply global update to other matching instances
        applyGlobalPictoUpdate(
          draft,
          originalPictoUrl,
          newSelectedPictoUrl,
          newPictoUrls,
          originalDisplayedTerm,
          displayedTerm
        );
      }
    });
    onWorksheetChange(newWorksheet);
    setEditingMainPictoSearchTerm(false);
  };

  const handleInstructionPictoSearchTermSave = async (displayedTerm: string, pictoSearchTerm: string, applyToAll: boolean) => {
    if (editingInstructionPicto) {
      const { sectionIndex, pictoIndex } = editingInstructionPicto;
      const currentInstructionPicto = worksheet.sections[sectionIndex].instruction.pictograms?.[pictoIndex];
      const originalPictoUrl = currentInstructionPicto?.url || '';
      const originalDisplayedTerm = currentInstructionPicto?.searchTerm || currentInstructionPicto?.content || '';

      const pictos = await searchPictograms(pictoSearchTerm);
      const newPictoUrls = pictos.map(p => getPictogramUrl(p._id));
      const newSelectedPictoUrl = newPictoUrls.length > 0 ? newPictoUrls[0] : '';

      const newWorksheet = produce(worksheet, draft => {
        if (applyToAll) {
          applyGlobalPictoUpdate(
            draft,
            originalPictoUrl,
            newSelectedPictoUrl,
            newPictoUrls,
            originalDisplayedTerm,
            displayedTerm
          );
        } else {
          const instructionPicto = draft.sections[sectionIndex].instruction.pictograms?.[pictoIndex];
          if (instructionPicto) {
            instructionPicto.searchTerm = displayedTerm;
            instructionPicto.content = displayedTerm;
            instructionPicto.url = newSelectedPictoUrl;
          }
        }
      });
      onWorksheetChange(newWorksheet);
      setEditingInstructionPicto(null);
    }
  };

  const handlePictoSelect = (selectedUrl: string, applyToAll: boolean) => {
    if (selectingPicto) {
      const { sectionIndex, itemIndex } = selectingPicto;
      const currentItem = worksheet.sections[sectionIndex].items[itemIndex];
      const originalPictoUrl = currentItem.selectedPictoUrl || '';
      const originalDisplayedTerm = currentItem.searchTerm || currentItem.content || '';

      const newPictoUrls = currentItem.pictoOptions || []; // Use existing options
      const newSelectedPictoUrl = selectedUrl;

      const newWorksheet = produce(worksheet, draft => {
        if (applyToAll) {
          applyGlobalPictoUpdate(
            draft,
            originalPictoUrl,
            newSelectedPictoUrl,
            newPictoUrls,
            originalDisplayedTerm,
            originalDisplayedTerm // Displayed term remains the same when only picto is changed from options
          );
        } else {
          const item = draft.sections[sectionIndex].items[itemIndex];
          item.selectedPictoUrl = newSelectedPictoUrl;
        }
      });
      onWorksheetChange(newWorksheet);
      setSelectingPicto(null);
    }
  };

  const handleMainPictoSelect = (selectedUrl: string, applyToAll: boolean) => {
    const originalPictoUrl = worksheet.selectedPictoUrl || '';
    const originalDisplayedTerm = worksheet.pictogramSearchTerm || '';

    const newPictoUrls = worksheet.pictoOptions || []; // Use existing options
    const newSelectedPictoUrl = selectedUrl;

    const newWorksheet = produce(worksheet, draft => {
      if (applyToAll) {
        applyGlobalPictoUpdate(
          draft,
          originalPictoUrl,
          newSelectedPictoUrl,
          newPictoUrls,
          originalDisplayedTerm,
          originalDisplayedTerm // Displayed term remains the same when only picto is changed from options
        );
      } else {
        draft.selectedPictoUrl = newSelectedPictoUrl;
      }
    });
    onWorksheetChange(newWorksheet);
    setSelectingMainPicto(false);
  };

  const currentItemForSearchTermEdit = editingSearchTerm ? worksheet.sections[editingSearchTerm.sectionIndex].items[editingSearchTerm.itemIndex] : null;
  const currentItemForPictoSelect = selectingPicto ? worksheet.sections[selectingPicto.sectionIndex].items[selectingPicto.itemIndex] : null;

  const renderWorksheetItem = (item: WorksheetItem, sectionIndex: number, itemIndex: number) => {
    const key = `${sectionIndex}-${itemIndex}`;
    switch (item.type) {
      case 'image':
        const hasMultipleOptions = item.pictoOptions && item.pictoOptions.length > 1;
        console.log('item.pictoOptions:', item.pictoOptions);
        console.log('hasMultipleOptions:', hasMultipleOptions);
        return (
          <div key={key} className="flex flex-col items-center">
            <button
              onClick={() => hasMultipleOptions && setSelectingPicto({ sectionIndex, itemIndex })}
              className={`relative flex flex-col items-center justify-center p-2 border-2 border-black rounded-lg h-32 w-32 bg-white group ${hasMultipleOptions ? 'cursor-pointer' : 'cursor-default'}`}
            >
              {item.selectedPictoUrl ? (
                <img
                  src={item.selectedPictoUrl}
                  alt={item.content}
                  className="max-h-20 max-w-20 object-contain"
                  loading="lazy"
                />
              ) : (
                <div
                  className="flex items-center justify-center text-center text-xs text-red-500 cursor-pointer p-2"
                  onClick={() => setEditingSearchTerm({ sectionIndex, itemIndex })} // Make it clickable to edit
                >
                  No se encontró el pictograma
                </div>
              )}
              <span className="text-sm text-center mt-2 font-mono text-gray-700 uppercase">{item.content}</span>
              {hasMultipleOptions && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                    <span className="text-white font-bold text-sm">Elegir</span>
                </div>
              )}
            </button>
            <button onClick={() => setEditingSearchTerm({ sectionIndex, itemIndex })} className="text-xs text-gray-500 hover:text-indigo-600 mt-1">Cambiar término</button>
          </div>
        );
       case 'traceable_text':
        return (
            <div key={key} className="flex items-center justify-center h-32 w-32 text-8xl font-bold text-gray-300" style={{ fontFamily: "'Comic Sans MS', cursive, sans-serif", border: "2px dashed #d1d5db", borderRadius: "0.5rem" }}>
            {item.content}
            </div>
        );
      default:
        return <div key={key} className="flex items-center justify-center h-32 w-32 text-4xl font-bold text-gray-700">{item.content}</div>;
    }
  };

  const hasMainPictoOptions = worksheet.pictoOptions && worksheet.pictoOptions.length > 1;

  return (
    <>
      {editingSearchTerm && (
        <ImageEditModal
          isOpen={!!editingSearchTerm}
          onClose={() => setEditingSearchTerm(null)}
          currentDisplayedTerm={currentItemForSearchTermEdit?.searchTerm || currentItemForSearchTermEdit?.content || ''}
          currentPictoSearchTerm={currentItemForSearchTermEdit?.searchTerm || currentItemForSearchTermEdit?.content || ''}
          onSave={handleSearchTermSave}
        />
      )}
      {editingMainPictoSearchTerm && ( // New modal for main pictogram
        <ImageEditModal
          isOpen={editingMainPictoSearchTerm}
          onClose={() => setEditingMainPictoSearchTerm(false)}
          currentDisplayedTerm={worksheet.pictogramSearchTerm}
          currentPictoSearchTerm={worksheet.pictogramSearchTerm}
          onSave={handleMainSearchTermSave}
        />
      )}
      {editingInstructionPicto && ( // New modal for instruction pictograms
        <ImageEditModal
          isOpen={!!editingInstructionPicto}
          onClose={() => setEditingInstructionPicto(null)}
          currentDisplayedTerm={currentInstructionPictoForEdit?.searchTerm || ''}
          currentPictoSearchTerm={currentInstructionPictoForEdit?.searchTerm || ''}
          onSave={handleInstructionPictoSearchTermSave}
        />
      )}
      {currentItemForPictoSelect && (
        <PictoSelectionModal
          isOpen={!!selectingPicto}
          onClose={() => setSelectingPicto(null)}
          pictoOptions={currentItemForPictoSelect.pictoOptions || []}
          onSelect={handlePictoSelect}
        />
      )}
       {selectingMainPicto && (
        <PictoSelectionModal
          isOpen={selectingMainPicto}
          onClose={() => setSelectingMainPicto(false)}
          pictoOptions={worksheet.pictoOptions || []}
          onSelect={handleMainPictoSelect}
        />
      )}
      <div className="p-6 border-4 border-black bg-slate-50 aspect-[210/297] w-full mx-auto" style={{ fontFamily: "'Comic Sans MS', cursive, sans-serif" }}>
        <header className="flex items-center justify-center gap-4 p-4 border-b-4 border-black mb-6">
          <button 
            onClick={() => hasMainPictoOptions && setSelectingMainPicto(true)}
            className={`h-16 w-16 flex items-center justify-center border-2 border-black relative group ${hasMainPictoOptions ? 'cursor-pointer' : 'cursor-default'}`}
          >
             {worksheet.selectedPictoUrl ? (
                <img src={worksheet.selectedPictoUrl} alt={worksheet.pictogramSearchTerm} className="max-h-12 max-w-12" />
              ) : (
                <div 
                  className="flex items-center justify-center text-center text-xs text-red-500 cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); setEditingMainPictoSearchTerm(true); }} // Make main picto placeholder clickable
                >
                  No encontrado
                </div>
              )}
             {hasMainPictoOptions && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white font-bold text-xs">Elegir</span>
                </div>
              )}
          </button>
          <h2 
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => handleTextChange(['title'], e.currentTarget.textContent || '')}
            className="text-4xl font-extrabold tracking-wider text-black uppercase outline-none focus:bg-yellow-200"
          >
            {worksheet.title}
          </h2>
        </header>
        
        <main className="space-y-4">
          {worksheet.sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="p-4 border-2 border-gray-300 rounded-lg bg-white">
                            <div className="text-center mb-6">
                              <h3
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => handleTextChange(['sections', sectionIndex, 'instruction', 'text'], e.currentTarget.textContent || '')}
                                className="font-bold text-2xl text-gray-600 uppercase tracking-widest outline-none focus:bg-yellow-200"
                              >
                                  {section.instruction.text}
                              </h3>
                              {section.instruction.pictograms && section.instruction.pictograms.length > 0 && (
                                <div className="flex justify-center gap-2 mt-2">
                                  {section.instruction.pictograms.map((picto, pictoIndex) => (
                                    <div key={pictoIndex} className="flex flex-col items-center">
                                      <button
                                        className="relative flex items-center justify-center p-1 border-2 border-transparent hover:border-indigo-500 rounded-lg h-16 w-16 group"
                                        onClick={() => setEditingInstructionPicto({ sectionIndex, pictoIndex })}
                                      >
                                        {picto.url ? (
                                          <img src={picto.url} alt={picto.content} className="max-h-12 max-w-12 object-contain" />
                                        ) : (
                                          <div className="flex items-center justify-center text-center text-xs text-red-500">
                                            No picto
                                          </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                                          <span className="text-white font-bold text-xs">Editar</span>
                                        </div>
                                      </button>
                                      <span className="text-xs text-gray-600 uppercase">{picto.content}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>              <div className="flex flex-row items-center justify-center gap-4 flex-wrap">
                {section.items.map((item, itemIndex) => renderWorksheetItem(item, sectionIndex, itemIndex))}
              </div>
            </div>
          ))}
        </main>
      </div>
    </>
  );
};