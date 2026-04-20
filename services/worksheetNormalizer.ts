import type {
  CopiarExercise,
  ExerciseType,
  RepasarExercise,
  RodearExercise,
  UnirExercise,
  Worksheet,
  WorksheetExercise,
  WorksheetInstruction,
  WorksheetItem,
  WorksheetLayout,
  WorksheetSection,
} from '../types';

const EXERCISE_TYPE_LABELS: Record<ExerciseType, string> = {
  repasar: 'REPASAR',
  unir: 'UNIR',
  rodear: 'RODEAR',
  copiar: 'COPIAR',
};

const EXERCISE_TYPE_TERMS: Record<ExerciseType, string[]> = {
  repasar: ['repasar'],
  unir: ['unir', 'flecha'],
  rodear: ['rodear'],
  copiar: ['copiar'],
};

const LEGACY_EXERCISE_TYPE_MAP: Record<string, ExerciseType> = {
  relacionar: 'unir',
  pintar: 'rodear',
};

const normalizeText = (value: string | undefined | null): string =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const isExerciseType = (value: unknown): value is ExerciseType =>
  value === 'repasar' || value === 'unir' || value === 'rodear' || value === 'copiar';

const toExerciseType = (value: unknown): ExerciseType | null => {
  if (isExerciseType(value)) {
    return value;
  }

  if (typeof value === 'string' && LEGACY_EXERCISE_TYPE_MAP[value]) {
    return LEGACY_EXERCISE_TYPE_MAP[value];
  }

  return null;
};

const cloneItem = (item: WorksheetItem): WorksheetItem => ({ ...item });

const getDefaultInstruction = (exerciseType: ExerciseType): WorksheetInstruction => ({
  text: EXERCISE_TYPE_LABELS[exerciseType],
  pictograms: EXERCISE_TYPE_TERMS[exerciseType].map(term => ({
    searchTerm: term,
    content: term.toUpperCase(),
  })),
});

const normalizeInstruction = (instruction: WorksheetSection['instruction'] | undefined, exerciseType: ExerciseType): WorksheetInstruction => {
  if (!instruction?.text?.trim()) {
    return getDefaultInstruction(exerciseType);
  }

  return {
    text: instruction.text.trim().toUpperCase(),
    pictograms: instruction.pictograms?.map(picto => ({
      searchTerm: picto.searchTerm || picto.content || '',
      content: picto.content || picto.searchTerm || '',
      url: picto.url,
    })),
  };
};

const inferExerciseTypeFromInstruction = (
  instructionText: string,
  pictograms?: WorksheetInstruction['pictograms']
): ExerciseType | null => {
  const normalizedInstruction = normalizeText(instructionText);
  const pictogramTerms = (pictograms || []).map(picto => normalizeText(picto.searchTerm || picto.content)).join(' ');
  const combined = `${normalizedInstruction} ${pictogramTerms}`.trim();

  if (combined.includes('unir') || combined.includes('relacion') || combined.includes('flecha')) {
    return 'unir';
  }
  if (combined.includes('repasa') || combined.includes('traza')) {
    return 'repasar';
  }
  if (combined.includes('copia') || combined.includes('escribe')) {
    return 'copiar';
  }
  if (combined.includes('rodea') || combined.includes('encierra') || combined.includes('senala') || combined.includes('marca')) {
    return 'rodear';
  }

  return null;
};

const inferExerciseTypeFromLayout = (layout?: WorksheetLayout): ExerciseType | null => {
  if (layout === 'matching_horizontal') {
    return 'unir';
  }
  if (layout === 'column') {
    return 'repasar';
  }
  if (layout === 'sentence_building' || layout === 'true_false') {
    return 'copiar';
  }
  if (layout === 'row') {
    return 'rodear';
  }
  return null;
};

const inferExerciseTypeFromItems = (items: WorksheetItem[]): ExerciseType => {
  const hasTraceable = items.some(item => item.type === 'traceable_text');
  if (hasTraceable) {
    return items.length > 1 ? 'copiar' : 'repasar';
  }

  const hasOnlyImages = items.length > 0 && items.every(item => item.type === 'image');
  if (hasOnlyImages && items.length % 2 === 0 && items.length >= 4) {
    return 'unir';
  }

  return 'rodear';
};

const inferExerciseType = (section: Partial<WorksheetSection>): ExerciseType => {
  return (
    toExerciseType(section.exercise?.type) ||
    toExerciseType(section.exerciseType) ||
    inferExerciseTypeFromInstruction(section.instruction?.text || '', section.instruction?.pictograms) ||
    inferExerciseTypeFromLayout(section.layout) ||
    inferExerciseTypeFromItems(section.items || [])
  );
};

const ensureImageItem = (item: WorksheetItem | undefined, fallbackContent: string): WorksheetItem => {
  if (!item) {
    return { type: 'image', content: fallbackContent, searchTerm: fallbackContent.toLowerCase() };
  }

  if (item.type === 'empty_box') {
    return { type: 'image', content: item.content || fallbackContent, searchTerm: item.searchTerm || item.content || fallbackContent.toLowerCase() };
  }

  return cloneItem(item);
};

const ensureTraceableItem = (item: WorksheetItem | undefined, fallbackContent: string): WorksheetItem => {
  if (!item) {
    return { type: 'traceable_text', content: fallbackContent };
  }

  if (item.type === 'traceable_text') {
    return cloneItem(item);
  }

  return { ...cloneItem(item), type: 'traceable_text', content: item.content || fallbackContent };
};

const normalizeRepasarExercise = (exercise: RepasarExercise | undefined, items: WorksheetItem[]): RepasarExercise => {
  const sourceItems = items.length > 0 ? items : (exercise?.prompts || []);
  const prompts = sourceItems.length > 0
    ? sourceItems.map(item => {
        if (item.type === 'image') {
          return cloneItem(item);
        }
        return ensureTraceableItem(item, item.content || 'A');
      })
    : [{ type: 'traceable_text', content: 'A' }];

  return { type: 'repasar', prompts };
};

const normalizeUnirExercise = (exercise: UnirExercise | undefined, items: WorksheetItem[]): UnirExercise => {
  if (exercise?.pairs?.length) {
    return {
      type: 'unir',
      pairs: exercise.pairs.map((pair, index) => ({
        left: ensureImageItem(pair.left, `opcion ${index * 2 + 1}`),
        right: ensureImageItem(pair.right, `opcion ${index * 2 + 2}`),
      })),
    };
  }

  const normalized = items.map((item, index) => ensureImageItem(item, `opcion ${index + 1}`));
  if (normalized.length % 2 !== 0) {
    normalized.pop();
  }

  const usable = normalized.length >= 4
    ? normalized
    : [
        { type: 'image', content: 'sol', searchTerm: 'sol' },
        { type: 'image', content: 'luna', searchTerm: 'luna' },
        { type: 'image', content: 'sol', searchTerm: 'sol' },
        { type: 'image', content: 'luna', searchTerm: 'luna' },
      ];

  const midPoint = usable.length / 2;
  return {
    type: 'unir',
    pairs: usable.slice(0, midPoint).map((left, index) => ({
      left,
      right: usable[index + midPoint],
    })),
  };
};

const normalizeRodearExercise = (exercise: RodearExercise | undefined, items: WorksheetItem[]): RodearExercise => {
  const sourceOptions = exercise?.options?.length ? exercise.options : items;
  const options = sourceOptions.length > 0
    ? sourceOptions.map((item, index) => ensureImageItem(item, `opcion ${index + 1}`))
    : [
        { type: 'image', content: 'opcion 1', searchTerm: 'opcion' },
        { type: 'image', content: 'opcion 2', searchTerm: 'opcion' },
      ];

  return {
    type: 'rodear',
    prompt: exercise?.prompt ? cloneItem(exercise.prompt) : null,
    options,
  };
};

const normalizeCopiarExercise = (exercise: CopiarExercise | undefined, items: WorksheetItem[]): CopiarExercise => {
  if (exercise?.model) {
    return {
      type: 'copiar',
      model: ensureTraceableItem(exercise.model, 'A'),
      copies: exercise.copies?.length
        ? exercise.copies.map((item, index) => ensureTraceableItem(item, String.fromCharCode(65 + index)))
        : [ensureTraceableItem(undefined, exercise.model.content || 'A')],
    };
  }

  const sourceItems = items.length > 0 ? items : [{ type: 'traceable_text', content: 'A' }];
  const [model, ...rest] = sourceItems;

  return {
    type: 'copiar',
    model: ensureTraceableItem(model, 'A'),
    copies: (rest.length > 0 ? rest : [model]).map((item, index) => ensureTraceableItem(item, String.fromCharCode(65 + index))),
  };
};

const normalizeExercise = (section: Partial<WorksheetSection>, exerciseType: ExerciseType): WorksheetExercise => {
  const items = section.items || [];

  switch (exerciseType) {
    case 'repasar':
      return normalizeRepasarExercise(section.exercise?.type === 'repasar' ? section.exercise : undefined, items);
    case 'unir':
      return normalizeUnirExercise(section.exercise?.type === 'unir' ? section.exercise : undefined, items);
    case 'copiar':
      return normalizeCopiarExercise(section.exercise?.type === 'copiar' ? section.exercise : undefined, items);
    case 'rodear':
    default:
      return normalizeRodearExercise(section.exercise?.type === 'rodear' ? section.exercise : undefined, items);
  }
};

export const getFlattenedItemsFromExercise = (exercise: WorksheetExercise): WorksheetItem[] => {
  switch (exercise.type) {
    case 'repasar':
      return exercise.prompts.map(cloneItem);
    case 'unir':
      return [
        ...exercise.pairs.map(pair => cloneItem(pair.left)),
        ...exercise.pairs.map(pair => cloneItem(pair.right)),
      ];
    case 'rodear':
      return [
        ...(exercise.prompt ? [cloneItem(exercise.prompt)] : []),
        ...exercise.options.map(cloneItem),
      ];
    case 'copiar':
      return [cloneItem(exercise.model), ...exercise.copies.map(cloneItem)];
  }
};

export const getCanonicalLayout = (exerciseType: ExerciseType): WorksheetLayout => {
  switch (exerciseType) {
    case 'unir':
      return 'matching_horizontal';
    case 'repasar':
    case 'copiar':
      return 'column';
    case 'rodear':
    default:
      return 'row';
  }
};

export const normalizeWorksheetSection = (section: Partial<WorksheetSection>): WorksheetSection => {
  const exerciseType = inferExerciseType(section);
  const exercise = normalizeExercise(section, exerciseType);

  return {
    instruction: normalizeInstruction(section.instruction, exerciseType),
    exerciseType,
    exercise,
    items: getFlattenedItemsFromExercise(exercise),
    layout: getCanonicalLayout(exerciseType),
  };
};

export const normalizeWorksheet = (worksheet: Worksheet): Worksheet => ({
  ...worksheet,
  sections: (worksheet.sections || []).map(section => normalizeWorksheetSection(section)),
});

export const getExerciseTypeLabel = (exerciseType: ExerciseType): string => EXERCISE_TYPE_LABELS[exerciseType];
