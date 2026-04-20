import { APP_DATA_STORAGE_KEY, CHILD_PROFILE, DEFAULT_AI_SETTINGS } from '../constants';
import type { Worksheet, Profile, AppData, SavedWorksheet, AISettings } from '../types';
import { normalizeWorksheet } from './worksheetNormalizer';

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

const WORKSHEET_JSON_SCHEMA = `{
  "title": "string corto en español",
  "pictogramSearchTerm": "sustantivo simple para el pictograma principal",
  "sections": [
    {
      "exerciseType": "repasar",
      "instruction": {
        "text": "REPASAR",
        "pictograms": [{ "searchTerm": "repasar", "content": "REPASAR" }]
      },
      "exercise": {
        "type": "repasar",
        "prompts": [
          { "type": "traceable_text", "content": "A" },
          { "type": "traceable_text", "content": "A" },
          { "type": "traceable_text", "content": "A" }
        ]
      }
    },
    {
      "exerciseType": "unir",
      "instruction": {
        "text": "UNIR",
        "pictograms": [
          { "searchTerm": "unir", "content": "UNIR" },
          { "searchTerm": "flecha", "content": "FLECHA" }
        ]
      },
      "exercise": {
        "type": "unir",
        "pairs": [
          {
            "left": { "type": "image", "content": "sol", "searchTerm": "sol" },
            "right": { "type": "image", "content": "sol", "searchTerm": "sol" }
          }
        ]
      }
    },
    {
      "exerciseType": "rodear",
      "instruction": {
        "text": "RODEAR",
        "pictograms": [{ "searchTerm": "rodear", "content": "RODEAR" }]
      },
      "exercise": {
        "type": "rodear",
        "prompt": { "type": "image", "content": "perro", "searchTerm": "perro" },
        "options": [
          { "type": "image", "content": "perro", "searchTerm": "perro" },
          { "type": "image", "content": "gato", "searchTerm": "gato" },
          { "type": "image", "content": "pez", "searchTerm": "pez" }
        ]
      }
    },
    {
      "exerciseType": "copiar",
      "instruction": {
        "text": "COPIAR",
        "pictograms": [{ "searchTerm": "copiar", "content": "COPIAR" }]
      },
      "exercise": {
        "type": "copiar",
        "model": { "type": "traceable_text", "content": "SOL" },
        "copies": [
          { "type": "traceable_text", "content": "SOL" },
          { "type": "traceable_text", "content": "SOL" }
        ]
      }
    }
  ]
}`;

const WORKSHEET_OUTPUT_RULES = `
REGLAS ESTRICTAS DE SALIDA:
- Devuelve SOLO un objeto JSON válido. Sin markdown. Sin comentarios. Sin texto antes ni después.
- Usa únicamente estos exerciseType: "repasar", "unir", "rodear", "copiar".
- El campo "exercise.type" debe coincidir exactamente con "exerciseType".
- No inventes layouts libres ni claves alternativas. No uses "activities", "tasks", "blocks", "pages" ni "elements".
- Cada sección debe contener exactamente: "exerciseType", "instruction", "exercise".
- Puedes omitir "instruction.pictograms" solo si se te pide instrucción simple. Nunca devuelvas null.
- Los items de imagen deben usar type "image" y llevar "searchTerm".
- Los items de trazado/copia deben usar type "traceable_text".
- No devuelvas ejercicios resueltos ni respuestas marcadas como correctas.
- Mantén todo el contenido alineado con el tema pedido. No uses letras, vocales, sílabas o palabras genéricas si el tema no es de lectoescritura.
- Si dudas entre dos formatos, elige SIEMPRE la estructura del esquema JSON mostrado.`;

const REFINEMENT_JSON_SCHEMA = `{
  "title": "string opcional",
  "pictogramSearchTerm": "string opcional",
  "sections": [
    {
      "exerciseType": "rodear",
      "instruction": {
        "text": "RODEAR",
        "pictograms": [{ "searchTerm": "rodear", "content": "RODEAR" }]
      },
      "exercise": {
        "type": "rodear",
        "prompt": { "type": "image", "content": "perro", "searchTerm": "perro" },
        "options": [
          { "type": "image", "content": "perro", "searchTerm": "perro" },
          { "type": "image", "content": "gato", "searchTerm": "gato" }
        ]
      }
    }
  ]
}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const parseJsonPayload = (rawText: string): unknown => JSON.parse(extractJsonObject(rawText));

const normalizeWorksheetPayload = (payload: unknown): Worksheet => {
  if (!isRecord(payload)) {
    throw new Error('La IA no devolvió un objeto JSON válido para la ficha.');
  }

  const title = typeof payload.title === 'string' && payload.title.trim()
    ? payload.title.trim()
    : 'Ficha adaptada';
  const pictogramSearchTerm = typeof payload.pictogramSearchTerm === 'string' && payload.pictogramSearchTerm.trim()
    ? payload.pictogramSearchTerm.trim()
    : title;
  const sections = Array.isArray(payload.sections)
    ? payload.sections.filter(section => isRecord(section))
    : [];

  if (sections.length === 0) {
    throw new Error('La IA no devolvió ninguna sección utilizable.');
  }

  return normalizeWorksheet({
    ...payload,
    title,
    pictogramSearchTerm,
    sections,
  } as Worksheet);
};

const normalizeRefinementPayload = (payload: unknown): Partial<Worksheet> => {
  if (!isRecord(payload)) {
    throw new Error('La IA no devolvió un objeto JSON válido para el refinado.');
  }

  const normalized: Partial<Worksheet> = {};

  if (typeof payload.title === 'string' && payload.title.trim()) {
    normalized.title = payload.title.trim();
  }

  if (typeof payload.pictogramSearchTerm === 'string' && payload.pictogramSearchTerm.trim()) {
    normalized.pictogramSearchTerm = payload.pictogramSearchTerm.trim();
  }

  if (Array.isArray(payload.sections)) {
    normalized.sections = normalizeWorksheetPayload({
      title: normalized.title || 'Ficha refinada',
      pictogramSearchTerm: normalized.pictogramSearchTerm || normalized.title || 'ficha',
      sections: payload.sections,
    }).sections;
  }

  return normalized;
};

const getSemanticContext = (options: GenerateWorksheetOptions): string =>
  [options.topic, options.adaptationDescription, options.adaptationTextContent]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

const isLiteracyTopic = (context: string): boolean =>
  /\b(letra|letras|vocal|vocales|silaba|silabas|sílaba|sílabas|abecedario|fonema|fonemas|lectura|escritura|lectoescritura)\b/i.test(context);

const isSingleLetterToken = (value: string): boolean => /^[a-záéíóúüñ]$/i.test(value.trim());

const needsSemanticRepair = (worksheet: Worksheet, options: GenerateWorksheetOptions): boolean => {
  const context = getSemanticContext(options);
  if (!context || isLiteracyTopic(context)) {
    return false;
  }

  const repasarTokens = worksheet.sections
    .filter(section => section.exercise?.type === 'repasar')
    .flatMap(section => section.exercise?.type === 'repasar' ? section.exercise.prompts : [])
    .map(item => item.content || '')
    .filter(Boolean);

  if (repasarTokens.length === 0) {
    return false;
  }

  const singleLetterCount = repasarTokens.filter(isSingleLetterToken).length;
  return singleLetterCount > 0 && singleLetterCount >= Math.ceil(repasarTokens.length / 2);
};

const repairSemanticMismatch = async (rawText: string, options: GenerateWorksheetOptions): Promise<Worksheet> => {
  const semanticContext = getSemanticContext(options) || 'tema no especificado';
  const repairPrompt = `
Corrige esta ficha porque su contenido no respeta el tema solicitado.

TEMA Y CONTEXTO REAL:
${semanticContext}

PROBLEMA DETECTADO:
- La ficha usa letras, vocales o trazos genéricos.
- Eso es incorrecto si el tema no es de lectoescritura.

INSTRUCCIONES DE CORRECCIÓN:
- Mantén la estructura JSON exacta del sistema.
- Sustituye letras o vocales genéricas por palabras y conceptos reales del tema.
- En ejercicios "repasar", usa palabras del tema completo o etiquetas significativas.
- Ejemplo: si el tema es "partes de una planta", usa "raíz", "tallo", "hoja", "flor", "semilla".

${WORKSHEET_OUTPUT_RULES}

ESQUEMA OBJETIVO:
${WORKSHEET_JSON_SCHEMA}

SALIDA A CORREGIR:
"""
${rawText}
"""`;

  const repairedText = await runProviderPrompt(repairPrompt, options.adaptationImage);
  return normalizeWorksheetPayload(parseJsonPayload(repairedText));
};

const repairJsonResponse = async (rawText: string, mode: 'worksheet' | 'refinement'): Promise<unknown> => {
  const promptText = `
Corrige la siguiente salida para que sea JSON válido y cumpla el esquema pedido.

TIPO DE RESPUESTA: ${mode === 'worksheet' ? 'ficha completa' : 'refinado parcial de ficha'}

${WORKSHEET_OUTPUT_RULES}

${mode === 'worksheet'
    ? `ESQUEMA OBJETIVO:
${WORKSHEET_JSON_SCHEMA}`
    : `ESQUEMA OBJETIVO:
${REFINEMENT_JSON_SCHEMA}`}

SALIDA A CORREGIR:
"""
${rawText}
"""`;

  const repairedText = await runProviderPrompt(promptText);
  return parseJsonPayload(repairedText);
};

const parseWorksheetResponse = async (rawText: string): Promise<Worksheet> => {
  try {
    return normalizeWorksheetPayload(parseJsonPayload(rawText));
  } catch (error) {
    console.warn('Fallo al parsear la ficha inicial. Intentando reparación automática.', error);
    return normalizeWorksheetPayload(await repairJsonResponse(rawText, 'worksheet'));
  }
};

const parseRefinementResponse = async (rawText: string): Promise<Partial<Worksheet>> => {
  try {
    return normalizeRefinementPayload(parseJsonPayload(rawText));
  } catch (error) {
    console.warn('Fallo al parsear el refinado inicial. Intentando reparación automática.', error);
    return normalizeRefinementPayload(await repairJsonResponse(rawText, 'refinement'));
  }
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
        7. **FIDELIDAD SEMÁNTICA**: Usa vocabulario del concepto detectado en la ficha original. Si la ficha trata, por ejemplo, sobre partes de una planta, los contenidos deben ser "raíz", "tallo", "hoja", "flor", etc., y nunca vocales o letras sueltas salvo que la ficha original trate de lectoescritura.
        8. **SALIDA JSON**: Devuelve solo un objeto JSON válido con esta estructura exacta:
        ${WORKSHEET_JSON_SCHEMA}
        ${WORKSHEET_OUTPUT_RULES}

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
        6. **FIDELIDAD AL TEMA**: Todo el contenido debe pertenecer al tema pedido. Si el tema es "las partes de una planta", usa elementos como "raíz", "tallo", "hoja", "flor", "semilla". No uses vocales, sílabas o letras aisladas salvo que el tema sea explícitamente de lectoescritura.
        7. **REPASAR CON SIGNIFICADO**: En actividades de tipo \`repasar\`, el texto trazable debe ser una palabra o etiqueta del tema, no una letra genérica, salvo que el tema sea una letra o sílaba concreta.
        8. **SALIDA JSON**: Devuelve solo un objeto JSON válido con esta estructura exacta:
        ${WORKSHEET_JSON_SCHEMA}
        ${WORKSHEET_OUTPUT_RULES}

        MODELOS DE ACTIVIDAD:
        - repasar: letras, sílabas o trazos visuales simples con \`exercise.prompts\`
        - unir: parejas equivalentes en dos columnas con \`exercise.pairs\`
        - rodear: una consigna visual opcional y varias opciones con \`exercise.prompt\` y \`exercise.options\`
        - copiar: un modelo arriba y varias repeticiones debajo con \`exercise.model\` y \`exercise.copies\`

        ${adaptationText}
      `;
    }

    const rawText = await runProviderPrompt(promptText, adaptationImage);
    const worksheet = await parseWorksheetResponse(rawText);

    if (needsSemanticRepair(worksheet, options)) {
      console.warn('La ficha generada no respeta el tema. Intentando corrección semántica automática.');
      return await repairSemanticMismatch(rawText, options);
    }

    return worksheet;
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
    4. Si modificas secciones, usa la misma estructura canónica del sistema:
    ${WORKSHEET_JSON_SCHEMA}
    5. Puedes devolver solo los campos modificados, pero cada sección que devuelvas debe ser válida por sí misma.
    6. Devuelve solo el JSON final, sin markdown ni explicación.
    ${WORKSHEET_OUTPUT_RULES}
  `;

  try {
    const rawText = await runProviderPrompt(prompt);
    return await parseRefinementResponse(rawText);
  } catch (error) {
    console.error('Error al refinar la ficha:', error);
    throw new Error(error instanceof Error ? error.message : 'No se pudo refinar la ficha. Por favor, inténtalo de nuevo.');
  }
};
