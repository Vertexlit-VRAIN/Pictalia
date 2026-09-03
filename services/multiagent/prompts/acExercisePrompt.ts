import { compact, PICTOGRAM_RULES } from './shared';
import { getExercisePromptRules } from '../../../components/exercises/registry';

export const buildAcExercisePrompt = (
  exerciseBlueprint: any,
  exerciseSchema: string,
  language: 'es' | 'val' | 'en',
  feedback?: string
): string => {
  const languageNames = {
    es: 'Castilian Spanish (es)',
    val: 'Valencian/Catalan (val)',
    en: 'English (en)',
  };
  const targetLang = languageNames[language] || languageNames.es;
  const specificRules = getExercisePromptRules(exerciseBlueprint.type);

  const baseRules = [
    'Generate the exact content and the exact element count (number of options, pairs, words, traces) described in the blueprint description. Do NOT default or be limited to the counts shown in the JSON schemas or few-shot examples.',
    ...specificRules,
    `All student-facing and teacher-facing text in the JSON (instructions, contents, searchTerms, copies, etc.) MUST be written in ${targetLang}.`,
    'Do NOT include any additional fields or wrapper objects. The output must be exactly the JSON section structure.',
    'Do NOT include markdown styling or text outside the JSON block. Return ONLY the JSON object.',
  ];

  return compact(
    `You are the Exercise Constructor Agent (AC) for Adaptator-TEA.
Your role is to generate the exact JSON structure for a single educational exercise according to a provided pedagogical blueprint.`,
    feedback
      ? `ATTENTION - PREVIOUS FEEDBACK TO CORRECT:
The previous attempt to generate this exercise failed validation or pedagogical criteria. You MUST correct it based on the following feedback:
"${feedback}"`
      : '',
    `PEDAGOGICAL BLUEPRINT:
- Exercise Type: ${exerciseBlueprint.type}
- Objective: ${exerciseBlueprint.objective}
- Instruction: ${exerciseBlueprint.instruction}
- Detailed Content Description: ${exerciseBlueprint.description}`,
    `TARGET SCHEMA AND RULES:
You must output a single JSON object matching the format below.
${exerciseSchema}`,
    `ADDITIONAL RULES:
${baseRules.map((rule, idx) => `${idx + 1}. ${rule}`).join('\n')}`,
    PICTOGRAM_RULES,
    `JSON ONLY. Respect Markdown JSON formatting.`
  );
};
