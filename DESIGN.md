---
name: Chen404 Frontend
description: "A personal editorial atlas with sakura warmth, readable product surfaces, and private travel memory tools."
colors:
  primary: "#fb7299"
  primary-light: "#ff85a7"
  primary-dark: "#e44d78"
  page-bg: "#f4f5f7"
  page-bg-warm: "#fff5f8"
  surface: "#ffffff"
  surface-soft: "#f7f7fa"
  surface-rose: "#fff1f6"
  surface-glass: "#ffffffb8"
  border: "#e3e5e7"
  border-rose: "#f3c7d7"
  text-strong: "#212121"
  text: "#565057"
  text-muted: "#8a7a84"
  profile-sakura: "#f59bbc"
  profile-mist: "#c7bdd9"
  atlas-ink: "#4e353e"
  atlas-route: "#d75f87"
  atlas-paper: "#fff8f2"
  album-amber: "#c98235"
  dark-page-bg: "#211d26"
  dark-surface: "#2b2431"
  dark-text-strong: "#f2ebf0"
  dark-text: "#c9bcc6"
typography:
  display:
    fontFamily: "\"Patrick Hand\", \"ZCOOL KuaiLe\", \"Segoe Print\", \"Bradley Hand\", cursive"
    fontSize: "clamp(3rem, 6vw, 5rem)"
    fontWeight: 400
    lineHeight: 1.04
    letterSpacing: "0"
  headline:
    fontFamily: "\"Microsoft YaHei UI\", \"PingFang SC\", \"Hiragino Sans GB\", \"Noto Sans CJK SC\", sans-serif"
    fontSize: "clamp(1.5rem, 2.5vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0"
  title:
    fontFamily: "\"Microsoft YaHei UI\", \"PingFang SC\", \"Hiragino Sans GB\", \"Noto Sans CJK SC\", sans-serif"
    fontSize: "1.25rem"
    fontWeight: 650
    lineHeight: 1.35
    letterSpacing: "0"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, \"Noto Sans\", sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.72
    letterSpacing: "0"
  label:
    fontFamily: "\"Microsoft YaHei UI\", \"PingFang SC\", \"Hiragino Sans GB\", \"Noto Sans CJK SC\", sans-serif"
    fontSize: "0.75rem"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "0.06em"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  xxl: "20px"
  feature: "24px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.pill}"
    padding: "0 18px"
    height: "38px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary-dark}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "36px"
  nav-pill:
    backgroundColor: "{colors.surface-glass}"
    textColor: "{colors.text}"
    rounded: "{rounded.pill}"
    padding: "8px 14px"
  card-standard:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-strong}"
    rounded: "{rounded.lg}"
    padding: "24px"
  card-feature:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-strong}"
    rounded: "{rounded.feature}"
    padding: "28px"
  search-input:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.text-strong}"
    rounded: "{rounded.pill}"
    padding: "0 18px"
    height: "44px"
---

# Design System: Chen404 Frontend

## 1. Overview

**Creative North Star: "The Sakura Editorial Atlas"**

Chen404 should feel like a personal editorial atlas: articles are arranged for reading, music is arranged for listening, guest messages are arranged like notes on a desk, and trusted travel memories are arranged like places in a private atlas. The product can be warm and slightly dreamy, but every page still needs a clear job.

The design language has four intensities:

- **Editorial public**: home, category, archive, article, tag, guestbook. Warm, readable, lightly expressive.
- **Companion product**: music. Tactile, musical, familiar, and state-driven.
- **Travel atlas**: memory map and travel detail. Public entries are explorable by everyone; friend-visible entries are more private, expressive, photo-led, map-aware, and structured.
- **Workbench**: editors, profile, admin. Quiet, dense, and task-shaped.

The current strongest surfaces are home and music. Home has a working editorial rhythm. Music has a product metaphor that supports the task. Category and archive are clear but ordinary, which is acceptable if they remain fast to scan. Guestbook needs a warmer message-desk pattern. Memory map and travel detail need the clearest correction: they must become a coherent private travel atlas rather than a mix of underwater hero, scrapbook spread, generic photo article, and oversized cards.

**Key Characteristics:**

- Sakura pink is the emotional accent, not the page wallpaper.
- Real content drives the layout: article titles, dates, category counts, lyrics, comments, map locations, and travel photos.
- Public heroes may be cinematic, but body sections must become precise quickly.
- Page-specific mood is allowed only when the information architecture stays clear.
- Familiar controls are mandatory. Personality should not reinvent buttons, maps, forms, players, or filters.

**The Dream-Then-Do Rule.** A route may open with atmosphere, but after the first viewport the UI must help the user read, choose, play, comment, browse, or edit.

**The One Universe Rule.** Different pages may have different intensity, but they must share typography discipline, radius scale, state vocabulary, and accent scarcity.

## 2. Colors

The palette is sakura warmth plus clean product neutrals, with a special atlas range for travel memory surfaces. It should feel personal and bright, not beige, neon, corporate, or underwater by default.

### Primary

- **Sakura Signal** (`{colors.primary}`): primary action, selected navigation, active state, small emphasis.
- **Blossom Lift** (`{colors.primary-light}`): hover brightness, soft gradients, warm highlights.
- **Petal Depth** (`{colors.primary-dark}`): stronger active states, focused links, destructive-adjacent warmth when pure red is too harsh.

### Secondary

- **Lavender Mist** (`{colors.profile-mist}`): cool counterpoint for profile, layered shells, and small balance moments. Use sparingly.

### Tertiary

- **Travel Rose** (`{colors.atlas-route}`): route lines, travel markers, itinerary indicators, map/detail connections.
- **Album Amber** (`{colors.album-amber}`): tiny photo-memory warmth for food, night street, and album metadata. Do not use it as a second primary action color.

### Neutral

- **Paper Field** (`{colors.page-bg}`): default page background for public and product surfaces.
- **Warm Page Field** (`{colors.page-bg-warm}`): private atlas and guestbook background wash.
- **Clean Paper** (`{colors.surface}`): cards, content panels, menus, forms.
- **Soft Control Fill** (`{colors.surface-soft}`): inputs, inactive chips, quiet toolbars.
- **Rose Wash** (`{colors.surface-rose}`): selected chips, soft message surfaces, travel note fragments.
- **Glass Veil** (`{colors.surface-glass}`): top nav and floating shells only.
- **Quiet Rule** (`{colors.border}`): normal divider and card border.
- **Rose Rule** (`{colors.border-rose}`): selected state or travel/guestbook accent border.
- **Ink** (`{colors.text-strong}`): primary text and titles.
- **Warm Graphite** (`{colors.text}`): body and standard UI text.
- **Muted Mauve** (`{colors.text-muted}`): metadata and helper text.
- **Atlas Ink** (`{colors.atlas-ink}`): travel memory headings and itinerary labels.
- **Atlas Paper** (`{colors.atlas-paper}`): private travel paper surfaces.

**The Accent Scarcity Rule.** Strong sakura fill belongs to primary actions, selected navigation, active filters, and travel route markers. If more than one major block on a viewport is saturated pink, reduce one.

**The Route Color Rule.** Route-specific moods may introduce supporting colors, but the body surface must still return to Chen404 paper, ink, and sakura. The travel map should not use a large underwater blue hero unless the selected journey is literally sea-related.

**The Contrast Rule.** Body text and form text must stay readable on tinted surfaces. Muted text on pink, glass, or photo overlays must be darkened until it is comfortably legible.

## 3. Typography

**Display Font:** `Patrick Hand`, with `ZCOOL KuaiLe`, `Segoe Print`, and `Bradley Hand` fallbacks.
**Body Font:** system sans stack with Chinese-friendly fallbacks.
**Label Font:** Chinese UI sans stack, not display handwriting.

**Character:** Typography has two voices: emotional route entrance and dependable product UI. The display voice is a signpost, not a general-purpose font.

### Hierarchy

- **Display** (`400`, `clamp(3rem, 6vw, 5rem)`, `1.04`): public hero titles and rare emotional marks only.
- **Headline** (`700`, `clamp(1.5rem, 2.5vw, 2.25rem)`, `1.2`): section heads, page panels, travel story headings.
- **Title** (`650`, `1.25rem`, `1.35`): article cards, category cards, music track titles, message author rows.
- **Body** (`400`, `0.9375rem`, `1.72`): article summaries, comments, travel notes, descriptions. Reading prose should stay around `65ch` to `75ch`.
- **Label** (`650`, `0.75rem`, `0.06em`): short metadata, section labels, status chips, compact controls.

**The Two-Voice Rule.** Handwritten display type is forbidden inside buttons, forms, tabs, data rows, map controls, music controls, admin pages, and editor workbenches.

**The No-Kicker Spam Rule.** Eyebrows such as `MEMORY MAP`, `TRAVEL DETAIL`, or `NOW PLAYING` are allowed when they identify a section. Do not put tiny tracked uppercase labels above every block.

**The Chinese Length Rule.** Every title, button, chip, and card must survive realistic Chinese strings. If the longest real word or title does not fit, reduce type size, change layout, or rewrite the component, not the content.

## 4. Elevation

Chen404 uses tonal layering, soft borders, photo depth, and restrained shadow. Depth should feel like paper and light, not heavy cards floating in a SaaS dashboard.

### Shadow Vocabulary

- **Quiet Lift** (`0 2px 8px rgba(0, 0, 0, 0.05)`): small cards, guestbook composer, light hover response.
- **Editorial Lift** (`0 14px 34px rgba(15, 23, 42, 0.08)`): article cards and route content that needs a readable sheet.
- **Rose Lift** (`0 16px 38px rgba(220, 138, 170, 0.09)`): travel, profile, and sakura-accented feature panels.
- **Hero Photo Lift** (`0 18px 42px rgba(74, 43, 55, 0.13)`): large photo hero surfaces. Use only when a real image carries the content.
- **Inset Paper Light** (`inset 0 1px 0 rgba(255, 255, 255, 0.72)`): glass/paper highlight layer for large shells.

**The Radius Budget Rule.** Standard cards use `12px`. Feature panels use `20px` to `24px`. Avoid `30px+` except for intentionally circular music/record elements or full pills. Over-rounding makes the system look generated.

**The No Ghost-Card Rule.** Do not pair a visible 1px border with a wide soft shadow on every card. Use a border for structure, or a shadow for lift, not both by reflex.

**The Map Attribution Rule.** Custom floating controls must never cover provider logos, copyright text, native map controls, player controls, or interaction hotspots.

## 5. Components

Components must be recognizable first and personal second. A user should understand the control before noticing the decoration.

### Implementation layers (how this doc maps to code)

Chen404 now has its own design system in code. This doc describes *intent*; the layers below are *where that intent lives*. Build new surfaces by composing these, not by styling raw library widgets.

- **Tokens — `src/design/` + `src/assets/styles/tokens.scss`.** Semantic CSS variables are the single source of visual truth: `--color-*` (accent / surface / border / text / state), `--radius-*` + `--radius-pill`, `--space-*`, `--font-size-*`, `--line-height-*`, `--motion-duration-*` / `--motion-ease-*`, `--z-*`, `--control-height-*`. The named colors, radii, and shadows in this doc are the *design rationale*; the CSS variables are their *runtime form*. Always reach for a token before a hardcoded value.
- **Motion — `src/design/motion.ts` + `src/assets/styles/motion.scss`.** Shared enter/leave transitions (`m-fade / m-raise / m-panel / m-list / m-drawer / m-press`) with reduced-motion handling. Use these named presets instead of per-component ad-hoc transitions.
- **UI primitives — `src/components/ui/` (`Ui*`).** Library-agnostic controls with a project-owned API: `UiButton`, `UiInput`, `UiTextarea`, `UiSelect`, `UiPanel`, `UiTabs`, `UiDialog`, `UiDrawer`, `UiBadge`, `UiTooltip`, `UiPagination`, `UiEmpty`, `UiTable`, `UiForm` / `UiFormField`, `UiAvatar`, `UiRadioGroup`, `UiSegmented`, `UiSwitch`, `UiCheckbox`, `UiSlider`, `UiUpload`, `UiDateField`, `UiNumberField`, `UiSkeleton`, `UiLoadingState`, `UiSearchBar`, `UiDropdown*`, `UiDivider`, and `UiIcon` (the single icon entry, fed by `design/icon-map.ts`).
- **App shells — `src/components/app/` (`App*`).** Brand-level compositions that carry Chen404's voice but stay cross-feature: `AppSection`, `AppActionBar`, `AppFilterBar`, `AppStatusPill`, `AppEmptyState`.
- **Feedback — `src/lib/feedback/`.** `notify.*` and `confirmAction()` / `confirmDelete()` / `confirmInput()` are the only message/confirm entry points.

**The Build-From-System Rule.** A new search box, card, filter, or panel should first be assembled from existing `Ui*` / `App*` + tokens. Create a new shared component only when a composition repeats or needs real semantic abstraction — never to re-skin an existing one. Element Plus still powers a few primitives internally, but it is a hidden dependency: business pages and components must not render `<el-*>`, use `v-loading`, or import `element-plus` directly. `npm run check:element-boundary` enforces this.

### PageHero

- **Role:** route entrance, not the whole page identity.
- **Image:** use route-relevant imagery. Home can be cinematic. Category/archive should be quieter. Music can show listening atmosphere. Travel map should show atlas, map paper, route, station, city, ticket, or real journey material, not unrelated underwater mood.
- **Transition:** the hero-to-content wave must visually attach to the next section. If the next section is a product workspace, use a shorter hero and faster handoff.
- **Copy:** one title, one useful subtitle, optional one-line metadata. No repeated emotional slogans.

### Navigation

- **Style:** floating translucent pill is a signature pattern.
- **State:** selected route uses sakura tint and clear text contrast.
- **Constraint:** navigation must not feel louder than the current page task.

### Buttons

- **Primary:** sakura fill or gradient, white text, `36px` to `40px` height, pill radius.
- **Secondary:** clean paper background, rose text or warm graphite, light border.
- **Icon buttons:** square or circular with stable dimensions. Use recognizable icons and tooltips when meaning is not obvious.
- **Danger:** use clear destructive color and label, not decorative pink.

### Cards / Containers

- **Article cards:** keep the current editorial image/text split. Preserve strong title hierarchy and metadata scanning.
- **Category cards:** simple topic tiles are enough. Improve empty states and icon/category hierarchy before adding more decoration.
- **Archive rows:** compact timeline rows should prioritize chronology and click targets. Do not turn archive into a card gallery.
- **Guestbook cards:** should feel like message notes on a desk. Composer, replies, like/reply/delete actions, and empty states need one shared material language.
- **Admin/workbench cards:** flatter, denser, and more predictable than public cards.

### Inputs / Fields

- **Style:** soft fill, clear border on focus, readable placeholder.
- **Validation:** error text must appear near the field and use plain language.
- **Guestbook composer:** avatar/name, textarea, emoji, counter, and submit action should form one coherent composer, not scattered controls.

### Chips / Filters / Tabs

- **Style:** pills with stable height and clear selected state.
- **Music filters:** status, category, card/list toggle, and playback mode must share one segmented-control vocabulary.
- **Category/tag chips:** avoid excessive color variation. Count and label hierarchy matter more than decoration.

### Sakura Radio

- **Role:** a warm listening room with product controls.
- **Preserve:** record metaphor, familiar playback controls, lyrics focus, track shelf.
- **Improve:** keep search, status filters, category cards, list/card toggle, and management actions visually related. Do not let every sub-area invent its own button style.
- **Ban:** nightclub black, neon equalizers, giant decorative controls, and hidden controls.

### Guestbook

- **Role:** message desk.
- **Composer:** should read as the first actionable surface, with clear author identity, text area, emoji, counter, and submit action.
- **Message list:** replies should nest visibly but softly. Like/reply/delete actions should be small, consistent, and keyboard reachable.
- **Tone:** warm and conversational, not admin-comment-table.

### Memory Map

- **Role:** public-to-private travel atlas.
- **Access state:** because `/memory-map` is a public entry, public locations should load without login. Empty public data must stay inside the normal map interface as an inline state; login and friend-application actions are optional nudges, not a full-page cover.
- **First viewport:** show route title, map, selected place preview, and primary browsing actions. The selected place preview must be visually tied to the map marker or route.
- **Material:** atlas paper, route ink, photo evidence, travel stamps used sparingly. Scrapbook details are accents, not structure.
- **Map:** reserve safe corners for zoom/reset/attribution. Custom controls must be grouped in a toolbar and visually subordinate to the map.
- **Index rail:** on desktop, place switching belongs in a left-side travel index rail. On smaller screens it may fall below the map, but it should not return as a second full card grid competing with the map/detail pair.
- **Owner action:** `新增旅游地点` is allowed but should sit as a clear secondary action, not the page's visual center.
- **Ban:** unrelated ocean/underwater hero, excessive tape/stamp/ring decoration, map and preview looking like two unrelated apps.

### Travel Detail

- **Role:** travel article with itinerary rail.
- **First viewport:** real photo hero, title, location/date, summary, and compact stats. The back action must be visible but quiet.
- **Body:** story fragments should alternate text, photo, and metadata with a readable rhythm. Avoid repeated full-width cards with the same internal structure.
- **Support rail:** location, mini map, album, fragment list, and previous/next navigation should appear as a coherent rail or responsive secondary zone, not as late scattered cards.
- **Photo treatment:** photos are content, not backgrounds only. Preserve aspect ratios and captions. Thumbnails should support navigation, not create visual noise.
- **Ban:** generic photo-blog layout, oversized blank cards, side information pushed below all story content on desktop, decorative stamps that compete with the actual place.

### Workbench / Admin

- **Role:** task completion.
- **Style:** calm, dense, consistent. Compose from the project's own `Ui*` primitives and `App*` shells; do not fall back to raw Element Plus visuals.
- **Motion:** state feedback only.
- **Ban:** cute stationery treatment, decorative display fonts, and large hero sections.

## 6. Do's and Don'ts

### Do:

- **Do** use Impeccable critique or browser screenshots before major frontend design decisions.
- **Do** preserve home and music as quality references: home for editorial rhythm, music for tactile product metaphor.
- **Do** keep archive compact and category simple unless the user problem requires a richer browsing model.
- **Do** make travel map an atlas: map, selected place, route, photos, and gallery should feel connected.
- **Do** make travel detail an itinerary article: photo hero, story fragments, support rail, album, map, and adjacent navigation.
- **Do** use sakura pink for primary actions, selected states, and small emotional emphasis.
- **Do** verify desktop and mobile with real Chinese content, actual photos, empty states, loading states, and long metadata.
- **Do** keep product controls familiar: standard buttons, segmented controls, sliders, text fields, tabs, and icon buttons.
- **Do** treat map attribution, media controls, focus rings, keyboard use, and readable contrast as design requirements.

### Don't:

- **Don't** use generic AI tool marketing: purple-blue gradients, neon accents, glass everywhere, glowing particles, cyan-on-black.
- **Don't** use SaaS landing-page cliches: hero metrics, repeated icon-card grids, fake productivity polish, decorative sparklines.
- **Don't** make every public page equally cinematic. Category and archive can be quieter than home.
- **Don't** make admin, editor, or management surfaces cute.
- **Don't** use scrapbook overload: tape, stamps, rings, torn paper, flowers, and texture all competing on the same viewport.
- **Don't** use unrelated hero imagery. Travel map should not look like an aquarium unless the route is actually about the sea.
- **Don't** use gradient text for headings or panel titles.
- **Don't** let every surface become a glass card.
- **Don't** rely on huge rounded corners, giant shadows, or pink badges to create hierarchy.
- **Don't** ship travel detail pages where supporting information arrives only after all story cards on desktop.
- **Don't** place floating controls over map provider attribution, player controls, text, or primary content.
