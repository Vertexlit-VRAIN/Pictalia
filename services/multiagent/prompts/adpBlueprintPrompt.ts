import { compact, buildPedagogicalContext, PromptOptions } from './shared';
import { getExercisePedagogicalDescription } from '../../../components/exercises/registry';

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

  return compact(
    `You are the Pedagogical Designer Agent (ADP) for Adaptator-TEA.
Your role is to analyze a student's profile, a target topic, and learning goals, and design a customized worksheet structure.`,
    `STUDENT PROFILE:
${childProfile}`,
    `PEDAGOGICAL GOALS:
${buildPedagogicalContext(options)}`,
    `AVAILABLE EXERCISE TYPES:
${availableExerciseTypes.map(t => `- "${t}": ${getExercisePedagogicalDescription(t as any)}`).join('\n')}`,
    `EXERCISE COUNT:
${options.requestedExerciseCount ? `Generate exactly ${options.requestedExerciseCount} exercises.` : 'Generate a recommended number of exercises (usually between 3 and 5) based on the student profile.'}`,
    `RULES:
1. Choose the most appropriate exercise types from the available list for this student's profile.
2. Structure the learning progression logically (easier exercises first, e.g. repasar before copiar).
3. For each exercise, write a clear objective, a concise instruction in uppercase, and a highly detailed content description.
4. If appropriate for numeracy or visual matching, you can plan "unir" exercises that match text numbers with a repeated pictogram (quantity), describing it in the exercise content description.
5. All texts (titles, instructions, description details) MUST be in ${targetLang}.
6. Output ONLY a valid JSON object matching the schema below. No conversational text.`,
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
