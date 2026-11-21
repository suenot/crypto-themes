import { createEffect, createMemo, createSignal, For, onCleanup, onMount, Show, type JSX } from 'solid-js';
import themeData from '../../data/themes.json';
import type { Theme } from '../../data/catalog';
import { accentInk, contrast, cssFile, tailwindConfig, themeJson, type Mode } from './lib/formats';

const REPO_URL = 'https://github.com/suenot/crypto-themes';
const LOGOS = 'https://logos.marketmaker.cc';
const HOST = 'https://themes.marketmaker.cc';
const themes = themeData as Theme[];

type Format = 'css' | 'json' | 'tailwind';
type Kind = 'all' | Theme['kind'];

const logoUrl = (theme: Theme, small: boolean) =>
  theme.logo ? `${LOGOS}/exchange-logos/${small ? 'sm/' : ''}${encodeURIComponent(small ? theme.logo.sm : theme.logo.file)}` : '';

/** Scopes one theme palette to an element through the same variables a real app would use. */
function vars(theme: Theme, mode: Mode): JSX.CSSProperties {
  const [bg, surface, accent, text] = theme[mode];
  return { '--bg': bg, '--surface': surface, '--accent': accent, '--accent-ink': accentInk(accent), '--text': text } as JSX.CSSProperties;
}

const Svg = (props: { d: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={props.d} /></svg>
);
const ICON_COPY = 'M9 9h10v10H9zM5 15V5h10';
const ICON_CLOSE = 'M6 6l12 12M18 6 6 18';

/** A logo from the logos site, or a monogram in the theme accent when the catalog has none. */
function Mark(props: { theme: Theme; mode: Mode; size: number }) {
  return (
    <Show when={props.theme.logo} fallback={
      <span class="mono-mark" style={{ width: `${props.size}px`, height: `${props.size}px`, background: props.theme[props.mode][2], color: accentInk(props.theme[props.mode][2]), 'font-size': `${props.size * 0.5}px` }}>
        {props.theme.name[0]}
      </span>
    }>
      <img class="logo-img" src={logoUrl(props.theme, true)} alt="" width={props.size} height={props.size} loading="lazy" />
    </Show>
  );
}

const asks: [string, string][] = [['97,418.50', '0.412'], ['97,416.00', '1.087'], ['97,414.50', '0.236'], ['97,413.00', '0.654']];
const bids: [string, string][] = [['97,412.50', '0.918'], ['97,411.00', '0.305'], ['97,409.50', '1.440'], ['97,408.00', '0.727']];
const tape: [string, string, boolean][] = [['14:02:11.482913', '0.025', true], ['14:02:11.470288', '0.310', false], ['14:02:11.455104', '0.114', true]];
const spark = 'M0 54 L18 48 L34 51 L52 38 L70 42 L88 30 L106 34 L124 22 L142 27 L160 15 L178 19 L196 8';

/** Mini trading terminal drawn only from the four palette colors plus fixed market green and red. */
function Terminal(props: { theme: Theme; mode: Mode }) {
  return (
    <div class="term" style={vars(props.theme, props.mode)}>
      <div class="term-top">
        <span class="term-brand"><Mark theme={props.theme} mode={props.mode} size={20} />{props.theme.name}</span>
        <span class="term-nav"><span>Markets</span><b>Trade</b><span>Wallet</span></span>
        <span class="term-login">Log in</span>
      </div>
      <div class="term-body">
        <div class="term-chart">
          <div class="term-pair"><b>BTC/USDT</b><span class="up">+2.41%</span></div>
          <div class="term-price">97,412.50</div>
          <svg class="term-spark" viewBox="0 0 196 64" preserveAspectRatio="none" aria-hidden="true">
            <path d={`${spark} L196 64 L0 64 Z`} class="spark-fill" />
            <path d={spark} class="spark-line" />
          </svg>
          <div class="term-tape">
            <For each={tape}>{([time, size, buy]) => <span><i>{time}</i><em class={buy ? 'up' : 'down'}>{size}</em></span>}</For>
          </div>
        </div>
        <div class="term-book">
          <For each={asks}>{([price, size]) => <div><em class="down">{price}</em><i>{size}</i></div>}</For>
          <div class="term-mid">97,412.50</div>
          <For each={bids}>{([price, size]) => <div><em class="up">{price}</em><i>{size}</i></div>}</For>
        </div>
      </div>
      <div class="term-foot"><span class="term-buy">Buy BTC</span><span class="term-sell">Sell</span></div>
    </div>
  );
}

function App() {
  const fromHash = () => themes.find((item) => item.id === location.hash.slice(1))?.id ?? 'marketmaker';
  const [themeId, setThemeId] = createSignal(fromHash());
  const [previewMode, setPreviewMode] = createSignal<Mode>('dark');
  const [kind, setKind] = createSignal<Kind>('all');
  const [format, setFormat] = createSignal<Format>('css');
  const [sheetOpen, setSheetOpen] = createSignal(false);
  const [feedback, setFeedback] = createSignal('');
  const [light, setLight] = createSignal(false);
  const [stuck, setStuck] = createSignal(false);
  const [typed, setTyped] = createSignal('');
  let feedbackTimer = 0;

  const theme = createMemo(() => themes.find((item) => item.id === themeId()) ?? themes[0]);
  const shown = createMemo(() => themes.filter((item) => kind() === 'all' || item.kind === kind()));
  const palette = createMemo(() => theme()[previewMode()]);
  const code = createMemo(() => (format() === 'css' ? cssFile(theme()) : format() === 'json' ? themeJson(theme()) : tailwindConfig(theme())));
  const cssUrl = () => `${HOST}/css/${theme().id}.css`;

  createEffect(() => {
    if (!sheetOpen()) return;
    const previous = document.body.style.overflow;
    if (window.matchMedia('(max-width: 1000px)').matches) document.body.style.overflow = 'hidden';
    onCleanup(() => { document.body.style.overflow = previous; });
  });

  // Types the css file name in the hero when the selection changes.
  createEffect(() => {
    const target = `${themeId()}.css`;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setTyped(target); return; }
    let cancelled = false;
    onCleanup(() => { cancelled = true; });
    setTyped('');
    void (async () => {
      for (let i = 1; i <= target.length; i += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 45));
        if (cancelled) return;
        setTyped(target.slice(0, i));
      }
    })();
  });

  function pick(id: string, open = true) {
    setThemeId(id);
    setFeedback('');
    setSheetOpen(open);
    history.replaceState(null, '', `#${id}`);
  }

  function say(message: string) {
    setFeedback(message);
    window.clearTimeout(feedbackTimer);
    feedbackTimer = window.setTimeout(() => setFeedback(''), 2600);
  }

  async function copy(value: string, what: string) {
    try {
      await navigator.clipboard.writeText(value);
      say(`${what} copied`);
      return;
    } catch { /* fall back to the legacy path below */ }
    const area = document.createElement('textarea');
    area.value = value;
    area.setAttribute('readonly', '');
    area.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
    document.body.append(area);
    area.select();
    const done = document.execCommand('copy');
    area.remove();
    say(done ? `${what} copied` : 'Clipboard is blocked in this browser');
  }

  function toggleTheme() {
    const next = light() ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch { /* storage unavailable */ }
    setLight(next === 'light');
    setPreviewMode(next);
  }

  onMount(() => {
    const current = document.documentElement.dataset.theme === 'light';
    setLight(current);
    setPreviewMode(current ? 'light' : 'dark');
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setSheetOpen(false); };
    const onScroll = () => setStuck(window.scrollY > 8);
    const onHash = () => setThemeId(fromHash());
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('hashchange', onHash);
    onScroll();
    onCleanup(() => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('hashchange', onHash);
    });
  });

  const labels = ['bg', 'surface', 'accent', 'text'] as const;
  const kinds: [Kind, string][] = [['all', 'All'], ['exchange', 'Exchanges'], ['product', 'Products']];
  const formats: [Format, string][] = [['css', 'CSS'], ['json', 'JSON'], ['tailwind', 'Tailwind']];

  return (
    <>
      <a class="skip" href="#browse">Skip to themes</a>
      <header class="nav" data-stuck={stuck()}>
        <div class="wrap">
          <a class="brand" href="#top" aria-label="Themes home">
            <svg class="brand-logo" viewBox="0 0 32 32" aria-hidden="true">
              <rect x="3" y="3" width="12" height="12" rx="3.5" fill="none" stroke="currentColor" stroke-width="2" />
              <rect x="17" y="3" width="12" height="12" rx="3.5" fill="var(--accent)" />
              <rect x="3" y="17" width="12" height="12" rx="3.5" fill="currentColor" />
              <rect x="17" y="17" width="12" height="12" rx="3.5" fill="none" stroke="currentColor" stroke-width="2" />
            </svg>
            <span>themes<i>.marketmaker.cc</i></span>
          </a>
          <nav class="nav-links" aria-label="Primary">
            <a href="#browse">Browse</a>
            <a href="#use">Use</a>
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer">GitHub</a>
          </nav>
          <div class="nav-end">
            <button class="icon-btn" type="button" onClick={toggleTheme} aria-label={light() ? 'Switch to dark theme' : 'Switch to light theme'}>
              <Show when={light()} fallback={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4" /></svg>}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 14.4A8.5 8.5 0 0 1 9.6 3.5 8.5 8.5 0 1 0 20.5 14.4Z" /></svg>
              </Show>
            </button>
            <a class="btn btn--primary btn--sm" href={`${HOST}/index/themes.json`}>themes.json</a>
          </div>
        </div>
      </header>

      <main id="top">
        <section class="hero wrap" aria-labelledby="hero-title">
          <h1 id="hero-title" class="sr">Color themes for trading products</h1>
          <div class="hero-grid">
            <div class="hero-text">
              <p class="host mono" aria-hidden="true">themes.marketmaker.cc</p>
              <p class="path mono" aria-hidden="true"><span class="path-fixed">/css/</span><span class="path-slot">{typed()}</span><span class="caret" /></p>
              <p class="lede">Exchange and product palettes in one catalog. Preview each in light and dark, then copy the CSS variables, JSON or Tailwind config.</p>
              <div class="cta">
                <a class="btn btn--primary" href="#browse">Browse themes</a>
                <a class="btn btn--ghost" href={REPO_URL} target="_blank" rel="noopener noreferrer">View on GitHub</a>
              </div>
              <dl class="facts mono">
                <div><dt class="sr">Themes</dt><dd><b>{themes.length}</b> themes</dd></div>
                <div><dt class="sr">Modes</dt><dd>light + dark</dd></div>
                <div><dt class="sr">Tokens</dt><dd>bg, surface, accent, text</dd></div>
              </dl>
            </div>
            <div class="ribbon" aria-hidden="true">
              <For each={themes}>{(item) => (
                <button class="ribbon-row" type="button" tabIndex={-1} data-active={item.id === themeId()} onClick={() => pick(item.id, false)}>
                  <span class="ribbon-bars">
                    <For each={item.dark}>{(color) => <i style={{ background: color }} />}</For>
                  </span>
                  <span class="mono">{item.id}</span>
                </button>
              )}</For>
            </div>
          </div>
        </section>

        <section class="browse wrap" id="browse" aria-labelledby="browse-title">
          <div class="browse-head">
            <h2 id="browse-title">Browse</h2>
            <div class="tools">
              <div class="chips" role="group" aria-label="Theme type">
                <For each={kinds}>{([id, text]) => <button class="chip" type="button" aria-pressed={kind() === id} onClick={() => setKind(id)}>{text}</button>}</For>
              </div>
              <div class="chips" role="group" aria-label="Preview mode">
                <button class="chip" type="button" aria-pressed={previewMode() === 'light'} onClick={() => setPreviewMode('light')}>Light</button>
                <button class="chip" type="button" aria-pressed={previewMode() === 'dark'} onClick={() => setPreviewMode('dark')}>Dark</button>
              </div>
            </div>
          </div>
          <p class="count mono" role="status" aria-live="polite">{shown().length} of {themes.length} themes, {previewMode()} palette</p>

          <div class="layout">
            <ul class="cards">
              <For each={shown()}>{(item) => (
                <li>
                  <button class="card" type="button" aria-pressed={item.id === themeId()} onClick={() => pick(item.id)}>
                    <span class="mini" style={vars(item, previewMode())}>
                      <span class="mini-panel"><i /><i /></span>
                      <span class="mini-pill" />
                    </span>
                    <span class="card-meta">
                      <Mark theme={item} mode={previewMode()} size={28} />
                      <span class="card-text">
                        <b>{item.name}</b>
                        <span>{item.note}</span>
                      </span>
                    </span>
                  </button>
                </li>
              )}</For>
            </ul>

            <button class="backdrop" type="button" tabIndex={-1} aria-hidden="true" data-open={sheetOpen()} onClick={() => setSheetOpen(false)} />
            <aside class="stage" data-open={sheetOpen()} aria-label="Selected theme">
              <button class="icon-btn close" type="button" onClick={() => setSheetOpen(false)} aria-label="Close"><Svg d={ICON_CLOSE} /></button>
              <Terminal theme={theme()} mode={previewMode()} />
              <div class="stage-head">
                <h3>{theme().name}</h3>
                <p class="insp-meta mono">{theme().kind}, id {theme().id}{theme().logo ? `, logo ${theme().logo!.slug}` : ''}</p>
              </div>
              <div class="swatches">
                <For each={labels}>{(label, index) => (
                  <button class="swatch" type="button" onClick={() => void copy(palette()[index()], `${label} ${palette()[index()]}`)} title={`Copy ${palette()[index()]}`}>
                    <i style={{ background: palette()[index()] }} />
                    <span>{label}</span>
                    <b class="mono">{palette()[index()]}</b>
                  </button>
                )}</For>
              </div>
              <p class="ratios mono">
                text on bg {contrast(palette()[3], palette()[0]).toFixed(1)}:1, ink on accent {contrast(accentInk(palette()[2]), palette()[2]).toFixed(1)}:1
              </p>

              <div class="snip">
                <div class="chips" role="group" aria-label="Export format">
                  <For each={formats}>{([id, text]) => <button class="chip chip--sm" type="button" aria-pressed={format() === id} onClick={() => setFormat(id)}>{text}</button>}</For>
                </div>
                <div class="code">
                  <pre><code class="mono">{code()}</code></pre>
                  <button class="btn btn--ghost btn--sm" type="button" onClick={() => void copy(code(), format() === 'css' ? 'CSS variables' : format() === 'json' ? 'JSON' : 'Tailwind config')}><Svg d={ICON_COPY} />Copy {format() === 'css' ? 'CSS variables' : format() === 'json' ? 'JSON' : 'Tailwind config'}</button>
                </div>
                <div class="url-row">
                  <code class="mono">{cssUrl()}</code>
                  <button class="icon-btn" type="button" onClick={() => void copy(cssUrl(), 'URL')} aria-label="Copy CSS URL"><Svg d={ICON_COPY} /></button>
                </div>
              </div>
              <p class="insp-status" role="status" aria-live="polite">{feedback()}</p>
            </aside>
          </div>
        </section>

        <section class="use wrap" id="use" aria-labelledby="use-title">
          <div class="use-head">
            <h2 id="use-title">Use a theme in your app</h2>
            <p>Link a stylesheet, set two attributes on the root element, and every variable switches with them. Market green and red are not part of a theme, because exchanges keep them fixed.</p>
          </div>
          <ul class="paths">
            <li><code class="mono">themes.marketmaker.cc/css/<b>binance.css</b></code><p>Both modes of one theme. Set <span class="mono">data-theme="binance"</span> and <span class="mono">data-mode="dark"</span> on the root element.</p></li>
            <li><code class="mono">themes.marketmaker.cc/css/<b>all.css</b></code><p>Every theme in one file, for apps that let people switch.</p></li>
            <li><code class="mono">themes.marketmaker.cc/index/<b>themes.json</b></code><p>The full catalog with ids, notes, logos and palettes. Served with CORS for any origin.</p></li>
            <li><code class="mono">logos.marketmaker.cc/exchange-logos/<b>binance.jpg</b></code><p>Exchange logos come from the logos site, under the same slug as the theme. Do not copy them into your repo.</p></li>
          </ul>
        </section>
      </main>

      <footer class="foot wrap">
        <p>Exchange names and palettes belong to their owners and are shown only to identify the listed platforms.</p>
        <div><a href="https://marketmaker.cc" target="_blank" rel="noopener noreferrer">marketmaker.cc</a><a href="https://logos.marketmaker.cc" target="_blank" rel="noopener noreferrer">logos</a><a href={REPO_URL} target="_blank" rel="noopener noreferrer">GitHub</a></div>
      </footer>
    </>
  );
}

export default App;
