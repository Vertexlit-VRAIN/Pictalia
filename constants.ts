export const APP_DATA_STORAGE_KEY = 'adaptatorAppData';
export const LEGACY_GEMINI_API_KEY_STORAGE_KEY = 'gemini_api_key';

export const DEFAULT_AI_SETTINGS = {
  provider: 'gemini',
  geminiApiKey: '',
  geminiModel: 'gemini-2.5-flash',
  ollamaBaseUrl: 'http://localhost:11434',
  ollamaModel: 'gemma4:e4b',
} as const;

export const DEFAULT_PICTOGRAM_SETTINGS = {
  provider: 'arasaac_official',
  arasaacApiUrl: 'https://api.arasaac.org/api/pictograms',
  privateApiUrl: 'http://localhost:3001/api/pictograms',
} as const;

export const CHILD_PROFILE = `
Perfil del Niño:
Edad: 6 años
Diagnóstico: TEA GRADO 1

Capacidades y Dificultades de Comunicación y Comportamiento:
- Prácticamente no verbal: No puede hablar, se limita a emitir sonidos breves. Es incapaz de leer.
- Atención muy limitada: No presta atención a indicaciones verbales. Difícil distinguir si no entiende o no quiere hacerlo.
- Incapaz de seguir una clase.
- Hiperactividad/Inquietud: No puede estar sentado en la misma posición más de 5 minutos.
- Alta distractibilidad: Se distrae con facilidad a mitad de una actividad.
- Necesidad de autonomía: Rechaza la ayuda directa y explicaciones prolongadas (más de 5 segundos), aparta al interlocutor para hacer la actividad solo.
- Baja tolerancia a la frustración: Muestra rechazo a actividades que no le gustan con rabietas. Cuando se frustra, intenta resolverlo a su manera sin atender a otras explicaciones.
- Estilo de aprendizaje visual y por imitación: Es mucho más propenso a entender cuando se le muestra un EJEMPLO visual y concreto de cómo hacer la tarea.

Habilidades en Matemáticas:
Es capaz de:
- Ordenar números en una recta numérica si empieza desde el 1 (hasta 50+).
- Escribir números del 1 al 10 si se los dictan.
- Identificar y relacionar números semejantes.
- Identificar formas y colores.
- Completar series de formas.
- Repasar trazos de números (aunque de forma imprecisa).
- Clasificar formas (entiende el concepto pero es difícil que siga la instrucción).

No es capaz de:
- Contar objetos de forma autónoma.
- Realizar operaciones matemáticas (suma, resta, etc.).

Habilidades en Lengua:
Es capaz de:
- Repasar letras.
- Rodear letras específicas.
- Relacionar elementos visuales que entiende.
- Pintar una letra requerida.
- Identificar vocales.
- Copiar palabras enteras en MAYÚSCULAS.
- Escribir VOCALES MAYÚSCULAS de memoria.

No es capaz de:
- Pronunciar, leer o escribir palabras por sí mismo.
- Copiar letras minúsculas.
- Identificar consonantes de forma aislada.
- Establecer la relación entre una letra mayúscula y su minúscula.

Intereses y Otras Habilidades:
- Hacer puzles.
- Pintar siguiendo un código de color.
- Jugar a juegos de persecución como 'pillar'.
- Interactuar de forma básica con compañeros.
`;
