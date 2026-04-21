import { WORKSHEET_JSON_SCHEMA, WORKSHEET_OUTPUT_RULES, REFINEMENT_JSON_SCHEMA } from './schemas';
import { ALL_FEW_SHOT_EXAMPLES } from './examples';

export interface PromptOptions {
  topic?: string;
  goal?: string;
  extraDetails?: string;
  adaptationDescription?: string;
  adaptationTextContent?: string;
  hasImage?: boolean;
}

const buildInstructionPrompt = (showPictogramInstructions: boolean): string => {
  return showPictogramInstructions
    ? `
      - **Instrucción Visual**: Para cada sección, en el objeto \`instruction\`, proporciona:
        - \`text\`: La instrucción principal en una o dos palabras MAYÚSCULAS (ej: "RODEAR", "UNIR", "COPIAR").
        - \`pictograms\`: Un array que descompone la instrucción. Para "UNIR CON FLECHAS", el array sería \`[{searchTerm: 'unir', content: 'UNIR'}, {searchTerm: 'flecha', content: 'FLECHA'}]\`. El \`searchTerm\` debe ser el verbo en infinitivo o un sustantivo, lo más descriptivo posible para encontrar la imagen correcta en ARASAAC.`
    : `
      - **Instrucción Simple**: Para cada sección, el campo \`instruction.text\` debe ser una o dos palabras MAYÚSCULAS (ej: "RODEAR", "UNIR", "COPIAR"). El campo \`instruction.pictograms\` debe omitirse.`;
};

export const buildWorksheetPrompt = (
  options: PromptOptions,
  childProfile: string,
  showPictogramInstructions: boolean
): string => {
  const instructionPrompt = buildInstructionPrompt(showPictogramInstructions);

  if (options.hasImage) {
    const extractedTextBlock = options.adaptationTextContent?.trim()
      ? `
        TEXTO EXTRAÍDO DEL PDF:
        """
        ${options.adaptationTextContent}
        """
        
        Si el texto extraído es legible, úsalo como referencia principal para identificar ejercicios textuales y convertirlos en actividades con pictogramas.`
      : '';

    return `
        Eres un experto en pedagogía terapéutica. Tu misión es ANALIZAR LA IMAGEN ADJUNTA (que contiene todas las páginas de una ficha) y ADAPTARLA para un niño con este perfil:
        ${childProfile}

        ${extractedTextBlock}

        INSTRUCCIONES DE ADAPTACIÓN:
        1. **IDENTIFICA EL CONCEPTO**: Mira TODAS LAS PÁGINAS en la imagen y entiende cuál es el objetivo educativo principal.
        2. **REINVENTA Y AMPLÍA**: No copies los ejercicios. Crea una ficha nueva y más sencilla basada en el concepto.
        3. **ESTRUCTURA DE LA FICHA**: La ficha debe ser dinámica. Varía constantemente el tipo de actividad entre cada sección.
        4. **SIN EJEMPLOS RESUELTOS**: Todas las actividades deben quedar sin resolver por el alumno.
        5. **CONVERTIR TEXTO A PICTOS**: Si en la ficha original hay instrucciones, palabras o ejercicios principalmente textuales, transfórmalos a una versión visual con pictogramas e imágenes, manteniendo la intención pedagógica.
        ${instructionPrompt}
        6. **VARIEDAD OBLIGATORIA Y NÚMERO DE EJERCICIOS**: Tu salida DEBE incluir al menos 4 secciones en total, **pero puedes generar 5 o 6 secciones si lo deseas**, repitiendo tipos de ejercicios (ej. dos "rodear" con contenido distinto). DEBES usar obligatoriamente los 4 tipos de ejercicio existentes (repasar, unir, rodear, copiar) al menos una vez en la ficha. Jamás omitas "rodear" ni "copiar". Para "unir", usa SIEMPRE un único estilo por ejercicio: si decides unir idénticos, todas las parejas de ese ejercicio deben ser idénticas; si decides usar relaciones lógicas, todas las parejas deben ser lógicas. Las columnas de "unir" deben tener máximo 4-5 parejas.
        7. **REGLA DE ORDEN**: Como norma metodológica crítica, si aparece el ejercicio de "copiar", este DEBE colocarse SIEMPRE a continuación de los ejercicios de trazar ("repasar").
        8. **FIDELIDAD SEMÁNTICA**: Usa vocabulario del concepto detectado en la ficha original. Si la ficha trata, por ejemplo, sobre partes de una planta, los contenidos deben ser "raíz", "tallo", "hoja", "flor", etc., y nunca vocales o letras sueltas salvo que la ficha original trate de lectoescritura.
        9. **SALIDA JSON**: Devuelve solo un objeto JSON válido con esta estructura exacta:
        ${WORKSHEET_JSON_SCHEMA}
        ${WORKSHEET_OUTPUT_RULES}

        ${ALL_FEW_SHOT_EXAMPLES}

        Analiza la imagen y genera la ficha adaptada.
      `;
  } else {
    const topicLine = options.adaptationDescription
      ? `- TEMA A ADAPTAR: "${options.adaptationDescription}".`
      : `- TEMA PRINCIPAL: "${options.topic}".`;
    const goalLine = options.goal?.trim()
      ? `\n        - OBJETIVO PEDAGÓGICO: ${options.goal.trim()}`
      : '';
    const extraDetailsLine = options.extraDetails?.trim()
      ? `\n        - REQUISITOS ADICIONALES DEL PROFESOR: ${options.extraDetails.trim()}`
      : '';

    const pedagogicalContext = `
        === DIRECTRICES PEDAGÓGICAS PARA ESTA FICHA ===
        ${topicLine}${goalLine}${extraDetailsLine}

        * Asegúrate de que todo el contenido generado (vocabulario, relaciones lógicas y opciones de ejercicios) refleje estrictamente estas directrices.
        ================================================`

    return `
        Eres un experto en pedagogía terapéutica. Tu misión es crear una ficha de trabajo para un niño con este perfil:

        ${childProfile}

        REGLAS DE DISEÑO OBLIGATORIAS:
        1. **ESTRUCTURA DINÁMICA**: Varía el tipo de ejercicio entre secciones para mantener la atención del niño. No agrupes todos los ejercicios del mismo formato.
        2. **SIN EJEMPLOS RESUELTOS**: No incluyas una primera actividad resuelta como ejemplo; deja que el alumno la resuelva.
        3. **VISUAL ANTE TODO**: La ficha debe ser 90% visual. Promueve la deducción guiada por pictogramas.
        ${instructionPrompt}
        4. **VARIEDAD OBLIGATORIA Y NÚMERO DE EJERCICIOS**: Tu salida DEBE incluir al menos 4 secciones en total, **pero puedes generar 5 o 6 secciones si lo deseas**, repitiendo tipos de ejercicios (ej. dos "unir" con contenido distinto). DEBES usar obligatoriamente los 4 tipos de ejercicio existentes (repasar, unir, rodear, copiar) al menos una vez en la ficha. Jamás omitas "rodear" ni "copiar". No incluyas ejercicios fuera de estos cuatro tipos.
        5. **REGLA DE ORDEN**: Como norma metodológica crítica, si aparece el ejercicio de "copiar", este DEBE colocarse SIEMPRE a continuación de los ejercicios de trazar ("repasar").
        6. **TÉRMINOS DE BÚSQUEDA**: Para cada imagen, proporciona un término de búsqueda claro para ARASAAC.
        7. **FIDELIDAD AL TEMA**: Todo el contenido debe pertenecer al tema pedido. Si el tema es "las partes de una planta", usa elementos como "raíz", "tallo", "hoja", "flor", "semilla". No uses vocales, sílabas o letras aisladas salvo que el tema sea explícitamente de lectoescritura.
        8. **REPASAR CON SIGNIFICADO**: En actividades de tipo \`repasar\`, el texto trazable debe ser una palabra o etiqueta del tema, no una letra genérica, salvo que el tema sea una letra o sílaba concreta.
        9. **SALIDA JSON**: Devuelve solo un objeto JSON válido con esta estructura exacta:
        ${WORKSHEET_JSON_SCHEMA}
        ${WORKSHEET_OUTPUT_RULES}

        MODELOS DE ACTIVIDAD Y VARIEDAD:
        - Puedes REPETIR un tipo de ejercicio en la misma ficha (ej. dos bloques de "rodear"), siempre que el vocabulario y objetivo sean distintos.
        - repasar: palabras completas o etiquetas lógicas del tema con \`exercise.prompts\`
        - unir: puedes usar parejas IDÉNTICAS (ej: Perro-Perro) o CONCEPTUALMENTE RELACIONADAS (ej: Vaca-Leche). REGLA ESTRICTA: usa UN SOLO ESTILO por ejercicio. Si uno es idéntico, toda la columna debe ser de idénticos. Si es conceptual, toda la columna conceptual. IMPORTANTE: El array \`exercise.pairs\` debe tener un MÁXIMO de 4 a 5 parejas en total (columnas cortas).
        - rodear: la instrucción debe indicar visualmente qué buscar. Puede ser buscar un objeto idéntico ("RODEAR PERRO") o buscar por GRUPO/CATEGORÍA ("RODEAR ANIMALES", "RODEAR FRUTAS", "RODEAR ROPA"). Genera varias opciones con \`exercise.options\` asegurándote de mezclar opciones correctas e incorrectas. NO uses el campo \`exercise.prompt\`. Al igual que en "unir", si haces un "rodear" buscando idénticos, o uno por categoría, mantén la coherencia en ese ejercicio concreto. MÁXIMO 4-6 opciones en total por ejercicio.
        - copiar: actividades para copiar palabras de forma autónoma. \`exercise.model\` es la primera palabra a copiar. Usa el array \`exercise.copies\` para proporcionar PALABRAS ADICIONALES Y DIFERENTES del mismo tema. Genera entre 2 y 4 palabras DIFERENTES en total por ejercicio de copiar. NUNCA repitas la misma palabra en un mismo ejercicio.

        ${ALL_FEW_SHOT_EXAMPLES}

        ${pedagogicalContext}
      `;
  }
};

export const buildSemanticRepairPrompt = (
  rawText: string,
  options: PromptOptions,
  childProfile: string,
  showPictogramInstructions: boolean
): string => {
  const instructionPrompt = buildInstructionPrompt(showPictogramInstructions);
  const semanticContext =
    [options.topic, options.goal, options.extraDetails, options.adaptationDescription, options.adaptationTextContent]
      .filter(Boolean)
      .join(' ') || '';

  return `
    La siguiente respuesta JSON no sigue las reglas semánticas. 
    Se te pidió una ficha relacionada con el concepto/tema: "${semanticContext}".
    Sin embargo, generaste palabras genéricas, vocales sueltas ("A", "E") o repetiste términos que no tienen un contenido pedagógico real relacionado con el tema central.

    Tu tarea es corregir la ficha y mejorar el contenido para que todo el vocabulario esté explícitamente relacionado con las imágenes de la ficha original o el tema pedido.

    REGLAS ESTRICTAS DE CORRECCIÓN:
    1. Reemplaza cualquier pictograma "a", "e", "i", "sol", "luna" o genérico que pusieras por defecto por vocabulario rico del tema principal.
    2. En "unir", asegura relaciones lógicas (ej: lluvia -> paraguas, araña -> telaraña).
    3. Mantén la estructura JSON intacta.
    ${instructionPrompt}
    4. Devuelve SOLO UN JSON VÁLIDO basándote en este ESQUEMA OBJETIVO:
    ${WORKSHEET_JSON_SCHEMA}

    AQUÍ ESTÁ TU SALIDA ANTERIOR CON ERRORES:
    \`\`\`json
    ${rawText}
    \`\`\`
  `;
};

export const buildJsonRepairPrompt = (
  rawText: string,
  errorMsg: string,
  mode: 'worksheet' | 'refinement'
): string => {
  const schema = mode === 'worksheet' ? WORKSHEET_JSON_SCHEMA : REFINEMENT_JSON_SCHEMA;
  return `
He intentado parsear tu salida como JSON, pero he obtenido este error: "${errorMsg}".
Probablemente incluiste texto tipo markdown \`\`\`json, código mal formado o comas sobrantes.

${WORKSHEET_OUTPUT_RULES}

ESQUEMA OBJETIVO:
${schema}

SALIDA A CORREGIR:
${rawText}

Corrige el error de formato y devuelve ÚNICAMENTE el JSON arreglado, sin comentarios ni explicaciones adicionales.
  `;
};

export const buildRefinementPrompt = (
  jsonWorksheetContent: string,
  instructionText: string,
  childProfile: string
): string => {
  return `
Eres un experto en pedagogía terapéutica.
Esta es mi ficha de trabajo actual generada para este perfil de alumno:
${childProfile}

Contenido actual de la ficha:
\`\`\`json
${jsonWorksheetContent}
\`\`\`

El usuario ha dado esta instrucción para alterar o refinar la ficha:
"${instructionText}"

RESPETO A LA INSTRUCCIÓN:
1. Aplica la acción pedida (modificar, añadir, eliminar ejercicios o cambiar su tema/layout).
2. TÓMATE LA INSTRUCCIÓN LITERALMENTE. Si el usuario pide generar 10 ítems, devuelves 10 ítems.
3. Devuelve los cambios usando esta estructura (solo JSON, sin comentarios).
${WORKSHEET_OUTPUT_RULES}
${WORKSHEET_JSON_SCHEMA}
  `;
};
