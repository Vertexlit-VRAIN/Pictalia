import React, { useEffect, useMemo, useState } from 'react';
import { produce } from 'immer';
import type { PictogramSearchResult, SavedWorksheet, WorksheetItem } from '../types';
import { searchPictograms } from '../services/pictogramService';

type EditableWorksheetProps = {
  worksheet: SavedWorksheet;
  onWorksheetChange: (newWorksheet: SavedWorksheet) => void;
};

type EditorTarget =
  | { type: 'main' }
  | { type: 'item'; sectionIndex: number; itemIndex: number }
  | { type: 'instruction'; sectionIndex: number; pictoIndex: number };

type PictogramEditorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  currentDisplayedTerm: string;
  currentSearchTerm: string;
  currentSelectedUrl?: string;
  currentPictoOptions?: string[];
  onSave: (payload: {
    displayedTerm: string;
    searchTerm: string;
    selectedUrl: string;
    pictoOptions: string[];
    applyToAll: boolean;
  }) => void;
};

const PictogramEditorModal: React.FC<PictogramEditorModalProps> = ({
  isOpen,
  onClose,
  title,
  currentDisplayedTerm,
  currentSearchTerm,
  currentSelectedUrl,
  currentPictoOptions,
  onSave,
}) => {
  const [displayedTerm, setDisplayedTerm] = useState(currentDisplayedTerm);
  const [searchTerm, setSearchTerm] = useState(currentSearchTerm);
  const [selectedUrl, setSelectedUrl] = useState(currentSelectedUrl || '');
  const [applyToAll, setApplyToAll] = useState(true);
  const [results, setResults] = useState<PictogramSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setDisplayedTerm(currentDisplayedTerm);
    setSearchTerm(currentSearchTerm);
    setSelectedUrl(currentSelectedUrl || '');
    setApplyToAll(true);
    setResults((currentPictoOptions || []).map((url, index) => ({ id: `${index}-${url}`, url })));
  }, [isOpen, currentDisplayedTerm, currentSearchTerm, currentSelectedUrl, currentPictoOptions]);

  useEffect(() => {
    if (!isOpen) return;

    const normalizedSearchTerm = (searchTerm || displayedTerm).trim();
    if (!normalizedSearchTerm) {
      setResults((currentPictoOptions || []).map((url, index) => ({ id: `${index}-${url}`, url })));
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);

    const timeoutId = window.setTimeout(async () => {
      try {
        const foundPictograms = await searchPictograms(normalizedSearchTerm);
        if (!cancelled) {
          setResults(foundPictograms);
          if (foundPictograms.length > 0) {
            const stillExists = foundPictograms.some(picto => picto.url === selectedUrl);
            if (!stillExists) {
              setSelectedUrl(foundPictograms[0].url);
            }
          } else {
            setSelectedUrl('');
          }
        }
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [isOpen, searchTerm, displayedTerm, currentPictoOptions, selectedUrl]);

  if (!isOpen) return null;

  const handleSave = () => {
    const finalDisplayedTerm = displayedTerm.trim();
    const finalSearchTerm = (searchTerm.trim() || finalDisplayedTerm);
    if (!finalDisplayedTerm) return;

    onSave({
      displayedTerm: finalDisplayedTerm,
      searchTerm: finalSearchTerm,
      selectedUrl,
      pictoOptions: results.map(result => result.url),
      applyToAll,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-500 mt-1">
          Cambia el texto y el término de búsqueda. Los pictogramas se actualizan automáticamente mientras escribes.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
          <div className="space-y-4">
            <div>
              <label htmlFor="displayedTerm" className="block text-sm font-medium text-gray-700 mb-1">Texto que aparece en la ficha</label>
              <input
                id="displayedTerm"
                type="text"
                value={displayedTerm}
                onChange={(e) => setDisplayedTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 mb-1">Término para buscar pictogramas</label>
              <input
                id="searchTerm"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ej: relacionar, manzana, rojo"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={applyToAll}
                onChange={(e) => setApplyToAll(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              Aplicar a todas las instancias equivalentes
            </label>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Selección actual</p>
              <div className="h-28 rounded-lg border-2 border-dashed border-gray-300 bg-white flex items-center justify-center">
                {selectedUrl ? (
                  <img src={selectedUrl} alt={displayedTerm} className="max-h-24 max-w-24 object-contain" />
                ) : (
                  <span className="text-xs text-gray-500 text-center px-4">Sin pictograma seleccionado. Puedes guardar así o elegir uno cuando aparezca.</span>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Resultados</p>
              {isSearching && <span className="text-xs text-gray-500">Buscando...</span>}
            </div>
            {results.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[420px] overflow-y-auto pr-1">
                {results.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => setSelectedUrl(result.url)}
                    className={`p-2 rounded-lg border-2 transition-colors bg-white ${selectedUrl === result.url ? 'border-indigo-600' : 'border-gray-200 hover:border-indigo-300'}`}
                  >
                    <img src={result.url} alt={displayedTerm} className="w-full h-20 object-contain" loading="lazy" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="h-56 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-center text-sm text-gray-500 px-6">
                No se ha encontrado ningún pictograma para ese término. Puedes cambiarlo y seguir buscando desde aquí.
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300">Cancelar</button>
          <button onClick={handleSave} disabled={!displayedTerm.trim()} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

const PlaceholderPicto: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center justify-center text-center text-xs text-red-500 px-2">
    {label}
  </div>
);

const getFallbackDisplayTerm = (item: WorksheetItem): string => item.searchTerm || item.content || '';

export const EditableWorksheetDisplay: React.FC<EditableWorksheetProps> = ({ worksheet, onWorksheetChange }) => {
  const [editorTarget, setEditorTarget] = useState<EditorTarget | null>(null);

  const handleTextChange = (path: (string | number)[], value: string) => {
    const newWorksheet = produce(worksheet, draft => {
      let current: any = draft;
      path.slice(0, -1).forEach(p => { current = current[p]; });
      current[path[path.length - 1]] = value;
    });
    onWorksheetChange(newWorksheet);
  };

  const applyGlobalPictoUpdate = (
    draft: SavedWorksheet,
    oldPictoUrl: string,
    newPictoUrl: string,
    newPictoOptions: string[],
    oldDisplayedTerm: string,
    newDisplayedTerm: string,
    newSearchTerm: string
  ) => {
    if (draft.selectedPictoUrl === oldPictoUrl && draft.pictogramSearchTerm === oldDisplayedTerm) {
      draft.selectedPictoUrl = newPictoUrl;
      draft.pictoOptions = newPictoOptions;
      draft.pictogramSearchTerm = newDisplayedTerm;
    }

    draft.sections.forEach(section => {
      section.instruction.pictograms?.forEach(picto => {
        if (picto.url === oldPictoUrl && (picto.searchTerm === oldDisplayedTerm || picto.content === oldDisplayedTerm)) {
          picto.url = newPictoUrl;
          picto.searchTerm = newSearchTerm;
          picto.content = newDisplayedTerm;
        }
      });

      section.items.forEach(item => {
        if (item.type === 'image' && item.selectedPictoUrl === oldPictoUrl && (item.searchTerm === oldDisplayedTerm || item.content === oldDisplayedTerm)) {
          item.selectedPictoUrl = newPictoUrl;
          item.pictoOptions = newPictoOptions;
          item.searchTerm = newSearchTerm;
          item.content = newDisplayedTerm;
        }
      });
    });
  };

  const handleSavePictogramEdit = ({
    displayedTerm,
    searchTerm,
    selectedUrl,
    pictoOptions,
    applyToAll,
  }: {
    displayedTerm: string;
    searchTerm: string;
    selectedUrl: string;
    pictoOptions: string[];
    applyToAll: boolean;
  }) => {
    if (!editorTarget) return;

    const newWorksheet = produce(worksheet, draft => {
      if (editorTarget.type === 'main') {
        const originalPictoUrl = draft.selectedPictoUrl || '';
        const originalDisplayedTerm = draft.pictogramSearchTerm || '';

        draft.pictogramSearchTerm = displayedTerm;
        draft.selectedPictoUrl = selectedUrl;
        draft.pictoOptions = pictoOptions;

        if (applyToAll) {
          applyGlobalPictoUpdate(draft, originalPictoUrl, selectedUrl, pictoOptions, originalDisplayedTerm, displayedTerm, searchTerm);
        }
        return;
      }

      if (editorTarget.type === 'instruction') {
        const instructionPicto = draft.sections[editorTarget.sectionIndex].instruction.pictograms?.[editorTarget.pictoIndex];
        if (!instructionPicto) return;

        const originalPictoUrl = instructionPicto.url || '';
        const originalDisplayedTerm = instructionPicto.searchTerm || instructionPicto.content || '';

        instructionPicto.content = displayedTerm;
        instructionPicto.searchTerm = searchTerm;
        instructionPicto.url = selectedUrl;

        if (applyToAll) {
          applyGlobalPictoUpdate(draft, originalPictoUrl, selectedUrl, pictoOptions, originalDisplayedTerm, displayedTerm, searchTerm);
        }
        return;
      }

      const item = draft.sections[editorTarget.sectionIndex].items[editorTarget.itemIndex];
      if (item.type !== 'image') return;

      const originalPictoUrl = item.selectedPictoUrl || '';
      const originalDisplayedTerm = item.searchTerm || item.content || '';

      item.content = displayedTerm;
      item.searchTerm = searchTerm;
      item.selectedPictoUrl = selectedUrl;
      item.pictoOptions = pictoOptions;

      if (applyToAll) {
        applyGlobalPictoUpdate(draft, originalPictoUrl, selectedUrl, pictoOptions, originalDisplayedTerm, displayedTerm, searchTerm);
      }
    });

    onWorksheetChange(newWorksheet);
    setEditorTarget(null);
  };

  const currentEditorState = useMemo(() => {
    if (!editorTarget) return null;

    if (editorTarget.type === 'main') {
      return {
        title: 'Editar pictograma principal',
        displayedTerm: worksheet.pictogramSearchTerm || '',
        searchTerm: worksheet.pictogramSearchTerm || '',
        selectedUrl: worksheet.selectedPictoUrl || '',
        pictoOptions: worksheet.pictoOptions || [],
      };
    }

    if (editorTarget.type === 'instruction') {
      const picto = worksheet.sections[editorTarget.sectionIndex].instruction.pictograms?.[editorTarget.pictoIndex];
      return {
        title: 'Editar pictograma del enunciado',
        displayedTerm: picto?.content || '',
        searchTerm: picto?.searchTerm || picto?.content || '',
        selectedUrl: picto?.url || '',
        pictoOptions: picto?.url ? [picto.url] : [],
      };
    }

    const item = worksheet.sections[editorTarget.sectionIndex].items[editorTarget.itemIndex];
    if (item.type !== 'image') return null;

    return {
      title: 'Editar pictograma del ejercicio',
      displayedTerm: item.content || '',
      searchTerm: getFallbackDisplayTerm(item),
      selectedUrl: item.selectedPictoUrl || '',
      pictoOptions: item.pictoOptions || [],
    };
  }, [editorTarget, worksheet]);

  const renderWorksheetItem = (item: WorksheetItem, sectionIndex: number, itemIndex: number) => {
    const key = `${sectionIndex}-${itemIndex}`;

    if (item.type === 'image') {
      return (
        <div key={key} className="flex flex-col items-center">
          <button
            onClick={() => setEditorTarget({ type: 'item', sectionIndex, itemIndex })}
            className="relative flex flex-col items-center justify-center p-2 border-2 border-black rounded-lg h-32 w-32 bg-white group cursor-pointer"
          >
            <div className="flex-1 flex items-center justify-center w-full">
              {item.selectedPictoUrl ? (
                <img src={item.selectedPictoUrl} alt={item.content} className="max-h-20 max-w-20 object-contain" loading="lazy" />
              ) : (
                <PlaceholderPicto label="Sin pictograma" />
              )}
            </div>
            <span className="text-sm text-center mt-2 font-mono text-gray-700 uppercase">{item.content}</span>
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
              <span className="text-white font-bold text-sm">Editar</span>
            </div>
          </button>
        </div>
      );
    }

    if (item.type === 'traceable_text') {
      return (
        <div key={key} className="flex items-center justify-center h-32 w-32 text-8xl font-bold text-gray-300" style={{ fontFamily: "'Comic Sans MS', cursive, sans-serif", border: '2px dashed #d1d5db', borderRadius: '0.5rem' }}>
          {item.content}
        </div>
      );
    }

    return <div key={key} className="flex items-center justify-center h-32 w-32 text-4xl font-bold text-gray-700">{item.content}</div>;
  };

  return (
    <>
      {currentEditorState && (
        <PictogramEditorModal
          isOpen={Boolean(editorTarget)}
          onClose={() => setEditorTarget(null)}
          title={currentEditorState.title}
          currentDisplayedTerm={currentEditorState.displayedTerm}
          currentSearchTerm={currentEditorState.searchTerm}
          currentSelectedUrl={currentEditorState.selectedUrl}
          currentPictoOptions={currentEditorState.pictoOptions}
          onSave={handleSavePictogramEdit}
        />
      )}

      <div className="p-6 border-4 border-black bg-slate-50 aspect-[210/297] w-full mx-auto" style={{ fontFamily: "'Comic Sans MS', cursive, sans-serif" }}>
        <header className="flex items-center justify-center gap-4 p-4 border-b-4 border-black mb-6">
          <button onClick={() => setEditorTarget({ type: 'main' })} className="h-16 w-16 flex items-center justify-center border-2 border-black relative group cursor-pointer bg-white">
            {worksheet.selectedPictoUrl ? (
              <img src={worksheet.selectedPictoUrl} alt={worksheet.pictogramSearchTerm} className="max-h-12 max-w-12" />
            ) : (
              <PlaceholderPicto label="Sin pictograma" />
            )}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white font-bold text-xs">Editar</span>
            </div>
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
                          className="relative flex items-center justify-center p-1 border-2 border-gray-200 hover:border-indigo-500 rounded-lg h-16 w-16 group bg-white"
                          onClick={() => setEditorTarget({ type: 'instruction', sectionIndex, pictoIndex })}
                        >
                          {picto.url ? (
                            <img src={picto.url} alt={picto.content} className="max-h-12 max-w-12 object-contain" />
                          ) : (
                            <PlaceholderPicto label="Sin pictograma" />
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
              </div>

              <div className="flex flex-row items-center justify-center gap-4 flex-wrap">
                {section.items.map((item, itemIndex) => renderWorksheetItem(item, sectionIndex, itemIndex))}
              </div>
            </div>
          ))}
        </main>
      </div>
    </>
  );
};
