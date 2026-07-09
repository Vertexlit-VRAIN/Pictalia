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
  WorksheetSection,
} from '../types';
import {
  createDefaultExercise,
  createImageWorksheetItem,
  createTraceableWorksheetItem,
  getCanonicalLayout,
  getDefaultInstruction,
  getExerciseTypeLabel,
  toExerciseType,
} from './exerciseRepository';

const normalizeText = (value: string | undefined | null): string =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const cloneItem = (item: WorksheetItem): WorksheetItem => ({ ...item });

const withPictogramFields = (
  item: WorksheetItem,
  overrides: Partial<WorksheetItem>
): WorksheetItem => ({
  ...item,
  ...overrides,
  searchTerm: overrides.searchTerm ?? item.searchTerm,
  selectedPictoUrl: overrides.selectedPictoUrl ?? item.selectedPictoUrl,
  pictoOptions: overrides.pictoOptions ?? item.pictoOptions,
  pictogramRenderMode: overrides.pictogramRenderMode ?? item.pictogramRenderMode,
  spelledLetterTerms: overrides.spelledLetterTerms ?? item.spelledLetterTerms,
  spelledLetterUrls: overrides.spelledLetterUrls ?? item.spelledLetterUrls,
  quantity: overrides.quantity !== undefined ? overrides.quantity : item.quantity,
});

const hydrateItem = (base: WorksheetItem, hydrated?: WorksheetItem): WorksheetItem => {
  if (!hydrated) return base;

  const result = { ...base };
  if (hydrated.internalId !== undefined) result.internalId = hydrated.internalId;
  if (hydrated.selectedPictoUrl !== undefined) result.selectedPictoUrl = hydrated.selectedPictoUrl;
  if (hydrated.pictoOptions !== undefined) result.pictoOptions = hydrated.pictoOptions;
  if (hydrated.searchTerm !== undefined) result.searchTerm = hydrated.searchTerm;
  if (hydrated.pictogramRenderMode !== undefined) result.pictogramRenderMode = hydrated.pictogramRenderMode;
  if (hydrated.spelledLetterTerms !== undefined) result.spelledLetterTerms = hydrated.spelledLetterTerms;
  if (hydrated.spelledLetterUrls !== undefined) result.spelledLetterUrls = hydrated.spelledLetterUrls;
  if (hydrated.quantity !== undefined) result.quantity = hydrated.quantity;
  return result;
};

const normalizeInstruction = (
  instruction: WorksheetSection['instruction'] | undefined,
  exerciseType: ExerciseType
): WorksheetInstruction => {
  if (!instruction?.text?.trim()) {
    return getDefaultInstruction(exerciseType);
  }

  return {
    text: instruction.text,
    pictograms: instruction.pictograms?.map(picto => ({
      internalId: picto.internalId,
      searchTerm: picto.searchTerm || picto.content || '',
      content: picto.content || picto.searchTerm || '',
      url: picto.url,
      pictogramRenderMode: picto.pictogramRenderMode,
      spelledLetterTerms: picto.spelledLetterTerms,
      spelledLetterUrls: picto.spelledLetterUrls,
    })),
  };
};

const resolveExerciseType = (section: Partial<WorksheetSection>): ExerciseType => {
  const declaredType = toExerciseType(section.exerciseType);
  const exerciseType = toExerciseType(section.exercise?.type);

  if (declaredType && exerciseType && declaredType !== exerciseType) {
    throw new Error(`La sección mezcla exerciseType "${declaredType}" con exercise.type "${exerciseType}".`);
  }

  const resolvedType = declaredType || exerciseType;
  if (!resolvedType) {
    throw new Error('La sección no contiene un exerciseType válido.');
  }

  return resolvedType;
};

const ensureImageItem = (item: WorksheetItem | undefined, fallbackContent: string): WorksheetItem => {
  if (!item) {
    return createImageWorksheetItem(fallbackContent);
  }

  if (item.type === 'empty_box') {
    return withPictogramFields(item, {
      type: 'image',
      content: item.content || fallbackContent,
      searchTerm: item.searchTerm || item.content || fallbackContent.toLowerCase(),
    });
  }

  return cloneItem(item);
};

const ensureTraceableItem = (item: WorksheetItem | undefined, fallbackContent: string): WorksheetItem => {
  if (!item) {
    return createTraceableWorksheetItem(fallbackContent);
  }

  if (item.type === 'traceable_text') {
    return cloneItem(item);
  }

  return withPictogramFields(item, {
    type: 'traceable_text',
    content: (item.content || item.searchTerm || fallbackContent).toUpperCase(),
  });
};

const normalizeRepasarExercise = (
  exercise: RepasarExercise | undefined,
  items: WorksheetItem[]
): RepasarExercise => {
  const rawItems = items.length > 0 ? items : exercise?.prompts || [];

  // Defensive merge: if generated prompts contain an 'image' card followed by a 'traceable_text' card for the same concept,
  // merge them into a single 'traceable_text' item to avoid visual duplication on paper/screen.
  const sourceItems: WorksheetItem[] = [];
  for (let i = 0; i < rawItems.length; i++) {
    const current = rawItems[i];
    if (
      current.type === 'image' &&
      i + 1 < rawItems.length &&
      rawItems[i + 1].type === 'traceable_text' &&
      (current.content?.toUpperCase() === rawItems[i + 1].content?.toUpperCase() ||
       current.searchTerm?.toUpperCase() === rawItems[i + 1].content?.toUpperCase())
    ) {
      // Merge the pictogram URLs/options from the image card into the traceable_text guide
      const traceable = { ...rawItems[i + 1] };
      traceable.selectedPictoUrl = current.selectedPictoUrl || traceable.selectedPictoUrl;
      traceable.pictoOptions = current.pictoOptions || traceable.pictoOptions;
      traceable.searchTerm = current.searchTerm || traceable.searchTerm;
      sourceItems.push(traceable);
      i++; // Skip the duplicate traceable_text in rawItems
    } else {
      sourceItems.push(current);
    }
  }

  const prompts = sourceItems.length > 0
    ? sourceItems.map((item, index) => {
        const hydratedItem = items.length > 0 && exercise?.prompts?.length ? items[index] : undefined;
        const base = item.type === 'image'
          ? cloneItem(item)
          : ensureTraceableItem(item, item.content || 'A');

        return hydrateItem(base, hydratedItem || item);
      })
    : [createTraceableWorksheetItem('A')];

  return { type: 'repasar', prompts };
};

const normalizeUnirExercise = (
  exercise: UnirExercise | undefined,
  items: WorksheetItem[]
): UnirExercise => {
  if (exercise?.pairs?.length) {
    const isHydrated = items.length === exercise.pairs.length * 2;

    return {
      type: 'unir',
      pairs: exercise.pairs.map((pair, index) => ({
        left: hydrateItem(
          ensureImageItem(pair.left, `opcion ${index * 2 + 1}`),
          isHydrated ? items[index] : pair.left
        ),
        right: hydrateItem(
          ensureImageItem(pair.right, `opcion ${index * 2 + 2}`),
          isHydrated ? items[index + exercise.pairs.length] : pair.right
        ),
      })),
    };
  }

  const normalized = items.map((item, index) =>
    hydrateItem(ensureImageItem(item, `opcion ${index + 1}`), item)
  );

  if (normalized.length % 2 !== 0) {
    normalized.pop();
  }

  const usable = normalized.length >= 4
    ? normalized
    : getFlattenedItemsFromExercise(createDefaultExercise('unir'));

  const midPoint = usable.length / 2;

  return {
    type: 'unir',
    pairs: usable.slice(0, midPoint).map((left, index) => ({
      left: hydrateItem(left, usable[index]),
      right: hydrateItem(usable[index + midPoint], usable[index + midPoint]),
    })),
  };
};

const normalizeRodearExercise = (
  exercise: RodearExercise | undefined,
  items: WorksheetItem[]
): RodearExercise => {
  const sourceOptions = exercise?.options?.length ? exercise.options : items;
  const hasPrompt = !!exercise?.prompt;
  const isHydrated = items.length === sourceOptions.length + (hasPrompt ? 1 : 0);

  const options = sourceOptions.length > 0
    ? sourceOptions.map((item, index) =>
        hydrateItem(
          ensureImageItem(item, `opcion ${index + 1}`),
          isHydrated ? items[index + (hasPrompt ? 1 : 0)] : item
        )
      )
    : getFlattenedItemsFromExercise(createDefaultExercise('rodear'));

  return {
    type: 'rodear',
    prompt: exercise?.prompt
      ? hydrateItem(cloneItem(exercise.prompt), isHydrated ? items[0] : exercise.prompt)
      : null,
    options,
  };
};

const normalizeCopiarExercise = (
  exercise: CopiarExercise | undefined,
  items: WorksheetItem[]
): CopiarExercise => {
  const sourceItems = exercise?.copies?.length ? exercise.copies : items;

  const copies = (sourceItems.length > 0
    ? sourceItems
    : [createTraceableWorksheetItem('PALABRA')]
  )
    .map((item, index) =>
      hydrateItem(
        ensureTraceableItem(item, `PALABRA ${index + 1}`),
        item
      )
    )
    .map((item, index) => ({
      ...item,
      type: 'traceable_text' as const,
      content: (item.content || item.searchTerm || `PALABRA ${index + 1}`).toUpperCase(),
    }))
    .filter((item, index, array) =>
      item.content.trim() &&
      array.findIndex(other => normalizeText(other.content) === normalizeText(item.content)) === index
    );

  return {
    type: 'copiar',
    copies: copies.length > 0
      ? copies
      : [createTraceableWorksheetItem('PALABRA')],
  };
};

const preNormalizeRawExercise = (exercise: any, type: ExerciseType): any => {
  if (!exercise) return undefined;

  if (type === 'repasar') {
    const rawPrompts = exercise.prompts || [];
    const prompts = rawPrompts.map((p: any) => {
      if (typeof p === 'string') {
        return { type: 'traceable_text', content: p };
      }
      return {
        type: p.type || 'traceable_text',
        content: p.content || '',
        searchTerm: p.searchTerm,
      };
    });
    return { type: 'repasar', prompts };
  }

  if (type === 'copiar') {
    const rawCopies = exercise.copies || [];
    const copies = rawCopies.map((c: any) => {
      if (typeof c === 'string') {
        return { type: 'traceable_text', content: c };
      }
      return {
        type: c.type || 'traceable_text',
        content: c.content || '',
        searchTerm: c.searchTerm,
      };
    });
    return { type: 'copiar', copies };
  }

  if (type === 'rodear') {
    const rawOptions = exercise.options || [];
    const options = rawOptions.map((o: any) => {
      if (typeof o === 'string') {
        return { type: 'image', content: o, searchTerm: o.toLowerCase() };
      }
      return {
        type: o.type || 'image',
        content: o.content || '',
        searchTerm: o.searchTerm || o.content || '',
        quantity: o.quantity,
      };
    });
    const prompt = exercise.prompt
      ? (typeof exercise.prompt === 'string'
          ? { type: 'image', content: exercise.prompt, searchTerm: exercise.prompt.toLowerCase() }
          : {
              type: exercise.prompt.type || 'image',
              content: exercise.prompt.content || '',
              searchTerm: exercise.prompt.searchTerm || exercise.prompt.content || '',
            })
      : null;
    return { type: 'rodear', prompt, options };
  }

  if (type === 'unir') {
    const rawPairs = exercise.pairs || [];
    const pairs = rawPairs.map((p: any) => {
      if (!p) return { left: undefined, right: undefined };
      const left = typeof p.left === 'string'
        ? { type: 'image', content: p.left, searchTerm: p.left.toLowerCase() }
        : {
            type: p.left?.type || (p.left?.searchTerm ? 'image' : 'text'),
            content: p.left?.content || '',
            searchTerm: p.left?.searchTerm || '',
            quantity: p.left?.quantity,
          };
      const right = typeof p.right === 'string'
        ? { type: 'image', content: p.right, searchTerm: p.right.toLowerCase() }
        : {
            type: p.right?.type || (p.right?.searchTerm ? 'image' : 'text'),
            content: p.right?.content || '',
            searchTerm: p.right?.searchTerm || '',
            quantity: p.right?.quantity,
          };
      return { left, right };
    });
    return { type: 'unir', pairs };
  }

  return exercise;
};

const normalizeExercise = (
  section: Partial<WorksheetSection>,
  exerciseType: ExerciseType
): WorksheetExercise => {
  const items = section.items || [];
  const rawExercise = preNormalizeRawExercise(section.exercise, exerciseType);

  switch (exerciseType) {
    case 'repasar':
      return normalizeRepasarExercise(rawExercise, items);
    case 'unir':
      return normalizeUnirExercise(rawExercise, items);
    case 'copiar':
      return normalizeCopiarExercise(rawExercise, items);
    case 'rodear':
    default:
      return normalizeRodearExercise(rawExercise, items);
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
      return exercise.copies.map(cloneItem);
  }
};

export const normalizeWorksheetSection = (section: Partial<WorksheetSection>): WorksheetSection => {
  const exerciseType = resolveExerciseType(section);
  const exercise = normalizeExercise(section, exerciseType);

  return {
    internalId: section.internalId,
    instruction: normalizeInstruction(section.instruction, exerciseType),
    exerciseType,
    exercise,
    items: getFlattenedItemsFromExercise(exercise),
    layout: getCanonicalLayout(exerciseType),
  };
};

export const normalizeWorksheet = (worksheet: Worksheet): Worksheet => ({
  ...worksheet,
  pictogramRenderMode: worksheet.pictogramRenderMode,
  spelledLetterTerms: worksheet.spelledLetterTerms,
  spelledLetterUrls: worksheet.spelledLetterUrls,
  sections: (worksheet.sections || []).map(section => normalizeWorksheetSection(section)),
});

export { getCanonicalLayout, getExerciseTypeLabel };
