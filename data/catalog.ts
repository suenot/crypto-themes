export type Palette = [bg: string, surface: string, accent: string, text: string];

export interface ThemeLogo {
  slug: string;
  file: string;
  sm: string;
}

/** Everything about a theme that is not a color. Same in light and dark. */
export interface ThemeStyle {
  font: string;
  fontDisplay: string;
  fontMono: string;
  /** Face for prices and other numbers. */
  fontNum: string;
  displayWeight: number;
  displayTracking: string;
  displayTransform: 'none' | 'uppercase';
  /** Radii in px. 999 means a pill. */
  radiusCard: number;
  radiusControl: number;
  radiusButton: number;
  /** Base spacing step in px. Paddings and gaps are multiples of it. */
  space: number;
}

export interface Theme {
  id: string;
  name: string;
  kind: 'exchange' | 'product';
  note: string;
  note_ru: string;
  logo?: ThemeLogo;
  style: ThemeStyle;
  light: Palette;
  dark: Palette;
}

export const paletteKeys = ['bg', 'surface', 'accent', 'text'] as const;
