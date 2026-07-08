import { runAiPrompt } from '../../aiClient';
import { buildAcExercisePrompt } from '../prompts/acExercisePrompt';
import { extractJsonObject } from '../utils';

export class AcAgent {
  /**
   * Generates a single exercise based on a blueprint plan.
   * Includes retry logic (up to maxAttempts).
   */
  async generateExercise(
    plan: { type: string; objective: string; instruction: string; description: string },
    index: number,
    schema: string,
    requestedLanguage: 'es' | 'val' | 'en',
    onRetry: () => void
  ): Promise<any> {
    const type = String(plan.type || 'rodear').toLowerCase().trim();
    const promptText = buildAcExercisePrompt(plan, schema, requestedLanguage);

    let attempts = 0;
    const maxAttempts = 3;
    while (attempts < maxAttempts) {
      try {
        const rawResult = await runAiPrompt(promptText);
        const parsed = JSON.parse(extractJsonObject(rawResult));
        if (!parsed.exerciseType || !parsed.instruction || !parsed.exercise) {
          throw new Error("El ejercicio generado tiene un esquema incorrecto.");
        }
        return parsed;
      } catch (error) {
        attempts++;
        onRetry();
        console.warn(
          `Intento ${attempts} fallido para generar el ejercicio ${index + 1} de tipo ${type}. Error:`,
          error
        );
        if (attempts >= maxAttempts) {
          throw new Error(`Fallo tras ${maxAttempts} intentos al generar el ejercicio de tipo "${type}".`);
        }
      }
    }
  }
}
