import React from 'react';
import { WorksheetExercise } from '../../types';
import { WorksheetItemDisplay } from './WorksheetItemDisplay';
import { getStableShuffledItems } from '../WorksheetDisplay';

export const UnirDisplay: React.FC<{ exercise: Extract<WorksheetExercise, { type: 'unir' }> }> = ({ exercise }) => {
  const leftColumnItems = exercise.pairs.map(pair => pair.left);
  const rightColumnItems = getStableShuffledItems(exercise.pairs.map(pair => pair.right));

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_180px_minmax(0,1fr)] items-start">
      <div className="flex flex-col gap-8 items-end">
        {leftColumnItems.map((item, index) => (
          <div key={`left-${index}`} className="flex items-center gap-4">
            <WorksheetItemDisplay item={item} index={index} />
            <div className="w-5 h-5 rounded-full border-2 border-black bg-white shadow-inner flex-shrink-0"></div>
          </div>
        ))}
      </div>

      <div className="min-h-full"></div>

      <div className="flex flex-col gap-8 items-start">
        {rightColumnItems.map((item, index) => (
          <div key={`right-${index}`} className="flex items-center gap-4">
            <div className="w-5 h-5 rounded-full border-2 border-black bg-white shadow-inner flex-shrink-0"></div>
            <WorksheetItemDisplay item={item} index={index + leftColumnItems.length} />
          </div>
        ))}
      </div>
    </div>
  );
};
