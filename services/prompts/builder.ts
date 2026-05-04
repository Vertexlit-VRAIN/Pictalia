import {
  WORKSHEET_JSON_EXAMPLE,
  WORKSHEET_JSON_SHAPE,
  WORKSHEET_OUTPUT_RULES,
  REFINEMENT_JSON_SCHEMA,
} from './schemas';
import {
  EXERCISE_VARIANTS_FEW_SHOT,
  PROFILE_SELECTION_GUIDE,
  IMAGE_ADAPTATION_GUIDE,
  PEDAGOGICAL_PRIORITIES,
  CONTENT_CONSISTENCY_RULES,
  INTERNAL_VALIDATION_CHECKLIST,
} from './examples';

export interface PromptOptions {
  topic?: string;
  goal?: string;
  extraDetails?: string;
  adaptationDescription?: string;
  adaptationTextContent?: string;
  hasImage?: boolean;
  requestedExerciseCount?: number;
}

const buildInstructionPrompt = (showPictogramInstructions: boolean): string => {
  return showPictogramInstructions
    ? `instruction.text breve en MAYÚSCULAS. instruction.pictograms con términos simples para ARASAAC.`
    : `instruction.text breve en MAYÚSCULAS. Omite instruction.pictograms.`;
};

const buildPedagogicalContext = (options: PromptOptions): string => {
  const topicLine = options.adaptationDescription?.trim()
    ? `Tema: ${options.adaptationDescription.trim()}`
    : options.topic?.trim()
      ? `Tema: ${options.topic.trim()}`
      : '';

  const goalLine = options.goal?.trim()
    ? `Objetivo: ${options.goal.trim()}`
    : '';

  const extraDetailsLine = options.extraDetails?.trim()
    ? `Detalles: ${options.extraDetails.trim()}`
    : '';

  return [topicLine, goalLine, extraDetailsLine].filter(Boolean).join('\n');
};

const buildTextExtractionBlock = (text?: string): string => {
  if (!text?.trim()) return '';

  return `
TEXTO EXTRAÍDO:
"""
${text.trim()}
"""

Usa este texto como referencia para entender el contenido original.
`;
};

const buildExerciseCountRule = (requestedExerciseCount?: number): string =>
  requestedExerciseCount && requestedExerciseCount > 0
    ? `- El profesor ha pedido exactamente ${requestedExerciseCount} ejercicios en "sections": respeta esa cantidad.`
    : '- Adapta el número de ejercicios al perfil del alumno; no fuerces una cantidad fija.';

const buildCommonRules = (instructionPrompt: string, requestedExerciseCount?: number): string => `
REGLAS GENERALES:
- Devuelve solo JSON válido.
- Usa solo estos tipos: repasar, unir, rodear, copiar.
- Cada sección del JSON corresponde a un ejercicio.
- ${buildExerciseCountRule(requestedExerciseCount)}
- Si no hay una cantidad exacta indicada por el profesor, prioriza la adaptación al perfil del alumno.
- Si sí hay una cantidad exacta indicada por el profesor, esa cantidad prevalece sobre la adaptación libre del número de ejercicios.
- En ausencia de cantidad exacta, genera al menos 4 ejercicios.
- La ficha debe tener suficiente contenido para ser útil como material de trabajo.
- Selecciona los tipos de ejercicio más adecuados según el perfil del alumno.
- Adapta la dificultad, el número de elementos y el tipo de actividad al perfil.
- Incluye variedad de ejercicios cuando sea adecuado para el perfil.
- Evita usar un único tipo de ejercicio en toda la ficha, salvo que el perfil lo requiera.
- Puedes repetir tipos si aporta valor pedagógico.
- Evita una ficha demasiado corta o pobre en contenido.
- Si incluyes "copiar" y también "repasar", coloca "copiar" después de "repasar".
- En ejercicios de "copiar", cada palabra esperada debe ser distinta; no repitas contenidos entre "model" y "copies".
- Usa castellano de España en todo el contenido.
- Evita regionalismos de otros países (ej: "computadora", "carro", "manejar").
- Usa términos habituales en España (ej: "ordenador", "coche", "conducir").
- ${instructionPrompt}
`;

export const buildWorksheetPrompt = (
  options: PromptOptions,
  childProfile: string,
  showPictogramInstructions: boolean
): string => {
  const instructionPrompt = buildInstructionPrompt(showPictogramInstructions);
  const pedagogicalContext = buildPedagogicalContext(options);

  if (options.hasImage) {
    const extractedText = buildTextExtractionBlock(options.adaptationTextContent);

    return `
TAREA:
Analiza la imagen y genera una ficha educativa adaptada.

PERFIL DEL ALUMNO:
${childProfile}

${pedagogicalContext || ''}

${extractedText}

INSTRUCCIONES:
- Detecta el tema principal de la ficha original.
- Simplifica y adapta el contenido al nivel del alumno.
- Convierte contenido textual en actividades visuales cuando sea posible.

${PEDAGOGOGICAL_BLOCK_SAFE(PEDAGOGICAL_PRIORITIES)}

${buildCommonRules(instructionPrompt, options.requestedExerciseCount)}

${PROFILE_SELECTION_GUIDE}

${IMAGE_ADAPTATION_GUIDE}

${CONTENT_CONSISTENCY_RULES}

${EXERCISE_VARIANTS_FEW_SHOT}

EJEMPLO DE JSON:
${WORKSHEET_JSON_EXAMPLE}

ESQUEMA DE SALIDA:
${WORKSHEET_JSON_SHAPE}

${WORKSHEET_OUTPUT_RULES}

${INTERNAL_VALIDATION_CHECKLIST}
`;
  }

  return `
TAREA:
Genera una ficha educativa adaptada.

PERFIL DEL ALUMNO:
${childProfile}

${pedagogicalContext || ''}

${PEDAGOGOGICAL_BLOCK_SAFE(PEDAGOGICAL_PRIORITIES)}

${buildCommonRules(instructionPrompt, options.requestedExerciseCount)}

${PROFILE_SELECTION_GUIDE}

${CONTENT_CONSISTENCY_RULES}

${EXERCISE_VARIANTS_FEW_SHOT}

EJEMPLO DE JSON:
${WORKSHEET_JSON_EXAMPLE}

ESQUEMA DE SALIDA:
${WORKSHEET_JSON_SHAPE}

${WORKSHEET_OUTPUT_RULES}

${INTERNAL_VALIDATION_CHECKLIST}
`;
};

const PEDAGOGOGICAL_BLOCK_SAFE = (content: string): string => content;

export const buildSemanticRepairPrompt = (
  rawText: string,
  options: PromptOptions,
  childProfile: string,
  showPictogramInstructions: boolean
): string => {
  const instructionPrompt = buildInstructionPrompt(showPictogramInstructions);

  const context =
    [
      options.topic,
      options.goal,
      options.extraDetails,
      options.adaptationDescription,
      options.adaptationTextContent,
    ]
      .filter(Boolean)
      .join(' ') || 'tema original';

  return `
TAREA:
Corrige esta ficha porque no se ajusta bien al tema o al perfil.

PERFIL DEL ALUMNO:
${childProfile}

TEMA ESPERADO:
${context}

${PEDAGOGICAL_PRIORITIES}

${CONTENT_CONSISTENCY_RULES}

REGLAS:
- Mantén la estructura JSON.
- Corrige contenido fuera de tema o demasiado genérico.
- Si el tema no es lectoescritura, no uses letras o vocales sueltas.
- Ajusta los ejercicios al perfil del alumno.
- ${buildExerciseCountRule(options.requestedExerciseCount)}
- En ejercicios de "copiar", cada palabra esperada debe ser distinta; no repitas contenidos entre "model" y "copies".
- ${instructionPrompt}
- Devuelve solo JSON válido.

${EXERCISE_VARIANTS_FEW_SHOT}

EJEMPLO DE JSON:
${WORKSHEET_JSON_EXAMPLE}

ESQUEMA:
${WORKSHEET_JSON_SHAPE}

${WORKSHEET_OUTPUT_RULES}

${INTERNAL_VALIDATION_CHECKLIST}

SALIDA ORIGINAL:
${rawText}
`;
};

export const buildExerciseCountRepairPrompt = (
  jsonWorksheetContent: string,
  requestedExerciseCount: number,
  options: PromptOptions,
  childProfile: string,
  showPictogramInstructions: boolean
): string => {
  const instructionPrompt = buildInstructionPrompt(showPictogramInstructions);
  const pedagogicalContext = buildPedagogicalContext(options);

  return `
TAREA:
Corrige esta ficha porque tiene menos ejercicios de los solicitados.

PERFIL DEL ALUMNO:
${childProfile}

${pedagogicalContext || ''}

FICHA ACTUAL:
${jsonWorksheetContent}

REGLAS:
- El profesor ha pedido exactamente ${requestedExerciseCount} ejercicios en "sections": respeta esa cantidad.
- Conserva el tema, el nivel de dificultad y el estilo pedagógico de la ficha actual.
- Mantén los ejercicios ya válidos y añade solo los necesarios para completar la cantidad pedida.
- Usa solo estos tipos: repasar, unir, rodear, copiar.
- Devuelve solo JSON válido.
- ${instructionPrompt}

${PEDAGOGOGICAL_BLOCK_SAFE(PEDAGOGICAL_PRIORITIES)}

${CONTENT_CONSISTENCY_RULES}

${EXERCISE_VARIANTS_FEW_SHOT}

EJEMPLO DE JSON:
${WORKSHEET_JSON_EXAMPLE}

ESQUEMA:
${WORKSHEET_JSON_SHAPE}

${WORKSHEET_OUTPUT_RULES}

${INTERNAL_VALIDATION_CHECKLIST}
`;
};

export const buildJsonRepairPrompt = (
  rawText: string,
  errorMsg: string,
  mode: 'worksheet' | 'refinement'
): string => {
  const schema = mode === 'worksheet' ? WORKSHEET_JSON_SHAPE : REFINEMENT_JSON_SCHEMA;

  return `
TAREA:
Corrige el formato JSON.

ERROR:
${errorMsg}

REGLAS:
- Devuelve solo JSON válido.
- No añadas texto ni explicaciones.

${WORKSHEET_OUTPUT_RULES}

ESQUEMA:
${schema}

JSON A CORREGIR:
${rawText}
`;
};

export const buildRefinementPrompt = (
  jsonWorksheetContent: string,
  instructionText: string,
  childProfile: string
): string => {
  return `
TAREA:
Refina la ficha según la instrucción.

PERFIL DEL ALUMNO:
${childProfile}

FICHA ACTUAL:
${jsonWorksheetContent}

INSTRUCCIÓN:
${instructionText}

${PEDAGOGICAL_PRIORITIES}

${CONTENT_CONSISTENCY_RULES}

REGLAS:
- Aplica la instrucción literalmente.
- Respeta el perfil del alumno.
- Mantén la estructura JSON.
- Usa solo estos tipos: repasar, unir, rodear, copiar.
- Devuelve solo JSON válido sin explicaciones.

${EXERCISE_VARIANTS_FEW_SHOT}

EJEMPLO DE JSON:
${WORKSHEET_JSON_EXAMPLE}

${WORKSHEET_OUTPUT_RULES}

ESQUEMA:
${REFINEMENT_JSON_SCHEMA}

${INTERNAL_VALIDATION_CHECKLIST}
`;
};
