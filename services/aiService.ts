import { APP_DATA_STORAGE_KEY, CHILD_PROFILE, DEFAULT_AI_SETTINGS } from '../constants';
import type { Worksheet, Profile, AppData, SavedWorksheet, AISettings } from '../types';

interface GenerateWorksheetOptions {
  topic?: string;
  adaptationDescription?: string;
  adaptationTextContent?: string;
  adaptationImage?: {
    mimeType: string;
    data: string;
  };
}

const getAppData = (): AppData | null => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  try {
    const appDataRaw = localStorage.getItem(APP_DATA_STORAGE_KEY);
    return appDataRaw ? JSON.parse(appDataRaw) as AppData : null;
  } catch (error) {
    console.error('Could not load app data from localStorage.', error);
    return null;
  }
};

const getAISettings = (): AISettings => {
  const appData = getAppData();
  return {
    ...DEFAULT_AI_SETTINGS,
    ...(appData?.aiSettings || {}),
  };
};

const getActiveProfileData = (): { profile: Profile | null; content: string; showPictogramInstructions: boolean } => {
  const appData = getAppData();
  const activeProfile = appData?.profiles.find(p => p.id === appData.activeProfileId) || null;

  if (activeProfile) {
    return {
      profile: activeProfile,
      content: activeProfile.content,
      showPictogramInstructions: activeProfile.showPictogramInstructions ?? true,
    };
  }

  return {
    profile: null,
    content: CHILD_PROFILE,
    showPictogramInstructions: true,
  };
};

const extractJsonObject = (rawText: string): string => {
  const trimmed = rawText.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed;
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  throw new Error('La respuesta de la IA no contiene un JSON válido.');
};

const callGemini = async (promptText: string, settings: AISettings, adaptationImage?: GenerateWorksheetOptions['adaptationImage']): Promise<string> => {
  if (!settings.geminiApiKey.trim()) {
    throw new Error('Configura una clave de API de Gemini en el perfil para usar este proveedor.');
  }

  const body: Record<string, unknown> = {
    contents: adaptationImage
      ? [{
          parts: [
            { text: promptText },
            {
              inline_data: {
                mime_type: adaptationImage.mimeType,
                data: adaptationImage.data,
              },
            },
          ],
        }]
      : [{
          parts: [{ text: promptText }],
        }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.4,
    },
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(settings.geminiModel)}:generateContent?key=${encodeURIComponent(settings.geminiApiKey)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`Gemini devolvió un error (${response.status}): ${responseText}`);
  }

  const payload = JSON.parse(responseText);
  const text = payload?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text || '')
    .join('')
    .trim();

  if (!text) {
    throw new Error('Gemini no devolvió contenido útil.');
  }

  return text;
};

const normalizeOllamaBaseUrl = (baseUrl: string): string => baseUrl.replace(/\/+$/, '');

const callOllama = async (promptText: string, settings: AISettings, adaptationImage?: GenerateWorksheetOptions['adaptationImage']): Promise<string> => {
  const baseUrl = normalizeOllamaBaseUrl(settings.ollamaBaseUrl);
  if (!baseUrl) {
    throw new Error('Configura la URL base de Ollama en el perfil para usar este proveedor.');
  }

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: settings.ollamaModel,
      stream: false,
      format: 'json',
      messages: [{
        role: 'user',
        content: promptText,
        images: adaptationImage ? [adaptationImage.data] : undefined,
      }],
    }),
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`Ollama devolvió un error (${response.status}): ${responseText}`);
  }

  const payload = JSON.parse(responseText);
  const text = payload?.message?.content?.trim();
  if (!text) {
    throw new Error('Ollama no devolvió contenido útil.');
  }

  return text;
};

const callDebugProxy = async (promptText: string, settings: AISettings, adaptationImage?: GenerateWorksheetOptions['adaptationImage']): Promise<string> => {
  const response = await fetch('/__ai-debug', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      promptText,
      settings,
      adaptationImage: adaptationImage
        ? {
            mimeType: adaptationImage.mimeType,
            data: adaptationImage.data,
          }
        : null,
    }),
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`AI debug proxy devolvió un error (${response.status}): ${responseText}`);
  }

  const payload = JSON.parse(responseText);
  if (!payload?.text) {
    throw new Error('AI debug proxy no devolvió contenido útil.');
  }

  return payload.text as string;
};

const runProviderPrompt = async (promptText: string, adaptationImage?: GenerateWorksheetOptions['adaptationImage']): Promise<string> => {
  const settings = getAISettings();

  if (import.meta.env.DEV) {
    return callDebugProxy(promptText, settings, adaptationImage);
  }

  if (settings.provider === 'ollama') {
    return callOllama(promptText, settings, adaptationImage);
  }

  return callGemini(promptText, settings, adaptationImage);
};

const buildInstructionPrompt = (showPictogramInstructions: boolean): string => {
  return showPictogramInstructions
    ? `
      - **Instrucción Visual**: Para cada sección, en el objeto \`instruction\`, proporciona:
        - \`text\`: La instrucción principal en una o dos palabras MAYÚSCULAS (ej: "RODEAR", "UNIR", "COPIAR").
        - \`pictograms\`: Un array que descompone la instrucción. Para "UNIR CON FLECHAS", el array sería \`[{searchTerm: 'unir', content: 'UNIR'}, {searchTerm: 'flecha', content: 'FLECHA'}]\`. El \`searchTerm\` debe ser el verbo en infinitivo o un sustantivo, lo más descriptivo posible para encontrar la imagen correcta en ARASAAC.`
    : `
      - **Instrucción Simple**: Para cada sección, el campo \`instruction.text\` debe ser una o dos palabras MAYÚSCULAS (ej: "RODEAR", "UNIR", "COPIAR"). El campo \`instruction.pictograms\` debe omitirse.`;
};

export const generateWorksheet = async (options: GenerateWorksheetOptions): Promise<Worksheet> => {
  const { topic, adaptationDescription, adaptationTextContent, adaptationImage } = options;
  const { content: childProfile, showPictogramInstructions } = getActiveProfileData();
  const instructionPrompt = buildInstructionPrompt(showPictogramInstructions);

  try {
    let promptText: string;

    if (adaptationImage) {
      const extractedTextBlock = adaptationTextContent?.trim()
        ? `
        TEXTO EXTRAÍDO DEL PDF:
        """
        ${adaptationTextContent}
        """
        
        Si el texto extraído es legible, úsalo como referencia principal para identificar ejercicios textuales y convertirlos en actividades con pictogramas.`
        : '';

      promptText = `
        Eres un experto en pedagogía terapéutica. Tu misión es ANALIZAR LA IMAGEN ADJUNTA (que contiene todas las páginas de una ficha) y ADAPTARLA para un niño con este perfil:
        ${childProfile}

        ${extractedTextBlock}

        INSTRUCCIONES DE ADAPTACIÓN:
        1. **IDENTIFICA EL CONCEPTO**: Mira TODAS LAS PÁGINAS en la imagen y entiende cuál es el objetivo educativo principal.
        2. **REINVENTA Y AMPLÍA**: No copies los ejercicios. Crea una ficha nueva y más sencilla basada en el concepto.
        3. **ESTRUCTURA AGRUPADA**: Genera grupos de actividades del mismo tipo. Crea al menos tres actividades seguidas del mismo layout antes de cambiar.
        4. **SIN EJEMPLOS RESUELTOS**: Todas las actividades deben quedar sin resolver.
        5. **CONVERTIR TEXTO A PICTOS**: Si en la ficha original hay instrucciones, palabras o ejercicios principalmente textuales, transfórmalos a una versión visual con pictogramas e imágenes, manteniendo la intención pedagógica.
        ${instructionPrompt}
        6. **TIPOS DE EJERCICIO**: Usa solo estos cuatro tipos de actividad: repasar, unir, rodear y copiar.
        7. **SALIDA JSON**: Devuelve solo un objeto JSON válido con esta estructura exacta:
        {
          "title": "string",
          "pictogramSearchTerm": "string",
          "sections": [
            {
              "exerciseType": "repasar | unir | rodear | copiar",
              "instruction": {
                "text": "string",
                "pictograms": [{ "searchTerm": "string", "content": "string" }]
              },
              "items": [
                {
                  "type": "image | text | traceable_text | empty_box",
                  "content": "string",
                  "searchTerm": "string opcional"
                }
              ],
              "layout": "row | column | true_false | sentence_building | matching_horizontal"
            }
          ]
        }

        Analiza la imagen y genera la ficha adaptada.
      `;
    } else {
      const adaptationText = adaptationDescription
        ? `El objetivo es adaptar el siguiente concepto de ficha: "${adaptationDescription}".`
        : `El objetivo es crear una nueva ficha sobre: "${topic}".`;

      promptText = `
        Eres un experto en pedagogía terapéutica. Tu misión es crear una ficha de trabajo para un niño con este perfil:

        ${childProfile}

        REGLAS DE DISEÑO OBLIGATORIAS:
        1. **ESTRUCTURA DE LA FICHA**: Genera grupos de actividades del mismo tipo. Crea al menos tres actividades seguidas del mismo layout antes de cambiar.
        2. **SIN EJEMPLOS RESUELTOS**: No incluyas una primera actividad resuelta como ejemplo.
        3. **VISUAL ANTE TODO**: La ficha debe ser 90% visual.
        ${instructionPrompt}
        4. **TIPO DE ACTIVIDADES**: Usa solo estos cuatro tipos: repasar, unir, rodear y copiar. Prioriza lo visual. No incluyas matemáticas complejas ni actividades fuera de esos cuatro tipos.
        5. **TÉRMINOS DE BÚSQUEDA**: Para cada imagen, proporciona un término de búsqueda claro para ARASAAC.
        6. **SALIDA JSON**: Devuelve solo un objeto JSON válido con esta estructura exacta:
        {
          "title": "string",
          "pictogramSearchTerm": "string",
          "sections": [
            {
              "exerciseType": "repasar | unir | rodear | copiar",
              "instruction": {
                "text": "string",
                "pictograms": [{ "searchTerm": "string", "content": "string" }]
              },
              "items": [
                {
                  "type": "image | text | traceable_text | empty_box",
                  "content": "string",
                  "searchTerm": "string opcional"
                }
              ],
              "layout": "row | column | true_false | sentence_building | matching_horizontal"
            }
          ]
        }

        MODELOS DE ACTIVIDAD:
        - repasar: letras, sílabas o trazos visuales simples
        - unir: conjuntos equivalentes en dos filas
        - rodear: varias opciones visuales para marcar
        - copiar: un modelo arriba y varias copias debajo

        ${adaptationText}
      `;
    }

    const rawText = await runProviderPrompt(promptText, adaptationImage);
    return JSON.parse(extractJsonObject(rawText)) as Worksheet;
  } catch (error) {
    console.error('Error al generar la ficha:', error);
    throw new Error(error instanceof Error ? error.message : 'No se pudo generar el contenido de la ficha. Por favor, inténtalo de nuevo.');
  }
};

export const refineWorksheet = async (originalWorksheet: SavedWorksheet, instruction: string): Promise<Partial<Worksheet>> => {
  const { content: childProfile } = getActiveProfileData();

  const prompt = `
    Eres un experto en pedagogía terapéutica. Tu tarea es modificar una ficha de trabajo existente basándote en una instrucción del usuario.

    PERFIL DEL NIÑO:
    ${childProfile}

    FICHA ORIGINAL (JSON):
    ${JSON.stringify(originalWorksheet, null, 2)}

    INSTRUCCIÓN DEL USUARIO:
    "${instruction}"

    REGLAS:
    1. Aplica el cambio solicitado sin romper la estructura de la ficha.
    2. Puedes cambiar títulos, instrucciones, añadir, quitar o reemplazar items y secciones.
    3. Mantén los campos coherentes, especialmente \`searchTerm\` y \`content\`.
    4. Devuelve solo el JSON final, sin markdown ni explicación.
  `;

  try {
    const rawText = await runProviderPrompt(prompt);
    return JSON.parse(extractJsonObject(rawText)) as Partial<Worksheet>;
  } catch (error) {
    console.error('Error al refinar la ficha:', error);
    throw new Error(error instanceof Error ? error.message : 'No se pudo refinar la ficha. Por favor, inténtalo de nuevo.');
  }
};
