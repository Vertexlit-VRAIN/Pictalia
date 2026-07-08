import React from 'react';
import { CommonEditorProps } from '../types';
import { WorksheetItemEditor } from '../../editors/WorksheetItemEditor';
import { getSectionItems } from '../../editorUtils';
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from '../../Icons';

export const MatchingEditor: React.FC<CommonEditorProps> = ({
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
      <div className="rounded-[20px] border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900">
        Trabaja asociaciones claras de uno a uno. Cada pareja debe tener relación evidente y pocas distracciones.
      </div>
      <div className="space-y-3">
        {leftItems.map((leftItem, pairIndex) => (
          <div key={pairIndex} className="rounded-[24px] border border-violet-200 bg-violet-50/40 p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-violet-900">Pareja {pairIndex + 1}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleMoveItem(sectionIndex, pairIndex, -1)}
                  disabled={pairIndex === 0}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ArrowUpIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveItem(sectionIndex, pairIndex, 1)}
                  disabled={pairIndex === pairCount - 1}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ArrowDownIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(sectionIndex, pairIndex)}
                  disabled={items.length <= 4}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <MinusIcon className="h-4 w-4" />
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
