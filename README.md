# Petrova Crisis — MOSAIC 2026

Single-page event site. Next.js (App Router) + TypeScript, **no Tailwind** — every
section owns a hand-written CSS file next to its component.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build, exported to out/
npm run typecheck  # tsc --noEmit
```

The build is a static export (`output: "export"` in `next.config.mjs`), so there is
no `next start`: serve the exported folder instead, e.g.
`cd out && python -m http.server 3123` (or `npx serve out`).

> If you preview this inside an embedded/webview panel and the page never
> hydrates, or scrolling and screenshots appear frozen, that panel is blocking
> the dev server's HMR WebSocket and stalling the frame pipeline. Serving the
> production export hydrates correctly there, and `npm run dev` works normally in
> a regular browser. The panel does break one thing permanently: smooth scrolling
> and the HUD cursor both run on animation frames, so both detect the stall and
> step aside (see **Smooth scrolling** below) — judge scroll feel in a real
> browser.

## Structure

```
app/
  layout.tsx                    app shell: fonts, tokens, intro gate + overlay
  page.tsx                      stacks the sections
  globals.css                   tokens + reset (shared, not a utility library)
styles/
  fonts.css                     @font-face declarations
  sections.css                  shared section/UI primitives (.section, .eyebrow,
                                .label, .stat, .btn, .hud-control, .reveal)
components/
  Preloader/
    Preloader.tsx / .css        intro film overlay
    PreloaderGate.tsx           pre-paint script that skips the intro for
                  reduced-motion visitors
  SectionBackdrop/              shared scenic background + overlay
  SectionHeading/               shared numbered heading block
  Hero/
    Hero.tsx / .css             section shell + the debris playfield
    BackgroundLayer/            hero background image
    HeroTitle/                  "PETROVA CRISIS"
    LogoMark/                   single event logo mark
    FloatingDebris/             drifting asteroid PNGs
      debris.config.ts          rock list: size, start, direction, speed, spin
      useDebrisPhysics.ts       the bounce engine
    HeroRegister/               [ REGISTER ] HUD control → #register
    ScrollCue/                  bottom-centre pulse → #about
  About/                        About Mosaic          (#about)      01
  Ignition/                     (not rendered — kept for reference, see below)
  OurTheme/                     Our Theme             (#theme)      02
  EventDetails/                 Mission Dossier       (#details)    03
  Register/                     Register              (#register)   04
  Footer/                       contact + socials     (#contact)
  Cursor/                       HUD reticle cursor
  SmoothScroll/                 Lenis layer + snap assist
hooks/
  useReducedMotion.ts
  useSiteReady.ts               fonts + background image + window load
lib/
  assets.ts                     every asset path in one place
  event.ts                      every event fact and every piece of copy
  intro.ts                      intro timing constants
public/assets/                  all binary assets, referenced by path
```

Adding a section = a new folder under `components/` with a `.tsx` and a matching
`.css`, then one line in `app/page.tsx`.

## Design system

Dark mode only. Every section sits on a scenic space photograph with a gradient
overlay between image and text.

| Token | Value | Role |
| --- | --- | --- |
| `--bg` | `#05060a` | page base, letterbox fill, card surfaces |
| `--crimson` | `#c8203c` | post-crisis primary — CTAs, key numbers, active states |
| `--ember` | `#d97b3f` | constant secondary accent |
| `--signal` | `#8fb8d9` | pre-crisis accent (Hero, About Mosaic only) |
| `--text` | `#eee9e2` | headings and body copy |
| `--text-muted` | `#9aa4b2` | meta text, labels, timestamps |
| `--hairline-calm` | `rgba(255,255,255,.08)` | pre-crisis borders |
| `--hairline-crisis` | `rgba(200,32,60,.25)` | post-crisis borders |

Browser chrome follows the same palette, from `globals.css`: text selection is
`--crimson` with white text (the same pairing as `.btn--primary`), and the page
scrollbar is a `--crimson` thumb on a `--bg-sunken` track, brightening to
`#e0264a` on hover. Scrollbars are coloured with `scrollbar-color` for Firefox
and current Chromium plus `-webkit-scrollbar` pseudo-elements for older
WebKit/Blink; their width is deliberately left at the platform default so the
layout gutters stay as measured.

### The two-phase palette

The phase is a **section-scoped token override**, not a per-component decision.
`.section--crisis` in `globals.css` re-points `--accent`, `--accent-glow`,
`--accent-tint`, `--hairline` and `--overlay`, and every shared primitive and
section stylesheet reads those variables. So the story beat — calm briefing, then
"the crisis has begun" — is one class on the section:

```
Hero            pre-crisis
About Mosaic    pre-crisis        .section           01
Our Theme       post-crisis       .section--crisis    02
Mission Dossier post-crisis       .section--crisis    03
Register        post-crisis       .section--crisis    04
Footer          post-crisis       .section--crisis
```

The Ignition Sequence used to turn the palette crimson mid-pin. It is no longer
rendered, so the crisis palette now starts at Our Theme (02).

### Typography

- **Headings, labels, HUD chrome, buttons** → `--font-display`: `"Cindie Mono"`,
  then the self-hosted stand-in, then a system monospace stack.
- **Descriptions and body copy** → `--font-body`: Space Grotesk, then a system
  sans stack.

### Motion

Every duration and curve lives in `globals.css` as a token, so hover states,
entrances and the cursor all move at one tempo instead of each section inventing
its own timing:

| Token | Value | Role |
| --- | --- | --- |
| `--dur-quick` | `180ms` | hovers, colour and border shifts |
| `--dur-base` | `420ms` | entrances, reticle state changes |
| `--ease-out-quint` | `cubic-bezier(.22,1,.36,1)` | the default curve |
| `--ease-in-out` | `cubic-bezier(.65,0,.35,1)` | symmetrical moves |
| `--stagger` | `60ms` | the beat between sibling entrances |

The one transition deliberately not tokenised is the intro fade in
`Preloader.css`: it is a contract with `INTRO_FADE_MS` in `lib/intro.ts`.

#### Section reveals

`.reveal` uses a CSS scroll-driven timeline (`animation-timeline: view()`), guarded
by `@supports` and `prefers-reduced-motion: no-preference`. No JavaScript, and
browsers without support simply render the content — nothing is ever hidden by
script that failed to load. It comes in three flavours, so not everything on the
page moves the same way — but every one of them travels the same direction,
**left to right**. Nothing is revealed top to bottom: a vertical wipe slices
glyphs in half as it passes them, which reads as broken type rather than as an
entrance.

- **`.reveal`** — fade plus a short 24px slide in from the left. Prose blocks:
  `about__copy`, `about__credits`, `our-theme__outro`, the register closing and
  CTA, the footer line.
- **`.reveal--mask`** — a smooth `clip-path: inset(0 100% 0 0)` sweep from the
  left. Headings.
- **`.reveal--print`** — the same sweep in discrete steps (`steps(16, end)`),
  which reads like a printer head. Gets its stagger from one custom property per
  child (`--print-step`, set by `:nth-child`), which shifts each child's whole
  `animation-range`, so the row above is always finished before the row below
  starts. Used by the transmission log, the dossier rows and the entry-fee facts.

Deliberately *not* a character typewriter: that needs `white-space: nowrap`, which
would break the wrapping rules the mobile layout depends on.

#### Crisis signal noise

`.section--crisis::after` lays a faint monochrome grain over the post-crisis
sections and rides that section's own view timeline from 3% to 7% opacity — the
transmission degrades as it is read. It is opacity-only (one composited layer, no
repaint), inlined as an SVG turbulence filter so there is no extra request, and it
never intercepts input.

#### Hero entrance

The hero's four elements come in behind the intro film on a stagger: title →
logo → register control → scroll cue, `--stagger` apart. The hidden state is
scoped to `html[data-preloader="playing"]`, so the content is **visible by
default** — with no JS, with reduced motion (the gate marks those visitors
`skip`), or if the film errors, the hero simply renders. The title animates its
wrapper because the glitch animation owns the element's own `transform`.

#### HUD reticle cursor

`components/Cursor/` draws four corner brackets that trail the pointer and close
in over anything clickable. It is drawn *next to* the native cursor, never
instead of it — there is no `cursor: none` in the project — so it cannot leave
anyone without a pointer. `pointer: coarse` and `prefers-reduced-motion` hide it
outright, and nothing is attached until one animation frame proves the page is
painting (see below).

### Full-screen sections and sticky backdrops

Every regular content section (About Mosaic, Our Theme, Mission Dossier, Register)
is at least one viewport tall and vertically centres its content, so the page
reads as a run of full-screen scenes. The Hero keeps its own shell and the Footer
keeps its content-driven height; `styles/sections.css` scopes both rules with
`.section:not(.site-footer)`. `min-height` — never a fixed height — so a section
still grows when its copy needs the room.

The backdrop is the same component everywhere, with two behaviours:

- **Regular sections** — `position: sticky; top: 0; height: 100svh`, pinned for as
  long as its own section is on screen. The image holds still while the content
  scrolls over it, and the next section's backdrop replaces it exactly at the
  section boundary. Negative block margins take the stage out of the flow (a
  section's padding is unchanged) and negative inline margins cancel the gutter,
  so it still bleeds edge to edge. Section-local, so it never drifts out of sync
  the way a fixed background would. See `SectionBackdrop.css`.
- **Footer** — the original absolute fill.

Both are pure CSS. No scroll listeners, and deliberately no
`background-attachment: fixed`.

`body` therefore uses `overflow-x: clip` (with `overflow-x: hidden` left in place
as a fallback), because `hidden` would turn the body into a scroll container and
break the sticky backdrops. The preloader's temporary `overflow: hidden` on `html`
and `body` is untouched.

## Smooth scrolling

`components/SmoothScroll/` mounts Lenis as a wheel/trackpad affordance only.
Touch devices keep native inertia (`syncTouch: false`), keyboard and scrollbar
scrolling are untouched, and nothing is smoothed for reduced-motion visitors.

Three numbers control the feel, at the top of `SmoothScroll.tsx`:

| Knob | Value | Symptom it fixes |
| --- | --- | --- |
| `LERP` | `0.14` | slow scrolling feeling laggy — a proportional follow closes 14% of the gap each frame and can never overshoot. Lenis's own default is `0.1`. **`duration` is deliberately never set**: Lenis prefers it over `lerp`, and its `1.2s` easing tail is what makes slow scrolling feel sticky. |
| `WHEEL_MULTIPLIER` | `0.85` | fast flicks flying past the section you meant to read — a flick now travels ~15% less than the raw wheel delta. |
| `SNAP_THRESHOLD` | `12%` | it "helpfully" correcting while you read. When a gesture ends within 12% of a section boundary, a proportional snap closes the gap; stop mid-scene and nothing moves. Cast a wider net or set `USE_SNAP_ASSIST` to `false`. |

The boundary assist is the `lenis/snap` plugin, not CSS `scroll-snap-type`: the
browser's snap engine and Lenis's own writes both claim the scroll position, so
native snapping fights the smoothing. Touch never routes through it either —
Lenis emits `virtual-scroll` for touch events *before* deciding not to smooth
them, so the wheel-only `virtualScroll` gate keeps the snap plugin from reacting
to finger flicks.

Anchor links glide through Lenis with `offset: -72`, mirroring `.section`'s
`scroll-margin-top: 4.5rem`, so the fixed mobile register pill never covers a
heading. `autoToggle` parks Lenis while the intro film holds the viewport with
`overflow: hidden` on `html`, and lets it go when the film hands over.

### When there are no frames

Smoothing runs on `requestAnimationFrame`. A page that is not painting cannot be
smoothed — Lenis would swallow wheel input and never move, which looks exactly
like a frozen site. Two guards prevent that, and both prefer native scrolling
over a page that ignores you:

- **Startup probe** — if no animation frame arrives within 600ms, smoothing is
  dropped and the browser scrolls normally. It retries up to five times, 1.5s
  apart, because embedded panels often stall only for the first moments.
- **Wheel watchdog** — for a stall that starts *later*, a wheel that produces no
  movement at all within 320ms means the frames died mid-session, so smoothing is
  dropped on the spot and the next wheel scrolls natively. Every case that can
  legitimately leave the page still is excluded (already at the top or bottom,
  a horizontal-only trackpad gesture, zoom, the intro film, sub-pixel deltas), so
  it cannot misfire on a healthy browser.

The HUD cursor uses the same idea: nothing is attached until a frame proves the
page is painting, so it can never appear as a stale reticle stuck in the corner.

## Swapping assets

Everything is referenced by path from `lib/assets.ts`, so replacing artwork means
overwriting the file in `public/assets/`. Nothing is inlined or bundled.

| File | Used for | Notes |
| --- | --- | --- |
| `public/assets/herobackground.jpeg` | hero + crisis-section scenery | `object-fit: cover` |
| `public/assets/greenadrian.webp` | calm-section scenery | `object-fit: cover` |
| `public/assets/redadrian.webp` | crisis-section scenery | `object-fit: cover` |
| `public/assets/planetadrian.png` | Ignition planet (transparent PNG) | intrinsic ratio, never stretched; unrendered |
| `public/assets/astronaut.png` | Ignition astronaut silhouette | transparent PNG; unrendered |
| `public/assets/rocky.png` | floating debris | see `ROCK_SOURCE_CONTENT` |
| `public/assets/logos/mosaic-logo.png` | the single logo mark | **placeholder** |
| `public/assets/video/preloader.webm` | intro film | **placeholder**, VP9, silent |
| `public/assets/fonts/SpaceMono-*.woff2` | heading stand-in | OFL, self-hosted |
| `public/assets/fonts/SpaceGrotesk-*.woff` | body/description | OFL, self-hosted |
| `public/assets/fonts/CindieMono.woff2` | the event typeface | **not included** |

Only a handful of scenic photographs exist, so the sections alternate them with
different `object-position` values and overlays. Drop more images into
`public/assets/` and point a section at one to break the repetition.

### Still to drop in

1. **Cindie Mono by Lewis McGuffie** — the typeface this design is set in, and a
  *commercial* release (sold via East of Rome / FutureFonts; the designer sends
  trial cuts on request). It is deliberately not vendored here. If it is
  installed on the device, every heading switches over automatically;
  otherwise the bundled Space Mono stand-in is used.
2. **The logo mark** — `public/assets/logos/mosaic-logo.png` currently holds a
   generated placeholder.
3. **The intro film** — `public/assets/video/preloader.webm` is a generated 4.5s
   VP9 placeholder. If the file is missing the preloader steps
   aside rather than trapping anyone.
4. **Real event details** — every bracketed value and all the lore copy lives in
   `lib/event.ts`. The dossier, the register facts, the footer contact block and
   the theme log all read from it, so filling in the real details is one file.

## How the hero behaves

- **Intro film** covers the viewport from the very first paint while the hero
  loads underneath. It fades out once the film has ended *and* the hero is ready;
  if the hero is slower it holds on the last frame. Skippable by click, button or
  `Esc`, played on every page load, skipped entirely for reduced motion, and
  capped at 15s so it can never trap anyone.
- **Film framing** is `object-fit: cover` in *both* orientations, so the screen
  always sits fully inside the film and the footage is never stretched. On
  portrait screens the film is rotated a quarter turn and its box takes the
  swapped viewport dimensions; rotated back, that box is exactly the screen.
  `cover` there crops only the mismatch between the film's aspect ratio (1.979)
  and the screen's — about 9% of the film's height, centred, on a 390x844 phone.
  `contain` would letterbox the rotated box into black bars at the top and bottom
  of the screen, which is why it is not used.
- **Background** uses `object-fit: cover`.
- **Debris** drifts slowly and tumbles, turning away from the hero's four walls
  and from every `data-debris-obstacle` inside it — currently the title, the logo
  and the register control. Bounces ease into the new heading instead of snapping.
  Movement is transform-only, the loop pauses when the hero is off-screen, the
  rock count drops to two below 40rem for mobile GPU budget, and reduced motion
  freezes the rocks in place rather than removing them.

## The Ignition Sequence (not rendered)

The component and its assets still live in the repo, but the section was removed
from `app/page.tsx`: the page is now Hero → About Mosaic (01) → Our Theme (02) →
Mission Dossier (03) → Register (04) → Footer. Nothing imports `components/Ignition`,
so it is not part of the build output; restoring it means one import and one
element in `app/page.tsx`, plus renumbering the sections after it.

If it is ever brought back, this is how it behaves:

- **Pinned scroll scene**, 300vh track with a sticky 100svh stage. A single
  scroll-driven animation (`animation-timeline: view()`, `cover 25% → 75%` — the
  exact pin window) animates registered `--ign-*` custom properties, so one
  scroll-progress value drives every layer and the scene reverses exactly when
  you scroll back up. No JavaScript, no timers, no per-scroll style writes.
- **Four phases by progress**: entrance 0→0.30 (planet descends, astronaut
  rises, planet lags for parallax), hold 0.30→0.60 (rotation, bob, red glow
  ramps in), ignition 0.60→0.85 (particle bloom + crimson veil + both PNGs tint
  red together), handoff 0.85→1 (whole composition cross-dissolves out as Our
  Theme fades in beneath).
- **Never stretched**: each image gets exactly one dimension
  (`height: min(...)`), width follows the intrinsic ratio.
- **Fallback**: without `animation-timeline` support, or under
  `prefers-reduced-motion`, the section renders the final composed frame —
  planet + astronaut + light red tint — at auto height, no motion.

## Deliberately not included

- **GSAP ScrollTrigger / ogl / dotlottie.** Still unused. Section reveals and
  the pinned Ignition scene need no scroll engine: native `position: sticky`
  plus a CSS scroll-driven timeline covers both, so those dependencies have
  never earned their weight. (They are still in `package.json` — either spend
  them or drop them.)
- **Phosphor Icons.** The footer needs three marks, so they are inline SVG in
  `components/Footer/Icons.tsx` — no dependency, and they render in a
  server component. Swap in Phosphor when the site needs a wider icon set.
- **`object-fit: contain` on section backgrounds.** The spec for the new sections
  asks for letterboxed `contain`, but the hero was explicitly moved to `cover`;
  the sections follow the hero so the page reads as one continuous space. Each
  backdrop is a single `object-fit` declaration if you want to switch back.
