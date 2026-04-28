export const PEDAGOGICAL_PRIORITIES = `
PRIORIDADES PEDAGÓGICAS:
- adapta la ficha al perfil antes que maximizar variedad
- prioriza autonomía, apoyo visual y baja carga verbal
- evita actividades que puedan provocar frustración
- si dudas entre dos opciones, elige la más simple y visual
- usa vocabulario claro, concreto y funcional
`;

export const CONTENT_CONSISTENCY_RULES = `
CONSISTENCIA DE CONTENIDO:
- usa vocabulario específico del tema
- evita palabras genéricas si el tema permite términos concretos
- no conviertas temas de conocimiento del entorno en ejercicios de letras salvo que el objetivo sea lectoescritura
- todos los ejercicios de la ficha deben compartir el mismo tema central
`;

export const INTERNAL_VALIDATION_CHECKLIST = `
VALIDACIÓN INTERNA ANTES DE RESPONDER:
- ¿el JSON es válido?
- ¿hay al menos 4 ejercicios?
- ¿exercise.type coincide exactamente con exerciseType?
- ¿todo el contenido pertenece al tema?
- ¿las actividades son adecuadas para el perfil?
- ¿no hay texto fuera del JSON?
`;

export const REPASAR_VARIANTS_EXAMPLE = `
- repasar:
  - usar palabras completas del tema
  - usar etiquetas funcionales del tema
  - evitar letras o sílabas sueltas salvo que el objetivo sea lectoescritura
`;

export const UNIR_VARIANTS_EXAMPLE = `
- unir:
  - iguales: PERRO -> PERRO
  - asociación lógica: VACA -> LECHE
  - relación funcional o contextual: ABEJA -> FLOR
  - dentro del mismo ejercicio usa un único criterio
  - mínimo 3 parejas y máximo 6 parejas
`;

export const RODEAR_VARIANTS_EXAMPLE = `
- rodear:
  - idéntico: RODEAR PERRO
  - categoría: RODEAR ANIMALES / RODEAR FRUTAS
  - mezclar opciones correctas e incorrectas
  - máximo 4 a 6 opciones
`;

export const COPIAR_VARIANTS_EXAMPLE = `
- copiar:
  - usar "model" como ejemplo visual de escritura
  - usar "copies" como palabras que el alumno debe copiar
  - las palabras de "copies" pueden ser iguales o distintas según el objetivo pedagógico
  - usar vocabulario funcional del tema
  - generar entre 2 y 4 palabras en total entre model y copies cuando sea posible
`;

export const EXERCISE_VARIANTS_FEW_SHOT = `
VARIANTES VÁLIDAS DE EJERCICIO:
${REPASAR_VARIANTS_EXAMPLE}
${UNIR_VARIANTS_EXAMPLE}
${RODEAR_VARIANTS_EXAMPLE}
${COPIAR_VARIANTS_EXAMPLE}
`;

export const PROFILE_SELECTION_GUIDE = `
GUÍA DE SELECCIÓN SEGÚN PERFIL:
- prioriza rodear y unir si el alumno necesita apoyo visual, menor carga verbal o tareas de discriminación
- usa repasar si el alumno puede trabajar trazado o reconocimiento escrito con sentido
- usa copiar solo si el perfil permite escritura funcional o copia con intención pedagógica
- si el alumno tiene más dificultad, usa menos tipos y actividades más simples
- si el alumno tiene más competencia, combina más variedad o mayor complejidad dentro del mismo tema
`;

export const IMAGE_ADAPTATION_GUIDE = `
ADAPTACIÓN DESDE IMAGEN O PDF:
- identifica el concepto principal de la ficha original
- no copies literalmente los ejercicios; crea una versión más accesible
- conserva la intención pedagógica
- transforma lo textual en actividades visuales cuando sea posible
- usa vocabulario fiel al contenido detectado
`;