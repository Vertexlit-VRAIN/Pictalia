import type { Worksheet, SavedWorksheet } from '../../types';
import { AdpAgent } from './agents/adpAgent';
import { AcAgent } from './agents/acAgent';
import { EvaluatorAgent } from './agents/evaluatorAgent';
import { searchPictograms } from '../pictogramService';
import { normalizeWorksheet, getFlattenedItemsFromExercise } from '../worksheetNormalizer';
import { getActiveProfileData, getAppData, parseJsonPayload, repairJsonResponse } from './utils';
import { runAiPrompt } from '../aiClient';
import { buildGenerationPromptBase } from './prompts/shared';
import {
  getAvailableExerciseTypes,
  getExerciseSchema,
} from '../../components/exercises/registry';

export interface GenerateWorksheetOptions {
  topic?: string;
  goal?: string;
  extraDetails?: string;
  language?: 'es' | 'val' | 'en';
}

const EXERCISE_COUNT_PATTERNS = [
  /\b(\d{1,2})\s+(?:ejercicios?|actividades?|secciones?)\b/i,
  /\b(?:con|de|tenga|tener|incluye?|incluya|quiero|necesito)\s+(\d{1,2})\s+(?:ejercicios?|actividades?|secciones?)\b/i,
  /\b(\d{1,2})\s+(?:exercises?|activities?|sections?)\b/i,
];

const getSemanticContext = (options: GenerateWorksheetOptions): string =>
  [options.topic, options.goal, options.extraDetails]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

const extractRequestedExerciseCount = (options: GenerateWorksheetOptions): number | undefined => {
  const textBlocks = [
    options.topic,
    options.goal,
    options.extraDetails,
  ].filter(Boolean) as string[];

  for (const text of textBlocks) {
    for (const pattern of EXERCISE_COUNT_PATTERNS) {
      const match = text.match(pattern);
      if (!match) continue;

      const count = Number.parseInt(match[1], 10);
      if (Number.isFinite(count) && count > 0) {
        return count;
      }
    }
  }

  return undefined;
};

/**
 * Orchestrates the Multi-Agent System (MAS) to design, construct and assemble a worksheet.
 */
export const generateWorksheet = async (options: GenerateWorksheetOptions): Promise<Worksheet> => {
  const { content: childProfile, showPictogramInstructions } = getActiveProfileData();
  const startTime = Date.now();
  
  const requestedLanguage = options.language || 'es';
  const availableExerciseTypes = getAvailableExerciseTypes();
  const requestedExerciseCount = extractRequestedExerciseCount(options);

  const appData = getAppData();
  const useSinglePrompt = appData?.aiSettings.useSinglePrompt || false;

  let adpTimeMs = 0;
  let acTimeMs = 0;
  let retryCount = 0;

  try {
    if (useSinglePrompt) {
      const promptText = buildGenerationPromptBase(
        "Generate a complete worksheet visual adaptada.",
        {
          topic: options.topic,
          goal: options.goal,
          extraDetails: options.extraDetails,
          requestedExerciseCount,
          language: requestedLanguage,
        },
        childProfile,
        showPictogramInstructions
      );

      let rawText = '';
      let parsedPayload: any = null;
      try {
        rawText = await runAiPrompt(promptText);
        parsedPayload = parseJsonPayload(rawText);
      } catch (err) {
        console.warn("Fallo en generación single-prompt, intentando reparar JSON:", err);
        try {
          parsedPayload = await repairJsonResponse(rawText, 'worksheet');
        } catch (repairErr) {
          throw new Error("No se pudo generar la ficha en una única llamada de IA debido a un fallo estructurado irrecuperable.");
        }
      }

      // Normalizar la ficha
      let worksheet = normalizeWorksheet(parsedPayload as Worksheet);
      worksheet.originalTopic = options.topic;
      worksheet.originalGoal = options.goal;
      worksheet.originalExtraDetails = options.extraDetails;
      worksheet.language = requestedLanguage;

      // Resolver pictogramas
      const searchTerms: { type: 'main' | 'section_instruction' | 'item'; path: number[]; term: string }[] = [];
      if (worksheet.pictogramSearchTerm) {
        searchTerms.push({ type: 'main', path: [], term: worksheet.pictogramSearchTerm });
      }

      worksheet.sections.forEach((section, sectionIndex) => {
        (section.instruction?.pictograms || []).forEach((picto, pictoIndex) => {
          searchTerms.push({
            type: 'section_instruction',
            path: [sectionIndex, pictoIndex],
            term: picto.searchTerm || picto.content,
          });
        });

        (section.items || []).forEach((item, itemIndex) => {
          if (item.type === 'image' || item.type === 'traceable_text') {
            searchTerms.push({
              type: 'item',
              path: [sectionIndex, itemIndex],
              term: item.searchTerm || item.content,
            });
          }
        });
      });

      const pictoSearchPromises = searchTerms.map(st => searchPictograms(st.term, requestedLanguage));
      const pictoSearchResults = await Promise.all(pictoSearchPromises);

      pictoSearchResults.forEach((foundPictos, idx) => {
        const st = searchTerms[idx];
        const urls = foundPictos.map(p => p.url);
        const chosenUrl = urls.length > 0 ? urls[0] : '';

        if (st.type === 'main') {
          worksheet.pictoOptions = urls;
          worksheet.selectedPictoUrl = chosenUrl;
        } else if (st.type === 'section_instruction') {
          const [sectionIndex, pictoIndex] = st.path;
          const pictoObj = worksheet.sections[sectionIndex].instruction.pictograms?.[pictoIndex];
          if (pictoObj) pictoObj.url = chosenUrl;
        } else if (st.type === 'item') {
          const [sectionIndex, itemIndex] = st.path;
          const itemObj = worksheet.sections[sectionIndex].items[itemIndex];
          if (itemObj) {
            itemObj.pictoOptions = urls;
            itemObj.selectedPictoUrl = chosenUrl;
          }
        }
      });

      worksheet = normalizeWorksheet(worksheet);
      worksheet.telemetry = {
        generationTimeMs: Date.now() - startTime,
        adpTimeMs: 0,
        acTimeMs: 0,
        rejectionCount: 0,
        manualEditsCount: 0,
        pictoOverridesCount: 0,
        retryCount: 0,
        createdTimestamp: new Date().toISOString(),
      };

      return worksheet;
    }
    // 1. Etapa 1: Agente Diseñador Pedagógico (ADP)
    const adpStartTime = Date.now();
    const adpAgent = new AdpAgent();
    const blueprint = await adpAgent.generateBlueprint(
      {
        topic: options.topic,
        goal: options.goal,
        extraDetails: options.extraDetails,
        requestedExerciseCount,
        language: requestedLanguage,
      },
      childProfile,
      availableExerciseTypes
    );
    adpTimeMs = Date.now() - adpStartTime;

    const exercisePlans = blueprint.exercisePlans || [];

    // 2. Etapa 2: Agente Constructor (AC) + Evaluador Individual (PEA) - Ejecución en paralelo con retry
    const acStartTime = Date.now();
    const acAgent = new AcAgent();
    const evaluatorAgent = new EvaluatorAgent();

    const sectionPromises = exercisePlans.map(async (plan, index) => {
      const typeKey = String(plan.type || 'rodear').toLowerCase().trim() as any;
      let targetSchema = '';
      try {
        targetSchema = getExerciseSchema(typeKey);
      } catch {
        targetSchema = getExerciseSchema('rodear');
      }

      let attempts = 0;
      const maxAttempts = 3;
      let generatedSection: any = null;
      let individualFeedback: string | undefined = undefined;

      while (attempts < maxAttempts) {
        try {
          generatedSection = await acAgent.generateExercise(
            plan,
            index,
            targetSchema,
            requestedLanguage,
            () => { retryCount++; },
            individualFeedback
          );

          // Evaluar individualmente el ejercicio generado
          const evalResult = await evaluatorAgent.evaluateExercise(
            plan,
            generatedSection,
            childProfile,
            requestedLanguage
          );

          if (evalResult.approved) {
            return generatedSection;
          } else {
            console.warn(
              `[Evaluador Individual] Ejercicio ${index + 1} de tipo ${typeKey} rechazado. Feedback: ${evalResult.feedback}`
            );
            individualFeedback = evalResult.feedback;
            attempts++;
            retryCount++;
          }
        } catch (error) {
          attempts++;
          retryCount++;
          console.warn(
            `Intento ${attempts} fallido para generar/evaluar el ejercicio ${index + 1} de tipo ${typeKey}. Error:`,
            error
          );
          if (attempts >= maxAttempts) {
            throw error;
          }
        }
      }
      throw new Error(`Fallo tras ${maxAttempts} intentos al generar el ejercicio de tipo "${typeKey}".`);
    });

    const rawSections = await Promise.all(sectionPromises);
    acTimeMs = Date.now() - acStartTime;

    // 3. Etapa 3: Ensamblador de Fichas (Código Puro)
    const assembledSections = rawSections.map((sectionPayload) => {
      return normalizeWorksheet({
        title: blueprint.title,
        pictogramSearchTerm: blueprint.pictogramSearchTerm,
        sections: [sectionPayload],
      }).sections[0];
    });

    // Crear el objeto provisional de la ficha
    let worksheet: Worksheet = {
      title: blueprint.title || options.topic || "Ficha adaptada",
      pictogramSearchTerm: blueprint.pictogramSearchTerm || options.topic || "ficha",
      sections: assembledSections,
      originalTopic: options.topic,
      originalGoal: options.goal,
      originalExtraDetails: options.extraDetails,
      language: requestedLanguage,
    };

    // 4. Etapa 4: Evaluador Global (GPEA)
    let globalAttempts = 0;
    const maxGlobalAttempts = 2;
    let globalApproved = false;

    while (globalAttempts < maxGlobalAttempts && !globalApproved) {
      const globalEval = await evaluatorAgent.evaluateWorksheet(
        childProfile,
        options.topic || '',
        options.goal || '',
        worksheet,
        requestedLanguage
      );

      if (globalEval.approved || !globalEval.exerciseModifications || globalEval.exerciseModifications.length === 0) {
        globalApproved = true;
      } else {
        console.warn(`[Evaluador Global] Ficha rechazada. Issues: ${globalEval.globalIssues}`);
        globalAttempts++;
        retryCount++;

        // Aplicar las correcciones solicitadas en paralelo
        const correctionPromises = globalEval.exerciseModifications.map(async (mod) => {
          const idx = mod.exerciseIndex;
          if (idx < 0 || idx >= worksheet.sections.length) return;

          const plan = exercisePlans[idx];
          const typeKey = String(plan.type || 'rodear').toLowerCase().trim() as any;
          let targetSchema = '';
          try {
            targetSchema = getExerciseSchema(typeKey);
          } catch {
            targetSchema = getExerciseSchema('rodear');
          }

          console.warn(`[Evaluador Global] Corrigiendo ejercicio ${idx + 1} de tipo ${typeKey} con feedback global.`);
          const correctedSection = await acAgent.generateExercise(
            plan,
            idx,
            targetSchema,
            requestedLanguage,
            () => { retryCount++; },
            mod.feedback
          );

          // Normalizar el ejercicio corregido
          worksheet.sections[idx] = normalizeWorksheet({
            title: blueprint.title,
            pictogramSearchTerm: blueprint.pictogramSearchTerm,
            sections: [correctedSection],
          }).sections[0];
        });

        await Promise.all(correctionPromises);
      }
    }

    // Resolver pictogramas
    const searchTerms: { type: 'main' | 'section_instruction' | 'item'; path: number[]; term: string }[] = [];

    // Pictograma de cabecera
    if (worksheet.pictogramSearchTerm) {
      searchTerms.push({
        type: 'main',
        path: [],
        term: worksheet.pictogramSearchTerm,
      });
    }

    // Pictogramas de enunciados y elementos de ejercicios
    worksheet.sections.forEach((section, sectionIndex) => {
      // Enunciado
      (section.instruction?.pictograms || []).forEach((picto, pictoIndex) => {
        searchTerms.push({
          type: 'section_instruction',
          path: [sectionIndex, pictoIndex],
          term: picto.searchTerm || picto.content,
        });
      });

      // Elementos de la sección
      (section.items || []).forEach((item, itemIndex) => {
        if (item.type === 'image' || item.type === 'traceable_text') {
          searchTerms.push({
            type: 'item',
            path: [sectionIndex, itemIndex],
            term: item.searchTerm || item.content,
          });
        }
      });
    });

    // Resolver en paralelo todas las búsquedas de pictogramas a ARASAAC
    const pictoSearchPromises = searchTerms.map(st => searchPictograms(st.term, requestedLanguage));
    const pictoSearchResults = await Promise.all(pictoSearchPromises);

    pictoSearchResults.forEach((foundPictos, idx) => {
      const st = searchTerms[idx];
      const urls = foundPictos.map(p => p.url);
      const chosenUrl = urls.length > 0 ? urls[0] : '';

      if (st.type === 'main') {
        worksheet.pictoOptions = urls;
        worksheet.selectedPictoUrl = chosenUrl;
      } else if (st.type === 'section_instruction') {
        const [sectionIndex, pictoIndex] = st.path;
        const pictoObj = worksheet.sections[sectionIndex].instruction.pictograms?.[pictoIndex];
        if (pictoObj) {
          pictoObj.url = chosenUrl;
        }
      } else if (st.type === 'item') {
        const [sectionIndex, itemIndex] = st.path;
        const itemObj = worksheet.sections[sectionIndex].items[itemIndex];
        if (itemObj) {
          itemObj.pictoOptions = urls;
          itemObj.selectedPictoUrl = chosenUrl;
        }
      }
    });

    // Normalizar la ficha entera con IDs internos
    worksheet = normalizeWorksheet(worksheet);

    const totalTimeMs = Date.now() - startTime;

    // Rellenar telemetría
    worksheet.telemetry = {
      generationTimeMs: totalTimeMs,
      adpTimeMs,
      acTimeMs,
      rejectionCount: 0,
      manualEditsCount: 0,
      pictoOverridesCount: 0,
      retryCount,
      createdTimestamp: new Date().toISOString(),
    };

    return worksheet;
  } catch (error) {
    console.error('Error al generar la ficha mediante MAS:', error);
    throw new Error(error instanceof Error ? error.message : 'No se pudo generar la ficha adaptada. Inténtalo de nuevo.');
  }
};
