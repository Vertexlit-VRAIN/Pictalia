import { exerciseTypesForPrompt } from '../exerciseRepository';
import { EXERCISE_TYPE_ORDER, getExercisePromptRules, getExerciseSchema } from '../../components/exercises/registry';

export const JSON_ONLY_RULE = `
Return ONLY valid JSON.
Do not use markdown wrappers.
Do not add explanations.
Do not add comments.
Do not add text before or after the JSON.
`;

export const PEDAGOGICAL_RULES = `
PEDAGOGICAL CRITERIA:
- Adapt the worksheet to the profile rather than maximizing variety.
- Prioritize autonomy, visual support, and low verbal load.
- Avoid activities that could cause frustration.
- If in doubt between two options, choose the simplest and most visual.
- Use concrete, everyday vocabulary suitable for the student's level.
- Do not convert environmental knowledge topics into literacy exercises unless the goal is reading/writing.
- All exercises must maintain direct coherence with the central topic.
- **Strict Content Coherence**: All sections, instructions, texts, images, and search terms of the worksheet must be 100% related and have direct thematic coherence with the requested topic and goals. Avoid mixing unrelated subject matter (e.g., avoid introducing number tracing or counting in worksheets about conceptual topics unless explicitly requested). All vocabulary and stimuli must belong to the central topic.
`;

export const PICTOGRAM_RULES = `
PICTOGRAM RULES:
- The AI DOES NOT search for pictograms.
- The AI DOES NOT choose specific pictograms.
- The AI DOES NOT return URLs.
- The AI DOES NOT return results from ARASAAC or any database.
- The system will search for pictograms later using "searchTerm".
- If the visible content is a number, "searchTerm" must be the same number in digits.
- Never convert numbers to words inside "searchTerm".
- For images, always use:
  { "type": "image", "content": "visible text", "searchTerm": "search term" }
- For instruction pictograms, always use:
  { "searchTerm": "search term", "content": "visible text" }
- "content" is mandatory.
- "searchTerm" is mandatory in images and instruction pictograms.
- **Pictogram Feasibility**: Request search terms ("searchTerm") only for concrete, real, and common concepts (e.g., animals, food, everyday objects, clear actions). AVOID requesting abstract concepts, complex combinations, visual metaphors, or special graphic variations (such as silhouettes, shadows, cutaways, or visual effects), as the pictogram database does not contain representations for these variations and search will fail.
`;

export const FORBIDDEN_TECHNICAL_FIELDS = `
FORBIDDEN FIELDS:
- Do not return "internalId" inside "section".
- Do not return "items".
- Do not return "layout".
- Do not return "selectedPictoUrl".
- Do not return "pictoOptions".
- Do not return "url".
- Do not return "pictogramRenderMode".
- Do not return "spelledLetterTerms".
- Do not return "spelledLetterUrls".
- Do not return arrays of URLs.
- Do not return invented IDs for pictograms, images, words, sounds, or items.
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
- Do not use alternative keys like "activities", "tasks", "blocks", "pages", or "elements".
`;

export const WORKSHEET_GENERATION_RULES = `
WORKSHEET GENERATION RULES:
- Return a complete worksheet.
- The worksheet must have "title", "pictogramSearchTerm", and "sections".
- Each element of "sections" is an exercise.
- In the absence of an exact quantity, generate at least 4 exercises.
- The worksheet must have enough content to be useful as study/work material.
- Select the most suitable exercise types based on the profile.
- Avoid using a single exercise type throughout the worksheet unless the profile requires it.
- If you include "copiar" and also "repasar", place "copiar" after "repasar".
`;

export const OPERATION_RULES = `
OPERATION RULES:
- Return a JSON object with a single property: "operations".
- Valid operations: "update_worksheet", "create_section", "update_section", "delete_section", "move_section".
- DO NOT return the entire worksheet.
- DO NOT regenerate all sections.
- Inside "section", return only pedagogical structure: "exerciseType", "instruction", "exercise".
- If there is a target section, return exactly one "update_section" operation with that "sectionId", unless the request is to delete or move.
- If there is a target section and the user says "make the exercise about...", update that section via "update_section".
- If there is no target section and the user asks to add a new exercise, use "create_section".
`;

export const ID_RULES = `
ID RULES:
- To modify, delete, or move, always use the existing "sectionId".
- Do not invent "sectionId".
- Do not invent "afterSectionId".
- The only permitted identification is "sectionId" or "afterSectionId" in the operation.
- Do not use IDs for pictograms, images, sounds, words, or items.
`;

export const OPERATION_PRESERVATION_RULES = `
PRESERVATION RULES:
- Change only what is necessary to fulfill the request.
- Keep the current content unless the user asks to replace, delete, or reorder it.
- If the request asks to add content, preserve the previous content and add only the new content.
- If the request asks to simplify, keep the topic and lower vocabulary, verbal load, and difficulty.
`;
