import { WorksheetItem, WorksheetSection } from '../../types';

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
