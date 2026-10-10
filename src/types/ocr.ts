export type ViewerTool = "select" | "hand" | "highlight" | "comment";

export type ViewMode = "canvas" | "clean" | "split" | "markdown";

export interface OcrBlock {
  type: "heading" | "paragraph" | "table" | "kv-pair" | "signature" | "footer";
  text: string;
  box2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] in 0-1000 range
  confidence: number;
  adobePath?: string; // e.g. "//Document/H1", "//Document/P", "//Document/Table"
  boundsPt?: [number, number, number, number]; // [x1, y1, x2, y2] in 72 DPI points
  fontName?: string;
  fontSizePt?: number;
  readingOrder?: number;
}

export interface OcrTable {
  title?: string;
  headers: string[];
  rows: string[][];
  adobePath?: string;
  boundsPt?: [number, number, number, number];
}

export interface OcrCorrection {
  originalArtifact: string;
  correctedText: string;
  reason: string;
}

export interface UncertainOcrToken {
  id: string;
  text: string;
  confidence: number; // percentage 0-100
  candidateAlternatives?: string[];
  context: string;
  reason: string;
  status?: "flagged" | "verified" | "edited";
}

export interface KeyDocumentEntity {
  label: string;
  value: string;
  type: "reference" | "date" | "currency" | "entity" | "tax_id";
  confidence: number;
}

export interface OcrPageData {
  pageNumber: number;
  detectedOrientation: 0 | 90 | 180 | 270;
  skewAngleDegrees: number;
  qualityScore: number;
  blurDetected: boolean;
  contrastLevel: "low" | "medium" | "high";
  documentType: string;
  title: string;
  summary: string;
  cleanMarkdown: string;
  blocks: OcrBlock[];
  tables: OcrTable[];
  confidenceScore: number;
  correctionsMade: OcrCorrection[];
  uncertainTokens?: UncertainOcrToken[];
  keyEntities?: KeyDocumentEntity[];
  imageSrc?: string;
  engine?: string;
  isAdobeExtract?: boolean;
  rawElementsCount?: number;
  pageGeometry?: { widthPt: number; heightPt: number; rotation: number };
}

export interface FilterSettings {
  autoDeskew: boolean;
  contrastBoost: boolean;
  sharpen: boolean;
  binarize: boolean;
  userRotation: number;
}

export interface NoteAnnotation {
  id: string;
  pageNumber: number;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  text: string;
  createdAt: string;
}

export interface HighlightAnnotation {
  id: string;
  pageNumber: number;
  blockIndex: number;
  color: string;
}
