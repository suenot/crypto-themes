# Crypto Themes

A catalog of light and dark UI palettes for exchanges and products at [themes.marketmaker.cc](https://themes.marketmaker.cc). The nine palettes come from `trading/agent/src/theme.ts`. The agent app should read from this catalog in the future.

## Get started

```sh
bun install
bun run dev
bun run build
bun test
bun run typecheck
```

Use Bun 1.3 or later and Node.js 22 for the Vite tooling. The build writes the site and catalog assets to `site/dist`. Use `bun run preview` to serve the build locally.

## Catalog

`data/themes.json` is an ordered array of themes. Each theme has a slug `id`, a `name`, a `kind` of `exchange` or `product`, and descriptions in `note` (English) and `note_ru` (Russian). The `light` and `dark` palettes contain four lowercase hex colors each, in `[bg, surface, accent, text]` order. An optional `logo` contains `slug`, `file`, and `sm` from the logos catalog.

| Endpoint | Contents |
| --- | --- |
| `/index/themes.json` | Full catalog as compact JSON |
| `/css/<id>.css` | One theme's light and dark CSS variables |
| `/css/all.css` | CSS variables for every theme in catalog order |

All catalog endpoints allow cross-origin requests with `Access-Control-Allow-Origin: *`. Select a theme with `data-theme="<id>"` on the root element and set `data-mode="dark"` to use its dark palette.

To add a theme, edit `data/themes.json`, update the expected IDs in `data/themes.test.ts`, and run `bun test`. If the sibling agent checkout is present, the tests also compare the catalog with its palettes.

For a theme with a matching logo, use the original at `https://logos.marketmaker.cc/exchange-logos/<file>` or the thumbnail at `https://logos.marketmaker.cc/exchange-logos/sm/<slug>.webp`. Keep both images hosted on the logos service.

## Deploy

On the development Mac, sign in to Cloudflare through Wrangler OAuth with `bun x wrangler@latest login`. Run the tests and typecheck, then deploy.

```sh
bun run deploy
```

Wrangler serves the built static assets on `themes.marketmaker.cc`. After deployment, check `/`, `/index/themes.json`, and `/css/binance.css`.
