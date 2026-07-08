import React from 'react';
import { WorksheetExercise } from '../../../types';
import { WorksheetItemDisplay } from '../../display/WorksheetItemDisplay';

export const CirclingDisplay: React.FC<{ exercise: Extract<WorksheetExercise, { type: 'rodear' }> }> = ({ exercise }) => (
  <div className="space-y-6">
    <div className="flex flex-row items-center justify-center gap-4 flex-wrap">
      {exercise.options.map((item, index) => <WorksheetItemDisplay key={index} item={item} index={index} />)}
    </div>
  </div>
);
