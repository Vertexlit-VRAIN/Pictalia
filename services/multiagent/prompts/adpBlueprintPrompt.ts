import { compact, buildPedagogicalContext, PromptOptions } from './shared';
import {
  getExercisePedagogicalDescription,
  getExercisePromptRules,
  getExerciseMinGenerateItems,
  getExerciseMaxGenerateItems,
} from '../../../components/exercises/registry';

export const buildAdpBlueprintPrompt = (
  options: PromptOptions,
  childProfile: string,
  availableExerciseTypes: string[]
): string => {
  const languageNames = {
    es: 'Castilian Spanish (es)',
    val: 'Valencian/Catalan (val)',
    en: 'English (en)',
  };
  const targetLang = options.language ? languageNames[options.language] : languageNames.es;

  const exerciseTypeDetails = availableExerciseTypes.map(t => {
    const pedagogical = getExercisePedagogicalDescription(t as any);
    const rules = getExercisePromptRules(t as any);
    const minItems = getExerciseMinGenerateItems(t as any);
    const maxItems = getExerciseMaxGenerateItems(t as any);
    const rulesStr = rules.map(r => `  - ${r}`).join('\n');
    return `- "${t}": ${pedagogical}\n  Limits: Min items: ${minItems}, Max items: ${maxItems}\n  Constraints and rules:\n${rulesStr}`;
  }).join('\n');

  return compact(
    `You are the Pedagogical Designer Agent (ADP) for Pictalia.
Your role is to analyze a student's profile, a target topic, and learning goals, and design a customized worksheet structure.`,
    `STUDENT PROFILE:
${childProfile}`,
    `PEDAGOGICAL GOALS:
${buildPedagogicalContext(options)}`,
    `AVAILABLE EXERCISE TYPES & STRUCTURAL CONSTRAINTS:
${exerciseTypeDetails}`,
    `EXERCISE COUNT:
${options.requestedExerciseCount ? `Generate exactly ${options.requestedExerciseCount} exercises.` : 'Generate a recommended number of exercises (usually between 3 and 5) based on the student profile.'}`,
    `RULES:
1. Choose the most appropriate exercise types from the available list for this student's profile.
2. Structure the learning progression logically (easier exercises first, e.g. repasar before copiar).
3. For each exercise, write a clear objective, a concise instruction in uppercase, and a highly detailed content description.
4. CRITICAL: The content description must strictly match the supported structure of the exercise type. Do NOT invent layouts, background scenes, interactive diagrams, or custom shapes that are not supported. E.g. for "rodear", describe targets and distractors; for "unir", describe left and right pairs; for "repasar", list words to trace.
5. If appropriate for numeracy or visual matching, you can plan "unir" exercises that match text numbers with a repeated pictogram (quantity), describing it in the exercise content description.
6. All texts (titles, instructions, description details) MUST be in ${targetLang}.
7. Output ONLY a valid JSON object matching the schema below. No conversational text.
8. CRITICAL: Strictly follow any exclusions, constraints, or explicit focus areas requested by the teacher in "Details" under PEDAGOGICAL GOALS. For instance, if the teacher explicitly says they do not want a specific type of exercise (e.g., "no quiero ejercicios de repasar", "no repasar", "no copiar", "do not include matching"), you MUST NOT plan or choose that exercise type under any circumstances, even if it is recommended by the student profile. Do not select it from the available exercise list.
9. CRITICAL: For each exercise plan, analyze the student's profile (specifically their attention span, motor skills, age, and cognitive support level) and EXPLICITLY specify the exact number of elements, pairs, options, or words to generate in the "description" field. The chosen count MUST fall strictly within the "Min items" and "Max items" limits specified for that exercise type. High support needs / short attention span profiles should get a count close to the Min limit (e.g., exactly 3 pairs/6 items for unir, exactly 4 options/items for rodear); lower support needs / higher attention span profiles should get a count close to the Max limit (e.g., exactly 5-6 pairs/10-12 items for unir, exactly 6-8 options/items for rodear).`,
    `OUTPUT SCHEMA:
{
  "title": "Short descriptive title of the worksheet in ${targetLang}",
  "pictogramSearchTerm": "Simple noun in ${targetLang} representing the overall theme",
  "exercisePlans": [
    {
      "type": "one of the available exercise types",
      "objective": "Detailed pedagogical objective for this exercise",
      "instruction": "SHORT INSTRUCTION IN UPPERCASE",
      "description": "Extremely detailed description of the content to generate. E.g. 'Match number 1 with 1 flower pictogram, number 2 with 2 flower pictograms, number 3 with 3 flower pictograms. Left column has numbers, right column has repeated flower pictures.'"
    }
  ]
}`,
    `JSON ONLY. Respect Markdown JSON formatting.`
  );
};
