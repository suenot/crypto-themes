import { expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import type { ThemeLogo } from './catalog';
import themes from './themes.json';

const agentSource = new URL('../../agent/src/theme.ts', import.meta.url);
const iconsCatalog = new URL('../../icons/data/exchanges.json', import.meta.url);

test('lists the nine themes in source order with unique slug IDs', () => {
  const ids = themes.map(theme => theme.id);
  expect(ids).toEqual(['marketmaker', 'warehouse', 'reforms', 'claude', 'codex', 'binance', 'bybit', 'tinvest', 'cscalp']);
  expect(new Set(ids).size).toBe(ids.length);
  for (const id of ids) expect(id).toMatch(/^[a-z0-9]+$/);
});

test('uses valid theme kinds, notes, and four-color palettes', () => {
  const exchanges = ['binance', 'bybit', 'tinvest'];
  for (const theme of themes) {
    expect(theme.kind).toBe(exchanges.includes(theme.id) ? 'exchange' : 'product');
    expect(theme.note.trim()).not.toBe('');
    expect(theme.note_ru.trim()).not.toBe('');
    expect(theme.note_ru).not.toMatch(/[ё«»]/);
    for (const palette of [theme.light, theme.dark]) {
      expect(palette).toHaveLength(4);
      for (const color of palette) expect(color).toMatch(/^#[0-9a-f]{6}$/);
    }
  }
});

test('gives every theme a complete style token set', () => {
  for (const { style } of themes) {
    for (const key of ['font', 'fontDisplay', 'fontMono', 'fontNum'] as const) expect(style[key].trim()).not.toBe('');
    expect(style.displayWeight).toBeGreaterThanOrEqual(100);
    expect(style.displayWeight).toBeLessThanOrEqual(900);
    expect(style.displayTracking).toMatch(/^-?\d+(\.\d+)?em$/);
    expect(['none', 'uppercase']).toContain(style.displayTransform);
    for (const radius of [style.radiusCard, style.radiusControl, style.radiusButton]) {
      expect(Number.isInteger(radius)).toBe(true);
      expect(radius).toBeGreaterThanOrEqual(0);
      expect(radius).toBeLessThanOrEqual(999);
    }
    expect(style.space).toBeGreaterThanOrEqual(2);
    expect(style.space).toBeLessThanOrEqual(8);
  }
});

test.skipIf(!existsSync(agentSource))('matches the light and dark colors in the agent source', () => {
  const source = readFileSync(agentSource, 'utf8');
  const entries = source.matchAll(/\{\s*id:\s*'([a-z0-9]+)'[^{}]*?\blight:\s*\[([^\]]*)\][^{}]*?\bdark:\s*\[([^\]]*)\]/g);
  const palettes = Array.from(entries, ([, id, light, dark]) => ({
    id,
    light: Array.from(light.matchAll(/'([^']*)'/g), ([, color]) => color),
    dark: Array.from(dark.matchAll(/'([^']*)'/g), ([, color]) => color),
  }));
  expect(themes.map(({ id, light, dark }) => ({ id, light, dark }))).toEqual(palettes);
});

test('provides logos for Binance and Bybit only', () => {
  expect(themes.filter(theme => theme.logo).map(theme => theme.id)).toEqual(['binance', 'bybit']);
});

test.skipIf(!existsSync(iconsCatalog))('uses logo metadata from the icons catalog', () => {
  const exchanges: ThemeLogo[] = JSON.parse(readFileSync(iconsCatalog, 'utf8'));
  for (const theme of themes) {
    if (!theme.logo) continue;
    const match = exchanges.find(exchange => exchange.slug === theme.id);
    expect(match).toMatchObject(theme.logo);
  }
});
