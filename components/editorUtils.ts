import type { ExerciseType, WorksheetItem, WorksheetSection } from '../types';

export const EXERCISE_TYPE_OPTIONS: { value: ExerciseType; label: string; addLabel: string }[] = [
  { value: 'repasar', label: 'Repasar', addLabel: 'Añadir trazo' },
  { value: 'unir', label: 'Unir', addLabel: 'Añadir pareja' },
  { value: 'rodear', label: 'Rodear', addLabel: 'Añadir pictograma' },
  { value: 'copiar', label: 'Copiar', addLabel: 'Añadir copia' },
];

export const getSectionItems = (section: WorksheetSection): WorksheetItem[] => section.items || [];

export const getExerciseTypeLabel = (exerciseType: ExerciseType): string =>
  EXERCISE_TYPE_OPTIONS.find(option => option.value === exerciseType)?.label || exerciseType;
