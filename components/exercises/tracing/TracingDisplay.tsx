import React from 'react';
import { WorksheetExercise } from '../../../types';
import { WorksheetItemDisplay } from '../../display/WorksheetItemDisplay';

export const TracingDisplay: React.FC<{ exercise: Extract<WorksheetExercise, { type: 'repasar' }> }> = ({ exercise }) => (
  <div className="flex flex-col items-center justify-center gap-4">
    {exercise.prompts.map((item, index) => <WorksheetItemDisplay key={index} item={item} index={index} showMidline={false} />)}
  </div>
);
