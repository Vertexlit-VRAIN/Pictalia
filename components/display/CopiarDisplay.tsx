import React from 'react';
import { WorksheetExercise } from '../../types';
import { WorksheetItemDisplay } from './WorksheetItemDisplay';

export const CopiarDisplay: React.FC<{ exercise: Extract<WorksheetExercise, { type: 'copiar' }> }> = ({ exercise }) => (
  <div className="flex flex-col items-center gap-6">
    <div className="flex items-center justify-center">
      <WorksheetItemDisplay item={exercise.model} index={0} solidText={true} />
    </div>
    <div className="flex flex-row items-center justify-center gap-4 flex-wrap">
      {exercise.copies.map((item, index) => <WorksheetItemDisplay key={index} item={item} index={index + 1} hidePicto={true} hideText={true} />)}
    </div>
  </div>
);
