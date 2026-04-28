
export interface Profile {
  id: string;
  name: string;
  content: string;
  showPictogramInstructions: boolean;
  savedWorksheets: SavedWorksheet[];
}

export type AIProvider = 'gemini' | 'ollama';

export interface AISettings {
  provider: AIProvider;
  geminiApiKey: string;
  geminiModel: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
}

export type PictogramProvider = 'arasaac_official' | 'private_api';

export interface PictogramSettings {
  provider: PictogramProvider;
  arasaacApiUrl: string;
  privateApiUrl: string;
}

export interface PictogramSearchResult {
  id: string;
  url: string;
  keywords?: string[];
}

export type PictogramRenderMode = 'auto' | 'spell';

export interface WorksheetItem {
  type: 'image' | 'text' | 'traceable_text' | 'empty_box';
  content: string;
  searchTerm?: string;
  selectedPictoUrl?: string;
  pictoOptions?: string[];
  pictogramRenderMode?: PictogramRenderMode;
  spelledLetterTerms?: string[];
  spelledLetterUrls?: string[];
}

export type WorksheetLayout = 'row' | 'column' | 'true_false' | 'sentence_building' | 'matching_horizontal';

export type ExerciseType = 'repasar' | 'unir' | 'rodear' | 'copiar';

export interface WorksheetInstructionPicto {
  searchTerm: string;
  content: string;
  url?: string | null;
  pictogramRenderMode?: PictogramRenderMode;
  spelledLetterTerms?: string[];
  spelledLetterUrls?: string[];
}

export interface WorksheetInstruction {
  text: string;
  pictograms?: WorksheetInstructionPicto[];
}

export interface RepasarExercise {
  type: 'repasar';
  prompts: WorksheetItem[];
}

export interface UnirExercisePair {
  left: WorksheetItem;
  right: WorksheetItem;
}

export interface UnirExercise {
  type: 'unir';
  pairs: UnirExercisePair[];
}

export interface RodearExercise {
  type: 'rodear';
  prompt?: WorksheetItem | null;
  options: WorksheetItem[];
}

export interface CopiarExercise {
  type: 'copiar';
  model: WorksheetItem;
  copies: WorksheetItem[];
}

export type WorksheetExercise =
  | RepasarExercise
  | UnirExercise
  | RodearExercise
  | CopiarExercise;

export interface WorksheetSection {
  instruction: WorksheetInstruction;
  exerciseType?: ExerciseType;
  exercise?: WorksheetExercise;
  items?: WorksheetItem[];
  layout?: WorksheetLayout;
}

export interface Worksheet {
  title: string;
  pictogramSearchTerm: string;
  selectedPictoUrl?: string;
  pictoOptions?: string[];
  pictogramRenderMode?: PictogramRenderMode;
  spelledLetterTerms?: string[];
  spelledLetterUrls?: string[];
  sections: WorksheetSection[];
}

export interface SavedWorksheet extends Worksheet {
  id: string;
  createdAt: string; // ISO string
  sourceDescription: string; // e.g., 'el número 5' or 'Ficha Adaptada de PDF'
}

export interface AppData {
  profiles: Profile[];
  activeProfileId: string | null;
  aiSettings: AISettings;
  pictogramSettings: PictogramSettings;
}
