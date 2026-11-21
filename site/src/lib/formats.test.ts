import { expect, test } from 'bun:test';
import type { Theme } from '../../../data/catalog';
import themes from '../../../data/themes.json';
import { accentInk, contrast, cssFile, cssTokens, cssVars, tailwindConfig, themeJson } from './formats';

const binance = themes.find(theme => theme.id === 'binance') as Theme;

const tokensCss = `:root[data-theme="binance"] {
  --font: 'IBM Plex Sans Variable', ui-sans-serif, system-ui, sans-serif;
  --font-display: 'IBM Plex Sans Variable', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'Geist Mono Variable', ui-monospace, SFMono-Regular, Menlo, monospace;
  --font-num: 'IBM Plex Sans Variable', ui-sans-serif, system-ui, sans-serif;
  --display-weight: 600;
  --display-tracking: -0.02em;
  --display-transform: none;
  --r-card: 12px;
  --r-ctl: 8px;
  --r-btn: 8px;
  --space: 4px;
}`;

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

test('formats the non-color tokens', () => {
  expect(cssTokens(binance)).toBe(tokensCss);
});

test('writes pill radii as 999px', () => {
  const marketmaker = themes.find(theme => theme.id === 'marketmaker') as Theme;
  expect(cssTokens(marketmaker)).toContain('--r-btn: 999px;');
});

test('formats the CSS file with a comment, tokens, then light and dark blocks', () => {
  expect(cssFile(binance)).toBe(`/* Binance: Yellow on graphite, dense terminal */\n${tokensCss}\n\n${lightCss}\n\n${darkCss}\n`);
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
      fontFamily: {
        sans: 'var(--font)',
        display: 'var(--font-display)',
        mono: 'var(--font-mono)',
        num: 'var(--font-num)',
      },
      borderRadius: {
        card: 'var(--r-card)',
        ctl: 'var(--r-ctl)',
        btn: 'var(--r-btn)',
      },
      spacing: {
        step: 'var(--space)',
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
