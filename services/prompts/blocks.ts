export const JSON_ONLY_RULE = `
Devuelve SOLO JSON válido.
No uses markdown.
No añadas explicaciones.
No añadas comentarios.
No añadas texto antes ni después del JSON.
`;

export const CASTILIAN_SPANISH_RULES = `
IDIOMA:
- Usa castellano de España.
- Evita regionalismos de otros países.
- Usa vocabulario claro, frecuente y funcional.
`;

export const PEDAGOGICAL_RULES = `
CRITERIOS PEDAGÓGICOS:
- Adapta la ficha al perfil antes que maximizar variedad.
- Prioriza autonomía, apoyo visual y baja carga verbal.
- Evita actividades que puedan provocar frustración.
- Si dudas entre dos opciones, elige la más simple y visual.
- Usa vocabulario concreto, cotidiano y adecuado al nivel del alumno.
- No conviertas temas de conocimiento del entorno en ejercicios de letras salvo que el objetivo sea lectoescritura.
- Todos los ejercicios deben mantener coherencia con el tema central.
`;

export const PICTOGRAM_RULES = `
REGLAS DE PICTOGRAMAS:
- La IA NO busca pictogramas.
- La IA NO elige pictogramas concretos.
- La IA NO devuelve URLs.
- La IA NO devuelve resultados de ARASAAC ni de ninguna base de datos.
- El sistema buscará después los pictogramas usando "searchTerm".
- Para imágenes usa siempre:
  { "type": "image", "content": "texto visible", "searchTerm": "término de búsqueda" }
- Para pictogramas de instrucción usa siempre:
  { "searchTerm": "término de búsqueda", "content": "texto visible" }
- "content" es obligatorio.
- "searchTerm" es obligatorio en imágenes y pictogramas de instrucción.
`;

export const FORBIDDEN_TECHNICAL_FIELDS = `
CAMPOS PROHIBIDOS:
- No devuelvas "internalId" dentro de "section".
- No devuelvas "items".
- No devuelvas "layout".
- No devuelvas "selectedPictoUrl".
- No devuelvas "pictoOptions".
- No devuelvas "url".
- No devuelvas "pictogramRenderMode".
- No devuelvas "spelledLetterTerms".
- No devuelvas "spelledLetterUrls".
- No devuelvas arrays de URLs.
- No devuelvas IDs inventados para pictogramas, imágenes, palabras, sonidos ni items.
`;

export const EXERCISE_STRUCTURE_RULES = `
ESTRUCTURA OBLIGATORIA POR TIPO:

1. "repasar":
{
  "type": "repasar",
  "prompts": [
    { "type": "traceable_text", "content": "TEXTO" }
  ]
}

2. "unir":
{
  "type": "unir",
  "pairs": [
    {
      "left": { "type": "image", "content": "vaca", "searchTerm": "vaca" },
      "right": { "type": "image", "content": "leche", "searchTerm": "leche" }
    }
  ]
}

3. "rodear":
{
  "type": "rodear",
  "options": [
    { "type": "image", "content": "manzana", "searchTerm": "manzana" }
  ]
}

4. "copiar":
{
  "type": "copiar",
  "copies": [
    { "type": "traceable_text", "content": "PERRO" },
    { "type": "traceable_text", "content": "GATO" }
  ]
}

REGLAS ESPECÍFICAS DE "copiar":
- No uses "model".
- Todas las palabras que el alumno debe copiar van dentro de "copies".
- Cada elemento de "copies" debe ser "traceable_text".
- No uses "image" dentro de "copiar".
- No uses "searchTerm" dentro de "copiar".
- Las palabras de "copies" deben ir en MAYÚSCULAS.
- Las palabras de "copies" deben ser distintas entre sí.
`;

export const SECTION_OUTPUT_RULES = `
REGLAS DE SECCIÓN:
- Cada sección debe contener exactamente estas claves:
  "exerciseType", "instruction", "exercise".
- "exerciseType" solo puede ser: "repasar", "unir", "rodear", "copiar".
- "exercise.type" debe coincidir exactamente con "exerciseType".
- No uses claves alternativas como "activities", "tasks", "blocks", "pages" o "elements".
`;

export const WORKSHEET_GENERATION_RULES = `
REGLAS DE GENERACIÓN DE FICHA:
- Devuelve una ficha completa.
- La ficha debe tener "title", "pictogramSearchTerm" y "sections".
- Cada elemento de "sections" es un ejercicio.
- En ausencia de cantidad exacta, genera al menos 4 ejercicios.
- La ficha debe tener suficiente contenido para ser útil como material de trabajo.
- Selecciona los tipos de ejercicio más adecuados según el perfil.
- Evita usar un único tipo de ejercicio en toda la ficha salvo que el perfil lo requiera.
- Si incluyes "copiar" y también "repasar", coloca "copiar" después de "repasar".
`;

export const OPERATION_RULES = `
REGLAS DE OPERACIONES:
- Devuelve un objeto JSON con una única propiedad: "operations".
- Operaciones válidas:
  "update_worksheet", "create_section", "update_section", "delete_section", "move_section".
- NO devuelvas la ficha completa.
- NO regeneres todas las secciones.
- Dentro de "section", devuelve solo estructura pedagógica:
  "exerciseType", "instruction", "exercise".
- Si hay sección objetivo, devuelve exactamente una operación "update_section" con ese "sectionId", salvo que la petición pida borrar o mover.
- Si hay sección objetivo y el usuario dice "haz el ejercicio sobre...", transforma esa sección mediante "update_section".
- Si no hay sección objetivo y el usuario pide añadir un ejercicio nuevo, usa "create_section".
`;

export const ID_RULES = `
REGLAS DE IDS:
- Para modificar, borrar o mover, usa siempre el "sectionId" existente.
- No inventes "sectionId".
- No inventes "afterSectionId".
- La única identificación permitida es "sectionId" o "afterSectionId" en la operación.
- No uses IDs de pictogramas, imágenes, sonidos, palabras ni items.
`;

export const OPERATION_PRESERVATION_RULES = `
REGLAS DE PRESERVACIÓN:
- Cambia solo lo necesario para cumplir la petición.
- Conserva el contenido actual salvo que el usuario pida sustituirlo, eliminarlo o reordenarlo.
- Si la petición pide añadir contenido, conserva lo anterior y añade solo lo nuevo.
- Si la petición pide simplificar, conserva el tema y baja vocabulario, carga verbal y dificultad.
`;