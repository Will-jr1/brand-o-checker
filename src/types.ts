export type Status = 'pass' | 'warn' | 'fail';
export type SampleKey = 'aura_approved' | 'aura_deviations' | 'multiverso_approved';

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface PaletteColor {
  name: string;
  hex: string;
  role: string;
  expectedShare: string;
}

// Todos os campos são opcionais: o JSON é editável ao vivo e pode vir incompleto.
export interface BrandRules {
  brand?: string;
  palette?: { toleranceDeltaE?: number; colors?: PaletteColor[] };
  typography?: {
    primaryFont?: string;
    secondaryFont?: string;
    minHierarchyRatio?: number;
    forbiddenStyles?: string[];
  };
  logo?: { clearspaceModule?: string; minMarginPercent?: number; allowedBackgrounds?: string[] };
  contrast?: { minWcagRatio?: number };
  artDirection?: { style?: string; toneOfVoice?: string };
}

export interface PresetManual {
  id: string;
  name: string;
  fileName: string;
  updatedAt: string;
  rules: BrandRules;
}

export interface ExtractedColor {
  extractedHex: string;
  percentage: number;
  closestOfficial: PaletteColor;
  deltaE: number;
  isCompliant: boolean;
}

export interface PixelData {
  colors: ExtractedColor[];
  bestContrast: number;
  contrastPair: string[];
  dimensions: { width: number; height: number };
}

export interface TypographyAnalysis {
  detectedStyle: string;
  confidence: number;
  matchStatus: Status;
  hierarchyRatio: string;
  note: string;
}

export interface Annotation {
  id: string;
  type: Status;
  pillar: string;
  label: string;
  detail: string;
  box: { top: string; left: string; width: string; height: string };
}

export interface ChecklistItem {
  id: string;
  pillar: string;
  title: string;
  status: Status;
  metric: string;
  description: string;
}

export interface AnalysisResult {
  totalScore: number;
  pillars: { critical: number; structural: number; aesthetic: number };
  pixelData: PixelData;
  typographyAnalysis: TypographyAnalysis;
  annotations: Annotation[];
  checklist: ChecklistItem[];
  timestamp: string;
}
