
export interface Profile {
  id: string;
  name: string;
  content: string;
  structuredContent?: StudentStructuredProfile;
  showPictogramInstructions: boolean;
  savedWorksheets: SavedWorksheet[];
}

export interface StudentProfileBlock {
  summary: string;
}

export interface StudentStructuredProfile {
  general: {
    age: string;
    schoolStage: string;
    diagnosis: string;
    priorityGoals: string;
    additionalComments: string;
  };
  blocks: {
    comprehensionAccess: StudentProfileBlock;
    responseModality: StudentProfileBlock;
    cognitiveProcessing: StudentProfileBlock;
    attentionSelfRegulation: StudentProfileBlock;
    motivationInterests: StudentProfileBlock;
  };
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

export type WorksheetEntityId = string;

export interface WorksheetItem {
  internalId?: WorksheetEntityId;
  type: 'image' | 'text' | 'traceable_text' | 'empty_box';
  content: string;
  searchTerm?: string;
  selectedPictoUrl?: string;
  pictoOptions?: string[];
  pictogramRenderMode?: PictogramRenderMode;
  spelledLetterTerms?: string[];
  spelledLetterUrls?: string[];
}

export type WorksheetLayout = 'row' | 'column' | 'matching_horizontal';

export type ExerciseType = 'repasar' | 'unir' | 'rodear' | 'copiar';

export interface WorksheetInstructionPicto {
  internalId?: WorksheetEntityId;
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
  copies: WorksheetItem[];
}

export type WorksheetExercise =
  | RepasarExercise
  | UnirExercise
  | RodearExercise
  | CopiarExercise;

export interface WorksheetSection {
  internalId?: WorksheetEntityId;
  instruction: WorksheetInstruction;
  exerciseType: ExerciseType;
  exercise: WorksheetExercise;
  items: WorksheetItem[];
  layout: WorksheetLayout;
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
  originalTopic?: string;
  originalGoal?: string;
  originalExtraDetails?: string;
}

export interface SavedWorksheet extends Worksheet {
  id: string;
  createdAt: string; // ISO string
  sourceDescription: string; // e.g., 'el número 5' or 'tema generado por IA'
  editHistory?: PersistedWorksheetHistoryEntry[];
  editHistoryIndex?: number;
}

export interface PersistedWorksheetHistoryEntry {
  state: SavedWorksheet;
  actionLabel: string;
  timestamp: string;
  operations: WorksheetOperation[];
}

export interface AppData {
  profiles: Profile[];
  activeProfileId: string | null;
  aiSettings: AISettings;
  pictogramSettings: PictogramSettings;
}

export interface UpdateWorksheetOperation {
  type: 'update_worksheet';
  changes: Partial<Pick<Worksheet, 'title' | 'pictogramSearchTerm' | 'selectedPictoUrl' | 'pictoOptions' | 'pictogramRenderMode' | 'spelledLetterTerms' | 'spelledLetterUrls'>>;
}

export interface CreateSectionOperation {
  type: 'create_section';
  afterSectionId?: WorksheetEntityId;
  section: Partial<WorksheetSection>;
}

export interface UpdateSectionOperation {
  type: 'update_section';
  sectionId: WorksheetEntityId;
  section: Partial<WorksheetSection>;
}

export interface DeleteSectionOperation {
  type: 'delete_section';
  sectionId: WorksheetEntityId;
}

export interface MoveSectionOperation {
  type: 'move_section';
  sectionId: WorksheetEntityId;
  toIndex: number;
}

export type WorksheetOperation =
  | UpdateWorksheetOperation
  | CreateSectionOperation
  | UpdateSectionOperation
  | DeleteSectionOperation
  | MoveSectionOperation;

export interface WorksheetOperationRequest {
  operations: WorksheetOperation[];
}
