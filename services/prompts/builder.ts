import {
  WORKSHEET_JSON_EXAMPLE,
  WORKSHEET_JSON_SHAPE,
  REFINEMENT_JSON_SCHEMA,
  WORKSHEET_OPERATION_JSON_EXAMPLE,
  WORKSHEET_OPERATION_JSON_SCHEMA,
} from './schemas';
import {
  OPERATIONS_INTERNAL_VALIDATION_CHECKLIST,
  PROFILE_SELECTION_GUIDE,
  REFINEMENT_INTERNAL_VALIDATION_CHECKLIST,
  WORKSHEET_INTERNAL_VALIDATION_CHECKLIST,
} from './examples';
import {
  CASTILIAN_SPANISH_RULES,
  EXERCISE_STRUCTURE_RULES,
  FORBIDDEN_TECHNICAL_FIELDS,
  ID_RULES,
  JSON_ONLY_RULE,
  OPERATION_PRESERVATION_RULES,
  OPERATION_RULES,
  PEDAGOGICAL_RULES,
  PICTOGRAM_RULES,
  SECTION_OUTPUT_RULES,
  WORKSHEET_GENERATION_RULES,
} from './blocks';

export interface PromptOptions {
  topic?: string;
  goal?: string;
  extraDetails?: string;
  requestedExerciseCount?: number;
}

const compact = (...blocks: Array<string | undefined | null | false>): string =>
  blocks
    .filter(Boolean)
    .map(block => String(block).trim())
    .filter(Boolean)
    .join('\n\n');

const buildInstructionPrompt = (showPictogramInstructions: boolean): string =>
  showPictogramInstructions
    ? `INSTRUCCIONES:
- instruction.text debe ser breve y en MAYÚSCULAS.
- instruction.pictograms debe contener términos simples para buscar pictogramas.`
    : `INSTRUCCIONES:
- instruction.text debe ser breve y en MAYÚSCULAS.
- Omite instruction.pictograms.`;

const buildPedagogicalContext = (options: PromptOptions): string => {
  const lines = [
    options.topic?.trim() ? `Tema: ${options.topic.trim()}` : '',
    options.goal?.trim() ? `Objetivo: ${options.goal.trim()}` : '',
    options.extraDetails?.trim() ? `Detalles: ${options.extraDetails.trim()}` : '',
  ].filter(Boolean);

  return lines.length > 0
    ? compact('CONTEXTO PEDAGÓGICO:', lines.join('\n'))
    : '';
};

const buildExerciseCountRule = (requestedExerciseCount?: number): string =>
  requestedExerciseCount && requestedExerciseCount > 0
    ? `CANTIDAD DE EJERCICIOS:
- El profesor ha pedido exactamente ${requestedExerciseCount} ejercicios en "sections".
- Respeta esa cantidad.`
    : `CANTIDAD DE EJERCICIOS:
- Adapta el número de ejercicios al perfil.
- Si no hay una cantidad exacta, genera al menos 4 ejercicios.`;

const buildOriginalPedagogicalContext = (
  originalTopic?: string,
  originalGoal?: string,
  originalExtraDetails?: string
): string => {
  const lines = [
    originalTopic?.trim() ? `Tema original: ${originalTopic.trim()}` : '',
    originalGoal?.trim() ? `Objetivo original: ${originalGoal.trim()}` : '',
    originalExtraDetails?.trim() ? `Detalles originales: ${originalExtraDetails.trim()}` : '',
  ].filter(Boolean);

  return lines.length > 0
    ? lines.join('\n')
    : 'No hay contexto pedagógico original adicional guardado.';
};

const buildWorksheetContract = (
  showPictogramInstructions: boolean,
  requestedExerciseCount?: number
): string =>
  compact(
    JSON_ONLY_RULE,
    buildExerciseCountRule(requestedExerciseCount),
    WORKSHEET_GENERATION_RULES,
    SECTION_OUTPUT_RULES,
    EXERCISE_STRUCTURE_RULES,
    PICTOGRAM_RULES,
    FORBIDDEN_TECHNICAL_FIELDS,
    CASTILIAN_SPANISH_RULES,
    buildInstructionPrompt(showPictogramInstructions)
  );

const buildGenerationPromptBase = (
  task: string,
  options: PromptOptions,
  childProfile: string,
  showPictogramInstructions: boolean,
  extraBlocks?: string
): string =>
  compact(
    `TAREA:\n${task}`,
    `PERFIL DEL ALUMNO:\n${childProfile}`,
    buildPedagogicalContext(options),
    extraBlocks,
    PEDAGOGICAL_RULES,
    PROFILE_SELECTION_GUIDE,
    buildWorksheetContract(showPictogramInstructions, options.requestedExerciseCount),
    `EJEMPLO DE JSON:\n${WORKSHEET_JSON_EXAMPLE}`,
    `ESQUEMA DE SALIDA:\n${WORKSHEET_JSON_SHAPE}`,
    WORKSHEET_INTERNAL_VALIDATION_CHECKLIST
  );

export const buildWorksheetPrompt = (
  options: PromptOptions,
  childProfile: string,
  showPictogramInstructions: boolean
): string =>
  buildGenerationPromptBase(
    'Genera una ficha educativa adaptada.',
    options,
    childProfile,
    showPictogramInstructions
  );

export const buildSemanticRepairPrompt = (
  rawText: string,
  options: PromptOptions,
  childProfile: string,
  showPictogramInstructions: boolean
): string => {
  const context = [
    options.topic,
    options.goal,
    options.extraDetails,
  ].filter(Boolean).join(' ') || 'tema original';

  return compact(
    'TAREA:\nCorrige esta ficha porque no se ajusta bien al tema o al perfil.',
    `PERFIL DEL ALUMNO:\n${childProfile}`,
    `TEMA ESPERADO:\n${context}`,
    PEDAGOGICAL_RULES,
    buildWorksheetContract(showPictogramInstructions, options.requestedExerciseCount),
    'REGLAS DE REPARACIÓN:\n- Mantén la estructura JSON.\n- Corrige contenido fuera de tema o demasiado genérico.\n- Si el tema no es lectoescritura, no uses letras o vocales sueltas.',
    `EJEMPLO DE JSON:\n${WORKSHEET_JSON_EXAMPLE}`,
    `ESQUEMA:\n${WORKSHEET_JSON_SHAPE}`,
    REFINEMENT_INTERNAL_VALIDATION_CHECKLIST,
    `SALIDA ORIGINAL:\n${rawText}`
  );
};

export const buildExerciseCountRepairPrompt = (
  jsonWorksheetContent: string,
  requestedExerciseCount: number,
  options: PromptOptions,
  childProfile: string,
  showPictogramInstructions: boolean
): string =>
  compact(
    'TAREA:\nCorrige esta ficha porque tiene menos ejercicios de los solicitados.',
    `PERFIL DEL ALUMNO:\n${childProfile}`,
    buildPedagogicalContext(options),
    `FICHA ACTUAL:\n${jsonWorksheetContent}`,
    `REGLAS:\n- El profesor ha pedido exactamente ${requestedExerciseCount} ejercicios en "sections".\n- Conserva el tema, el nivel y el estilo pedagógico.\n- Mantén los ejercicios válidos y añade solo los necesarios.`,
    PEDAGOGICAL_RULES,
    buildWorksheetContract(showPictogramInstructions, requestedExerciseCount),
    `EJEMPLO DE JSON:\n${WORKSHEET_JSON_EXAMPLE}`,
    `ESQUEMA:\n${WORKSHEET_JSON_SHAPE}`,
    WORKSHEET_INTERNAL_VALIDATION_CHECKLIST
  );

export const buildJsonRepairPrompt = (
  rawText: string,
  errorMsg: string,
  mode: 'worksheet' | 'refinement' | 'operations'
): string => {
  const schema = mode === 'worksheet'
    ? WORKSHEET_JSON_SHAPE
    : mode === 'operations'
      ? WORKSHEET_OPERATION_JSON_SCHEMA
      : REFINEMENT_JSON_SCHEMA;

  return compact(
    'TAREA:\nCorrige el formato JSON.',
    `ERROR:\n${errorMsg}`,
    JSON_ONLY_RULE,
    `ESQUEMA:\n${schema}`,
    `JSON A CORREGIR:\n${rawText}`
  );
};

export const buildRefinementPrompt = (
  jsonWorksheetContent: string,
  instructionText: string,
  childProfile: string
): string =>
  compact(
    'TAREA:\nRefina la ficha según la instrucción.',
    `PERFIL DEL ALUMNO:\n${childProfile}`,
    `FICHA ACTUAL:\n${jsonWorksheetContent}`,
    `INSTRUCCIÓN:\n${instructionText}`,
    PEDAGOGICAL_RULES,
    SECTION_OUTPUT_RULES,
    EXERCISE_STRUCTURE_RULES,
    PICTOGRAM_RULES,
    FORBIDDEN_TECHNICAL_FIELDS,
    CASTILIAN_SPANISH_RULES,
    JSON_ONLY_RULE,
    `EJEMPLO DE JSON:\n${WORKSHEET_JSON_EXAMPLE}`,
    `ESQUEMA:\n${REFINEMENT_JSON_SCHEMA}`,
    REFINEMENT_INTERNAL_VALIDATION_CHECKLIST
  );

export const buildExerciseRefinementPrompt = (
  jsonWorksheetContent: string,
  instructionText: string,
  childProfile: string,
  originalTopic?: string,
  originalGoal?: string,
  originalExtraDetails?: string,
  targetSectionId?: string,
  targetSectionContent?: string,
  worksheetContextSummary?: string
): string =>
  compact(
    'TAREA:\nDevuelve operaciones JSON para editar una ficha educativa.',
    JSON_ONLY_RULE,
    `PERFIL DEL ALUMNO:\n${childProfile}`,
    `CONTEXTO PEDAGÓGICO ORIGINAL:\n${buildOriginalPedagogicalContext(originalTopic, originalGoal, originalExtraDetails)}`,
    `FICHA ACTUAL EN FORMATO LIMPIO PARA IA:\n${jsonWorksheetContent}`,
    `PETICIÓN DEL USUARIO:\n${instructionText}`,
    targetSectionId
      ? `SECCIÓN OBJETIVO:\nModifica SOLO la sección con sectionId "${targetSectionId}".`
      : '',
    targetSectionContent
      ? `CONTENIDO DE LA SECCIÓN OBJETIVO:\n${targetSectionContent}`
      : '',
    worksheetContextSummary
      ? `RESUMEN DE LA FICHA:\n${worksheetContextSummary}`
      : '',
    OPERATION_RULES,
    ID_RULES,
    OPERATION_PRESERVATION_RULES,
    PEDAGOGICAL_RULES,
    SECTION_OUTPUT_RULES,
    EXERCISE_STRUCTURE_RULES,
    PICTOGRAM_RULES,
    FORBIDDEN_TECHNICAL_FIELDS,
    CASTILIAN_SPANISH_RULES,
    `EJEMPLO DE OPERACIONES:\n${WORKSHEET_OPERATION_JSON_EXAMPLE}`,
    `ESQUEMA DE SALIDA:\n${WORKSHEET_OPERATION_JSON_SCHEMA}`,
    OPERATIONS_INTERNAL_VALIDATION_CHECKLIST
  );
