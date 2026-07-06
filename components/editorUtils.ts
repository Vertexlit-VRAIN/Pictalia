import type { WorksheetItem, WorksheetSection } from '../types';
import {
  EXERCISE_TYPE_OPTIONS,
  getExerciseTypeLabel,
} from '../services/exerciseRepository';
import { getFlattenedItemsFromExercise } from '../services/worksheetNormalizer';

const isWorksheetItem = (item: unknown): item is WorksheetItem =>
  typeof item === 'object' &&
  item !== null &&
  !Array.isArray(item) &&
  typeof (item as WorksheetItem).type === 'string';

export const getSectionItems = (section: WorksheetSection): WorksheetItem[] => {
  if (section.items?.length) {
    return section.items.filter(isWorksheetItem);
  }

  if (section.exercise) {
    return getFlattenedItemsFromExercise(section.exercise).filter(isWorksheetItem);
  }

  return (section.items || []).filter(isWorksheetItem);
};

export { EXERCISE_TYPE_OPTIONS, getExerciseTypeLabel };
