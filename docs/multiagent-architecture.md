# Arquitectura Multiagente para Adaptator TEA

## Objetivo

Diseñar una orquestación que mantenga un catálogo cerrado de ejercicios:

- `RODEAR`
- `PINTAR`
- `RELACIONAR`
- `REPASAR`

La arquitectura debe seguir haciendo lo mismo que el sistema actual:

- generar fichas nuevas
- adaptar fichas PDF
- refinar fichas existentes
- buscar pictogramas
- permitir edición humana

Pero con más control, menos deriva del modelo y mejor capacidad de revisión.

## Problema del sistema actual

Hoy la IA genera una ficha completa de una sola vez. Eso tiene tres consecuencias:

1. Mezcla decisión pedagógica, diseño estructural y redacción JSON en una sola llamada.
2. Puede introducir layouts heredados o formatos que no queremos.
3. No hay una revisión real antes de pasar a búsqueda de pictogramas y render.

## Propuesta

Usar una tubería multiagente con contratos estrictos entre etapas.

### Agente 1: `Classifier`

Responsabilidad:
- entender el tema o el PDF
- extraer intención pedagógica
- detectar nivel de dificultad
- producir una lista breve de objetivos visuales

Entrada:
- tema libre o texto extraído del PDF
- perfil del alumno

Salida:
- `learningGoals[]`
- `constraints[]`
- `sourceSignals[]`

Nunca genera ejercicios.

### Agente 2: `Planner`

Responsabilidad:
- decidir cuántas secciones tendrá la ficha
- repartirlas entre `rodear`, `pintar`, `relacionar` y `repasar`
- secuenciar dificultad y fatiga cognitiva

Entrada:
- salida del `Classifier`
- perfil del alumno

Salida:
- `worksheetPlan`
- cada sección con:
  - `exerciseType`
  - `goal`
  - `difficulty`
  - `itemCount`
  - `visualStrategy`

Reglas:
- no puede inventar layouts libres
- no puede generar contenido final

### Agente 3: `Exercise Generator`

Responsabilidad:
- convertir cada sección del plan en contenido estructurado

Entrada:
- una sola sección del `worksheetPlan`

Salida:
- JSON de sección compatible con el dominio:
  - `exerciseType`
  - `instruction`
  - `items`
  - `layout` canónico

Conviene lanzar un generador por sección. Así se gana paralelismo y se acota el fallo.

### Agente 4: `Pedagogical Critic`

Responsabilidad:
- revisar si cada sección es realizable para el perfil
- detectar sobrecarga, ambigüedad visual, exceso de texto o dificultad impropia

Entrada:
- plan
- secciones generadas
- perfil

Salida:
- `approved: boolean`
- `issues[]`
- `rewriteHints[]`

Si falla, devuelve la sección al `Exercise Generator` con instrucciones concretas.

### Agente 5: `Pictogram Resolver`

Responsabilidad:
- traducir términos a búsquedas ARASAAC
- elegir mejores pictogramas
- detectar términos ambiguos

Entrada:
- ficha aprobada sin resolver

Salida:
- ficha enriquecida con:
  - `searchTerm`
  - `pictoOptions`
  - `selectedPictoUrl`

Este agente puede ser híbrido:
- reglas locales primero
- IA solo para desambiguación semántica cuando haga falta

### Agente 6: `Structural Validator`

Responsabilidad:
- validar el esquema final antes de guardar o renderizar

Checks mínimos:
- solo existen los 4 `exerciseType`
- `relacionar` tiene número par de elementos
- `repasar` usa trazos legibles
- no quedan layouts legacy
- no hay secciones vacías

Debe ser determinista y local, no LLM.

### Agente 7: `Refiner`

Responsabilidad:
- aplicar cambios pedidos por el usuario sobre la ficha existente
- mantener el catálogo cerrado

Entrada:
- ficha actual
- instrucción del usuario

Salida:
- ficha revisada

Debe trabajar sección a sección, no reescribir toda la ficha sin control.

## Orquestación recomendada

### Generación desde tema

1. `Classifier`
2. `Planner`
3. `Exercise Generator` en paralelo por sección
4. `Pedagogical Critic`
5. `Pictogram Resolver`
6. `Structural Validator`
7. render/edición humana

### Adaptación desde PDF

1. OCR o extracción de texto
2. `Classifier` con texto + imagen
3. `Planner`
4. `Exercise Generator` por sección
5. `Pedagogical Critic`
6. `Pictogram Resolver`
7. `Structural Validator`

### Refinado desde biblioteca

1. `Refiner`
2. `Pedagogical Critic`
3. `Pictogram Resolver` solo en elementos nuevos o modificados
4. `Structural Validator`

## Contratos de datos

La unidad estable del sistema debe ser `WorksheetSection`.

Campos obligatorios:

- `exerciseType`
- `instruction`
- `items`
- `layout`

Regla clave:
- `exerciseType` manda
- `layout` se deriva de él

Mapa canónico:

- `rodear` -> `row`
- `pintar` -> `row`
- `relacionar` -> `matching_horizontal`
- `repasar` -> `column`

## Qué conviene implementar después

1. Separar prompts por agente en archivos dedicados.
2. Guardar trazas intermedias del pipeline para depuración.
3. Añadir score por sección:
   - claridad visual
   - carga cognitiva
   - adecuación al perfil
4. Añadir reintento automático solo en la sección que falle, no en toda la ficha.
5. Incluir tests de validación estructural sobre ejemplos reales.

## Encaje con el refactor actual

El refactor actual ya deja preparada la pieza crítica:

- el dominio se ha cerrado a cuatro tipos
- la ficha se normaliza localmente
- la IA ya no puede introducir formatos abiertos sin ser reconducida

Eso permite montar la orquestación multiagente encima sin rehacer el render ni la persistencia.
