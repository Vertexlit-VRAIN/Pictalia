import { exerciseTypesForPrompt } from '../exerciseRepository';
import { EXERCISE_TYPE_ORDER, getExercisePromptRules, getExerciseSchema } from '../../components/exercises/registry';

export const JSON_ONLY_RULE = `
Return ONLY valid JSON. Omit explanations, markdown wrappers, or comments.
`;

export const PEDAGOGICAL_RULES = `
PEDAGOGICAL RULES:
- Adapt the exercise to the student profile. Prioritize autonomy, visual support, and low verbal load.
- Choose simple and concrete visual representations. Everyday vocabulary only.
- Strict Content Coherence: All titles, instructions, text, and search terms must have 100% direct thematic coherence with the topic. Do not mix unrelated subjects.
`;

export const PICTOGRAM_RULES = `
PICTOGRAM & SEARCH RULES:
- The "content" property holds the visible text shown to the student. The "searchTerm" property is used to search for the pictogram.
- Both "content" and "searchTerm" must be the direct name of the concept. Use digits (0-9) directly for numbers.
- AVOID prefixes (e.g. use "lápiz" instead of "pictograma lápiz", "flor" instead of "dibujo flor").
- Only use concrete nouns or actions. No abstract descriptors or visual metaphors.
`;

export const FORBIDDEN_TECHNICAL_FIELDS = `
FORBIDDEN FIELDS:
- Do NOT return: internalId, items, layout, selectedPictoUrl, pictoOptions, url, pictogramRenderMode, spelledLetterTerms, spelledLetterUrls.
- Do NOT generate custom IDs for items.
`;

const parts = EXERCISE_TYPE_ORDER.map((type, idx) => {
  const rules = getExercisePromptRules(type);
  const schema = getExerciseSchema(type);
  return `${idx + 1}. "${type}":
JSON Schema format:
${schema}
Rules:
${rules.map(r => `- ${r}`).join('\n')}`;
});

export const EXERCISE_STRUCTURE_RULES = `MANDATORY STRUCTURE BY TYPE:

${parts.join('\n\n')}`;

export const SECTION_OUTPUT_RULES = `
SECTION OUTPUT RULES:
- Each section must contain exactly these keys: "exerciseType", "instruction", "exercise".
- "exerciseType" can only be: ${exerciseTypesForPrompt()}.
- "exercise.type" must match "exerciseType" exactly.
`;

export const WORKSHEET_GENERATION_RULES = `
WORKSHEET GENERATION RULES:
- Return a worksheet containing: "title", "pictogramSearchTerm", and "sections".
- Generate at least 4 exercises unless an exact quantity was requested.
- If you include "copiar" and "repasar", place "copiar" after "repasar".
`;

export const OPERATION_RULES = `
OPERATION RULES:
- Return a JSON object with a single property: "operations".
- Valid operations: "update_worksheet", "create_section", "update_section", "delete_section", "move_section".
- Do NOT return the entire worksheet. Return only the array of operations.
`;

export const ID_RULES = `
ID RULES:
- To modify, delete, or move sections, use the existing "sectionId". Do not invent new IDs.
`;

export const OPERATION_PRESERVATION_RULES = `
PRESERVATION RULES:
- Change only what is necessary to fulfill the request. Keep the current content otherwise.
`;
