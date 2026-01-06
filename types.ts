
export enum CardType {
  MONSTER = 'Monster/Creature',
  SPELL = 'Spell/Magic',
  TRAP = 'Trap/Action'
}

export enum Attribute {
  DARK = 'Dark',
  LIGHT = 'Light',
  WATER = 'Water',
  FIRE = 'Fire',
  EARTH = 'Earth',
  WIND = 'Wind',
  NONE = 'None'
}

export enum GenerationMode {
  NEW = 'new',
  VARIATION = 'variation'
}

export enum VariationStrength {
  SUBTLE = 'subtle',
  MODERATE = 'moderate',
  SIGNIFICANT = 'significant'
}

export interface CardData {
  id: string;
  name: string;
  type: CardType;
  attribute: Attribute;
  level: number;
  description: string;
  atk: string;
  def: string;
  imageUrl: string;
  backImageUrl?: string;
  prompt: string;
  timestamp: number;
  fontFamily?: string;
  bodyColor?: string;
  frameColor?: string;
  accentColor?: string;
  artOffsetX?: number;
  artOffsetY?: number;
  artScale?: number;
}

export interface GenerationState {
  isGenerating: boolean;
  error: string | null;
  mode: GenerationMode;
  strength: VariationStrength;
  customPrompt: string;
  variationChanges: string;
  uploadedImage?: string; // base64 data of user uploaded image
}
