import React from 'react';
import { WorksheetExercise } from '../../types';
import { WorksheetItemDisplay } from './WorksheetItemDisplay';

export const CopiarDisplay: React.FC<{ exercise: Extract<WorksheetExercise, { type: 'copiar' }> }> = ({ exercise }) => {
  const models = [exercise.model, ...exercise.copies];

  return (
    <div className="flex w-full flex-col items-center gap-6">
      {models.map((item, index) => (
        <div key={index} className="flex w-full flex-col items-center gap-3">
          <WorksheetItemDisplay item={item} index={index} solidText={true} />
          <WorksheetItemDisplay item={item} index={index + 100} hidePicto={true} hideText={true} />
        </div>
      ))}
    </div>
  );
};
