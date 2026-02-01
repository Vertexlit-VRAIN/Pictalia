
export interface Profile {
  id: string;
  name: string;
  content: string;
  showPictogramInstructions: boolean;
  savedWorksheets: SavedWorksheet[];
}

export interface WorksheetItem {
  type: 'image' | 'text' | 'traceable_text' | 'empty_box';
  content: string;
  searchTerm?: string;
  selectedPictoUrl?: string;
  pictoOptions?: string[];
}

export type WorksheetLayout = 'row' | 'column' | 'true_false' | 'sentence_building' | 'matching_horizontal';

export interface WorksheetSection {
  instruction: {
    text: string;
    pictograms?: {
      searchTerm: string;
      content: string;
      url?: string | null;
    }[];
  };
  items: WorksheetItem[];
  layout: WorksheetLayout;
}

export interface Worksheet {
  title: string;
  pictogramSearchTerm: string;
  selectedPictoUrl?: string;
  pictoOptions?: string[];
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
}
