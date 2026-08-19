export interface BibleDatabaseInfo {
  name: string;
  language: "Tamil" | "English";
  booksCount: number;
  chaptersCount: number;
  versesCount: number;
  uploadedAt: string;
  validationReport?: {
    hasDuplicates: boolean;
    duplicateBookChapterVerses: any[];
    hasMissing: boolean;
    missingSequentialVerses: any[];
  };
}

export interface Verse {
  versecount: number;
  verse: string;
  // Selected configuration attributes
  templateId?: string;
  fontFamily?: string;
  textStyleId?: string;
  frameStyleId?: string;
  voiceName?: string;
  audioUrl?: string;
  audioDuration?: number;
  status?: "Pending" | "Ready" | "Generating" | "Failed";
}

export interface FontAsset {
  family: string;
  url: string;
  filename: string;
  enabled?: boolean;
  weight?: string;
  style?: string;
  glyphCount?: number;
}

export interface BackgroundStyle {
  id: string;
  name: string;
  category: string;
  bgType: "gradient" | "color" | "image";
  value: string; // CSS style or image URL
  overlayOpacity?: number;
}

export interface TextStyle {
  id: string;
  name: string;
  fontWeight: string;
  fontStyle: string;
  color: string;
  shadow?: string;
  outlineColor?: string;
  outlineWidth?: number;
  glow?: string;
  gradient?: string;
}

export interface FrameStyle {
  id: string;
  name: string;
  borderStyle: string; // CSS borders
  borderColor: string;
  borderRadius: string;
  padding: string;
  glow?: string;
}

export interface TemplateConfig {
  id: string;
  name: string;
  category: string;
  backgroundId: string;
  textStyleId: string;
  frameStyleId: string;
  animationIn: string;
  animationHold: string;
  animationOut: string;
  particles: string;
  particlesDensity: "Low" | "Medium" | "High" | "Ultra";
}

export interface RenderTask {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  status: "Waiting" | "Processing Slide" | "Rendering Video" | "Joining Intro/Outro" | "Completed" | "Failed";
  progress: number;
  filename: string;
  downloadUrl?: string;
  error?: string;
}
