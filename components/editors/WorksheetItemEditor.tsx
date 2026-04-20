import React from 'react';
import { WorksheetItem, WorksheetSection } from '../../types';
import {
  EXERCISE_TYPE_OPTIONS,
  PlaceholderPicto,
  EditorPictogramPreview,
  getExerciseTypeLabel,
  getSectionItems
} from '../EditableWorksheetDisplay';
import { EditorTarget } from './types';

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
  const key = `${sectionIndex}-${itemIndex}`;
  const exerciseType = section.exerciseType || 'rodear';
  const isFullWidth = (exerciseType === 'repasar' && item.type === 'traceable_text') || options?.fullWidth;
  const previewPictoUrl = item.selectedPictoUrl || item.pictoOptions?.[0] || '';
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
    <div key={key} className={`w-full rounded-xl border border-gray-200 bg-gray-50 p-3 ${isFullWidth ? 'max-w-[720px]' : 'max-w-[220px]'}`}>
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
            {previewPictoUrl || item.searchTerm || item.content ? (
              <EditorPictogramPreview
                src={previewPictoUrl}
                searchTerm={item.searchTerm || item.content}
                altText={item.content}
                className="max-h-20 max-w-20 object-contain"
              />
            ) : (
              <span className="px-3 text-center text-3xl font-bold text-gray-700">{item.content || 'Texto'}</span>
            )}
            <div className="absolute inset-0 rounded-md bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center">
              <span className="text-sm font-bold text-white">Editar elemento</span>
            </div>
          </button>
        </>
      ) : item.type === 'traceable_text' ? (
        <>
          <button
            onClick={() => setEditorTarget({ type: 'item', sectionIndex, itemIndex })}
            className="relative flex min-h-32 w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white group"
          >
            <div className={`flex w-full items-center ${isFullWidth ? 'gap-4 px-4 py-3' : 'justify-center gap-3 px-3'}`}>
              <div className={`flex flex-shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-gray-50 ${isFullWidth ? 'h-24 w-24' : 'h-20 w-20'}`}>
                {previewPictoUrl || item.searchTerm || item.content ? (
                  <EditorPictogramPreview
                    src={previewPictoUrl}
                    searchTerm={item.searchTerm || item.content}
                    altText={item.content}
                    className={`${isFullWidth ? 'max-h-20 max-w-20' : 'max-h-14 max-w-14'} object-contain`}
                  />
                ) : (
                  <PlaceholderPicto label={item.searchTerm || item.content || 'Sin pictograma'} />
                )}
              </div>
              <span className={`${isFullWidth ? 'flex-1 overflow-hidden text-center text-7xl' : 'text-6xl'} font-bold text-gray-300 break-words`}>
                {item.content || '...'}
              </span>
            </div>
            <div className="absolute inset-0 rounded-md bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center">
              <span className="text-sm font-bold text-white">Editar trazo</span>
            </div>
          </button>
        </>
      ) : (
        <>
          <div className="flex h-32 w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white">
            <span className="text-4xl font-bold text-gray-700">
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
