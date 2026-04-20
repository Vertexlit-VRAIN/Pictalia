import React, { useEffect, useMemo, useState } from 'react';
import { WorksheetExercise, WorksheetItem } from '../../types';
import { WorksheetItemDisplay } from './WorksheetItemDisplay';

const shuffleArray = <T,>(items: T[]): T[] => {
  const next = [...items];

  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }

  return next;
};

const shuffleAvoidingSamePosition = <T,>(items: T[]): T[] => {
  if (items.length <= 2) {
    return shuffleArray(items);
  }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const shuffled = shuffleArray(items);
    const hasSamePosition = shuffled.some((item, index) => item === items[index]);

    if (!hasSamePosition) {
      return shuffled;
    }
  }

  return shuffleArray(items);
};

export const UnirDisplay: React.FC<{ exercise: Extract<WorksheetExercise, { type: 'unir' }> }> = ({ exercise }) => {
  const leftColumnItems = exercise.pairs.map(pair => pair.left);
  const rightItems = exercise.pairs.map(pair => pair.right);

  const pairsSignature = useMemo(
    () =>
      exercise.pairs
        .map(
          (pair) =>
            `${pair.left.content}|${pair.left.searchTerm || ''}|${pair.right.content}|${pair.right.searchTerm || ''}`
        )
        .join('||'),
    [exercise.pairs]
  );

  const [rightColumnItems, setRightColumnItems] = useState<WorksheetItem[]>(() =>
    shuffleAvoidingSamePosition(rightItems)
  );

  useEffect(() => {
    setRightColumnItems(shuffleAvoidingSamePosition(rightItems));
  }, [pairsSignature]);

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
