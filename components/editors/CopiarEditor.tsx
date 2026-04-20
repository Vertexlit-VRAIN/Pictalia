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
  const model = items[0];
  const copies = items.slice(1);

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-sky-50 border border-sky-200 px-4 py-3 text-sm text-sky-900">
        El alumno ve un modelo arriba y varias repeticiones debajo. Solo se edita el modelo (picto y texto), las copias serán automáticamente líneas en blanco.
      </div>
      {model && (
        <div>
          <p className="mb-2 text-sm font-semibold text-gray-700">Modelo a copiar</p>
          <WorksheetItemEditor
            item={model}
            section={section}
            sectionIndex={sectionIndex}
            itemIndex={0}
            options={{
              title: 'Modelo principal',
              description: 'Referencia visual principal.',
              hideMoveButtons: true,
              fullWidth: true,
            }}
            handleMoveItem={handleMoveItem}
            handleRemoveItem={handleRemoveItem}
            setEditorTarget={setEditorTarget}
            handleItemTextChange={handleItemTextChange}
          />
        </div>
      )}
    </div>
  );
};
