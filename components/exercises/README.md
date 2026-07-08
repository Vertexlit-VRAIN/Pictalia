# Exercises Component & AI Prompt Design System

This folder holds all visual, interactive, editing, and prompt generation modules for the worksheet exercise types available in Adaptator-TEA. 

By grouping everything related to exercises in one directory, adding a new exercise type becomes a clean and self-contained process.

---

## Folder Structure

Each exercise type is a self-contained module inside its own subfolder:

```
components/exercises/
├── <exercise_type>/
│   ├── <ExerciseType>Display.tsx  # Renders the static/A4 print visual preview
│   ├── <ExerciseType>Play.tsx     # Renders the interactive student gameplay mode
│   ├── <ExerciseType>Editor.tsx   # Renders the focused item edit form inputs
│   └── manifest.ts                # AI Config (Pedagogical descriptions, prompts, schemas, few-shots)
├── types.ts                       # Shared typescript editor props and manifest types
├── registry.ts                    # Dynamic exercise registry loading all modules
└── README.md                      # This documentation file
```

---

## Walkthrough: Adding a New Exercise Type

To implement a new exercise type (e.g. `"colorear"` / `"coloring"`), follow these steps:

### Step 1: Update Domain Types
Update the global `types.ts` at the root of the project to add the new exercise structures:
1. Under `WorksheetSectionType` / `WorksheetExercise` union, add your new type name:
   ```typescript
   export type WorksheetSectionType = 'repasar' | 'unir' | 'rodear' | 'copiar' | 'colorear';
   ```
2. Define the schema/interfaces representing the new exercise structure (e.g., `ColorearExercise`).

### Step 2: Create UI Components
Create a new directory `components/exercises/coloring/` and implement the three required components:
1. **`ColoringDisplay.tsx`**: Renders the static preview for print/A4 sheets. Typically renders pictograms and outlines.
2. **`ColoringPlay.tsx`**: Renders the interactive canvas or target buttons for digital gameplay (e.g., click to fill colors).
3. **`ColoringEditor.tsx`**: Renders the forms and fields for custom items/pictogram editing, using `WorksheetItemEditor` under the hood.

### Step 3: Register in UI Orchestrators
Integrate the new components into the three central workspace views:
1. **Worksheet Display (Print/A4)**: In [WorksheetDisplay.tsx](file:///Users/calitor/Documents/projects/Adaptator-TEA/components/WorksheetDisplay.tsx) (and visual preview mode in [EditableWorksheetDisplay.tsx](file:///Users/calitor/Documents/projects/Adaptator-TEA/components/EditableWorksheetDisplay.tsx)), import `ColoringDisplay` and map it under the section type render switch:
   ```typescript
   {section.exerciseType === 'colorear' && <ColoringDisplay exercise={section.exercise as any} />}
   ```
2. **Interactive Student Mode**: In [InteractiveWorksheetPlay.tsx](file:///Users/calitor/Documents/projects/Adaptator-TEA/components/exercises/InteractiveWorksheetPlay.tsx), import `ColoringPlay` and map it:
   ```typescript
   {currentSection.exerciseType === 'colorear' && (
     <ColoringPlay items={currentSection.items} onComplete={handleNextSection} />
   )}
   ```
3. **Focused Block Editor**: In the inline section editor modal of [EditableWorksheetDisplay.tsx](file:///Users/calitor/Documents/projects/Adaptator-TEA/components/EditableWorksheetDisplay.tsx), import `ColoringEditor` and render it when editing that section type:
   ```typescript
   {activeSection.exerciseType === 'colorear' && (
     <ColoringEditor ... />
   )}
   ```

### Step 4: Normalizer Integration
If the exercise type has specific items that must be parsed or validated (like merging duplicates or parsing text), add defensive normalization rules inside [worksheetNormalizer.ts](file:///Users/calitor/Documents/projects/Adaptator-TEA/services/worksheetNormalizer.ts).

### Step 5: AI Module Manifest Configuration
Create a `manifest.ts` file inside your exercise folder (e.g., `components/exercises/coloring/manifest.ts`) exporting an `ExerciseManifest` object:
1. **`pedagogicalDescription`**: A description explaining when and why the didactic agent (ADP) should select this exercise (e.g. "recommended for color recognition and target matching").
2. **`jsonSchema`**: A JSON schema string defining the exercise structure.
3. **`promptRules`**: Specific formatting rules for correct exercise construction.
4. **`fewShotExamples`**: Few-shot generated examples for the AI to learn the structure.

### Step 6: Registration in Exercise Registry
Add the new manifest to [components/exercises/registry.ts](file:///Users/calitor/Documents/projects/Adaptator-TEA/components/exercises/registry.ts):
1. Import the manifest:
   ```typescript
   import { manifest as coloringManifest } from './coloring/manifest';
   ```
2. Register it in `EXERCISE_REGISTRY`:
   ```typescript
   colorear: coloringManifest
   ```
3. Append its key to the order array:
   ```typescript
   export const EXERCISE_TYPE_ORDER: ExerciseType[] = ['repasar', 'unir', 'rodear', 'copiar', 'colorear'];
   ```

This registers your exercise for both the UI (forms, layouts, print, student play mode) and the AI agents (ADP planning and AC construction) dynamically!
