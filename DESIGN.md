---
name: Chen404 Frontend
description: "A personal editorial atlas with sakura warmth, readable product surfaces, and private travel memory tools."
colors:
  brand-sakura: "#fb7299"
  brand-sakura-light: "#ff85a7"
  brand-sakura-dark: "#e44d78"
  action-primary: "#b83264"
  action-solid: "#c83f6d"
  action-hover: "#a92d57"
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
  text-muted: "#766a72"
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
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "0"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, \"Noto Sans\", sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.68
    letterSpacing: "0"
  reading:
    fontFamily: "\"Noto Serif SC\", \"Source Han Serif SC\", \"Songti SC\", SimSun, serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.82
    letterSpacing: "0"
  label:
    fontFamily: "\"Microsoft YaHei UI\", \"PingFang SC\", \"Hiragino Sans GB\", \"Noto Sans CJK SC\", sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.06em"
rounded:
  sm: "4px"
  control-sm: "6px"
  md: "8px"
  control: "10px"
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
layout:
  page-max: "1200px"
  reading-shell: "980px"
  reading-content: "840px"
  reading-prose: "760px"
  form-focus: "920px"
  sidebar: "280px"
components:
  button-primary:
    backgroundColor: "{colors.action-solid}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "0 18px"
    height: "38px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.action-primary}"
    rounded: "{rounded.control}"
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

The design language has five surface modes:

- **Editorial public**: home, category, archive, article, tag, guestbook. Warm, readable, lightly expressive.
- **Companion product**: music. Tactile, musical, familiar, and state-driven.
- **Travel atlas**: memory map and travel detail. Public entries are explorable by everyone; friend-visible entries are more private, expressive, photo-led, map-aware, and structured.
- **Focused reader**: bookshelf and book reader. Quiet, typographic, progress-aware, and free from unrelated decoration.
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

### Brand

- **Sakura Signal** (`{colors.brand-sakura}`): identity, illustrations, route markers, decorative emphasis, and color moments that do not carry small white text.
- **Blossom Lift** (`{colors.brand-sakura-light}`): soft highlights and restrained atmospheric gradients.
- **Petal Depth** (`{colors.brand-sakura-dark}`): deeper brand material. It is not a substitute for verified interaction contrast.

### Interaction

- **Action Ink** (`{colors.action-primary}`): links, selected text, focus treatment, active tabs, and outlined controls on light surfaces.
- **Action Solid** (`{colors.action-solid}`): primary button and selected-control backgrounds when the foreground is white.
- **Action Hover** (`{colors.action-hover}`): hover and pressed treatment for solid actions.

Brand color and action color are related but not interchangeable. `#fb7299` remains the recognizable sakura color; it must not be used automatically for small link text or behind white button text.

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

**The Accent Scarcity Rule.** Strong sakura fill belongs to identity, small emotional emphasis, and route-specific marks. Use the darker action scale for controls. If more than one major block on a viewport is saturated pink, reduce one.

**The Route Color Rule.** Route-specific moods may introduce supporting colors, but the body surface must still return to Chen404 paper, ink, and sakura. The travel map should not use a large underwater blue hero unless the selected journey is literally sea-related.

**The Contrast Rule.** Normal text, links, placeholders, and button labels target at least `4.5:1`; large text and visible control boundaries target at least `3:1`. Muted text remains readable on tinted surfaces and may not fall below the normal-text target merely to look quiet. Photo text requires a tested safe zone, scrim, or solid backing.

## 3. Typography

**Display Font:** `Patrick Hand`, with `ZCOOL KuaiLe`, `Segoe Print`, and `Bradley Hand` fallbacks.
**Body Font:** system sans stack with Chinese-friendly fallbacks.
**Reading Font:** `Noto Serif SC`, `Source Han Serif SC`, or a Chinese Song fallback for the dedicated book reader only.
**Label Font:** Chinese UI sans stack, not display handwriting.

**Character:** Typography has two voices: emotional route entrance and dependable product UI. The display voice is a signpost, not a general-purpose font.

### Hierarchy

- **Display** (`400`, `clamp(3rem, 6vw, 5rem)`, `1.04`): public hero titles and rare emotional marks only.
- **Headline** (`700`, `clamp(1.5rem, 2.5vw, 2.25rem)`, `1.2`): section heads, page panels, travel story headings.
- **Title** (`600`, `1.25rem`, `1.35`): article cards, category cards, music track titles, message author rows.
- **Body** (`400`, `1rem`, `1.68`): summaries, comments, travel notes, descriptions, and standard product copy.
- **Reading** (`400`, `1.0625rem`, `1.82`): dedicated long-form reader prose. Article pages may keep the UI sans face while using the same measure and line-height discipline.
- **Label** (`600`, `0.75rem`, `1.2`): short metadata, section labels, status chips, compact controls. Letter spacing is optional for short Latin labels and should not be applied mechanically to Chinese.

Use real supported weights (`400 / 500 / 600 / 700`). Do not depend on interpolated `650` when the active Chinese fallback font does not provide it.

**The Prose Measure Rule.** Long Latin prose stays around `65ch` to `75ch`. Chinese reading should be visually checked around `34` to `45` full-width characters per line. CSS `ch` is not a reliable substitute for a Chinese screenshot.

**The Two-Voice Rule.** Handwritten display type is forbidden inside buttons, forms, tabs, data rows, map controls, music controls, admin pages, and editor workbenches.

**The No-Kicker Spam Rule.** Eyebrows such as `MEMORY MAP`, `TRAVEL DETAIL`, or `NOW PLAYING` are allowed when they identify a section. Do not put tiny tracked uppercase labels above every block.

**The Chinese Length Rule.** Every title, button, chip, and card must survive realistic Chinese strings. If the longest real word or title does not fit, reduce type size, change layout, or rewrite the component, not the content.

## 4. Layout

Layout uses nested width roles. A background canvas, page shell, content composition, and prose measure solve different problems and must not share one arbitrary `max-width`.

| Role | Runtime token | Desktop reference | Purpose |
| --- | --- | ---: | --- |
| Page canvas | full width | viewport | Background, atmosphere, full-bleed hero |
| Page shell | `--layout-page-max` | `1200px` | Home, category, archive, workbench composition |
| Reading shell | `--layout-reading-shell` | `980px` | Article or document surface inside the page |
| Reading content | `--layout-reading-content` | `840px` | Title, summary, media, code, table, navigation, comments |
| Reading prose | `--layout-reading-prose` | `760px` | Paragraphs, lists, headings, quotes |
| Focused form | `--layout-form-focus` | `920px` | Ordinary forms and settings |
| Sidebar | `--layout-sidebar` | `280px` | Workbench and supporting rail |

**The Canvas-Content-Prose Rule.** Never narrow the whole article to improve paragraph line length. Keep the title, summary, media, tags, adjacent navigation, and comments on the wider content measure; constrain continuous prose separately. Whole-page screenshots decide whether the content composition still fills its canvas naturally.

**The Media Width Rule.** Images, code blocks, tables, maps, and other evidence may use the reading-content width even when nearby paragraphs use the prose width. A feature may deliberately break wider only when the surrounding shell still owns overflow and alignment.

**The Route Width Rule.** Public browsing pages default to the page shell. Reading pages use reading shell plus content/prose nesting. Focused forms use the form width. Media editors and multi-column workbenches may use the full workbench width.

**Responsive contract.** Shared viewport breakpoints are `640px`, `768px`, `1024px`, and `1280px`. A component-specific breakpoint must represent a real content failure and stay local; prefer container queries for reusable components instead of inventing another viewport breakpoint.

## 5. Elevation

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

## 6. Components

Components must be recognizable first and personal second. A user should understand the control before noticing the decoration.

### Implementation layers (how this doc maps to code)

Chen404 now has its own design system in code. This doc describes *intent*; the layers below are *where that intent lives*. Build new surfaces by composing these, not by styling raw library widgets.

- **Tokens — `src/design/` + `src/assets/styles/tokens.scss`.** Semantic CSS variables are the single source of visual truth: `--color-brand-*`, `--color-action-*`, surface / border / text / state colors, `--layout-*`, `--font-family-*`, `--font-size-*`, `--line-height-*`, radius, spacing, shadow, motion, z-index, and control-height tokens. `variables.scss` contains compatibility aliases only. Always reach for a semantic token before a hardcoded value.
- **Motion — `src/design/motion.ts` + `src/assets/styles/motion.scss`.** Shared enter/leave transitions (`m-fade / m-raise / m-panel / m-list / m-drawer / m-press`) with reduced-motion handling. Use these named presets instead of per-component ad-hoc transitions.
- **UI primitives — `src/components/ui/` (`Ui*`).** Library-agnostic controls with a project-owned API: `UiButton`, `UiInput`, `UiTextarea`, `UiSelect`, `UiPanel`, `UiTabs`, `UiDialog`, `UiDrawer`, `UiBadge`, `UiTooltip`, `UiPagination`, `UiEmpty`, `UiTable`, `UiForm` / `UiFormField`, `UiAvatar`, `UiRadioGroup`, `UiSegmented`, `UiSwitch`, `UiCheckbox`, `UiSlider`, `UiUpload`, `UiDateField`, `UiNumberField`, `UiSkeleton`, `UiLoadingState`, `UiSearchBar`, `UiDropdown*`, `UiDivider`, and `UiIcon` (the single icon entry, fed by `design/icon-map.ts`).
- **App shells — `src/components/app/` (`App*`).** Brand-level compositions that carry Chen404's voice but stay cross-feature: `AppSection`, `AppActionBar`, `AppFilterBar`, `AppStatusPill`, `AppEmptyState`.
- **Feedback — `src/lib/feedback/`.** `notify.*` and `confirmAction()` / `confirmDelete()` / `confirmInput()` are the only message/confirm entry points.
- **Authentication feedback:** login, registration, verification-code, and password-reset failures must always produce one visible message while preserving the user's input. The request layer owns Axios transport and HTTP feedback; auth pages own generated-SDK business-envelope failures and must not silently catch them or duplicate the request-layer notification.
- **Legal documents:** user agreements and privacy policies should read like calm documents, not promotional cards. Use one short summary, a linear section flow, natural dividers, and a `65–75ch` prose measure. Keep section titles on the document column and indent their body copy one step to make the hierarchy explicit; avoid nested cards, decorative gradients, oversized headings, and custom scrollbars.

**The Build-From-System Rule.** A new search box, card, filter, or panel should first be assembled from existing `Ui*` / `App*` + tokens. Create a new shared component only when a composition repeats or needs real semantic abstraction, never to re-skin an existing one. Element Plus still powers a few primitives internally, but it is a hidden dependency: business pages and components must not render `<el-*>`, use `v-loading`, or import `element-plus` directly. `npm run check:element-boundary` enforces the library boundary; `npm run check:design-boundary` enforces the foundational visual contract.

### PageHero

- **Role:** route entrance, not the whole page identity.
- **Image:** use route-relevant imagery. Home can be cinematic. Category/archive should be quieter. Music can show listening atmosphere. Travel map should show atlas, map paper, route, station, city, ticket, or real journey material, not unrelated underwater mood.
- **Transition:** the hero-to-content wave must visually attach to the next section. If the next section is a product workspace, use a shorter hero and faster handoff.
- **Content clearance:** the wave may overlap imagery inside the hero, but it must not pull the following section into its fog or mask with a negative outer margin. Preserve at least `20px` of visible clearance between the hero boundary and the first heading, control, or card on desktop and mobile.
- **Copy:** one title, one useful subtitle, optional one-line metadata. No repeated emotional slogans.

### Navigation

- **Style:** floating translucent pill is a signature pattern.
- **State:** selected route uses sakura tint and clear text contrast.
- **Constraint:** navigation must not feel louder than the current page task.
- **Hierarchy:** when a concept groups multiple peer destinations, expose the parent in global navigation and keep each child as a standalone route. Do not repeat that cross-page choice as a selector inside page content.
- **Top-level scope:** keep frequent public destinations at the top level. Group secondary public destinations such as `留言板 / 关于本站` under `更多` on desktop, while mobile may expose their child links directly inside the navigation drawer.
- **Account tasks:** friend access requests and permission status belong inside the personal center under `好友与权限`, with an optional account-menu shortcut. Do not place this low-frequency authenticated task beside public content destinations. Keep legacy `/trust-request` links as redirects to `/profile?tab=trust`.

### Buttons

- **Primary:** solid action color, verified white text, `36px` to `40px` height, standard control radius. Use a pill only when the composition explicitly needs a compact signature CTA.
- **Secondary:** clean paper background, rose text or warm graphite, light border.
- **Icon buttons:** square or circular with stable dimensions. Use recognizable icons and tooltips when meaning is not obvious.
- **Danger:** use clear destructive color and label, not decorative pink.

### Cards / Containers

- **Article cards:** keep the current editorial image/text split. Preserve strong title hierarchy and metadata scanning.
- **Category cards:** simple topic tiles are enough. Improve empty states and icon/category hierarchy before adding more decoration.
- **Archive rows:** compact timeline rows should prioritize chronology and click targets. Do not turn archive into a card gallery.
- **Development-history summary:** project metrics and the contribution heatmap share one parent surface with a quiet internal divider; they should not appear as two consecutive cards separated by page background.
- **Development-history heatmap:** contribution cells scale with the available content width on desktop while remaining square. Keep a fixed minimum chart width and horizontal overflow on narrow screens; avoid fixed-size desktop charts that leave half the summary surface empty.
- **Development-history rows:** the month index is a period selector, not a scrollspy over every month concatenated into one page. Render one selected month at a time and let its records expand into the normal page flow on every viewport; do not add a nested scrollbar inside the record area.
- **Guestbook cards:** should feel like message notes on a desk. Composer, replies, like/reply/delete actions, and empty states need one shared material language.
- **Admin/workbench cards:** flatter, denser, and more predictable than public cards.

### Inputs / Fields

- **Style:** soft fill, clear border on focus, readable placeholder.
- **Validation:** error text must appear near the field and use plain language.
- **Contextual help:** stable, non-critical helper copy such as format limits or visibility consequences should use the shared information-icon tooltip immediately beside the relevant label, never beside the field control. Keep validation errors, upload progress, permission state, and other time-sensitive feedback directly visible. Tooltip triggers must be keyboard-focusable and carry a specific accessible label.
- **Boolean controls:** inside an existing form or settings surface, present a simple switch directly beneath or beside its label. Do not wrap each switch in another bordered, rounded, tinted container unless that container represents a real grouped setting.
- **Guestbook composer:** avatar/name, textarea, emoji, counter, and submit action should form one coherent composer, not scattered controls.

### Chips / Filters / Tabs

- **Style:** pills with stable height and clear selected state.
- **Filter toolbar order:** follow the left-to-right reading flow. Place filters first and search immediately after them; when search is the only control, keep it at the leading edge rather than pushing it to the far right. Let the row wrap before changing this order.
- **Filter toolbar sizing:** segmented filters, search fields, selects, and adjacent actions on the same toolbar must use the same control-height token and align on one vertical centerline.
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

### Lyra Companion

- **Compact identity:** show one `Lyra` badge in Sakura Signal (`var(--primary)`), without a second Lyra label or a `404` replacement mark.
- **Compact spacing:** keep the identity and tool actions in one centered group. Do not use `flex-grow` as a spacer between them; keep only a small deliberate group gap and trim unused outer width.
- **Touch targets:** visual density must not reduce mobile tool buttons below the established 44px touch target.

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

### Reader / Bookshelf

- **Bookshelf:** cover-first scanning with calm metadata, clear reading progress, and no cinematic hero competing with the library.
- **Reader:** the text is the primary surface. A Chinese serif reading face is allowed here even though product controls remain in the UI sans face.
- **Measure:** use the reading shell and prose measure; toolbars, progress, chapter navigation, and resume notices may use the wider content measure.
- **Focus:** hide unrelated floating companions and decorative motion while reading. Keep chapter navigation, theme, type size, progress, and exit controls familiar.
- **Ban:** handwritten body text, card-per-paragraph layouts, saturated page backgrounds, and toolbar chrome that competes with the book.

### Workbench / Admin

- **Role:** task completion.
- **Style:** calm, dense, consistent. Compose from the project's own `Ui*` primitives and `App*` shells; do not fall back to raw Element Plus visuals.
- **Personal creation hierarchy:** creation management belongs inside the personal center under one `我的创作` destination. Use peer tabs for `文章 / 旅行 / 音乐`; place the active tab's create action at the far right of the same tab bar and switch its label and route with the active content type. Do not duplicate a global `创作中心` entry in the header or account menu.
- **Personal access hierarchy:** friend application, review status, and current friend capability summary belong under one `好友与权限` personal-center destination. Admin review remains an administration task and must not add an applicant-facing header entry.
- **Personal-center canvas:** keep the route-level personal-center wrapper transparent so the shared site background remains continuous. A constrained wrapper must not paint an exposed rectangular backdrop around or above its content cards.
- **Personal interaction lists:** liked and favorite article cards should use the available personal-center content width and align with the panel header. Apply this as a page-context override while preserving the reusable compact card's default width for genuinely narrow feeds.
- **Creation permissions:** a user may keep historical records after losing a create capability. Preserve those records in read-only form, hide create/edit actions, and explain the current limitation without treating the history as an error.
- **Creation toolbar copy:** tabs, filters, records, and the primary create button already communicate the workflow. Do not add helper sentences that merely repeat “manage, continue editing, or create”; remove them instead of moving them into a tooltip.
- **Creation search:** place status filters and search in one compact, transparent row directly below the content tabs. Article, travel, and music views all provide search in the same position, using fields appropriate to each content type; do not wrap the row in a broad gray background.
- **Creation pagination:** personal article management uses 5 records per page. Travel and music management use 10 records per page and paginate the filtered result, returning to page 1 whenever a new search is applied.
- **Compatibility:** legacy `/studio` links may redirect to `/profile?tab=creations`; they must not create a second navigation concept or a second workbench layout.
- **Settings actions:** every configuration tab uses the shared bottom-right settings footer for reset, test/sync, and save commands. Headers carry identity and status only; never duplicate save actions at the top or inside a sub-pane.
- **Settings structure:** use whitespace, alignment, and at most one quiet group surface before adding dividers. Do not place borders around the outer panel, every section, every status cell, and the footer at the same time.
- **Settings color:** quiet does not mean grayscale. In light admin screens, avoid broad neutral-gray and charcoal work surfaces; use restrained rose, lavender, blue, and mint tints to distinguish operational summaries and setting modes while keeping primary actions pink.
- **Settings rhythm:** keep 24-32px between a feature heading, its status summary, and the editable form or sub-tabs. Use 24px between stacked form fields and related setting groups. Summary metrics need their own breathing room instead of forming one dense strip directly under the title.
- **Settings measure:** do not stretch ordinary text inputs and prose-like textareas across the full admin canvas. Keep focused forms near 880-960px, broader two-column or media work areas near 1120-1200px, and collapse them to the available width on smaller screens.
- **Media settings:** let uploaded images carry the color. Use clean surfaces, cool-lilac hairlines, and quiet elevation for cover or asset editors; do not wash the entire editor card in brand pink when the media is already visually saturated.
- **Settings copy:** helper text explains a consequence, constraint, or unfamiliar term. Remove subtitles and chips that only restate the heading or field label.
- **Technical settings:** translate implementation terms into operational labels and attach concise info tooltips to numeric limits, durations, and timeout fields.
- **Workbench focus:** hide floating companion widgets on admin routes so they cannot cover navigation, forms, or actions.
- **Motion:** state feedback only.
- **Ban:** cute stationery treatment, decorative display fonts, and large hero sections.

## 7. Do's and Don'ts

### Do:

- **Do** use Impeccable critique or browser screenshots before major frontend design decisions.
- **Do** preserve home and music as quality references: home for editorial rhythm, music for tactile product metaphor.
- **Do** keep archive compact and category simple unless the user problem requires a richer browsing model.
- **Do** make travel map an atlas: map, selected place, route, photos, and gallery should feel connected.
- **Do** make travel detail an itinerary article: photo hero, story fragments, support rail, album, map, and adjacent navigation.
- **Do** keep sakura pink for brand identity and use the verified action scale for links, focus states, and white-text controls.
- **Do** separate page canvas, reading content, and prose measure on long-form pages.
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
- **Don't** use the decorative brand pink automatically for small text or behind white button labels.
- **Don't** narrow titles, summaries, media, navigation, and comments merely to shorten paragraph lines.
- **Don't** ship travel detail pages where supporting information arrives only after all story cards on desktop.
- **Don't** place floating controls over map provider attribution, player controls, text, or primary content.
