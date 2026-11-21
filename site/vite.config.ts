import { readFile } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import solid from 'vite-plugin-solid';
import { defineConfig, type Plugin } from 'vite';
import type { Theme } from '../data/catalog';
import { cssFile } from './src/lib/formats';

const siteDirectory = fileURLToPath(new URL('.', import.meta.url));
const themesPath = path.resolve(siteDirectory, '../data/themes.json');

async function themeAssets(): Promise<Map<string, string>> {
  const themes: Theme[] = JSON.parse(await readFile(themesPath, 'utf8'));
  const styles = themes.map(theme => [`css/${theme.id}.css`, cssFile(theme)] as const);
  return new Map([
    ['index/themes.json', JSON.stringify(themes)],
    ...styles,
    ['css/all.css', styles.map(([, css]) => css).join('\n')],
  ]);
}

type Next = (error?: unknown) => void;

async function serveThemeAssets(request: IncomingMessage, response: ServerResponse, next: Next) {
  const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
  const isIndex = pathname === '/index/themes.json';
  const isCss = /^\/css\/[a-z0-9]+\.css$/.test(pathname);
  if ((!isIndex && !isCss) || (request.method !== 'GET' && request.method !== 'HEAD')) {
    next();
    return;
  }
  try {
    const source = (await themeAssets()).get(pathname.slice(1));
    if (source === undefined) {
      next();
      return;
    }
    response.setHeader('Content-Type', isIndex ? 'application/json; charset=utf-8' : 'text/css; charset=utf-8');
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.end(request.method === 'HEAD' ? undefined : source);
  } catch (error) {
    next(error);
  }
}

function themeData(): Plugin {
  return {
    name: 'theme-data',
    async generateBundle() {
      for (const [fileName, source] of await themeAssets()) {
        this.emitFile({ type: 'asset', fileName, source });
      }
    },
    configureServer(server) {
      server.middlewares.use(serveThemeAssets);
    },
    configurePreviewServer(server) {
      server.middlewares.use(serveThemeAssets);
    },
  };
}

export default defineConfig({
  root: siteDirectory,
  plugins: [solid(), themeData()],
  build: { outDir: path.join(siteDirectory, 'dist'), emptyOutDir: true },
  server: { host: '127.0.0.1' },
});
