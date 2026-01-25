// =============================================================================
// CharcuterME Type Definitions
// =============================================================================

// Ingredient Types
export type IngredientRole = 'anchor' | 'filler' | 'pop' | 'vehicle';
export type IngredientSize = 'tiny' | 'small' | 'medium' | 'large';
export type PlatingStyle = 'stack' | 'scatter' | 'cluster' | 'spread' | 'fan' | 'pile';

export interface IngredientData {
  role: IngredientRole;
  size: IngredientSize;
  shape: string;
  color: string;
  platingStyle: PlatingStyle;
  displayName: string;
  proTip: string;
  isSmallRound?: boolean;
  isLongItem?: boolean;
  isBulky?: boolean;
  needsContainer?: boolean;
  useOddNumbers?: boolean;
}

export interface ClassifiedIngredient extends IngredientData {
  original: string;
}

export interface IngredientSummary {
  total: number;
  anchors: ClassifiedIngredient[];
  fillers: ClassifiedIngredient[];
  pops: ClassifiedIngredient[];
  vehicles: ClassifiedIngredient[];
  hasLarge: boolean;
  hasBulky: boolean;
  hasSmallRound: boolean;
  hasLongItems: boolean;
  hasSpreadable: boolean;
  needsContainer: boolean;
  hasOddNumberItems: boolean;
}

// Template Types
export interface TemplateLayout {
  style: string;
  negativeSpace: string;
  boardShape: string;
}

export interface Template {
  name: string;
  conditions: (summary: IngredientSummary) => boolean;
  description: string;
  layout: TemplateLayout;
  rules: string[];
  visualGuide: string;
}

// Visual Rules Types
export interface VisualRule {
  name: string;
  check: (summary: IngredientSummary) => boolean;
  instruction: string;
  appliesTo?: string[];
}

// Processing Result Types
export interface ProcessedResult {
  input: string | string[];
  classified: ClassifiedIngredient[];
  summary: {
    total: number;
    anchors: string[];
    fillers: string[];
    pops: string[];
    vehicles: string[];
  };
  templateSelected: string;
  templateReason: string;
  rulesApplied: string[];
  prompt: string;
}

// API Response Types
export interface NamerResponse {
  name: string;
  validation: string;
  tip: string;
}

export interface VibeCheckResponse {
  score: number;
  rank: string;
  compliment: string;
  sticker: string;
  improvement?: string;
}

// Sticker Types
export type StickerTier = 'legendary' | 'great' | 'good' | 'chaotic' | 'messy';

export interface StickerConfig {
  options: string[];
  style: string;
}

// Validation Types
export type ValidationSeverity = 'high' | 'low' | 'clarification';

export interface ValidationResult {
  valid: boolean;
  severity?: ValidationSeverity;
  category?: string;
  snark?: string;
  suggestion?: string;
  validForms?: string[];
  classification?: {
    found: boolean;
    role: string;
    category: string;
    matched?: string;
    warning?: string;
  };
}

export interface ValidationListResult {
  valid: Array<{ item: string; classification: ValidationResult['classification'] }>;
  invalid: Array<{ item: string; severity: ValidationSeverity; category: string; snark: string }>;
  ambiguous: Array<{ item: string; snark: string; validForms: string[] }>;
  warnings: Array<{ item: string; warning: string }>;
}

export interface DinnerMatch {
  name: string;
  tip: string;
  template: string;
  validation: string;
}

// App State Types
export type Screen = 'input' | 'name' | 'blueprint' | 'camera' | 'results';

export interface AppState {
  screen: Screen;
  ingredients: string;
  dinnerName: string;
  validation: string;
  tip: string;
  blueprintUrl: string | null;
  userPhoto: string | null;
  vibeScore: number;
  vibeRank: string;
  vibeCompliment: string;
  sticker: string;
  isLoading: boolean;
  error: string | null;
}
