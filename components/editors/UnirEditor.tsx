import React from 'react';
import { CommonEditorProps } from './types';
import { WorksheetItemEditor } from './WorksheetItemEditor';
import { getSectionItems } from '../EditableWorksheetDisplay';

export const UnirEditor: React.FC<CommonEditorProps> = ({
  section,
  sectionIndex,
  handleMoveItem,
  handleRemoveItem,
  setEditorTarget,
  handleItemTextChange,
}) => {
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
              <WorksheetItemEditor
                item={leftItem}
                section={section}
                sectionIndex={sectionIndex}
                itemIndex={pairIndex}
                options={{
                  title: 'Columna izquierda',
                  description: 'Primer elemento de la asociación.',
                  hideMoveButtons: true,
                }}
                handleMoveItem={handleMoveItem}
                handleRemoveItem={handleRemoveItem}
                setEditorTarget={setEditorTarget}
                handleItemTextChange={handleItemTextChange}
              />
              <WorksheetItemEditor
                item={rightItems[pairIndex]}
                section={section}
                sectionIndex={sectionIndex}
                itemIndex={pairIndex + pairCount}
                options={{
                  title: 'Columna derecha',
                  description: 'Segundo elemento de la asociación.',
                  hideMoveButtons: true,
                }}
                handleMoveItem={handleMoveItem}
                handleRemoveItem={handleRemoveItem}
                setEditorTarget={setEditorTarget}
                handleItemTextChange={handleItemTextChange}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
