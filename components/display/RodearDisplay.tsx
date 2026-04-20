import React from 'react';
import { WorksheetExercise } from '../../types';
import { WorksheetItemDisplay } from './WorksheetItemDisplay';

export const RodearDisplay: React.FC<{ exercise: Extract<WorksheetExercise, { type: 'rodear' }> }> = ({ exercise }) => (
  <div className="space-y-6">
    {exercise.prompt && (
      <div className="flex justify-center">
        <WorksheetItemDisplay item={exercise.prompt} index={0} />
      </div>
    )}
    <div className="flex flex-row items-center justify-center gap-4 flex-wrap">
      {exercise.options.map((item, index) => <WorksheetItemDisplay key={index} item={item} index={index + (exercise.prompt ? 1 : 0)} />)}
    </div>
  </div>
);
