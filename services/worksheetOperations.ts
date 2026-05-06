import { produce } from 'immer';
import type {
  SavedWorksheet,
  Worksheet,
  WorksheetEntityId,
  WorksheetInstructionPicto,
  WorksheetItem,
  WorksheetOperation,
  WorksheetOperationRequest,
  WorksheetSection,
} from '../types';
import { normalizeWorksheet, normalizeWorksheetSection } from './worksheetNormalizer';

const ID_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
const ID_LENGTH = 6;

const randomId = (): WorksheetEntityId => {
  let result = '';
  for (let index = 0; index < ID_LENGTH; index += 1) {
    const randomIndex = Math.floor(Math.random() * ID_ALPHABET.length);
    result += ID_ALPHABET[randomIndex];
  }
  return result;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const unwrapFirst = (value: unknown): unknown =>
  Array.isArray(value) ? value[0] : value;

const textFromAIItem = (value: unknown, fallback: string): string => {
  if (!isRecord(value)) {
    return fallback;
  }

  const content = typeof value.content === 'string' ? value.content.trim() : '';
  const searchTerm = typeof value.searchTerm === 'string' ? value.searchTerm.trim() : '';

  return (content || searchTerm || fallback).toUpperCase();
};

const toTraceableTextFromAIItem = (value: unknown, fallback: string): WorksheetItem => ({
  type: 'traceable_text',
  content: textFromAIItem(value, fallback),
});

const assignInstructionPictoIds = (
  pictograms?: WorksheetInstructionPicto[]
): WorksheetInstructionPicto[] | undefined =>
  pictograms?.map(pictogram => ({
    ...pictogram,
    internalId: pictogram.internalId || randomId(),
  }));

const assignItemIds = (items?: WorksheetItem[]): WorksheetItem[] | undefined =>
  items?.map(item => ({
    ...item,
    internalId: item.internalId || randomId(),
  }));

export const ensureWorksheetInternalIds = <T extends Worksheet>(worksheet: T): T => ({
  ...worksheet,
  sections: (worksheet.sections || []).map(section => ({
    ...section,
    internalId: section.internalId || randomId(),
    instruction: {
      ...section.instruction,
      pictograms: assignInstructionPictoIds(section.instruction.pictograms),
    },
    items: assignItemIds(section.items),
    exercise: section.exercise
      ? {
          ...section.exercise,
          ...(section.exercise.type === 'repasar'
            ? { prompts: assignItemIds(section.exercise.prompts) || [] }
            : {}),
          ...(section.exercise.type === 'unir'
            ? {
                pairs: section.exercise.pairs.map(pair => ({
                  left: { ...pair.left, internalId: pair.left.internalId || randomId() },
                  right: { ...pair.right, internalId: pair.right.internalId || randomId() },
                })),
              }
            : {}),
          ...(section.exercise.type === 'rodear'
            ? {
                prompt: section.exercise.prompt
                  ? {
                      ...section.exercise.prompt,
                      internalId: section.exercise.prompt.internalId || randomId(),
                    }
                  : null,
                options: assignItemIds(section.exercise.options) || [],
              }
            : {}),
          ...(section.exercise.type === 'copiar'
            ? {
                copies: assignItemIds(section.exercise.copies) || [],
              }
            : {}),
        }
      : section.exercise,
  })),
}) as T;

const sanitizeInstructionPictogramForAI = (pictogram: WorksheetInstructionPicto) => ({
  searchTerm: pictogram.searchTerm || pictogram.content || '',
  content: pictogram.content || pictogram.searchTerm || '',
});

const sanitizeImageItemForAI = (item: WorksheetItem): WorksheetItem => {
  const content = item.content || item.searchTerm || '';

  return {
    type: 'image',
    content,
    searchTerm: item.searchTerm || content,
  };
};

const sanitizeTraceableItemForAI = (item: WorksheetItem): WorksheetItem => ({
  type: 'traceable_text',
  content: (item.content || item.searchTerm || '').toUpperCase(),
});

const sanitizeItemForAI = (item: WorksheetItem): WorksheetItem => {
  if (item.type === 'image') {
    return sanitizeImageItemForAI(item);
  }

  if (item.type === 'traceable_text') {
    return sanitizeTraceableItemForAI(item);
  }

  if (item.type === 'empty_box') {
    return {
      type: 'empty_box',
      content: item.content || '',
    };
  }

  return {
    type: item.type,
    content: item.content || '',
    searchTerm: item.searchTerm || item.content || '',
  } as WorksheetItem;
};

const sanitizeCopiarSectionForAI = (
  section: Partial<WorksheetSection>,
  instruction: WorksheetSection['instruction']
) => {
  const rawExercise = isRecord(section.exercise) ? section.exercise : {};
  const rawModel = unwrapFirst(rawExercise.model);
  const rawCopies = Array.isArray(rawExercise.copies) ? rawExercise.copies : [];

  const allCopyItems = [
    rawModel,
    ...rawCopies,
  ].filter(Boolean);

  const copies = allCopyItems
    .map((item, index) => toTraceableTextFromAIItem(item, `PALABRA ${index + 1}`))
    .filter((item, index, array) =>
      item.content.trim() &&
      array.findIndex(other => other.content === item.content) === index
    );

  return {
    exerciseType: 'copiar' as const,
    instruction,
    exercise: {
      type: 'copiar' as const,
      copies: copies.length > 0
        ? copies
        : [
            {
              type: 'traceable_text' as const,
              content: 'PALABRA',
            },
          ],
    },
  };
};

const sanitizeSectionForAI = (section: Partial<WorksheetSection>) => {
  const normalizedSection = normalizeWorksheetSection(section);

  const instruction = {
    text: normalizedSection.instruction.text,
    pictograms: normalizedSection.instruction.pictograms?.map(sanitizeInstructionPictogramForAI) || [],
  };

  if (section.exerciseType === 'copiar' || section.exercise?.type === 'copiar') {
    return sanitizeCopiarSectionForAI(section, instruction);
  }

  switch (normalizedSection.exercise.type) {
    case 'repasar':
      return {
        exerciseType: 'repasar' as const,
        instruction,
        exercise: {
          type: 'repasar' as const,
          prompts: normalizedSection.exercise.prompts.map(sanitizeTraceableItemForAI),
        },
      };

    case 'unir':
      return {
        exerciseType: 'unir' as const,
        instruction,
        exercise: {
          type: 'unir' as const,
          pairs: normalizedSection.exercise.pairs.map(pair => ({
            left: sanitizeImageItemForAI(pair.left),
            right: sanitizeImageItemForAI(pair.right),
          })),
        },
      };

    case 'rodear':
      return {
        exerciseType: 'rodear' as const,
        instruction,
        exercise: {
          type: 'rodear' as const,
          prompt: normalizedSection.exercise.prompt
            ? sanitizeItemForAI(normalizedSection.exercise.prompt)
            : null,
          options: normalizedSection.exercise.options.map(sanitizeImageItemForAI),
        },
      };

    case 'copiar':
    default:
      return sanitizeCopiarSectionForAI(normalizedSection, instruction);
  }
};

const normalizeIncomingSection = (
  section: Partial<WorksheetSection>,
  existingSectionId?: WorksheetEntityId
): WorksheetSection => {
  // Local editor operations already provide a valid worksheet section shape and may
  // include pictogram metadata that sanitizeSectionForAI intentionally strips for
  // AI prompts. Normalize the incoming section directly so those fields persist.
  const normalizedSection = normalizeWorksheetSection(section);

  return ensureWorksheetInternalIds({
    title: '',
    pictogramSearchTerm: '',
    sections: [{
      ...normalizedSection,
      internalId: existingSectionId || normalizedSection.internalId,
    }],
  }).sections[0];
};

const insertAfterSectionId = (
  sections: WorksheetSection[],
  afterSectionId: WorksheetEntityId | undefined,
  nextSection: WorksheetSection
) => {
  if (!afterSectionId) {
    sections.push(nextSection);
    return;
  }

  const afterIndex = sections.findIndex(section => section.internalId === afterSectionId);
  if (afterIndex === -1) {
    sections.push(nextSection);
    return;
  }

  sections.splice(afterIndex + 1, 0, nextSection);
};

export const buildWorksheetEditingContext = (
  worksheet: SavedWorksheet,
  targetSectionId?: WorksheetEntityId
): {
  worksheetPayload: string;
  worksheetContextSummary: string;
  targetSectionContent?: string;
} => {
  const worksheetWithIds = ensureWorksheetInternalIds(
    normalizeWorksheet(worksheet) as SavedWorksheet
  );

  const targetSection = targetSectionId
    ? worksheetWithIds.sections.find(section => section.internalId === targetSectionId)
    : undefined;

  if (targetSectionId && !targetSection) {
    throw new Error('No se encontró la sección objetivo en la ficha actual.');
  }

  const sectionsForAI = worksheetWithIds.sections.map((section, index) => ({
    index,
    sectionId: section.internalId,
    ...sanitizeSectionForAI(section),
  }));

  const worksheetPayload = JSON.stringify({
    title: worksheetWithIds.title,
    pictogramSearchTerm: worksheetWithIds.pictogramSearchTerm,
    originalTopic: worksheetWithIds.originalTopic,
    originalGoal: worksheetWithIds.originalGoal,
    originalExtraDetails: worksheetWithIds.originalExtraDetails,
    sections: sectionsForAI,
  }, null, 2);

  const worksheetContextSummary = sectionsForAI
    .map(section => [
      `Ejercicio ${section.index + 1}`,
      `- sectionId: ${section.sectionId}`,
      `- tipo: ${section.exerciseType}`,
      `- instrucción: ${section.instruction.text}`,
    ].join('\n'))
    .join('\n\n');

  const targetSectionContent = targetSection
    ? JSON.stringify({
        sectionId: targetSection.internalId,
        ...sanitizeSectionForAI(targetSection),
      }, null, 2)
    : undefined;

  return {
    worksheetPayload,
    worksheetContextSummary,
    targetSectionContent,
  };
};

export const applyWorksheetOperations = (
  worksheet: SavedWorksheet,
  operations: WorksheetOperation[]
): SavedWorksheet => {
  const nextWorksheet = produce(ensureWorksheetInternalIds(worksheet), draft => {
    operations.forEach(operation => {
      switch (operation.type) {
        case 'update_worksheet': {
          Object.assign(draft, operation.changes);
          break;
        }

        case 'create_section': {
          insertAfterSectionId(
            draft.sections,
            operation.afterSectionId,
            normalizeIncomingSection(operation.section)
          );
          break;
        }

        case 'update_section': {
          const sectionIndex = draft.sections.findIndex(section => section.internalId === operation.sectionId);
          if (sectionIndex === -1) return;

          draft.sections[sectionIndex] = normalizeIncomingSection(operation.section, operation.sectionId);
          break;
        }

        case 'delete_section': {
          const sectionIndex = draft.sections.findIndex(section => section.internalId === operation.sectionId);
          if (sectionIndex === -1 || draft.sections.length <= 1) return;

          draft.sections.splice(sectionIndex, 1);
          break;
        }

        case 'move_section': {
          const fromIndex = draft.sections.findIndex(section => section.internalId === operation.sectionId);
          if (fromIndex === -1) return;

          const boundedIndex = Math.max(0, Math.min(operation.toIndex, draft.sections.length - 1));
          if (boundedIndex === fromIndex) return;

          const [movedSection] = draft.sections.splice(fromIndex, 1);
          draft.sections.splice(boundedIndex, 0, movedSection);
          break;
        }
      }
    });
  });

  return ensureWorksheetInternalIds(normalizeWorksheet(nextWorksheet) as SavedWorksheet);
};

export const describeWorksheetOperations = (operations: WorksheetOperation[]): string => {
  if (operations.length === 1) {
    const [operation] = operations;

    switch (operation.type) {
      case 'update_worksheet':
        return 'Edición de ficha';
      case 'create_section':
        return 'Creación de ejercicio';
      case 'update_section':
        return 'Edición de ejercicio';
      case 'delete_section':
        return 'Borrado de ejercicio';
      case 'move_section':
        return 'Reordenación de ejercicios';
    }
  }

  return `Lote de ${operations.length} operaciones`;
};

const isValidOperation = (value: unknown): value is WorksheetOperation => {
  if (!isRecord(value) || typeof value.type !== 'string') {
    return false;
  }

  switch (value.type) {
    case 'update_worksheet':
      return isRecord(value.changes);
    case 'create_section':
      return isRecord(value.section);
    case 'update_section':
      return typeof value.sectionId === 'string' && isRecord(value.section);
    case 'delete_section':
      return typeof value.sectionId === 'string';
    case 'move_section':
      return typeof value.sectionId === 'string' && typeof value.toIndex === 'number';
    default:
      return false;
  }
};

export const parseWorksheetOperationRequest = (payload: unknown): WorksheetOperationRequest => {
  if (!isRecord(payload) || !Array.isArray(payload.operations)) {
    throw new Error('La IA no devolvió una lista de operaciones válida.');
  }

  const invalidOperations = payload.operations.filter(operation => !isValidOperation(operation));
  if (invalidOperations.length > 0) {
    console.warn('Operaciones inválidas devueltas por la IA:', invalidOperations);
  }

  const operations = payload.operations.filter(isValidOperation);

  if (operations.length === 0) {
    throw new Error('La IA no devolvió operaciones aplicables.');
  }

  return { operations };
};

export const validateOperationsForTargetSection = (
  operations: WorksheetOperation[],
  targetSectionId?: WorksheetEntityId
): WorksheetOperation[] => {
  if (!targetSectionId) {
    return operations;
  }

  if (operations.length !== 1) {
    throw new Error('La edición sobre un ejercicio concreto debe devolver exactamente una operación.');
  }

  const [operation] = operations;

  if (operation.type !== 'update_section' || operation.sectionId !== targetSectionId) {
    throw new Error('La edición sobre un ejercicio concreto solo puede modificar la sección seleccionada.');
  }

  return operations;
};

const normalizeComparableValue = (value: string | undefined): string =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const extractRequestedPairIncrease = (instruction: string): number | null => {
  const match = instruction.match(/\b(?:anade|añade|agrega|agregar|incorpora|sumar|suma|completa)\s+(\d{1,2})\s+parejas?\b/i);
  if (!match) {
    return null;
  }

  const count = Number.parseInt(match[1], 10);
  return Number.isFinite(count) && count > 0 ? count : null;
};

const getUnirPairSignature = (section: WorksheetSection): string[] => {
  const normalizedSection = normalizeWorksheetSection(section);

  if (normalizedSection.exercise?.type !== 'unir') {
    return [];
  }

  return normalizedSection.exercise.pairs.map(pair =>
    `${normalizeComparableValue(pair.left.content)}=>${normalizeComparableValue(pair.right.content)}`
  );
};

export const validateOperationsAgainstInstruction = (
  originalWorksheet: SavedWorksheet,
  operations: WorksheetOperation[],
  instruction: string,
  targetSectionId?: WorksheetEntityId
): WorksheetOperation[] => {
  if (!targetSectionId) {
    return operations;
  }

  const requestedPairIncrease = extractRequestedPairIncrease(instruction);
  if (!requestedPairIncrease) {
    return operations;
  }

  const originalSection = originalWorksheet.sections.find(section => section.internalId === targetSectionId);
  const updatedOperation = operations[0];

  if (!originalSection || updatedOperation?.type !== 'update_section') {
    return operations;
  }

  const originalSignatures = getUnirPairSignature(originalSection);
  if (originalSignatures.length === 0) {
    return operations;
  }

  const updatedSection = normalizeWorksheetSection({
    ...updatedOperation.section,
    internalId: targetSectionId,
  });
  const updatedSignatures = getUnirPairSignature(updatedSection);

  if (updatedSignatures.length < originalSignatures.length + requestedPairIncrease) {
    throw new Error(`La IA no ha añadido las ${requestedPairIncrease} parejas solicitadas conservando las anteriores.`);
  }

  const missingOriginalPairs = originalSignatures.filter(signature => !updatedSignatures.includes(signature));
  if (missingOriginalPairs.length > 0) {
    throw new Error('La IA ha sustituido o eliminado parejas existentes cuando solo debía añadir nuevas.');
  }

  return operations;
};
