import type { StudentProfileBlock, StudentStructuredProfile } from '../types';

type ProfileBlockKey = keyof StudentStructuredProfile['blocks'];

export type StudentProfileBlockDefinition = {
  key: ProfileBlockKey;
  title: string;
  description: string;
  questions: string[];
};

export const STUDENT_PROFILE_BLOCKS: StudentProfileBlockDefinition[] = [
  {
    key: 'comprehensionAccess',
    title: '1. Comprensión y acceso a la información',
    description: 'Define cómo comprende las consignas y qué apoyos necesita para acceder a la tarea.',
    questions: [
      '¿Qué tipo de consignas comprende? (simples, con apoyo visual, modeladas...)',
      '¿Cuántos pasos puede seguir?',
      '¿Necesita pictogramas, ejemplos o anticipación?',
      '¿Qué tipo de formato le facilita la comprensión? (visual, repetitivo, estructurado...)',
    ],
  },
  {
    key: 'responseModality',
    title: '2. Modalidad de respuesta',
    description: 'Recoge cómo responde mejor y qué limitaciones tiene al ejecutar la respuesta.',
    questions: [
      '¿Cómo responde mejor? (señalar, rodear, escribir, arrastrar...)',
      '¿Presenta dificultades grafomotoras?',
      '¿Necesita opciones cerradas?',
      '¿Puede producir respuestas o solo reconocer/seleccionar?',
    ],
  },
  {
    key: 'cognitiveProcessing',
    title: '3. Procesamiento cognitivo',
    description: 'Describe qué operaciones mentales ya maneja y cuáles resultan más accesibles.',
    questions: [
      '¿Qué habilidades tiene adquiridas? (clasificar, asociar, seriación...)',
      '¿Qué nivel de abstracción maneja?',
      '¿Puede generalizar aprendizajes?',
      '¿Qué tipo de actividades le resultan más accesibles?',
    ],
  },
  {
    key: 'attentionSelfRegulation',
    title: '4. Atención y autorregulación',
    description: 'Ayuda a ajustar duración, error, ayudas y carga atencional de la ficha.',
    questions: [
      '¿Cuánto tiempo mantiene la atención?',
      '¿Qué ocurre ante tareas no motivadoras?',
      '¿Tolera el error o necesita aprendizaje sin error?',
      '¿Qué tipo de apoyos necesita? (refuerzo, pausas, elección...)',
    ],
  },
  {
    key: 'motivationInterests',
    title: '5. Motivación e intereses',
    description: 'Permite escoger contenidos, refuerzos y formatos con mayor enganche.',
    questions: [
      '¿Qué temas o materiales le motivan?',
      '¿Qué rechaza claramente?',
      '¿Responde mejor a refuerzos concretos?',
      '¿Muestra más interés en formato digital o manipulativo?',
    ],
  },
];

const createEmptyBlock = (_questionCount: number): StudentProfileBlock => ({
  summary: '',
});

export const createEmptyStructuredProfile = (): StudentStructuredProfile => ({
  general: {
    age: '',
    schoolStage: '',
    diagnosis: '',
    priorityGoals: '',
    additionalComments: '',
  },
  blocks: STUDENT_PROFILE_BLOCKS.reduce((accumulator, block) => {
    accumulator[block.key] = createEmptyBlock(block.questions.length);
    return accumulator;
  }, {} as StudentStructuredProfile['blocks']),
});

export const DEFAULT_STRUCTURED_PROFILE: StudentStructuredProfile = {
  general: {
    age: '6',
    schoolStage: 'Educación Infantil / primeros cursos de Primaria con adaptación significativa',
    diagnosis: 'TEA grado 1',
    priorityGoals: 'Aumentar comprensión de consignas visuales, sostener la atención en tareas breves y consolidar aprendizajes funcionales en lengua y matemáticas.',
    additionalComments: 'Rechaza ayudas verbales prolongadas y suele responder mejor cuando la tarea es autoexplicativa, breve y visual.',
  },
  blocks: {
    comprehensionAccess: {
      summary: `- Comprende mejor consignas de un paso, simples, visuales y modeladas.
- Necesita estructura clara, anticipación breve y un ejemplo inmediato para entender qué tiene que hacer.
- Puede seguir un paso y, de forma variable, secuencias muy cortas si están modeladas.
- No presta atención a indicaciones verbales largas ni explicaciones prolongadas.
- Le facilita un formato visual, repetitivo, muy estructurado y con pocas distracciones.
- Responde mejor cuando ve exactamente qué tiene que hacer que cuando se le explica verbalmente.`,
    },
    responseModality: {
      summary: `- Responde mejor señalando, rodeando, relacionando visualmente y copiando modelos simples en mayúsculas.
- Necesita formatos cerrados y tareas con respuesta muy delimitada.
- Predomina el reconocimiento y la selección; la producción espontánea es muy limitada.
- Presenta dificultades grafomotoras y el trazo es impreciso.
- Puede repasar trazos de números y letras, aunque con poca precisión.
- Puede copiar palabras enteras en mayúsculas y escribir vocales mayúsculas de memoria.
- No puede leer, pronunciar ni escribir palabras por sí mismo.
- No conviene exigir escritura funcional autónoma; es preferible priorizar selección, emparejamiento o copia con modelo.`,
    },
    cognitiveProcessing: {
      summary: `- Tiene habilidades básicas de asociación y clasificación, con escasa abstracción y mejor rendimiento en tareas concretas.
- Identifica formas y colores.
- Completa series de formas.
- Identifica y relaciona números semejantes.
- Ordena números en recta numérica si empieza desde el 1, incluso por encima del 50.
- Puede escribir números del 1 al 10 si se le dictan.
- Identifica vocales y puede rodear o pintar letras cuando entiende la consigna.
- Relaciona elementos visuales que comprende.
- Maneja un nivel de abstracción bajo y funciona mejor con referentes concretos y visuales.
- La generalización es limitada y necesita mucha consistencia entre ejemplo y tarea.
- No cuenta objetos de forma autónoma ni realiza operaciones matemáticas.
- No identifica consonantes aisladas ni la relación entre mayúscula y minúscula.`,
    },
    attentionSelfRegulation: {
      summary: `- Presenta atención breve y alta distractibilidad.
- Le cuesta mantenerse sentado en la misma posición más de 5 minutos.
- Se distrae con facilidad a mitad de una actividad.
- No tolera bien tareas poco motivadoras o demasiado difíciles.
- Ante la frustración puede rechazar la actividad o intentar resolverla a su manera sin atender a nuevas explicaciones.
- Rechaza la ayuda directa prolongada y aparta al interlocutor para hacerlo solo.
- Necesita aprendizaje con muy poco error, exigencia ajustada, tareas cortas, pausas y refuerzo inmediato.
- La tarea debe ser autoexplicativa, con baja carga verbal y alta claridad visual.`,
    },
    motivationInterests: {
      summary: `- Se implica mejor con materiales visuales, manipulativos y muy claros.
- Le motivan los puzles.
- Le motivan las actividades de pintar siguiendo código de color.
- Le gustan juegos de persecución como "pillar".
- Puede mostrar interés por interacciones básicas con compañeros.
- Rechaza con claridad actividades largas, poco comprensibles o que le generan frustración rápida.
- Responde mejor a refuerzos concretos e inmediatos.
- Conviene usar temas cercanos, apoyos visuales potentes y propuestas con componente lúdico para mantener la implicación.`,
    },
  },
};

export const normalizeStructuredProfile = (
  structuredContent: StudentStructuredProfile | undefined
): StudentStructuredProfile => {
  const base = createEmptyStructuredProfile();

  if (!structuredContent) {
    return base;
  }

  return {
    general: {
      age: structuredContent.general?.age || '',
      schoolStage: structuredContent.general?.schoolStage || '',
      diagnosis: structuredContent.general?.diagnosis || '',
      priorityGoals: structuredContent.general?.priorityGoals || '',
      additionalComments: structuredContent.general?.additionalComments || '',
    },
    blocks: STUDENT_PROFILE_BLOCKS.reduce((accumulator, block) => {
      const sourceBlock = structuredContent.blocks?.[block.key];
      accumulator[block.key] = {
        summary: sourceBlock?.summary || '',
      };
      return accumulator;
    }, {} as StudentStructuredProfile['blocks']),
  };
};

const sanitizeLine = (value: string): string => value.trim().replace(/\s+/g, ' ');

const toBullet = (label: string, value: string): string | null => {
  const normalized = sanitizeLine(value);
  return normalized ? `- ${label}: ${normalized}` : null;
};

export const serializeStructuredProfile = (structuredContent: StudentStructuredProfile): string => {
  const lines: string[] = ['Perfil del Alumno:'];

  const generalFields = [
    toBullet('Edad', structuredContent.general.age),
    toBullet('Curso o etapa', structuredContent.general.schoolStage),
    toBullet('Diagnóstico o condición relevante', structuredContent.general.diagnosis),
    toBullet('Objetivos prioritarios actuales', structuredContent.general.priorityGoals),
    toBullet('Comentarios adicionales', structuredContent.general.additionalComments),
  ].filter(Boolean) as string[];

  if (generalFields.length > 0) {
    lines.push('', 'Datos generales:', ...generalFields);
  }

  STUDENT_PROFILE_BLOCKS.forEach(block => {
    const contentBlock = structuredContent.blocks[block.key];
    const blockLines: string[] = [];

    const summaryLine = toBullet('Síntesis profesional', contentBlock.summary);
    if (summaryLine) blockLines.push(summaryLine);

    if (blockLines.length > 0) {
      lines.push('', `${block.title}:`, ...blockLines);
    }
  });

  return lines.join('\n').trim();
};
