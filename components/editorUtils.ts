import type { ExerciseType, WorksheetItem, WorksheetSection } from '../types';

export const EXERCISE_TYPE_OPTIONS: { value: ExerciseType; label: string; addLabel: string }[] = [
  { value: 'repasar', label: 'Repasar', addLabel: 'Añadir trazo' },
  { value: 'unir', label: 'Unir', addLabel: 'Añadir pareja' },
  { value: 'rodear', label: 'Rodear', addLabel: 'Añadir pictograma' },
  { value: 'copiar', label: 'Copiar', addLabel: 'Añadir copia' },
];

const isWorksheetItem = (item: unknown): item is WorksheetItem =>
  typeof item === 'object' &&
  item !== null &&
  !Array.isArray(item) &&
  typeof (item as WorksheetItem).type === 'string';

export const getSectionItems = (section: WorksheetSection): WorksheetItem[] => {
  if (section.exercise) {
    switch (section.exercise.type) {
      case 'repasar':
        return section.exercise.prompts.filter(isWorksheetItem);

      case 'unir':
        return [
          ...section.exercise.pairs.map(pair => pair.left).filter(isWorksheetItem),
          ...section.exercise.pairs.map(pair => pair.right).filter(isWorksheetItem),
        ];

      case 'rodear':
        return [
          ...(isWorksheetItem(section.exercise.prompt) ? [section.exercise.prompt] : []),
          ...section.exercise.options.filter(isWorksheetItem),
        ];

      case 'copiar':
        return section.exercise.copies.filter(isWorksheetItem);
    }
  }

  return (section.items || []).filter(isWorksheetItem);
};

export const getExerciseTypeLabel = (exerciseType: ExerciseType): string =>
  EXERCISE_TYPE_OPTIONS.find(option => option.value === exerciseType)?.label || exerciseType;