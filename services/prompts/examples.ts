export const PROFILE_SELECTION_GUIDE = `
GUÍA DE SELECCIÓN SEGÚN PERFIL:
- Prioriza "rodear" y "unir" si el alumno necesita apoyo visual, menor carga verbal o tareas de discriminación.
- Usa "repasar" si el alumno puede trabajar trazado o reconocimiento escrito con sentido.
- Usa "copiar" solo si el perfil permite copia de palabras completas.
- Si el alumno tiene más dificultad, usa menos tipos y actividades más simples.
- Si el alumno tiene más competencia, combina más variedad o mayor complejidad.
`;

export const IMAGE_ADAPTATION_GUIDE = `
ADAPTACIÓN DESDE IMAGEN O PDF:
- Identifica el concepto principal de la ficha original.
- No copies literalmente los ejercicios; crea una versión más accesible.
- Conserva la intención pedagógica.
- Transforma contenido textual en actividades visuales cuando sea posible.
- Usa vocabulario fiel al contenido detectado.
`;

export const WORKSHEET_INTERNAL_VALIDATION_CHECKLIST = `
VALIDACIÓN INTERNA:
- ¿El JSON es válido?
- ¿Hay al menos 4 ejercicios salvo que se haya pedido otra cantidad?
- ¿Cada exercise.type coincide con exerciseType?
- ¿Todo el contenido pertenece al tema?
- ¿Las actividades son adecuadas para el perfil?
- Si hay "copiar", ¿usa solo copies y no usa model?
- ¿No hay texto fuera del JSON?
`;

export const REFINEMENT_INTERNAL_VALIDATION_CHECKLIST = `
VALIDACIÓN INTERNA:
- ¿El JSON es válido?
- ¿Cada exercise.type coincide con exerciseType?
- ¿Todo el contenido modificado sigue perteneciendo al tema?
- ¿Las actividades siguen siendo adecuadas para el perfil?
- Si hay "copiar", ¿usa solo copies y no usa model?
- ¿No hay texto fuera del JSON?
`;

export const OPERATIONS_INTERNAL_VALIDATION_CHECKLIST = `
VALIDACIÓN INTERNA:
- ¿El JSON es válido?
- ¿La respuesta contiene solo "operations"?
- ¿Cada operación usa un type permitido?
- ¿Los sectionId y afterSectionId existen en el contexto cuando son necesarios?
- ¿Las secciones nuevas no incluyen internalId?
- ¿Las secciones modificadas mantienen exerciseType/exercise.type coherentes?
- ¿El contenido nuevo o modificado sigue perteneciendo al tema?
- ¿Las actividades nuevas o modificadas siguen siendo adecuadas para el perfil?
- Si hay "copiar", ¿usa solo copies y no usa model?
- ¿No hay texto fuera del JSON?
`;