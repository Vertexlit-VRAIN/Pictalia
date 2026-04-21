import React from 'react';
import { CommonEditorProps } from './types';
import { WorksheetItemEditor } from './WorksheetItemEditor';
import { getSectionItems } from '../EditableWorksheetDisplay';

export const CopiarEditor: React.FC<CommonEditorProps> = ({
  section,
  sectionIndex,
  handleMoveItem,
  handleRemoveItem,
  setEditorTarget,
  handleItemTextChange,
}) => {
  const items = getSectionItems(section);

  return (
    <div className="space-y-4">
      <div className="rounded-[20px] border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
        Cada bloque funciona como un modelo de copia independiente. Puedes añadir varios modelos con su pictograma y texto.
      </div>
      {items.length > 0 && (
        <div className="space-y-4">
          {items.map((item, itemIndex) => (
            <div key={`${sectionIndex}-copy-model-${itemIndex}`}>
              <WorksheetItemEditor
                item={item}
                section={section}
                sectionIndex={sectionIndex}
                itemIndex={itemIndex}
                options={{
                  description: 'Referencia visual completa para copiar.',
                  fullWidth: true,
                }}
                handleMoveItem={handleMoveItem}
                handleRemoveItem={handleRemoveItem}
                setEditorTarget={setEditorTarget}
                handleItemTextChange={handleItemTextChange}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
