import React, { useEffect, useMemo, useState } from 'react';
import { produce } from 'immer';
import type { ExerciseType, PictogramSearchResult, SavedWorksheet, WorksheetItem, WorksheetSection } from '../types';
import { searchPictograms } from '../services/pictogramService';
import { normalizeWorksheet, normalizeWorksheetSection } from '../services/worksheetNormalizer';

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
  helperText?: string;
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

const EXERCISE_TYPE_OPTIONS: { value: ExerciseType; label: string; addLabel: string }[] = [
  { value: 'repasar', label: 'Repasar', addLabel: 'Añadir trazo' },
  { value: 'unir', label: 'Unir', addLabel: 'Añadir pareja' },
  { value: 'rodear', label: 'Rodear', addLabel: 'Añadir pictograma' },
  { value: 'copiar', label: 'Copiar', addLabel: 'Añadir copia' },
];

const PictogramEditorModal: React.FC<PictogramEditorModalProps> = ({
  isOpen,
  onClose,
  title,
  helperText,
  currentDisplayedTerm,
  currentSearchTerm,
  currentSelectedUrl,
  currentPictoOptions,
  onSave,
}) => {
  const [displayedTerm, setDisplayedTerm] = useState(currentDisplayedTerm);
  const [searchTerm, setSearchTerm] = useState(currentSearchTerm);
  const [selectedUrl, setSelectedUrl] = useState(currentSelectedUrl || '');
  const [hidePictogram, setHidePictogram] = useState(false);
  const [applyToAll, setApplyToAll] = useState(true);
  const [results, setResults] = useState<PictogramSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setDisplayedTerm(currentDisplayedTerm);
    setSearchTerm(currentSearchTerm);
    setSelectedUrl(currentSelectedUrl || '');
    setHidePictogram(!currentSelectedUrl);
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
            if (!stillExists && !hidePictogram) {
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
  }, [isOpen, searchTerm, displayedTerm, currentPictoOptions, selectedUrl, hidePictogram]);

  if (!isOpen) return null;

  const handleSave = () => {
    const finalDisplayedTerm = displayedTerm.trim();
    const finalSearchTerm = searchTerm.trim() || finalDisplayedTerm;
    if (!finalDisplayedTerm) return;

    onSave({
      displayedTerm: finalDisplayedTerm,
      searchTerm: finalSearchTerm,
      selectedUrl: hidePictogram ? '' : selectedUrl,
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
          {helperText || 'Cambia el texto, la búsqueda y el pictograma sin salir del editor.'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
          <div className="space-y-4">
            <div>
              <label htmlFor="displayedTerm" className="block text-sm font-medium text-gray-700 mb-1">Texto visible</label>
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
              <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 mb-1">Búsqueda de pictograma</label>
              <input
                id="searchTerm"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ej: unir, perro, rojo"
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
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={hidePictogram}
                onChange={(e) => {
                  const nextChecked = e.target.checked;
                  setHidePictogram(nextChecked);
                  if (nextChecked) {
                    setSelectedUrl('');
                  } else if (results.length > 0) {
                    setSelectedUrl(results[0].url);
                  }
                }}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              No mostrar pictograma
            </label>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Selección actual</p>
              <div className="h-28 rounded-lg border-2 border-dashed border-gray-300 bg-white flex items-center justify-center">
                {hidePictogram ? (
                  <span className="text-sm font-semibold text-gray-600 text-center px-4">Solo texto</span>
                ) : selectedUrl ? (
                  <img src={selectedUrl} alt={displayedTerm} className="max-h-24 max-w-24 object-contain" />
                ) : (
                  <span className="text-xs text-gray-500 text-center px-4">Sin pictograma seleccionado.</span>
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
                    onClick={() => {
                      setHidePictogram(false);
                      setSelectedUrl(result.url);
                    }}
                    className={`p-2 rounded-lg border-2 transition-colors bg-white ${!hidePictogram && selectedUrl === result.url ? 'border-indigo-600' : 'border-gray-200 hover:border-indigo-300'}`}
                  >
                    <img src={result.url} alt={displayedTerm} className="w-full h-20 object-contain" loading="lazy" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="h-56 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-center text-sm text-gray-500 px-6">
                No se ha encontrado ningún pictograma.
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

const createImageItem = (content: string): WorksheetItem => ({
  type: 'image',
  content,
  searchTerm: content.toLowerCase(),
  selectedPictoUrl: '',
  pictoOptions: [],
});

const createTraceableItem = (content: string): WorksheetItem => ({
  type: 'traceable_text',
  content,
});

const createInstructionPicto = (content: string) => ({
  content,
  searchTerm: content.toLowerCase(),
  url: '',
});

const createInstructionText = (content: string) => ({
  content,
  searchTerm: '',
  url: '',
});

const getSectionItems = (section: WorksheetSection): WorksheetItem[] => section.items || [];

const getExerciseTypeLabel = (exerciseType: ExerciseType): string =>
  EXERCISE_TYPE_OPTIONS.find(option => option.value === exerciseType)?.label || exerciseType;

const moveItemInArray = <T,>(items: T[], fromIndex: number, toIndex: number) => {
  if (toIndex < 0 || toIndex >= items.length || fromIndex === toIndex) {
    return;
  }

  const [movedItem] = items.splice(fromIndex, 1);
  items.splice(toIndex, 0, movedItem);
};

export const EditableWorksheetDisplay: React.FC<EditableWorksheetProps> = ({ worksheet, onWorksheetChange }) => {
  const [editorTarget, setEditorTarget] = useState<EditorTarget | null>(null);

  const updateWorksheet = (recipe: (draft: SavedWorksheet) => void) => {
    const nextWorksheet = produce(worksheet, draft => {
      recipe(draft);
      draft.sections.forEach(section => {
        section.exercise = undefined;
      });
    });
    onWorksheetChange(normalizeWorksheet(nextWorksheet));
  };

  const handleTextChange = (path: (string | number)[], value: string) => {
    updateWorksheet(draft => {
      let current: any = draft;
      path.slice(0, -1).forEach(segment => {
        current = current[segment];
      });
      current[path[path.length - 1]] = value;
    });
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

      (section.items || []).forEach(item => {
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

    updateWorksheet(draft => {
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

      const item = draft.sections[editorTarget.sectionIndex].items?.[editorTarget.itemIndex];
      if (!item || item.type === 'traceable_text' || item.type === 'empty_box') return;

      const originalPictoUrl = item.selectedPictoUrl || '';
      const originalDisplayedTerm = item.searchTerm || item.content || '';

      item.type = 'image';
      item.content = displayedTerm;
      item.searchTerm = searchTerm;
      item.selectedPictoUrl = selectedUrl;
      item.pictoOptions = pictoOptions;

      if (applyToAll) {
        applyGlobalPictoUpdate(draft, originalPictoUrl, selectedUrl, pictoOptions, originalDisplayedTerm, displayedTerm, searchTerm);
      }
    });

    setEditorTarget(null);
  };

  const handleExerciseTypeChange = (sectionIndex: number, exerciseType: ExerciseType) => {
    updateWorksheet(draft => {
      const currentSection = draft.sections[sectionIndex];
      draft.sections[sectionIndex] = normalizeWorksheetSection({
        ...currentSection,
        exerciseType,
        exercise: undefined,
        items: undefined,
        layout: undefined,
        instruction: {
          text: exerciseType.toUpperCase(),
          pictograms: undefined,
        },
      });
    });
  };

  const handleAddSection = (exerciseType: ExerciseType) => {
    updateWorksheet(draft => {
      draft.sections.push(normalizeWorksheetSection({ exerciseType }));
    });
  };

  const handleRemoveSection = (sectionIndex: number) => {
    updateWorksheet(draft => {
      draft.sections.splice(sectionIndex, 1);
    });
  };

  const handleAddInstructionPicto = (sectionIndex: number) => {
    updateWorksheet(draft => {
      const pictograms = draft.sections[sectionIndex].instruction.pictograms || (draft.sections[sectionIndex].instruction.pictograms = []);
      pictograms.push(createInstructionPicto('nuevo'));
    });
  };

  const handleAddInstructionText = (sectionIndex: number) => {
    updateWorksheet(draft => {
      const pictograms = draft.sections[sectionIndex].instruction.pictograms || (draft.sections[sectionIndex].instruction.pictograms = []);
      pictograms.push(createInstructionText('texto'));
    });
  };

  const handleRemoveInstructionPicto = (sectionIndex: number, pictoIndex: number) => {
    updateWorksheet(draft => {
      const pictograms = draft.sections[sectionIndex].instruction.pictograms;
      if (!pictograms || pictograms.length <= 1) return;
      pictograms.splice(pictoIndex, 1);
    });
  };

  const handleMoveInstructionPicto = (sectionIndex: number, pictoIndex: number, direction: -1 | 1) => {
    updateWorksheet(draft => {
      const pictograms = draft.sections[sectionIndex].instruction.pictograms;
      if (!pictograms) return;
      moveItemInArray(pictograms, pictoIndex, pictoIndex + direction);
    });
  };

  const handleAddItem = (sectionIndex: number) => {
    updateWorksheet(draft => {
      const section = draft.sections[sectionIndex];
      const items = section.items || (section.items = []);
      const exerciseType = section.exerciseType || 'rodear';

      if (exerciseType === 'unir') {
        const nextPairNumber = items.length / 2 + 1;
        const midpoint = items.length / 2;
        items.splice(midpoint, 0, createImageItem(`opcion ${nextPairNumber}`));
        items.push(createImageItem(`opcion ${nextPairNumber}`));
        return;
      }

      if (exerciseType === 'copiar') {
        const modelContent = items[0]?.content || 'A';
        items.push(createTraceableItem(modelContent));
        return;
      }

      if (exerciseType === 'repasar') {
        items.push(createTraceableItem('A'));
        return;
      }

      items.push(createImageItem(`opcion ${items.length + 1}`));
    });
  };

  const handleAddPictogramItem = (sectionIndex: number) => {
    updateWorksheet(draft => {
      const section = draft.sections[sectionIndex];
      const items = section.items || (section.items = []);
      const exerciseType = section.exerciseType || 'rodear';

      if (exerciseType === 'unir') {
        const nextPairNumber = items.length / 2 + 1;
        const midpoint = items.length / 2;
        items.splice(midpoint, 0, createImageItem(`pictograma ${nextPairNumber}`));
        items.push(createImageItem(`pictograma ${nextPairNumber}`));
        return;
      }

      items.push(createImageItem(`pictograma ${items.length + 1}`));
    });
  };

  const handleRemoveItem = (sectionIndex: number, itemIndex: number) => {
    updateWorksheet(draft => {
      const section = draft.sections[sectionIndex];
      const items = section.items || [];
      const exerciseType = section.exerciseType || 'rodear';

      if (exerciseType === 'unir') {
        if (items.length <= 4) return;
        const pairCount = items.length / 2;
        const pairIndex = itemIndex < pairCount ? itemIndex : itemIndex - pairCount;
        items.splice(pairCount + pairIndex, 1);
        items.splice(pairIndex, 1);
        return;
      }

      const minimumItems = exerciseType === 'copiar' ? 2 : exerciseType === 'repasar' ? 1 : 2;
      if (items.length <= minimumItems) return;
      items.splice(itemIndex, 1);
    });
  };

  const handleMoveItem = (sectionIndex: number, itemIndex: number, direction: -1 | 1) => {
    updateWorksheet(draft => {
      const section = draft.sections[sectionIndex];
      const items = section.items || [];
      const exerciseType = section.exerciseType || 'rodear';

      if (exerciseType === 'unir') {
        const pairCount = items.length / 2;
        const pairIndex = itemIndex < pairCount ? itemIndex : itemIndex - pairCount;
        const targetPairIndex = pairIndex + direction;
        if (targetPairIndex < 0 || targetPairIndex >= pairCount) return;

        const leftItems = items.slice(0, pairCount);
        const rightItems = items.slice(pairCount);
        moveItemInArray(leftItems, pairIndex, targetPairIndex);
        moveItemInArray(rightItems, pairIndex, targetPairIndex);
        section.items = [...leftItems, ...rightItems];
        return;
      }

      moveItemInArray(items, itemIndex, itemIndex + direction);
    });
  };

  const handleItemTextChange = (sectionIndex: number, itemIndex: number, value: string) => {
    handleTextChange(['sections', sectionIndex, 'items', itemIndex, 'content'], value);
  };

  const handleItemSearchTermChange = (sectionIndex: number, itemIndex: number, value: string) => {
    handleTextChange(['sections', sectionIndex, 'items', itemIndex, 'searchTerm'], value);
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
      const isTextOnly = !picto?.url && !(picto?.searchTerm || '').trim();
      return {
        title: isTextOnly ? 'Editar texto del enunciado' : 'Editar pictograma del enunciado',
        helperText: isTextOnly
          ? 'Puedes usar este bloque como texto de apoyo en el enunciado. El pictograma es opcional.'
          : 'Cambia el texto, la búsqueda y el pictograma del enunciado.',
        displayedTerm: picto?.content || '',
        searchTerm: picto?.searchTerm || picto?.content || '',
        selectedUrl: picto?.url || '',
        pictoOptions: picto?.url ? [picto.url] : [],
      };
    }

    const item = worksheet.sections[editorTarget.sectionIndex].items?.[editorTarget.itemIndex];
    if (!item || item.type === 'traceable_text' || item.type === 'empty_box') return null;

    return {
      title: 'Editar elemento del ejercicio',
      helperText: 'Todos estos elementos se editan igual. Si no seleccionas pictograma, se mostrará solo el texto.',
      displayedTerm: item.content || '',
      searchTerm: item.searchTerm || '',
      selectedUrl: item.selectedPictoUrl || '',
      pictoOptions: item.pictoOptions || [],
    };
  }, [editorTarget, worksheet]);

  const renderWorksheetItem = (
    item: WorksheetItem,
    sectionIndex: number,
    itemIndex: number,
    section: WorksheetSection,
    options?: {
      title?: string;
      description?: string;
      hideMoveButtons?: boolean;
      moveBackDisabled?: boolean;
      moveForwardDisabled?: boolean;
    }
  ) => {
    const key = `${sectionIndex}-${itemIndex}`;
    const exerciseType = section.exerciseType || 'rodear';
    const addLabel = EXERCISE_TYPE_OPTIONS.find(option => option.value === exerciseType)?.addLabel || 'Añadir elemento';
    const itemCount = getSectionItems(section).length;
    const pairCount = exerciseType === 'unir' ? itemCount / 2 : 0;
    const pairIndex = exerciseType === 'unir' ? (itemIndex < pairCount ? itemIndex : itemIndex - pairCount) : itemIndex;
    const canMoveBack = exerciseType === 'unir' ? pairIndex > 0 : itemIndex > 0;
    const canMoveForward = exerciseType === 'unir' ? pairIndex < pairCount - 1 : itemIndex < itemCount - 1;
    const disableRemove = exerciseType === 'unir'
      ? itemCount <= 4
      : exerciseType === 'copiar'
        ? itemCount <= 2
        : exerciseType === 'repasar'
          ? itemCount <= 1
          : itemCount <= 2;

    return (
      <div key={key} className="w-full max-w-[220px] rounded-xl border border-gray-200 bg-gray-50 p-3">
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            {options?.title || (exerciseType === 'unir' ? `Pareja ${pairIndex + 1}` : `${getExerciseTypeLabel(exerciseType)} ${itemIndex + 1}`)}
          </span>
          <div className="flex items-center gap-1">
            {!options?.hideMoveButtons && (
              <>
                <button
                  type="button"
                  onClick={() => handleMoveItem(sectionIndex, itemIndex, -1)}
                  disabled={options?.moveBackDisabled ?? !canMoveBack}
                  className="rounded-md bg-gray-200 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveItem(sectionIndex, itemIndex, 1)}
                  disabled={options?.moveForwardDisabled ?? !canMoveForward}
                  className="rounded-md bg-gray-200 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  →
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => handleRemoveItem(sectionIndex, itemIndex)}
              disabled={disableRemove}
              className="rounded-md bg-red-100 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Quitar
            </button>
          </div>
        </div>

        {item.type !== 'traceable_text' && item.type !== 'empty_box' ? (
          <>
            <button
              onClick={() => setEditorTarget({ type: 'item', sectionIndex, itemIndex })}
              className="relative flex h-32 w-full items-center justify-center rounded-lg border-2 border-black bg-white group"
            >
              {item.selectedPictoUrl ? (
                <img src={item.selectedPictoUrl} alt={item.content} className="max-h-20 max-w-20 object-contain" loading="lazy" />
              ) : (
                <span className="px-3 text-center text-3xl font-bold text-gray-700">{item.content || 'Texto'}</span>
              )}
              <div className="absolute inset-0 rounded-md bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center">
                <span className="text-sm font-bold text-white">Editar elemento</span>
              </div>
            </button>
            <div className="mt-3 space-y-2">
              <input
                type="text"
                value={item.content}
                onChange={(e) => handleItemTextChange(sectionIndex, itemIndex, e.target.value)}
                placeholder="Texto"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={item.searchTerm || ''}
                onChange={(e) => handleItemSearchTermChange(sectionIndex, itemIndex, e.target.value)}
                placeholder="Búsqueda de pictograma opcional"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </>
        ) : (
          <>
            <div className="flex h-32 w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white">
              <span className={`font-bold ${item.type === 'traceable_text' ? 'text-7xl text-gray-300' : 'text-4xl text-gray-700'}`}>
                {item.content || '...'}
              </span>
            </div>
            <input
              type="text"
              value={item.content}
              onChange={(e) => handleItemTextChange(sectionIndex, itemIndex, e.target.value)}
              placeholder="Texto"
              className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </>
        )}

        <p className="mt-3 text-[11px] text-gray-500">{options?.description || addLabel}</p>
      </div>
    );
  };

  const renderRepasarEditor = (section: WorksheetSection, sectionIndex: number) => (
    <div className="space-y-4">
      <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900">
        El profesor prepara trazos simples y repetitivos. Conviene usar pocas unidades visuales y letras claras.
      </div>
      <div className="flex flex-wrap gap-3">
        {getSectionItems(section).map((item, itemIndex) =>
          renderWorksheetItem(item, sectionIndex, itemIndex, section, {
            title: `Trazo ${itemIndex + 1}`,
            description: 'Modelo sencillo para repasar.',
          })
        )}
      </div>
    </div>
  );

  const renderCopiarEditor = (section: WorksheetSection, sectionIndex: number) => {
    const items = getSectionItems(section);
    const model = items[0];
    const copies = items.slice(1);

    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-sky-50 border border-sky-200 px-4 py-3 text-sm text-sky-900">
          El alumno ve un modelo arriba y varias repeticiones debajo. Mantén el patrón muy estable.
        </div>
        {model && (
          <div>
            <p className="mb-2 text-sm font-semibold text-gray-700">Modelo</p>
            {renderWorksheetItem(model, sectionIndex, 0, section, {
              title: 'Modelo',
              description: 'Referencia visual principal.',
              hideMoveButtons: true,
            })}
          </div>
        )}
        <div>
          <p className="mb-2 text-sm font-semibold text-gray-700">Copias</p>
          <div className="flex flex-wrap gap-3">
            {copies.map((item, index) =>
              renderWorksheetItem(item, sectionIndex, index + 1, section, {
                title: `Copia ${index + 1}`,
                description: 'Espacio de repetición.',
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderRodearEditor = (section: WorksheetSection, sectionIndex: number) => (
    <div className="space-y-4">
      <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-900">
        Presenta pocas opciones, muy diferenciadas y visualmente limpias para facilitar la discriminación.
      </div>
      <div className="flex flex-wrap gap-3">
        {getSectionItems(section).map((item, itemIndex) =>
          renderWorksheetItem(item, sectionIndex, itemIndex, section, {
            title: `Opción ${itemIndex + 1}`,
            description: 'Pictograma para rodear o señalar.',
          })
        )}
      </div>
    </div>
  );

  const renderUnirEditor = (section: WorksheetSection, sectionIndex: number) => {
    const items = getSectionItems(section);
    const pairCount = items.length / 2;
    const leftItems = items.slice(0, pairCount);
    const rightItems = items.slice(pairCount);

    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-violet-50 border border-violet-200 px-4 py-3 text-sm text-violet-900">
          Trabaja asociaciones claras de uno a uno. Cada pareja debe tener relación evidente y pocas distracciones.
        </div>
        <div className="space-y-3">
          {leftItems.map((leftItem, pairIndex) => (
            <div key={pairIndex} className="rounded-xl border border-violet-200 bg-violet-50/40 p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-violet-900">Pareja {pairIndex + 1}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleMoveItem(sectionIndex, pairIndex, -1)}
                    disabled={pairIndex === 0}
                    className="rounded-md bg-gray-200 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveItem(sectionIndex, pairIndex, 1)}
                    disabled={pairIndex === pairCount - 1}
                    className="rounded-md bg-gray-200 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    →
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(sectionIndex, pairIndex)}
                    disabled={items.length <= 4}
                    className="rounded-md bg-red-100 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Quitar pareja
                  </button>
                </div>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                {renderWorksheetItem(leftItem, sectionIndex, pairIndex, section, {
                  title: 'Columna izquierda',
                  description: 'Primer elemento de la asociación.',
                  hideMoveButtons: true,
                })}
                {renderWorksheetItem(rightItems[pairIndex], sectionIndex, pairIndex + pairCount, section, {
                  title: 'Columna derecha',
                  description: 'Segundo elemento de la asociación.',
                  hideMoveButtons: true,
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderExerciseEditor = (section: WorksheetSection, sectionIndex: number) => {
    switch (section.exerciseType) {
      case 'repasar':
        return renderRepasarEditor(section, sectionIndex);
      case 'unir':
        return renderUnirEditor(section, sectionIndex);
      case 'copiar':
        return renderCopiarEditor(section, sectionIndex);
      case 'rodear':
      default:
        return renderRodearEditor(section, sectionIndex);
    }
  };

  return (
    <>
      {currentEditorState && (
        <PictogramEditorModal
          isOpen={Boolean(editorTarget)}
          onClose={() => setEditorTarget(null)}
          title={currentEditorState.title}
          helperText={currentEditorState.helperText}
          currentDisplayedTerm={currentEditorState.displayedTerm}
          currentSearchTerm={currentEditorState.searchTerm}
          currentSelectedUrl={currentEditorState.selectedUrl}
          currentPictoOptions={currentEditorState.pictoOptions}
          onSave={handleSavePictogramEdit}
        />
      )}

      <div className="space-y-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="grid gap-4 md:grid-cols-[80px_minmax(0,1fr)] md:items-center">
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
            <input
              type="text"
              value={worksheet.title}
              onChange={(e) => handleTextChange(['title'], e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-2xl font-extrabold uppercase tracking-wider text-black"
            />
          </div>
        </div>

        {worksheet.sections.map((section, sectionIndex) => {
          const exerciseType = section.exerciseType || 'rodear';
          const addLabel = EXERCISE_TYPE_OPTIONS.find(option => option.value === exerciseType)?.addLabel || 'Añadir elemento';
          const instructionPictograms = section.instruction.pictograms || [];

          return (
            <div key={sectionIndex} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1 space-y-3">
                  <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
                    <select
                      value={exerciseType}
                      onChange={(e) => handleExerciseTypeChange(sectionIndex, e.target.value as ExerciseType)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold"
                    >
                      {EXERCISE_TYPE_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={section.instruction.text}
                      onChange={(e) => handleTextChange(['sections', sectionIndex, 'instruction', 'text'], e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-lg font-bold uppercase tracking-wide text-gray-700"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {instructionPictograms.map((picto, pictoIndex) => (
                      <div key={pictoIndex} className="flex flex-col items-center rounded-lg border border-gray-200 bg-gray-50 p-2">
                        <div className="mb-2 flex items-center gap-1 self-end">
                          <button
                            type="button"
                            onClick={() => handleMoveInstructionPicto(sectionIndex, pictoIndex, -1)}
                            disabled={pictoIndex === 0}
                            className="rounded-md bg-gray-200 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            ←
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveInstructionPicto(sectionIndex, pictoIndex, 1)}
                            disabled={pictoIndex === instructionPictograms.length - 1}
                            className="rounded-md bg-gray-200 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            →
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveInstructionPicto(sectionIndex, pictoIndex)}
                            disabled={instructionPictograms.length <= 1}
                            className="rounded-md bg-red-100 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Quitar
                          </button>
                        </div>
                        
                        <button
                          className="relative flex items-center justify-center p-1 border-2 border-gray-200 hover:border-indigo-500 rounded-lg h-16 w-16 group bg-white"
                          onClick={() => setEditorTarget({ type: 'instruction', sectionIndex, pictoIndex })}
                        >
                          {picto.url ? (
                            <img src={picto.url} alt={picto.content} className="max-h-12 max-w-12 object-contain" />
                          ) : picto.searchTerm ? (
                            <PlaceholderPicto label="Sin pictograma" />
                          ) : (
                            <span className="px-2 text-center text-xs font-semibold text-gray-600 uppercase">{picto.content}</span>
                          )}
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                            <span className="text-white font-bold text-xs">Editar</span>
                          </div>
                        </button>
                        <span className="mt-2 text-xs font-semibold uppercase text-gray-600">{picto.content}</span>
                      </div>
                    ))}
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => handleAddInstructionPicto(sectionIndex)}
                        className="flex h-[58px] w-[124px] flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 text-sm font-semibold text-gray-600 hover:border-indigo-500 hover:text-indigo-600"
                      >
                        Añadir pictograma
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddInstructionText(sectionIndex)}
                        className="flex h-[58px] w-[124px] flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white px-3 text-sm font-semibold text-gray-600 hover:border-indigo-500 hover:text-indigo-600"
                      >
                        Añadir texto
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {exerciseType !== 'rodear' && exerciseType !== 'unir' && (
                    <button
                      type="button"
                      onClick={() => handleAddItem(sectionIndex)}
                      className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                      {addLabel}
                    </button>
                  )}
                  {(exerciseType === 'rodear' || exerciseType === 'unir') && (
                    <button
                      type="button"
                      onClick={() => handleAddPictogramItem(sectionIndex)}
                      className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                      {exerciseType === 'unir' ? 'Añadir pareja visual' : 'Añadir pictograma'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveSection(sectionIndex)}
                    disabled={worksheet.sections.length <= 1}
                    className="rounded-lg bg-red-100 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Eliminar ejercicio
                  </button>
                </div>
              </div>

              <div className="mt-4">
                {renderExerciseEditor(section, sectionIndex)}
              </div>
            </div>
          );
        })}

        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Añadir ejercicio nuevo</p>
          <div className="flex flex-wrap gap-2">
            {EXERCISE_TYPE_OPTIONS.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleAddSection(option.value)}
                className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-700 border border-gray-300 hover:border-indigo-500 hover:text-indigo-600"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
