import { readFile } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import solid from 'vite-plugin-solid';
import { defineConfig, type Plugin } from 'vite';
import type { Theme } from '../data/catalog';
import { cssFile } from './src/lib/formats';

const root = fileURLToPath(new URL('.', import.meta.url));
const themesPath = path.resolve(root, '../data/themes.json');

/** Every generated file by its public path: the catalog index and one stylesheet per theme. */
async function generated(): Promise<Map<string, string>> {
  const themes: Theme[] = JSON.parse(await readFile(themesPath, 'utf8'));
  const sheets = themes.map((theme) => [`css/${theme.id}.css`, cssFile(theme)] as const);
  return new Map([
    ['index/themes.json', JSON.stringify(themes)],
    ...sheets,
    ['css/all.css', sheets.map(([, css]) => css).join('\n')],
  ]);
}

type Next = (error?: unknown) => void;

async function serve(request: IncomingMessage, response: ServerResponse, next: Next) {
  const { pathname } = new URL(request.url ?? '/', 'http://localhost');
  if (!/^\/(index\/themes\.json|css\/[a-z0-9]+\.css)$/.test(pathname) || (request.method !== 'GET' && request.method !== 'HEAD')) return next();
  try {
    const body = (await generated()).get(pathname.slice(1));
    if (body === undefined) return next();
    response.setHeader('Content-Type', pathname.endsWith('.json') ? 'application/json; charset=utf-8' : 'text/css; charset=utf-8');
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch (error) {
    next(error);
  }
}

function themeFiles(): Plugin {
  return {
    name: 'theme-files',
    async generateBundle() {
      for (const [fileName, source] of await generated()) this.emitFile({ type: 'asset', fileName, source });
    },
    configureServer: (server) => void server.middlewares.use(serve),
    configurePreviewServer: (server) => void server.middlewares.use(serve),
  };
}

export default defineConfig({
  root,
  plugins: [solid(), themeFiles()],
  build: { outDir: path.join(root, 'dist'), emptyOutDir: true },
  server: { host: '127.0.0.1' },
});
