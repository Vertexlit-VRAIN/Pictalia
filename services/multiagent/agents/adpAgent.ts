import { runAiPrompt } from '../../aiClient';
import { buildAdpBlueprintPrompt } from '../prompts/adpBlueprintPrompt';
import { extractJsonObject } from '../utils';
import type { PromptOptions } from '../prompts/shared';

export interface ADPBlueprint {
  title: string;
  pictogramSearchTerm: string;
  exercisePlans: {
    type: string;
    objective: string;
    instruction: string;
    description: string;
  }[];
}

export class AdpAgent {
  /**
   * Generates a pedagogical blueprint for the worksheet.
   */
  async generateBlueprint(
    options: PromptOptions,
    childProfile: string,
    availableExerciseTypes: string[]
  ): Promise<ADPBlueprint> {
    const prompt = buildAdpBlueprintPrompt(options, childProfile, availableExerciseTypes);
    const responseRaw = await runAiPrompt(prompt);
    
    const parsed = JSON.parse(extractJsonObject(responseRaw)) as ADPBlueprint;
    
    if (!parsed.exercisePlans || parsed.exercisePlans.length === 0) {
      throw new Error("El Agente Diseñador Pedagógico no ha devuelto ningún ejercicio en su planificación.");
    }
    
    return parsed;
  }
}
