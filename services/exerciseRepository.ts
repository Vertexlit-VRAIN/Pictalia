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

export const EXERCISE_TYPE_ORDER: ExerciseType[] = ['repasar', 'unir', 'rodear', 'copiar'];

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

export const EXERCISE_REPOSITORY: Record<ExerciseType, ExerciseTypeDefinition> = {
  repasar: {
    type: 'repasar',
    label: 'Repasar',
    instructionText: 'REPASAR',
    addLabel: 'Añadir trazo',
    defaultLayout: 'column',
    instructionTerms: ['repasar'],
    minimumItems: 1,
    createDefaultExercise: () => ({
      type: 'repasar',
      prompts: [createTraceableWorksheetItem('A')],
    }),
  },
  unir: {
    type: 'unir',
    label: 'Unir',
    instructionText: 'UNIR',
    addLabel: 'Añadir pareja',
    defaultLayout: 'matching_horizontal',
    instructionTerms: ['unir', 'flecha'],
    minimumItems: 4,
    createDefaultExercise: () => ({
      type: 'unir',
      pairs: [
        {
          left: createImageWorksheetItem('sol'),
          right: createImageWorksheetItem('sol'),
        },
        {
          left: createImageWorksheetItem('luna'),
          right: createImageWorksheetItem('luna'),
        },
      ],
    }),
  },
  rodear: {
    type: 'rodear',
    label: 'Rodear',
    instructionText: 'RODEAR',
    addLabel: 'Añadir pictograma',
    defaultLayout: 'row',
    instructionTerms: ['rodear'],
    minimumItems: 2,
    createDefaultExercise: () => ({
      type: 'rodear',
      prompt: null,
      options: [
        createImageWorksheetItem('opcion 1'),
        createImageWorksheetItem('opcion 2'),
      ],
    }),
  },
  copiar: {
    type: 'copiar',
    label: 'Copiar',
    instructionText: 'COPIAR',
    addLabel: 'Añadir copia',
    defaultLayout: 'column',
    instructionTerms: ['copiar'],
    minimumItems: 1,
    createDefaultExercise: () => ({
      type: 'copiar',
      copies: [createTraceableWorksheetItem('PALABRA')],
    }),
  },
};

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
