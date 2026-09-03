import { exerciseTypesForPrompt } from '../exerciseRepository';
import { EXERCISE_TYPE_ORDER, getExercisePromptRules, getExerciseSchema, getExerciseMinGenerateItems, getExerciseMaxGenerateItems } from '../../components/exercises/registry';

export const JSON_ONLY_RULE = `
Return ONLY valid JSON. Omit explanations, markdown wrappers, or comments.
`;

export const PEDAGOGICAL_RULES = `
PEDAGOGICAL RULES:
- Adapt the exercise to the student profile. Prioritize autonomy, visual support, and low verbal load.
- Choose simple and concrete visual representations. Everyday vocabulary only.
- Strict Content Coherence: All titles, instructions, text, and search terms must have 100% direct thematic coherence with the topic. Do not mix unrelated subjects.
- Element Scaling: Dynamically adapt the number of elements/items in each generated exercise section (e.g., pairs in "unir", options in "rodear", words/letters in "repasar"/"copiar") to the student's age, attention limit, and cognitive support level. The chosen count MUST fall strictly within the "Min items" and "Max items" limits specified for that exercise type. High support needs profiles should get a count close to the Min limit; lower support needs should get a count close to the Max limit.
`;

export const PICTOGRAM_RULES = `
PICTOGRAM & SEARCH RULES:
- IMPORTANT: Every pictogram (both in instruction.pictograms and exercise item content/searchTerm) MUST be a SINGLE WORD (e.g. "perro", "comer", "rojo").
- Never output phrases, sentences, or multiple words in "searchTerm" or "content" (e.g., AVOID "perro grande", "comer manzana", "el gato"). If it is a phrase, simplify it to a single concrete word.
- Both "content" and "searchTerm" must be the direct name of the concept. Use digits (0-9) directly for numbers.
- AVOID prefixes (e.g. use "lápiz" instead of "pictograma lápiz", "flor" instead of "dibujo flor").
- NEVER append suffixes or qualifiers like "_pictograma", "_picto", "_image", "_dibujo", "_dibujo_de" to search terms (e.g. use "mango" instead of "mango_pictograma"). Search terms must NOT contain underscores ("_") or hyphens ("-").
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
  const minItems = getExerciseMinGenerateItems(type);
  const maxItems = getExerciseMaxGenerateItems(type);
  return `${idx + 1}. "${type}":
JSON Schema format:
${schema}
Limits: Min items: ${minItems}, Max items: ${maxItems}
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
- CRITICAL: Strictly follow any exclusions, constraints, or explicit instructions requested by the teacher in "Details" under PEDAGOGICAL CONTEXT. If the teacher explicitly asks to exclude a certain exercise type (e.g. "no repasar", "no quiero copiar", "do not include matching"), you MUST NOT generate any sections of that type under any circumstances, even if recommended by the student profile.
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
