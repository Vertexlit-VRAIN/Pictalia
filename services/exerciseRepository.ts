import type {
  ExerciseType,
  WorksheetExercise,
  WorksheetInstruction,
  WorksheetInstructionPicto,
  WorksheetItem,
  WorksheetLayout,
} from '../types';

export interface ExerciseTypeDefinition {
  type: ExerciseType;
  label: string;
  instructionText: string;
  addLabel: string;
  defaultLayout: WorksheetLayout;
  instructionTerms: string[];
  minimumItems: number;
  createDefaultExercise: () => WorksheetExercise;
}

import { EXERCISE_TYPE_ORDER, EXERCISE_REGISTRY } from '../components/exercises/registry';

export const createImageWorksheetItem = (content: string): WorksheetItem => ({
  type: 'image',
  content,
  searchTerm: content.toLowerCase(),
  selectedPictoUrl: '',
  pictoOptions: [],
  pictogramRenderMode: 'auto',
  spelledLetterTerms: [],
  spelledLetterUrls: [],
});

export const createTraceableWorksheetItem = (content: string): WorksheetItem => ({
  type: 'traceable_text',
  content: content.toUpperCase(),
});

export const createInstructionPictogram = (content: string): WorksheetInstructionPicto => ({
  content: content.toUpperCase(),
  searchTerm: content.toLowerCase(),
  url: '',
  pictogramRenderMode: 'auto',
  spelledLetterTerms: [content],
  spelledLetterUrls: [],
});

export const EXERCISE_REPOSITORY: Record<ExerciseType, ExerciseTypeDefinition> = {} as any;

EXERCISE_TYPE_ORDER.forEach((type) => {
  const manifest = EXERCISE_REGISTRY[type];
  EXERCISE_REPOSITORY[type] = {
    type,
    label: manifest.label,
    instructionText: manifest.instructionText,
    addLabel: manifest.addLabel,
    defaultLayout: manifest.defaultLayout,
    instructionTerms: manifest.instructionTerms,
    minimumItems: manifest.minimumItems,
    createDefaultExercise: manifest.createDefaultExercise,
  };
});

export const EXERCISE_TYPE_OPTIONS = EXERCISE_TYPE_ORDER.map(type => ({
  value: type,
  label: EXERCISE_REPOSITORY[type].label,
  addLabel: EXERCISE_REPOSITORY[type].addLabel,
}));

export const isExerciseType = (value: unknown): value is ExerciseType =>
  typeof value === 'string' && EXERCISE_TYPE_ORDER.includes(value as ExerciseType);

export const toExerciseType = (value: unknown): ExerciseType | null => {
  if (isExerciseType(value)) return value;
  return null;
};

export const getExerciseDefinition = (type: ExerciseType): ExerciseTypeDefinition =>
  EXERCISE_REPOSITORY[type];

export const getExerciseTypeLabel = (type: ExerciseType): string =>
  getExerciseDefinition(type).label;

export const getExerciseTypeAddLabel = (type: ExerciseType): string =>
  getExerciseDefinition(type).addLabel;

export const getCanonicalLayout = (type: ExerciseType): WorksheetLayout =>
  getExerciseDefinition(type).defaultLayout;

export const getDefaultInstruction = (type: ExerciseType): WorksheetInstruction => {
  const definition = getExerciseDefinition(type);

  return {
    text: definition.instructionText,
    pictograms: definition.instructionTerms.map(term => ({
      searchTerm: term,
      content: term.toUpperCase(),
    })),
  };
};

export const createDefaultExercise = (type: ExerciseType): WorksheetExercise =>
  getExerciseDefinition(type).createDefaultExercise();

export const exerciseTypesForPrompt = (): string =>
  EXERCISE_TYPE_ORDER.map(type => `"${type}"`).join(', ');
