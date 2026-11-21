import type { Theme } from '../../../data/catalog';

export type Mode = 'light' | 'dark';

const INK_DARK = '#0b0b0b';
const INK_LIGHT = '#ffffff';

export function hexToRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** WCAG relative luminance. */
function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio, 1 to 21. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Text color for a button painted with the accent. */
export function accentInk(accent: string): string {
  return contrast(accent, INK_DARK) >= contrast(accent, INK_LIGHT) ? INK_DARK : INK_LIGHT;
}

/** CSS variables for one mode. Light is the default, dark adds [data-mode="dark"]. */
export function cssVars(theme: Theme, mode: Mode = 'dark'): string {
  const [bg, surface, accent, text] = theme[mode];
  const selector = `:root[data-theme="${theme.id}"]${mode === 'dark' ? '[data-mode="dark"]' : ''}`;
  return [
    `${selector} {`,
    `  color-scheme: ${mode};`,
    `  --bg: ${bg};`,
    `  --surface: ${surface};`,
    `  --accent: ${accent};`,
    `  --accent-ink: ${accentInk(accent)};`,
    `  --text: ${text};`,
    '}',
  ].join('\n');
}

/** Stylesheet with both modes, light first. */
export function cssFile(theme: Theme): string {
  return `/* ${theme.name}: ${theme.note} */\n${cssVars(theme, 'light')}\n\n${cssVars(theme, 'dark')}\n`;
}

/** The theme as a user would paste it: no logo, no Russian note. */
export function themeJson(theme: Theme): string {
  const { logo: _logo, note_ru: _noteRu, ...rest } = theme;
  return `${JSON.stringify(rest, null, 2)}\n`;
}

export function tailwindConfig(theme: Theme): string {
  return `/** Tailwind config for the ${theme.name} theme. Add the CSS variables from /css/${theme.id}.css to your global stylesheet. */
export default {
  darkMode: ['selector', '[data-mode="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        accent: 'var(--accent)',
        'accent-ink': 'var(--accent-ink)',
        text: 'var(--text)',
      },
    },
  },
};
`;
}
