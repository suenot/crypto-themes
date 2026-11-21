export type Palette = [bg: string, surface: string, accent: string, text: string];

export interface ThemeLogo {
  slug: string;
  file: string;
  sm: string;
}

export interface Theme {
  id: string;
  name: string;
  kind: 'exchange' | 'product';
  note: string;
  note_ru: string;
  logo?: ThemeLogo;
  light: Palette;
  dark: Palette;
}

export const paletteKeys = ['bg', 'surface', 'accent', 'text'] as const;
