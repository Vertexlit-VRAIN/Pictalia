import { GoogleGenAI, Type } from "@google/genai";
import { searchPictograms } from './arasaacService';
import { CHILD_PROFILE, APP_DATA_STORAGE_KEY } from '../constants';
import type { Worksheet, Profile, AppData, SavedWorksheet } from '../types';

if (!process.env.API_KEY) {
  console.error("API_KEY no está configurada. La aplicación no podrá comunicarse con la IA.");
  throw new Error("La clave de API de Gemini no está configurada en el entorno.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getActiveProfileData = (): { content: string; showPictogramInstructions: boolean } => {
    if (typeof window !== 'undefined' && window.localStorage) {
        try {
            const appDataRaw = localStorage.getItem(APP_DATA_STORAGE_KEY);
            if (appDataRaw) {
                const appData: AppData = JSON.parse(appDataRaw);
                const activeProfile = appData.profiles.find(p => p.id === appData.activeProfileId);
                if (activeProfile) {
                    return {
                        content: activeProfile.content,
                        showPictogramInstructions: activeProfile.showPictogramInstructions ?? true,
                    };
                }
            }
        } catch (error) {
            console.error("Could not load child profile from localStorage, falling back to default.", error);
        }
    }
    // Fallback to the default constant and settings
    return { content: CHILD_PROFILE, showPictogramInstructions: true };
};


const instructionSchema = {
    type: Type.OBJECT,
    properties: {
        text: { type: Type.STRING, description: 'Instrucción ultra-simple para la sección en mayúsculas. Ej: "RODEA", "UNE"' },
        pictograms: {
            type: Type.ARRAY,
            description: 'Traducción de la instrucción a una secuencia de pictogramas. Solo si se solicita.',
            items: {
                type: Type.OBJECT,
                properties: {
                    searchTerm: { type: Type.STRING, description: 'Término de búsqueda para ARASAAC. Ej: "unir", "flecha"' },
                    content: { type: Type.STRING, description: 'Texto que acompaña al pictograma. Ej: "UNE", "FLECHA"' },
                }
            }
        }
    }
}

const sectionSchema = {
    type: Type.OBJECT,
    properties: {
        instruction: instructionSchema,
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, description: 'Tipo de item: "image", "text", "traceable_text", "empty_box"' },
              content: { type: Type.STRING, description: 'Contenido del item. Para "traceable_text", el número o letra a repasar. Para texto, la palabra. Para imagen, una descripción.' },
              searchTerm: { type: Type.STRING, description: 'Término de búsqueda para ARASAAC si el tipo es "image". Ej: "manzana"' }
            }
          }
        },
        layout: { type: Type.STRING, description: 'Disposición de los items: "row", "column", "true_false", "sentence_building", "matching_horizontal"' }
    }
};

const worksheetSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: 'Título de la ficha en mayúsculas. Ej: "EL NÚMERO 3"' },
    pictogramSearchTerm: { type: Type.STRING, description: 'Un sustantivo o verbo en infinitivo para buscar un pictograma en ARASAAC que represente el título. Ej: "número" o "contar"' },
    sections: {
      type: Type.ARRAY,
      description: 'Una lista de secciones o actividades para la ficha. Genera al menos 3 actividades seguidas del mismo tipo (layout) para reforzar el aprendizaje.',
      items: sectionSchema
    }
  },
  required: ['title', 'pictogramSearchTerm', 'sections']
};

interface GenerateWorksheetOptions {
    topic?: string;
    adaptationDescription?: string;
    adaptationImage?: {
        mimeType: string;
        data: string;
    };
}


export const generateWorksheet = async (options: GenerateWorksheetOptions): Promise<Worksheet> => {
  const { topic, adaptationDescription, adaptationImage } = options;
  const { content: childProfile, showPictogramInstructions } = getActiveProfileData();
  
  const instructionPrompt = showPictogramInstructions
    ? `
      - **Instrucción Visual**: Para cada sección, en el objeto \`instruction\`, proporciona:
        - \`text\`: La instrucción principal en una o dos palabras MAYÚSCULAS (ej: "UNE CON FLECHAS").
        - \`pictograms\`: Un array que descompone la instrucción. Para "UNE CON FLECHAS", el array sería \`[{searchTerm: 'unir flecha', content: 'UNE'}, {searchTerm: 'flecha', content: 'FLECHA'}]\`. El \`searchTerm\` debe ser lo más descriptivo posible para encontrar la imagen correcta en ARASAAC.`
    : `
      - **Instrucción Simple**: Para cada sección, el campo \`instruction.text\` debe ser una o dos palabras MAYÚSCULAS (ej: "RODEA", "UNE"). El campo \`instruction.pictograms\` debe omitirse.`;
  
  try {
    let contents: any;
    let promptText: string;

    if (adaptationImage) {
        promptText = `
            Eres un experto en pedagogía terapéutica. Tu misión es ANALIZAR LA IMAGEN ADJUNTA (que contiene todas las páginas de una ficha) y ADAPTARLA para un niño con este perfil:
            ${childProfile}
    
            INSTRUCCIONES DE ADAPTACIÓN:
            1.  **IDENTIFICA EL CONCEPTO**: Mira TODAS LAS PÁGINAS en la imagen y entiende cuál es el objetivo educativo principal (ej: aprender el número 3, los colores).
            2.  **REINVENTA Y AMPLÍA**: No copies los ejercicios. Crea una ficha nueva y más sencilla basada en el concepto.
            3.  **ESTRUCTURA AGRUPADA**: Genera grupos de actividades del mismo tipo. Por ejemplo, crea AL MENOS TRES actividades seguidas de "unir con flechas" antes de cambiar a otro tipo.
            4.  **SIN EJEMPLOS RESUELTOS**: No incluyas una actividad resuelta como ejemplo. Todas las actividades deben ser para que el niño las resuelva.
            ${instructionPrompt}
            5.  **FORMATO JSON**: Tu respuesta DEBE ser un objeto JSON válido que se ajuste al esquema, sin texto adicional.
    
            Analiza la imagen y genera la ficha adaptada en formato JSON.
        `;
        const imagePart = {
            inlineData: {
                mimeType: adaptationImage.mimeType,
                data: adaptationImage.data,
            },
        };
        contents = { parts: [{ text: promptText }, imagePart] };
    } else {
        const adaptationText = adaptationDescription 
            ? `El objetivo es adaptar el siguiente concepto de ficha: "${adaptationDescription}".`
            : `El objetivo es crear una nueva ficha sobre: "${topic}".`;

        promptText = `
            Eres un experto en pedagogía terapéutica. Tu misión es crear una ficha de trabajo para un niño con este perfil:

            ${childProfile}

            REGLAS DE DISEÑO OBLIGATORIAS:
            1.  **ESTRUCTURA DE LA FICHA**: La ficha debe tener una estructura clara. Genera grupos de actividades del mismo tipo. Por ejemplo, crea AL MENOS TRES actividades seguidas de "unir con flechas", luego puedes pasar a otro tipo de actividad.
            2.  **SIN EJEMPLOS RESUELTOS**: No incluyas una primera actividad resuelta como ejemplo. Todas las actividades deben ser para que el niño las complete.
            3.  **VISUAL ANTE TODO**: La ficha debe ser 90% visual.
            ${instructionPrompt}
            4.  **TIPO DE ACTIVIDADES**: Prioriza repasar, rodear, unir, pintar, clasificar visualmente. NO incluyas contar, escribir (excepto vocales mayúsculas) o matemáticas complejas.
            5.  **TÉRMINOS DE BÚSQUEDA**: Para cada imagen, proporciona un término de búsqueda para ARASAAC. Debe ser específico y descriptivo. Por ejemplo, para "unir con flechas", un buen término sería "unir flecha". Para una manzana, "manzana".
            6.  **FORMATO**: La respuesta DEBE ser un objeto JSON válido que se ajuste al esquema proporcionado, sin ningún texto o explicación adicional.

            ---
            TIPOS DE FICHAS A GENERAR (Basa tus creaciones en estos modelos):

            1.  **"ADIVINA: ¿VERDADERO O FALSO?"**
                -   \`layout\`: "true_false"
                -   \`items\`: [imagen_principal, afirmacion_1, afirmacion_2].

            2.  **"CONSTRUIR FRASES"**
                -   \`layout\`: "sentence_building"
                -   \`items\`: [empty_box, empty_box, ..., picto_1, picto_2, ...].

            3.  **"UNIR CON FLECHAS (HORIZONTAL)"**
                -   \`layout\`: "matching_horizontal"
                -   \`items\`: [item_arriba_1, item_arriba_2, item_abajo_1, item_abajo_2].
            ---

            ${adaptationText}

            Genera el contenido de la ficha en formato JSON.
        `;
        contents = promptText;
    }


    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: worksheetSchema,
      },
    });

    const jsonText = response.text.trim();
    const worksheetData: Worksheet = JSON.parse(jsonText);

    // Fetch pictograms from ARASAAC
    if (worksheetData.pictogramSearchTerm) {
        worksheetData.pictogramUrl = await searchPictograms(worksheetData.pictogramSearchTerm);
    }

    for (const section of worksheetData.sections) {
        if (section.instruction.pictograms) {
            for (const pictogram of section.instruction.pictograms) {
                if (pictogram.searchTerm) {
                    pictogram.url = await searchPictograms(pictogram.searchTerm);
                }
            }
        }
        for (const item of section.items) {
            if (item.type === 'image' && item.searchTerm) {
                item.pictogramUrl = await searchPictograms(item.searchTerm);
            }
        }
    }

    return worksheetData;
  } catch (error) {
    console.error("Error al generar la ficha:", error);
    throw new Error("No se pudo generar el contenido de la ficha. Por favor, inténtalo de nuevo.");
  }
};

export const refineWorksheet = async (originalWorksheet: SavedWorksheet, instruction: string): Promise<Partial<Worksheet>> => {
  const { content: childProfile } = getActiveProfileData();

  const prompt = `
    Eres un experto en pedagogía terapéutica. Tu tarea es modificar una ficha de trabajo existente basándote en una instrucción del usuario.

    PERFIL DEL NIÑO:
    ${childProfile}

    FICHA ORIGINAL (en formato JSON):
    ${JSON.stringify(originalWorksheet, null, 2)}

    INSTRUCCIÓN DEL USUARIO:
    "${instruction}"

    REGLAS PARA LA MODIFICACIÓN:
    1.  **APLICA EL CAMBIO**: Modifica la ficha original para cumplir con la instrucción del usuario. Puedes cambiar títulos, instrucciones, añadir, quitar o reemplazar items y secciones.
    2.  **MANTÉN EL FORMATO**: La estructura de la ficha debe seguir siendo la misma.
    3.  **RESPUESTA JSON**: Tu respuesta DEBE ser únicamente el objeto JSON de la ficha modificada, ajustándose al esquema proporcionado. No incluyas texto adicional, explicaciones o markdown.
    4.  **SÉ CONSISTENTE**: Asegúrate de que los \`searchTerm\` para las imágenes son coherentes con el \`content\

    Genera el JSON de la ficha modificada.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: worksheetSchema,
      },
    });

    const jsonText = response.text.trim();
    const refinedData: Worksheet = JSON.parse(jsonText);
    
    // Post-processing to fetch pictogram URLs can be added here if needed,
    // similar to generateWorksheet. For now, just return the data structure.

    return refinedData;

  } catch (error) {
    console.error("Error al refinar la ficha:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido.";
    if (errorMessage.includes("SAFETY")) {
        throw new Error("La instrucción no pudo ser procesada por motivos de seguridad. Intenta reformularla.");
    }
    throw new Error("No se pudo refinar la ficha con la IA. Revisa la instrucción o inténtalo de nuevo.");
  }
};