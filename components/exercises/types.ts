import { WorksheetItem, WorksheetSection, ExerciseType, WorksheetExercise, WorksheetLayout } from '../../types';

export type EditorTarget =
  | { type: 'main' }
  | { type: 'item'; sectionIndex: number; itemIndex: number }
  | { type: 'instruction'; sectionIndex: number; pictoIndex: number };

export interface CommonEditorProps {
  section: WorksheetSection;
  sectionIndex: number;
  handleMoveItem: (sectionIndex: number, itemIndex: number, direction: -1 | 1) => void;
  handleRemoveItem: (sectionIndex: number, itemIndex: number) => void;
  setEditorTarget: (target: EditorTarget | null) => void;
  handleItemTextChange: (sectionIndex: number, itemIndex: number, value: string) => void;
}

export interface FewShotExample {
  title: string;
  description: string;
  json: string;
}

export interface ExerciseManifest {
  type: ExerciseType;
  label: string;
  instructionText: string;
  addLabel: string;
  defaultLayout: WorksheetLayout;
  instructionTerms: string[];
  minimumItems: number;
  minGenerateItems: number;
  maxGenerateItems: number;
  createDefaultExercise: () => WorksheetExercise;

  // AI & Prompt directives
  pedagogicalDescription: string;
  jsonSchema: string;
  promptRules: string[];
  fewShotExamples: FewShotExample[];
}
