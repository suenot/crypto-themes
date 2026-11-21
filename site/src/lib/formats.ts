import type { Theme } from '../../../data/catalog';

export type Mode = 'light' | 'dark';

export function hexToRgb(hex: string): [number, number, number] {
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
}

function luminance(hex: string): number {
  const [red, green, blue] = hexToRgb(hex).map(channel => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function contrast(a: string, b: string): number {
  const first = luminance(a);
  const second = luminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

export function accentInk(accent: string): string {
  const dark = '#0b0b0b';
  const light = '#ffffff';
  return contrast(accent, dark) >= contrast(accent, light) ? dark : light;
}

export function cssVars(theme: Theme, mode: Mode = 'dark'): string {
  const [bg, surface, accent, text] = theme[mode];
  const selector = `:root[data-theme="${theme.id}"]${mode === 'dark' ? '[data-mode="dark"]' : ''}`;
  return `${selector} {
  color-scheme: ${mode};
  --bg: ${bg};
  --surface: ${surface};
  --accent: ${accent};
  --accent-ink: ${accentInk(accent)};
  --text: ${text};
}`;
}

export function cssFile(theme: Theme): string {
  return `/* ${theme.name}: ${theme.note} */\n${cssVars(theme, 'light')}\n\n${cssVars(theme, 'dark')}\n`;
}

export function themeJson(theme: Theme): string {
  const { logo, note_ru, ...download } = theme;
  return `${JSON.stringify(download, null, 2)}\n`;
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
