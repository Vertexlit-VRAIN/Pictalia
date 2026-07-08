import React, { useState } from 'react';
import { WorksheetItem, WorksheetSection } from '../../types';
import {
  PlaceholderPicto,
  EditorPictogramPreview,
} from '../EditableWorksheetDisplay';
import { getAdaptiveSpelledBoxWidth } from '../PictogramRenderer';
import {
  getExerciseTypeLabel,
  getSectionItems
} from '../editorUtils';
import { getExerciseTypeAddLabel } from '../../services/exerciseRepository';
import { EditorTarget } from '../exercises/types';
import { ArrowDownIcon, ArrowUpIcon, MinusIcon, PencilRulerIcon } from '../Icons';

interface WorksheetItemEditorProps {
  item: WorksheetItem;
  sectionIndex: number;
  itemIndex: number;
  section: WorksheetSection;
  options?: {
    title?: string;
    description?: string;
    hideMoveButtons?: boolean;
    moveBackDisabled?: boolean;
    moveForwardDisabled?: boolean;
    fullWidth?: boolean;
  };
  handleMoveItem: (sectionIndex: number, itemIndex: number, direction: -1 | 1) => void;
  handleRemoveItem: (sectionIndex: number, itemIndex: number) => void;
  setEditorTarget: (target: EditorTarget | null) => void;
  handleItemTextChange: (sectionIndex: number, itemIndex: number, value: string) => void;
}

export const WorksheetItemEditor: React.FC<WorksheetItemEditorProps> = ({
  item,
  sectionIndex,
  itemIndex,
  section,
  options,
  handleMoveItem,
  handleRemoveItem,
  setEditorTarget,
  handleItemTextChange,
}) => {
  const [isSpelledFallback, setIsSpelledFallback] = useState(item.pictogramRenderMode === 'spell');
  const key = `${sectionIndex}-${itemIndex}`;
  const exerciseType = section.exerciseType || 'rodear';
  const isFullWidth = (exerciseType === 'repasar' && item.type === 'traceable_text') || options?.fullWidth;
  const previewPictoUrl = item.selectedPictoUrl || item.pictoOptions?.[0] || '';
  const addLabel = getExerciseTypeAddLabel(exerciseType);
  const itemCount = getSectionItems(section).length;
  const pairCount = exerciseType === 'unir' ? itemCount / 2 : 0;
  const pairIndex = exerciseType === 'unir' ? (itemIndex < pairCount ? itemIndex : itemIndex - pairCount) : itemIndex;
  const canMoveBack = exerciseType === 'unir' ? pairIndex > 0 : itemIndex > 0;
  const canMoveForward = exerciseType === 'unir' ? pairIndex < pairCount - 1 : itemIndex < itemCount - 1;
  const disableRemove = exerciseType === 'unir'
    ? itemCount <= 4
    : exerciseType === 'copiar'
      ? itemCount <= 1
      : exerciseType === 'repasar'
        ? itemCount <= 1
        : itemCount <= 2;
  const isMatchingColumn = exerciseType === 'unir';
  const shouldExpandPreview = isSpelledFallback || item.pictogramRenderMode === 'spell';
  const adaptivePreviewWidth = shouldExpandPreview
    ? getAdaptiveSpelledBoxWidth(item.searchTerm || item.content || '', true, {
        minRem: 10.5,
        baseRem: 7.5,
        stepRem: 1.85,
        maxRem: 34,
      })
    : '13.75rem';

  return (
    <div
      key={key}
      className={`w-full rounded-[24px] border border-slate-200 bg-slate-50 p-3 ${isFullWidth ? 'max-w-none' : ''}`}
      style={
        isFullWidth
          ? undefined
          : isMatchingColumn
            ? { maxWidth: '100%', minWidth: 0 }
            : { maxWidth: adaptivePreviewWidth, minWidth: shouldExpandPreview ? adaptivePreviewWidth : '13.75rem' }
      }
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {options?.title || (exerciseType === 'unir' ? `Pareja ${pairIndex + 1}` : `${getExerciseTypeLabel(exerciseType)} ${itemIndex + 1}`)}
        </span>
        <div className="flex items-center gap-1">
          {!options?.hideMoveButtons && (
            <>
              <button
                type="button"
                onClick={() => handleMoveItem(sectionIndex, itemIndex, -1)}
                disabled={options?.moveBackDisabled ?? !canMoveBack}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowUpIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleMoveItem(sectionIndex, itemIndex, 1)}
                disabled={options?.moveForwardDisabled ?? !canMoveForward}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowDownIcon className="h-4 w-4" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => handleRemoveItem(sectionIndex, itemIndex)}
            disabled={disableRemove}
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-700 hover:bg-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <MinusIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {item.type !== 'traceable_text' && item.type !== 'empty_box' ? (
        <>
          <button
            onClick={() => setEditorTarget({ type: 'item', sectionIndex, itemIndex })}
            className={`group relative flex items-center justify-center self-center rounded-[20px] border-2 border-slate-300 bg-white transition hover:border-sky-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-600 ${isSpelledFallback ? 'min-h-32 px-3 py-3' : 'h-32 w-full'}`}
            style={
              isSpelledFallback
                ? isMatchingColumn
                  ? { width: '100%', minWidth: 0, maxWidth: '100%' }
                  : { width: 'fit-content', minWidth: adaptivePreviewWidth, maxWidth: '100%' }
                : undefined
            }
          >
            {previewPictoUrl || item.searchTerm || item.content ? (
              <EditorPictogramPreview
                src={previewPictoUrl}
                searchTerm={item.searchTerm || item.content}
                altText={item.content}
                renderMode={item.pictogramRenderMode}
                letterTerms={item.spelledLetterTerms}
                letterUrls={item.spelledLetterUrls}
                className="max-h-20 max-w-20 object-contain"
                letterWrapperClassName={`px-1.5 ${isSpelledFallback ? 'w-full max-w-full justify-center py-1.5' : 'max-h-20 max-w-20'}`}
                letterTileClassName="min-h-10 min-w-10"
                letterSingleRow={!isSpelledFallback}
                onFallbackModeChange={setIsSpelledFallback}
              />
            ) : (
              <span className="px-3 text-center text-3xl font-bold text-slate-700">{item.content || 'Texto'}</span>
            )}
            <div className="absolute inset-0 flex items-center justify-center rounded-[18px] bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-bold text-white">
                <PencilRulerIcon className="h-4 w-4" />
                Editar
              </span>
            </div>
          </button>
        </>
      ) : item.type === 'traceable_text' ? (
        <>
          <button
            onClick={() => setEditorTarget({ type: 'item', sectionIndex, itemIndex })}
            className={`group relative flex items-center justify-center rounded-[20px] border-2 border-dashed border-slate-300 bg-white transition hover:border-sky-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-600 ${isSpelledFallback ? 'min-h-32 py-3' : 'min-h-32 w-full'}`}
            style={isSpelledFallback ? { width: 'fit-content', minWidth: '100%', maxWidth: '100%' } : undefined}
          >
            <div className={`flex ${isSpelledFallback ? 'w-fit max-w-full' : 'w-full'} items-center ${isFullWidth ? 'gap-4 px-4 py-3' : 'justify-center gap-3 px-3'}`}>
              <div className={`flex flex-shrink-0 items-center justify-center rounded-2xl border border-slate-300 bg-slate-50 ${isFullWidth ? 'min-h-24 w-24 px-1 py-2' : 'min-h-20 w-24 px-1 py-2'}`}>
                {previewPictoUrl || item.searchTerm || item.content ? (
                  <EditorPictogramPreview
                    src={previewPictoUrl}
                    searchTerm={item.searchTerm || item.content}
                    altText={item.content}
                    renderMode={item.pictogramRenderMode}
                    letterTerms={item.spelledLetterTerms}
                    letterUrls={item.spelledLetterUrls}
                    className={`${isFullWidth ? 'max-h-20 max-w-20' : 'max-h-14 max-w-14'} object-contain`}
                    letterWrapperClassName={`${isFullWidth ? 'max-h-20 max-w-20' : 'max-h-14 max-w-14'} px-1.5 ${isSpelledFallback ? 'justify-center py-1.5' : ''}`}
                    letterTileClassName="min-h-10 min-w-10"
                    letterSingleRow={!isSpelledFallback}
                    onFallbackModeChange={setIsSpelledFallback}
                  />
                ) : (
                  <PlaceholderPicto label={item.searchTerm || item.content || 'Sin pictograma'} />
                )}
              </div>
              <span className={`${isFullWidth ? 'flex-1 overflow-hidden text-center text-7xl' : 'text-6xl'} break-words font-bold text-slate-300`}>
                {item.content || '...'}
              </span>
            </div>
            <div className="absolute inset-0 flex items-center justify-center rounded-[18px] bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-bold text-white">
                <PencilRulerIcon className="h-4 w-4" />
                Editar
              </span>
            </div>
          </button>
        </>
      ) : (
        <>
          <div className="flex h-32 w-full items-center justify-center rounded-[20px] border-2 border-dashed border-slate-300 bg-white">
            <span className="text-4xl font-bold text-slate-700">
              {item.content || '...'}
            </span>
          </div>
          <input
            type="text"
            value={item.content}
            onChange={(e) => handleItemTextChange(sectionIndex, itemIndex, e.target.value)}
            placeholder="Texto"
            className="mt-3 w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
          />
        </>
      )}

      <p className="mt-3 text-[11px] text-slate-500">{options?.description || addLabel}</p>
    </div>
  );
};
