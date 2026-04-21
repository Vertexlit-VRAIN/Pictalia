import React from 'react';
import { CommonEditorProps } from './types';
import { WorksheetItemEditor } from './WorksheetItemEditor';
import { getSectionItems } from '../EditableWorksheetDisplay';

export const RepasarEditor: React.FC<CommonEditorProps> = ({
  section,
  sectionIndex,
  handleMoveItem,
  handleRemoveItem,
  setEditorTarget,
  handleItemTextChange,
}) => {
  return (
    <div className="space-y-4">
      <div className="rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        El profesor prepara trazos simples y repetitivos. Conviene usar pocas unidades visuales y letras claras.
      </div>
      <div className="flex flex-col gap-3">
        {getSectionItems(section).map((item, itemIndex) => (
          <WorksheetItemEditor
            key={`${sectionIndex}-${itemIndex}`}
            item={item}
            section={section}
            sectionIndex={sectionIndex}
            itemIndex={itemIndex}
            options={{
              title: `Trazo ${itemIndex + 1}`,
              description: 'Pictograma de apoyo y palabra guía para repasar.',
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
