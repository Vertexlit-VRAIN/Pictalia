# Guías de Desarrollo y Programación — Adaptator-TEA

Este documento detalla las directrices de desarrollo, arquitectura y buenas prácticas recomendadas para el mantenimiento y expansión de la plataforma **Adaptator-TEA**.

---

## 1. Arquitectura del Proyecto y Estructura de Carpetas

Mantenemos una separación limpia de responsabilidades organizada por carpetas:

- `/components`: Componentes visuales de React.
  - Componentes generales de la aplicación (ej: `Header`, `Spinner`).
  - Directorios especializados para agrupar vistas complejas y sus subcomponentes modulares (ej. `/components/translator/`, `/components/editors/`, `/components/display/`).
- `/services`: Lógica de comunicación con APIs externas (ARASAAC, proveedores de IA como Gemini u Ollama) y funciones puras de procesamiento de datos o algoritmos (ej. normalización de fichas).
- `/hooks`: Hooks de React personalizados para encapsular lógica de estado compleja que se comparte o reutiliza (ej. persistencia en LocalStorage, gestión del perfil del estudiante activo).
- `/types.ts`: Definición de interfaces e intersecciones de tipos globales y reutilizables en toda la plataforma.
- `/constants.ts`: Valores constantes predeterminados, claves de LocalStorage y configuraciones globales estáticas.

---

## 2. Guía para la Modularización de Componentes React

Los archivos monolíticos dificultan la lectura, el testing y el mantenimiento colaborativo. Seguimos la regla de **Responsabilidad Única**:

1. **Límite de Líneas**: Cualquier componente que supere las **300-400 líneas** debe ser evaluado para su modularización.
2. **Subcomponentes**: Extraer subcomponentes lógicos a sus propios archivos independientes. Si son exclusivos de una vista específica, agrúpalos dentro de una subcarpeta en `components` (ej. `components/translator/`).
3. **Componentes Contenedores vs. Presentacionales (Dumb)**:
   - **Contenedores**: Se encargan de la orquestación, estados principales (`useState`, `useReducer`), llamadas a servicios y hooks de persistencia.
   - **Presentacionales**: Reciben datos y funciones manejadoras a través de `props`. Son puros, fáciles de testear y reutilizables.
4. **Prop Drilling**: Si el paso de props supera los 3 o 4 niveles, considere el uso de un Contexto de React o extraiga la lógica a un hook personalizado.

---

## 3. Manejo de Estado y Hooks Personalizados

- La lógica de negocio pesada, la interacción con LocalStorage o las llamadas a APIs asíncronas no deben residir directamente mezcladas con el markup JSX de los componentes.
- Utilice **Hooks personalizados** (como `useAppDataManager`) para encapsular las llamadas a servicios y la sincronización de estados globales.
- Mantenga el estado local lo más cerca posible de donde se utiliza para evitar renders innecesarios en cascada.

---

## 4. Tipado Estricto de TypeScript

Para asegurar la robustez de la plataforma:

- **Evitar `any`**: El uso de `any` está prohibido a menos que sea estrictamente necesario para interactuar con librerías externas sin tipar. En su lugar, utilice interfaces específicas, tipos de unión, genéricos o `unknown` junto con validaciones de tipo.
- **Tipar las Props**: Todos los componentes React deben tener interfaces o tipos explícitos y descriptivos para sus props (ej: `interface TranslatorWorkspaceProps { ... }`).
- **Retornos de Función**: Declare explícitamente el tipo de retorno en las funciones de servicios y controladores para facilitar la auto-documentación del código.

---

## 5. Estética Visual y Consistencia

- La interfaz visual debe verse moderna, limpia y premium.
- Utilice la paleta de colores corporativa (tonos slate, sky y amber) de forma consistente mediante Tailwind CSS.
- Garantice la legibilidad y accesibilidad cognitiva de la plataforma, respetando espaciados, tamaños de fuente legibles y soporte óptimo para impresión (media query `@media print`).
