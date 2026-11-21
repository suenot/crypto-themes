# Crypto Themes

A catalog of UI themes for exchanges and products at [themes.marketmaker.cc](https://themes.marketmaker.cc). A theme is a full token set: light and dark colors, fonts, display type, corner radii and spacing. This catalog is the single source of truth for the themes. The agent app (`trading/agent`) links `/css/all.css`, reads `/index/themes.json` and derives its other tokens from the four colors; it keeps no theme data of its own.

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

`data/themes.json` is an ordered array of themes. Each theme has a slug `id`, a `name`, a `kind` of `exchange` or `product`, and descriptions in `note` (English) and `note_ru` (Russian). The `light` and `dark` palettes contain four lowercase hex colors each, in `[bg, surface, accent, text]` order. An optional `logo` contains `slug`, `file`, and `sm` from the logos catalog. `style` holds everything that is not a color and is the same in both modes:

| Field | CSS variable | Meaning |
| --- | --- | --- |
| `font`, `fontDisplay`, `fontMono`, `fontNum` | `--font`, `--font-display`, `--font-mono`, `--font-num` | Font stacks for body, headings, code and numbers |
| `displayWeight`, `displayTracking`, `displayTransform` | `--display-weight`, `--display-tracking`, `--display-transform` | Heading weight, letter spacing, `none` or `uppercase` |
| `radiusCard`, `radiusControl`, `radiusButton` | `--r-card`, `--r-ctl`, `--r-btn` | Corner radii in px, 999 is a pill |
| `space` | `--space` | Base spacing step in px; use multiples of it for padding and gaps |

The site loads Geist, Inter, IBM Plex Sans, Roboto and Source Serif 4 through `@fontsource-variable`. An app that uses a theme must load the fonts named in its stacks.

| Endpoint | Contents |
| --- | --- |
| `/index/themes.json` | Full catalog as compact JSON |
| `/css/<id>.css` | One theme's tokens plus light and dark colors as CSS variables |
| `/css/all.css` | CSS variables for every theme in catalog order |

All catalog endpoints allow cross-origin requests with `Access-Control-Allow-Origin: *`. Select a theme with `data-theme="<id>"` on the root element and set `data-mode="dark"` to use its dark colors.

To add a theme, edit `data/themes.json`, update the expected IDs in `data/themes.test.ts`, and run `bun test`.

For a theme with a matching logo, use the original at `https://logos.marketmaker.cc/exchange-logos/<file>` or the thumbnail at `https://logos.marketmaker.cc/exchange-logos/sm/<slug>.webp`. Keep both images hosted on the logos service.

## Deploy

On the development Mac, sign in to Cloudflare through Wrangler OAuth with `bun x wrangler@latest login`. Run the tests and typecheck, then deploy.

```sh
bun run deploy
```

Wrangler serves the built static assets on `themes.marketmaker.cc`. After deployment, check `/`, `/index/themes.json`, and `/css/binance.css`.
