import { expect, test } from 'bun:test';
import type { Theme } from '../../../data/catalog';
import themes from '../../../data/themes.json';
import { accentInk, contrast, cssFile, cssVars, tailwindConfig, themeJson } from './formats';

const binance = themes.find(theme => theme.id === 'binance') as Theme;

const lightCss = `:root[data-theme="binance"] {
  color-scheme: light;
  --bg: #fafafa;
  --surface: #ffffff;
  --accent: #fcd535;
  --accent-ink: #0b0b0b;
  --text: #1e2329;
}`;

const darkCss = `:root[data-theme="binance"][data-mode="dark"] {
  color-scheme: dark;
  --bg: #0b0e11;
  --surface: #181a20;
  --accent: #fcd535;
  --accent-ink: #0b0b0b;
  --text: #eaecef;
}`;

test('formats the CSS variables for each mode and defaults to dark', () => {
  expect(cssVars(binance, 'light')).toBe(lightCss);
  expect(cssVars(binance, 'dark')).toBe(darkCss);
  expect(cssVars(binance)).toBe(darkCss);
});

test('formats the CSS file with a comment and the light block first', () => {
  expect(cssFile(binance)).toBe(`/* Binance: Yellow on graphite, dense terminal */\n${lightCss}\n\n${darkCss}\n`);
});

test('formats the Tailwind configuration', () => {
  expect(tailwindConfig(binance)).toBe(`/** Tailwind config for the Binance theme. Add the CSS variables from /css/binance.css to your global stylesheet. */
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
`);
});

test('exports the theme JSON without logo metadata or the Russian note', () => {
  const { logo, note_ru, ...expected } = binance;
  const json = themeJson(binance);
  expect(JSON.parse(json)).toEqual(expected);
  expect(json).toBe(`${JSON.stringify(expected, null, 2)}\n`);
});

test('chooses the ink with higher contrast against the accent', () => {
  expect(accentInk('#fcd535')).toBe('#0b0b0b');
  expect(accentInk('#5b4be6')).toBe('#ffffff');
});

test('calculates the WCAG contrast ratio for black and white', () => {
  expect(contrast('#000000', '#ffffff')).toBeCloseTo(21);
});
