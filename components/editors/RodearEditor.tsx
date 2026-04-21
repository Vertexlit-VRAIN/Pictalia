import React from 'react';
import { CommonEditorProps } from './types';
import { WorksheetItemEditor } from './WorksheetItemEditor';
import { getSectionItems } from '../editorUtils';

export const RodearEditor: React.FC<CommonEditorProps> = ({
  section,
  sectionIndex,
  handleMoveItem,
  handleRemoveItem,
  setEditorTarget,
  handleItemTextChange,
}) => {
  return (
    <div className="space-y-4">
      <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        Presenta pocas opciones, muy diferenciadas y visualmente limpias para facilitar la discriminación.
      </div>
      <div className="flex flex-wrap gap-3">
        {getSectionItems(section).map((item, itemIndex) => (
          <WorksheetItemEditor
            key={`${sectionIndex}-${itemIndex}`}
            item={item}
            section={section}
            sectionIndex={sectionIndex}
            itemIndex={itemIndex}
            options={{
              title: `Opción ${itemIndex + 1}`,
              description: 'Pictograma para rodear o señalar.',
            }}
            handleMoveItem={handleMoveItem}
            handleRemoveItem={handleRemoveItem}
            setEditorTarget={setEditorTarget}
            handleItemTextChange={handleItemTextChange}
          />
        ))}
      </div>
    </div>
  );
};
