import React, { useEffect, useMemo, useState } from 'react';
import { produce } from 'immer';
import type { ExerciseType, PictogramRenderMode, PictogramSearchResult, SavedWorksheet, WorksheetItem, WorksheetOperation, WorksheetSection } from '../types';
import { searchPictograms } from '../services/pictogramService';
import { normalizeWorksheetSection } from '../services/worksheetNormalizer';
import { describeWorksheetOperations, ensureWorksheetInternalIds } from '../services/worksheetOperations';
import { ArrowDownIcon, ArrowUpIcon, ChevronDownIcon, PlusIcon, MinusIcon, XIcon, SaveIcon } from './Icons';
import { EXERCISE_TYPE_OPTIONS, getSectionItems, getExerciseTypeLabel } from './editorUtils';
import { Pictogram, getAdaptiveSpelledBoxStyle } from './PictogramRenderer';

type EditableWorksheetProps = {
  worksheet: SavedWorksheet;
  onWorksheetChange: (operations: WorksheetOperation[], actionLabel?: string) => void;
  highlightedSectionIds?: string[];
};

import { EditorTarget } from './editors/types';
import { RepasarEditor } from './editors/RepasarEditor';
import { UnirEditor } from './editors/UnirEditor';
import { CopiarEditor } from './editors/CopiarEditor';
import { RodearEditor } from './editors/RodearEditor';

type PictogramEditorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  helperText?: string;
  currentDisplayedTerm: string;
  currentSearchTerm: string;
  currentSelectedUrl?: string;
  currentPictoOptions?: string[];
  currentRenderMode?: PictogramRenderMode;
  currentSpelledLetterTerms?: string[];
  currentSpelledLetterUrls?: string[];
  onSave: (payload: {
    displayedTerm: string;
    searchTerm: string;
    selectedUrl: string;
    pictoOptions: string[];
    renderMode: PictogramRenderMode;
    spelledLetterTerms: string[];
    spelledLetterUrls: string[];
    applyToAll: boolean;
  }) => void;
};

const getSpellableCharacters = (value: string): string[] =>
  Array.from(value.trim()).filter(character => character.trim().length > 0);

const PictogramEditorModal: React.FC<PictogramEditorModalProps> = ({
  isOpen,
  onClose,
  title,
  helperText,
  currentDisplayedTerm,
  currentSearchTerm,
  currentSelectedUrl,
  currentPictoOptions,
  currentRenderMode,
  currentSpelledLetterTerms,
  currentSpelledLetterUrls,
  onSave,
}) => {
  const [displayedTerm, setDisplayedTerm] = useState(currentDisplayedTerm);
  const [searchTerm, setSearchTerm] = useState(currentSearchTerm);
  const [selectedUrl, setSelectedUrl] = useState(currentSelectedUrl || '');
  const [renderMode, setRenderMode] = useState<PictogramRenderMode>(currentRenderMode || 'auto');
  const [spelledLetterTerms, setSpelledLetterTerms] = useState<string[]>(currentSpelledLetterTerms || []);
  const [spelledLetterUrls, setSpelledLetterUrls] = useState<string[]>(currentSpelledLetterUrls || []);
  const [applyToAll, setApplyToAll] = useState(false);
  const [results, setResults] = useState<PictogramSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const letters = useMemo(() => getSpellableCharacters(searchTerm || displayedTerm), [displayedTerm, searchTerm]);

  useEffect(() => {
    if (!isOpen) return;
    setDisplayedTerm(currentDisplayedTerm);
    setSearchTerm(currentSearchTerm);
    setSelectedUrl(currentSelectedUrl || '');
    setRenderMode(currentRenderMode || 'auto');
    setSpelledLetterTerms(currentSpelledLetterTerms || []);
    setSpelledLetterUrls(currentSpelledLetterUrls || []);
    setApplyToAll(false);
    setResults((currentPictoOptions || []).map((url, index) => ({ id: `${index}-${url}`, url })));
  }, [isOpen, currentDisplayedTerm, currentSearchTerm, currentSelectedUrl, currentPictoOptions, currentRenderMode, currentSpelledLetterTerms, currentSpelledLetterUrls]);

  useEffect(() => {
    setSpelledLetterTerms(current => letters.map((letter, index) => current[index]?.trim() || letter));
    setSpelledLetterUrls(current => letters.map((_, index) => current[index] || ''));
  }, [letters]);

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
    const finalSearchTerm = searchTerm.trim() || finalDisplayedTerm;
    if (!finalDisplayedTerm) return;

    onSave({
      displayedTerm: finalDisplayedTerm,
      searchTerm: finalSearchTerm,
      selectedUrl,
      pictoOptions: results.map(result => result.url),
      renderMode,
      spelledLetterTerms: letters.map((letter, index) => spelledLetterTerms[index]?.trim() || letter),
      spelledLetterUrls: letters.map((_, index) => spelledLetterUrls[index] || ''),
      applyToAll,
    });
    onClose();
  };

    return (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
    onClick={onClose}
  >
    <div
      className="relative z-[101] max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">
          {helperText || 'Cambia el texto, la búsqueda visual y la presentación sin salir del editor.'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
          <div className="space-y-4">
            <div>
              <label htmlFor="displayedTerm" className="mb-1 block text-sm font-medium text-slate-700">Texto visible</label>
              <input
                id="displayedTerm"
                type="text"
                value={displayedTerm}
                onChange={(e) => setDisplayedTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="searchTerm" className="mb-1 block text-sm font-medium text-slate-700">Búsqueda visual</label>
              <input
                id="searchTerm"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ej: unir, perro, rojo"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={renderMode === 'spell'}
                onChange={(e) => setRenderMode(e.target.checked ? 'spell' : 'auto')}
                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              Mostrar en bloques de letras
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={applyToAll}
                onChange={(e) => setApplyToAll(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              Aplicar a todas las instancias equivalentes
            </label>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Selección actual</p>
              <div className="flex min-h-28 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white px-2 py-3">
                {selectedUrl || displayedTerm.trim() || searchTerm.trim() ? (
                  <Pictogram
                    searchTerm={searchTerm || displayedTerm}
                    altText={displayedTerm}
                    src={renderMode === 'spell' ? '' : selectedUrl}
                    renderMode={renderMode}
                    letterTerms={spelledLetterTerms}
                    letterUrls={spelledLetterUrls}
                    className="max-h-24 max-w-24 object-contain"
                    letterWrapperClassName="max-w-full justify-center px-1.5 py-1.5"
                    letterTileClassName="min-h-10 min-w-10"
                  />
                ) : (
                  <span className="px-4 text-center text-xs text-slate-500">Sin pictograma seleccionado.</span>
                )}
              </div>
            </div>
            {renderMode === 'spell' && letters.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Bloques de letras</p>
                <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-3 text-sm text-sky-900">
                  Este modo muestra la palabra en bloques, una letra por bloque, con una tipografía más legible y sin repetir el texto debajo.
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">{renderMode === 'spell' ? 'Vista de bloques' : 'Resultados'}</p>
              {isSearching && <span className="text-xs text-slate-500">Buscando...</span>}
            </div>
            {renderMode !== 'spell' && results.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[420px] overflow-y-auto pr-1">
                {results.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => setSelectedUrl(result.url)}
                    className={`rounded-2xl border-2 bg-white p-2 transition-colors ${
                      selectedUrl === result.url
                        ? 'border-sky-600'
                        : 'border-slate-200 hover:border-sky-300'
                    }`}
                  >
                    <img src={result.url} alt={displayedTerm} className="w-full h-20 object-contain" loading="lazy" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex h-56 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 text-center text-sm text-slate-500">
                {renderMode === 'spell'
                  ? 'La palabra se mostrará como bloques de letras. No hace falta elegir resultados visuales.'
                  : 'No se ha encontrado ningún pictograma.'}
              </div>
            )}
          </div>
        </div>

        <div className="relative z-20 mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="relative z-20 flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-slate-200 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-600 sm:w-auto sm:min-w-[120px]"
          >
            <XIcon className="h-4 w-4 pointer-events-none" />
            <span className="pointer-events-none">Cancelar</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!displayedTerm.trim()}
            className="relative z-20 flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-600 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto sm:min-w-[140px]"
          >
            <SaveIcon className="h-4 w-4 pointer-events-none" />
            <span className="pointer-events-none">Guardar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const PlaceholderPicto: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center justify-center text-center text-xs text-red-500 px-2">
    {label}
  </div>
);

const AdaptivePreviewButton: React.FC<{
  searchTerm?: string;
  altText: string;
  src?: string | null;
  renderMode?: PictogramRenderMode;
  letterTerms?: string[];
  letterUrls?: string[];
  className: string;
  previewClassName?: string;
  previewTileClassName?: string;
  onClick?: () => void;
  children: React.ReactNode;
  defaultWidthRem?: number;
  fallbackMinRem?: number;
  fallbackBaseRem?: number;
  fallbackStepRem?: number;
  fallbackMaxRem?: number;
}> = ({
  searchTerm,
  altText,
  src,
  renderMode,
  letterTerms,
  letterUrls,
  className,
  previewClassName,
  previewTileClassName,
  onClick,
  children,
  defaultWidthRem = 5,
  fallbackMinRem = 7.5,
  fallbackBaseRem = 6.5,
  fallbackStepRem = 1.2,
  fallbackMaxRem = 12,
}) => {
  const [isSpelledFallback, setIsSpelledFallback] = useState(renderMode === 'spell');
  const shouldExpand = isSpelledFallback || renderMode === 'spell';
  const adaptiveStyle = getAdaptiveSpelledBoxStyle(searchTerm || altText || '', shouldExpand, {
    defaultRem: defaultWidthRem,
    minRem: fallbackMinRem,
    baseRem: fallbackBaseRem,
    stepRem: fallbackStepRem,
    maxRem: fallbackMaxRem,
  });

  return (
    <button className={className} style={adaptiveStyle} type="button" onClick={onClick}>
      {src || searchTerm || altText ? (
        <EditorPictogramPreview
          src={src}
          searchTerm={searchTerm}
          altText={altText}
          renderMode={renderMode}
          letterTerms={letterTerms}
          letterUrls={letterUrls}
          className="max-h-12 max-w-12 object-contain"
          letterWrapperClassName={previewClassName || 'max-w-full justify-center px-1.5 py-1.5'}
          letterTileClassName={previewTileClassName || 'min-h-10 min-w-10'}
          onFallbackModeChange={setIsSpelledFallback}
        />
      ) : (
        <PlaceholderPicto label="Sin pictograma" />
      )}
      {children}
    </button>
  );
};

const EDITOR_LETTER_BLOCK_PREVIEW_SIZING = {
  defaultWidthRem: 5,
  fallbackMinRem: 10.5,
  fallbackBaseRem: 7.5,
  fallbackStepRem: 1.85,
  fallbackMaxRem: 34,
} as const;

export const EditorPictogramPreview: React.FC<{
  searchTerm?: string;
  altText: string;
  src?: string | null;
  renderMode?: PictogramRenderMode;
  letterTerms?: string[];
  letterUrls?: string[];
  className?: string;
  letterWrapperClassName?: string;
  letterTileClassName?: string;
  letterSingleRow?: boolean;
  onFallbackModeChange?: (isSpelledFallback: boolean) => void;
}> = ({ searchTerm, altText, src, renderMode, letterTerms, letterUrls, className, letterWrapperClassName, letterTileClassName, letterSingleRow, onFallbackModeChange }) => {
  if (!(src || searchTerm || altText)) {
    return <PlaceholderPicto label="Sin pictograma" />;
  }

  return (
    <Pictogram
      searchTerm={searchTerm || altText}
      altText={altText}
      src={src}
      renderMode={renderMode}
      letterTerms={letterTerms}
      letterUrls={letterUrls}
      className={className}
      letterWrapperClassName={letterWrapperClassName}
      letterTileClassName={letterTileClassName || 'min-h-10 min-w-10'}
      letterSingleRow={letterSingleRow}
      onFallbackModeChange={onFallbackModeChange}
    />
  );
};

const getFallbackDisplayTerm = (item?: WorksheetItem): string => item?.searchTerm || item?.content || '';

const createImageItem = (content: string): WorksheetItem => ({
  type: 'image',
  content,
  searchTerm: content.toLowerCase(),
  selectedPictoUrl: '',
  pictoOptions: [],
  pictogramRenderMode: 'auto',
  spelledLetterTerms: [],
  spelledLetterUrls: [],
});

const createTraceableItem = (content: string): WorksheetItem => ({
  type: 'traceable_text',
  content,
});

const isWorksheetItem = (item: unknown): item is WorksheetItem =>
  typeof item === 'object' &&
  item !== null &&
  !Array.isArray(item) &&
  typeof (item as WorksheetItem).type === 'string';

const cloneWorksheetItem = (item: WorksheetItem | undefined, fallbackContent: string): WorksheetItem => {
  if (!item) {
    return createTraceableItem(fallbackContent);
  }

  return {
    ...item,
    content: item.content || fallbackContent,
    searchTerm: item.searchTerm,
    selectedPictoUrl: item.selectedPictoUrl,
    pictoOptions: item.pictoOptions ? [...item.pictoOptions] : item.pictoOptions,
    pictogramRenderMode: item.pictogramRenderMode,
    spelledLetterTerms: item.spelledLetterTerms ? [...item.spelledLetterTerms] : item.spelledLetterTerms,
    spelledLetterUrls: item.spelledLetterUrls ? [...item.spelledLetterUrls] : item.spelledLetterUrls,
  };
};

const createInstructionPicto = (content: string) => ({
  content,
  searchTerm: content.toLowerCase(),
  url: '',
  pictogramRenderMode: 'auto' as PictogramRenderMode,
  spelledLetterTerms: [content],
  spelledLetterUrls: [],
});



const moveItemInArray = <T,>(items: T[], fromIndex: number, toIndex: number) => {
  if (toIndex < 0 || toIndex >= items.length || fromIndex === toIndex) {
    return;
  }

  const [movedItem] = items.splice(fromIndex, 1);
  items.splice(toIndex, 0, movedItem);
};

const moveIndexInList = (indexes: number[], fromIndex: number, toIndex: number): number[] => {
  if (fromIndex === toIndex) return indexes;

  return indexes.map(index => {
    if (index === fromIndex) return toIndex;

    if (fromIndex < toIndex) {
      if (index > fromIndex && index <= toIndex) return index - 1;
      return index;
    }

    if (index >= toIndex && index < fromIndex) return index + 1;
    return index;
  });
};

const removeIndexFromList = (indexes: number[], removedIndex: number): number[] =>
  indexes
    .filter(index => index !== removedIndex)
    .map(index => (index > removedIndex ? index - 1 : index));

export const EditableWorksheetDisplay: React.FC<EditableWorksheetProps> = ({
  worksheet,
  onWorksheetChange,
  highlightedSectionIds = [],
}) => {
  const [editorTarget, setEditorTarget] = useState<EditorTarget | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<number[]>([]);
  const [sectionPendingDelete, setSectionPendingDelete] = useState<number | null>(null);

  const isSectionCollapsed = (sectionIndex: number): boolean => collapsedSections.includes(sectionIndex);

  const toggleSectionCollapsed = (sectionIndex: number) => {
    setCollapsedSections(current =>
      current.includes(sectionIndex)
        ? current.filter(index => index !== sectionIndex)
        : [...current, sectionIndex]
    );
  };

  const getSectionSummary = (section: WorksheetSection): string => {
    const items = getSectionItems(section).filter(isWorksheetItem);
    const firstLabel = items[0]?.content || section.instruction.text || 'Sin contenido';
    const countLabel = items.length === 1 ? '1 elemento' : `${items.length} elementos`;
    return `${countLabel} · ${firstLabel}`;
  };

  const commitOperations = (operations: WorksheetOperation[], actionLabel?: string) => {
    onWorksheetChange(operations, actionLabel || describeWorksheetOperations(operations));
  };

  const updateWorksheetMetadata = (
    recipe: (draft: SavedWorksheet) => void,
    actionLabel = 'Edición de ficha'
  ) => {
    const nextWorksheet = produce(ensureWorksheetInternalIds(worksheet), recipe);
    commitOperations([{
      type: 'update_worksheet',
      changes: {
        title: nextWorksheet.title,
        pictogramSearchTerm: nextWorksheet.pictogramSearchTerm,
        selectedPictoUrl: nextWorksheet.selectedPictoUrl,
        pictoOptions: nextWorksheet.pictoOptions,
        pictogramRenderMode: nextWorksheet.pictogramRenderMode,
        spelledLetterTerms: nextWorksheet.spelledLetterTerms,
        spelledLetterUrls: nextWorksheet.spelledLetterUrls,
      },
    }], actionLabel);
  };

  const updateSectionByIndex = (
    sectionIndex: number,
    recipe: (draft: WorksheetSection) => void,
    actionLabel = 'Edición de ejercicio'
  ) => {
    const sourceSection = worksheet.sections[sectionIndex];
    if (!sourceSection?.internalId) return;

    const nextSection = produce(sourceSection, recipe);
    const normalizedSection = ensureWorksheetInternalIds({
      title: worksheet.title,
      pictogramSearchTerm: worksheet.pictogramSearchTerm,
      sections: [normalizeWorksheetSection(nextSection)],
    }).sections[0];

    commitOperations([{
      type: 'update_section',
      sectionId: sourceSection.internalId,
      section: normalizedSection,
    }], actionLabel);
  };

  const applyGlobalPictoUpdate = (
    draft: SavedWorksheet,
    oldPictoUrl: string,
    newPictoUrl: string,
    newPictoOptions: string[],
    oldDisplayedTerm: string,
    newDisplayedTerm: string,
    newSearchTerm: string,
    newRenderMode: PictogramRenderMode,
    newSpelledLetterTerms: string[],
    newSpelledLetterUrls: string[]
  ) => {
    if (draft.selectedPictoUrl === oldPictoUrl && draft.pictogramSearchTerm === oldDisplayedTerm) {
      draft.selectedPictoUrl = newPictoUrl;
      draft.pictoOptions = newPictoOptions;
      draft.pictogramSearchTerm = newDisplayedTerm;
      draft.pictogramRenderMode = newRenderMode;
      draft.spelledLetterTerms = newSpelledLetterTerms;
      draft.spelledLetterUrls = newSpelledLetterUrls;
    }

    draft.sections.forEach(section => {
      section.instruction.pictograms?.forEach(picto => {
        if (picto.url === oldPictoUrl && (picto.searchTerm === oldDisplayedTerm || picto.content === oldDisplayedTerm)) {
          picto.url = newPictoUrl;
          picto.searchTerm = newSearchTerm;
          picto.content = newDisplayedTerm;
          picto.pictogramRenderMode = newRenderMode;
          picto.spelledLetterTerms = newSpelledLetterTerms;
          picto.spelledLetterUrls = newSpelledLetterUrls;
        }
      });

      (section.items || []).filter(isWorksheetItem).forEach(item => {
        if (item.type === 'image' && item.selectedPictoUrl === oldPictoUrl && (item.searchTerm === oldDisplayedTerm || item.content === oldDisplayedTerm)) {
          item.selectedPictoUrl = newPictoUrl;
          item.pictoOptions = newPictoOptions;
          item.searchTerm = newSearchTerm;
          item.content = newDisplayedTerm;
          item.pictogramRenderMode = newRenderMode;
          item.spelledLetterTerms = newSpelledLetterTerms;
          item.spelledLetterUrls = newSpelledLetterUrls;
        }
      });
    });
  };

  const handleSavePictogramEdit = ({
    displayedTerm,
    searchTerm,
    selectedUrl,
    pictoOptions,
    renderMode,
    spelledLetterTerms,
    spelledLetterUrls,
    applyToAll,
  }: {
    displayedTerm: string;
    searchTerm: string;
    selectedUrl: string;
    pictoOptions: string[];
    renderMode: PictogramRenderMode;
    spelledLetterTerms: string[];
    spelledLetterUrls: string[];
    applyToAll: boolean;
  }) => {
    if (!editorTarget) return;

    if (editorTarget.type === 'main') {
      updateWorksheetMetadata(draft => {
        const originalPictoUrl = draft.selectedPictoUrl || '';
        const originalDisplayedTerm = draft.pictogramSearchTerm || '';

        draft.pictogramSearchTerm = displayedTerm;
        draft.selectedPictoUrl = renderMode === 'spell' ? '' : selectedUrl;
        draft.pictoOptions = pictoOptions;
        draft.pictogramRenderMode = renderMode;
        draft.spelledLetterTerms = spelledLetterTerms;
        draft.spelledLetterUrls = spelledLetterUrls;

        if (applyToAll) {
          applyGlobalPictoUpdate(draft, originalPictoUrl, selectedUrl, pictoOptions, originalDisplayedTerm, displayedTerm, searchTerm, renderMode, spelledLetterTerms, spelledLetterUrls);
        }
      }, 'Edición de ficha');
      setEditorTarget(null);
      return;
    }

    if (editorTarget.type === 'instruction') {
      updateSectionByIndex(editorTarget.sectionIndex, sectionDraft => {
        const instructionPicto = sectionDraft.instruction.pictograms?.[editorTarget.pictoIndex];
        if (!instructionPicto) return;

        instructionPicto.content = displayedTerm;
        instructionPicto.searchTerm = searchTerm;
        instructionPicto.url = renderMode === 'spell' ? '' : selectedUrl;
        instructionPicto.pictogramRenderMode = renderMode;
        instructionPicto.spelledLetterTerms = spelledLetterTerms;
        instructionPicto.spelledLetterUrls = spelledLetterUrls;
      });
      setEditorTarget(null);
      return;
    }

    updateSectionByIndex(editorTarget.sectionIndex, sectionDraft => {
      const items = getSectionItems(sectionDraft).filter(isWorksheetItem);
      const item = items[editorTarget.itemIndex];

      if (!item || item.type === 'empty_box') return;

      item.content = displayedTerm;

      if (item.type === 'image') {
        item.searchTerm = searchTerm;
        item.selectedPictoUrl = renderMode === 'spell' ? '' : selectedUrl;
        item.pictoOptions = pictoOptions;
        item.pictogramRenderMode = renderMode;
        item.spelledLetterTerms = spelledLetterTerms;
        item.spelledLetterUrls = spelledLetterUrls;
      }

      if (item.type === 'traceable_text') {
        item.content = displayedTerm.toUpperCase();
      }

      sectionDraft.items = items;
    });

    setEditorTarget(null);
  };

  const handleExerciseTypeChange = (sectionIndex: number, exerciseType: ExerciseType) => {
    const currentSection = worksheet.sections[sectionIndex];
    if (!currentSection?.internalId) return;

    const nextSection = normalizeWorksheetSection({
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

    commitOperations([{
      type: 'update_section',
      sectionId: currentSection.internalId,
      section: ensureWorksheetInternalIds({
        title: worksheet.title,
        pictogramSearchTerm: worksheet.pictogramSearchTerm,
        sections: [nextSection],
      }).sections[0],
    }], 'Cambio de tipo de ejercicio');
  };

  const handleAddSection = (exerciseType: ExerciseType) => {
    commitOperations([{
      type: 'create_section',
      afterSectionId: worksheet.sections[worksheet.sections.length - 1]?.internalId,
      section: normalizeWorksheetSection({ exerciseType }),
    }], 'Creación de ejercicio');
  };

  const handleRemoveSection = (sectionIndex: number) => {
    if (worksheet.sections.length <= 1) return;
    const sectionId = worksheet.sections[sectionIndex]?.internalId;
    if (!sectionId) return;

    commitOperations([{ type: 'delete_section', sectionId }], 'Borrado de ejercicio');
    setCollapsedSections(current => removeIndexFromList(current, sectionIndex));
    setSectionPendingDelete(null);
  };

  const handleMoveSection = (sectionIndex: number, direction: -1 | 1) => {
    const targetIndex = sectionIndex + direction;
    const sectionId = worksheet.sections[sectionIndex]?.internalId;
    if (!sectionId || targetIndex < 0 || targetIndex >= worksheet.sections.length) return;

    commitOperations([{ type: 'move_section', sectionId, toIndex: targetIndex }], 'Reordenación de ejercicios');
    setCollapsedSections(current => moveIndexInList(current, sectionIndex, targetIndex));
  };

  const handleAddInstructionPicto = (sectionIndex: number) => {
    updateSectionByIndex(sectionIndex, sectionDraft => {
      const pictograms = sectionDraft.instruction.pictograms || (sectionDraft.instruction.pictograms = []);
      pictograms.push(createInstructionPicto('nuevo'));
    });
  };

  const handleRemoveInstructionPicto = (sectionIndex: number, pictoIndex: number) => {
    updateSectionByIndex(sectionIndex, sectionDraft => {
      const pictograms = sectionDraft.instruction.pictograms;
      if (!pictograms || pictograms.length <= 1) return;
      pictograms.splice(pictoIndex, 1);
    });
  };

  const handleMoveInstructionPicto = (sectionIndex: number, pictoIndex: number, direction: -1 | 1) => {
    updateSectionByIndex(sectionIndex, sectionDraft => {
      const pictograms = sectionDraft.instruction.pictograms;
      if (!pictograms) return;
      moveItemInArray(pictograms, pictoIndex, pictoIndex + direction);
    });
  };

  const handleAddItem = (sectionIndex: number) => {
    updateSectionByIndex(sectionIndex, section => {
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
        items.push(createTraceableItem(`PALABRA ${items.length + 1}`));
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
    updateSectionByIndex(sectionIndex, section => {
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
    updateSectionByIndex(sectionIndex, section => {
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

      const minimumItems = exerciseType === 'copiar' ? 1 : exerciseType === 'repasar' ? 1 : 2;      if (items.length <= minimumItems) return;
      items.splice(itemIndex, 1);
    });
  };

  const handleMoveItem = (sectionIndex: number, itemIndex: number, direction: -1 | 1) => {
    updateSectionByIndex(sectionIndex, section => {
      const items = (section.items || []).filter(isWorksheetItem);
      section.items = items;
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
    updateSectionByIndex(sectionIndex, section => {
      const item = section.items?.[itemIndex];
      if (!isWorksheetItem(item)) return;
      item.content = section.exerciseType === 'copiar' ? value.toUpperCase() : value;
    });
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
        renderMode: worksheet.pictogramRenderMode || 'auto',
        spelledLetterTerms: worksheet.spelledLetterTerms || [],
        spelledLetterUrls: worksheet.spelledLetterUrls || [],
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
        renderMode: picto?.pictogramRenderMode || 'auto',
        spelledLetterTerms: picto?.spelledLetterTerms || [],
        spelledLetterUrls: picto?.spelledLetterUrls || [],
      };
    }

    const section = worksheet.sections[editorTarget.sectionIndex];
    const item = section ? getSectionItems(section).filter(isWorksheetItem)[editorTarget.itemIndex] : undefined;

    if (!item || item.type === 'empty_box') return null;

    return {
      title: item.type === 'traceable_text' ? 'Editar trazo' : 'Editar elemento del ejercicio',
      helperText: item.type === 'traceable_text'
        ? 'Puedes elegir el pictograma de apoyo y el texto que se repasa.'
        : 'Todos estos elementos se editan igual. Si no seleccionas pictograma, se mostrará solo el texto.',
      displayedTerm: item.content || '',
      searchTerm: item.searchTerm || item.content || '',
      selectedUrl: item.selectedPictoUrl || '',
      pictoOptions: item.pictoOptions || [],
      renderMode: item.pictogramRenderMode || 'auto',
      spelledLetterTerms: item.spelledLetterTerms || [],
      spelledLetterUrls: item.spelledLetterUrls || [],
    };
  }, [editorTarget, worksheet]);

  const renderExerciseEditor = (section: WorksheetSection, sectionIndex: number) => {
    switch (section.exerciseType) {
      case 'repasar':
        return <RepasarEditor section={section} sectionIndex={sectionIndex} handleMoveItem={handleMoveItem} handleRemoveItem={handleRemoveItem} setEditorTarget={setEditorTarget} handleItemTextChange={handleItemTextChange} />;
      case 'unir':
        return <UnirEditor section={section} sectionIndex={sectionIndex} handleMoveItem={handleMoveItem} handleRemoveItem={handleRemoveItem} setEditorTarget={setEditorTarget} handleItemTextChange={handleItemTextChange} />;
      case 'copiar':
        return <CopiarEditor section={section} sectionIndex={sectionIndex} handleMoveItem={handleMoveItem} handleRemoveItem={handleRemoveItem} setEditorTarget={setEditorTarget} handleItemTextChange={handleItemTextChange} />;
      case 'rodear':
      default:
        return <RodearEditor section={section} sectionIndex={sectionIndex} handleMoveItem={handleMoveItem} handleRemoveItem={handleRemoveItem} setEditorTarget={setEditorTarget} handleItemTextChange={handleItemTextChange} />;
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
          currentRenderMode={currentEditorState.renderMode}
          currentSpelledLetterTerms={currentEditorState.spelledLetterTerms}
          currentSpelledLetterUrls={currentEditorState.spelledLetterUrls}
          onSave={handleSavePictogramEdit}
        />
      )}

      {sectionPendingDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSectionPendingDelete(null)}>
          <div
            className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-section-title"
          >
            <div className="mb-4 flex items-start gap-3">
              <div>
                <h3 id="delete-section-title" className="text-lg font-black text-slate-900">Eliminar ejercicio</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Vas a eliminar el ejercicio {sectionPendingDelete + 1}. Esta acción no se puede deshacer desde este paso.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSectionPendingDelete(null)}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-200 px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleRemoveSection(sectionPendingDelete)}
                className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-2.5 font-semibold text-white hover:bg-rose-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-[max-content_minmax(0,1fr)] md:items-center">
            <AdaptivePreviewButton
              src={worksheet.selectedPictoUrl || worksheet.pictoOptions?.[0]}
              searchTerm={worksheet.pictogramSearchTerm}
              altText={worksheet.pictogramSearchTerm}
              renderMode={worksheet.pictogramRenderMode}
              letterTerms={worksheet.spelledLetterTerms}
              letterUrls={worksheet.spelledLetterUrls}
              className="relative flex min-h-16 items-center justify-center rounded-2xl border-2 border-slate-300 bg-white p-2 transition hover:border-sky-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-600 group"
              onClick={() => setEditorTarget({ type: 'main' })}
              defaultWidthRem={EDITOR_LETTER_BLOCK_PREVIEW_SIZING.defaultWidthRem}
              fallbackMinRem={EDITOR_LETTER_BLOCK_PREVIEW_SIZING.fallbackMinRem}
              fallbackBaseRem={EDITOR_LETTER_BLOCK_PREVIEW_SIZING.fallbackBaseRem}
              fallbackStepRem={EDITOR_LETTER_BLOCK_PREVIEW_SIZING.fallbackStepRem}
              fallbackMaxRem={EDITOR_LETTER_BLOCK_PREVIEW_SIZING.fallbackMaxRem}
            >
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="text-white font-bold text-xs">Editar</span>
              </div>
            </AdaptivePreviewButton>
            <input
              type="text"
              value={worksheet.title}
              onChange={(e) => updateWorksheetMetadata(draft => {
                draft.title = e.target.value;
              })}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-2xl font-extrabold uppercase tracking-wider text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
            />
          </div>
        </div>

        {worksheet.sections.map((section, sectionIndex) => {
          const exerciseType = section.exerciseType || 'rodear';
          const isHighlighted = Boolean(
            section.internalId && highlightedSectionIds.includes(section.internalId)
          );
          const addLabel = EXERCISE_TYPE_OPTIONS.find(option => option.value === exerciseType)?.addLabel || 'Añadir elemento';
          const instructionPictograms = section.instruction.pictograms || [];

          return (
              <div
                key={section.internalId || sectionIndex}
                className={`rounded-[24px] border p-4 shadow-sm transition ${
                  isHighlighted
                    ? 'border-sky-500 bg-sky-50/40 ring-4 ring-sky-200'
                    : 'border-slate-200 bg-white'
                }`}
              >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleSectionCollapsed(sectionIndex)}
                        className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-sky-500 hover:text-sky-700"
                        aria-label={isSectionCollapsed(sectionIndex) ? 'Expandir ejercicio' : 'Colapsar ejercicio'}
                        title={isSectionCollapsed(sectionIndex) ? 'Expandir ejercicio' : 'Colapsar ejercicio'}
                      >
                        <ChevronDownIcon className={`h-4 w-4 transition-transform ${isSectionCollapsed(sectionIndex) ? '-rotate-90' : ''}`} />
                      </button>
                      <div className="truncate text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Ejercicio {sectionIndex + 1}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleMoveSection(sectionIndex, -1)}
                        disabled={sectionIndex === 0}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-sky-500 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Subir ejercicio"
                        title="Subir ejercicio"
                      >
                        <ArrowUpIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveSection(sectionIndex, 1)}
                        disabled={sectionIndex === worksheet.sections.length - 1}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-sky-500 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Bajar ejercicio"
                        title="Bajar ejercicio"
                      >
                        <ArrowDownIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSectionPendingDelete(sectionIndex)}
                        disabled={worksheet.sections.length <= 1}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 bg-white text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Eliminar ejercicio"
                        title="Eliminar ejercicio"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
                    <select
                      value={exerciseType}
                      onChange={(e) => handleExerciseTypeChange(sectionIndex, e.target.value as ExerciseType)}
                      className="rounded-2xl border border-slate-300 px-3 py-2 text-sm font-semibold focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                    >
                      {EXERCISE_TYPE_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={section.instruction.text}
                      onChange={(e) => updateSectionByIndex(sectionIndex, sectionDraft => {
                        sectionDraft.instruction.text = e.target.value;
                      })}
                      className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-lg font-bold uppercase tracking-wide text-slate-700 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                    />
                  </div>

                  {isSectionCollapsed(sectionIndex) ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      {getSectionSummary(section)}
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {instructionPictograms.map((picto, pictoIndex) => (
                          <div key={pictoIndex} className="flex flex-col items-center rounded-2xl border border-slate-200 bg-slate-50 p-2">
                            <div className="mb-2 flex items-center gap-1 self-end">
                              <button
                                type="button"
                                onClick={() => handleMoveInstructionPicto(sectionIndex, pictoIndex, -1)}
                                disabled={pictoIndex === 0}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <ArrowUpIcon className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveInstructionPicto(sectionIndex, pictoIndex, 1)}
                                disabled={pictoIndex === instructionPictograms.length - 1}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <ArrowDownIcon className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveInstructionPicto(sectionIndex, pictoIndex)}
                                disabled={instructionPictograms.length <= 1}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-700 hover:bg-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <MinusIcon className="h-4 w-4" />
                              </button>
                            </div>
                            
                            <AdaptivePreviewButton
                              src={picto.url}
                              searchTerm={picto.searchTerm || picto.content}
                              altText={picto.content}
                              renderMode={picto.pictogramRenderMode}
                              letterTerms={picto.spelledLetterTerms}
                              letterUrls={picto.spelledLetterUrls}
                              className="group relative flex min-h-16 items-center justify-center rounded-2xl border-2 border-slate-200 bg-white px-1 py-2 hover:border-sky-500"
                              onClick={() => setEditorTarget({ type: 'instruction', sectionIndex, pictoIndex })}
                              defaultWidthRem={EDITOR_LETTER_BLOCK_PREVIEW_SIZING.defaultWidthRem}
                              fallbackMinRem={EDITOR_LETTER_BLOCK_PREVIEW_SIZING.fallbackMinRem}
                              fallbackBaseRem={EDITOR_LETTER_BLOCK_PREVIEW_SIZING.fallbackBaseRem}
                              fallbackStepRem={EDITOR_LETTER_BLOCK_PREVIEW_SIZING.fallbackStepRem}
                              fallbackMaxRem={EDITOR_LETTER_BLOCK_PREVIEW_SIZING.fallbackMaxRem}
                            >
                              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                <span className="text-white font-bold text-xs">Editar</span>
                              </div>
                            </AdaptivePreviewButton>
                            {picto.pictogramRenderMode !== 'spell' && (
                              <span className="mt-2 text-xs font-semibold uppercase text-slate-600">{picto.content}</span>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleAddInstructionPicto(sectionIndex)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600 hover:border-sky-500 hover:text-sky-700"
                        >
                          <PlusIcon className="h-4 w-4" />
                          Añadir pictograma al enunciado
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap gap-2" />
              </div>

              {!isSectionCollapsed(sectionIndex) && (
                <div className="mt-4">
                  {renderExerciseEditor(section, sectionIndex)}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {exerciseType !== 'rodear' && exerciseType !== 'unir' && (
                      <button
                        type="button"
                        onClick={() => handleAddItem(sectionIndex)}
                        className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                      >
                        <PlusIcon className="h-4 w-4" />
                        {addLabel}
                      </button>
                    )}
                    {(exerciseType === 'rodear' || exerciseType === 'unir') && (
                      <button
                        type="button"
                        onClick={() => handleAddPictogramItem(sectionIndex)}
                        className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                      >
                        <PlusIcon className="h-4 w-4" />
                        {exerciseType === 'unir' ? 'Añadir pareja visual' : 'Añadir pictograma'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-4">
          <p className="mb-3 text-sm font-semibold text-slate-700">Añadir ejercicio nuevo</p>
          <div className="flex flex-wrap gap-2">
            {EXERCISE_TYPE_OPTIONS.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleAddSection(option.value)}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-sky-500 hover:text-sky-700"
              >
                <PlusIcon className="h-4 w-4" />
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
