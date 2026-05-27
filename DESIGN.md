---
name: Chen404 Frontend
description: "A sakura-tinted personal blog and companion workspace with soft editorial warmth."
colors:
  primary: "#fb7299"
  primary-light: "#ff85a7"
  primary-dark: "#e44d78"
  primary-hover: "#ff9eb3"
  page-bg: "#f4f5f7"
  surface: "#ffffff"
  surface-soft: "#f5f5f5"
  surface-glass: "#ffffffb8"
  surface-glass-strong: "#ffffffd6"
  border: "#e3e5e7"
  border-light: "#f1f2f3"
  text-strong: "#212121"
  text: "#666666"
  text-muted: "#999999"
  profile-sakura: "#f59bbc"
  profile-mist: "#c7bdd9"
  memory-ink: "#4e353e"
  memory-accent: "#ef88ab"
  dark-page-bg: "#211d26"
  dark-surface: "#2b2431"
  dark-surface-elevated: "#352d3d"
  dark-text-strong: "#f2ebf0"
  dark-text: "#c9bcc6"
  dark-text-muted: "#9b8d99"
typography:
  display:
    fontFamily: "\"Patrick Hand\", \"ZCOOL KuaiLe\", \"Segoe Print\", \"Bradley Hand\", cursive"
    fontSize: "clamp(2.9rem, 6.5vw, 5.15rem)"
    fontWeight: 400
    lineHeight: 1.02
    letterSpacing: "0.01em"
  headline:
    fontFamily: "\"Microsoft YaHei UI\", \"PingFang SC\", \"Hiragino Sans GB\", \"Noto Sans CJK SC\", sans-serif"
    fontSize: "clamp(1.5rem, 2.7vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.18
    letterSpacing: "0.01em"
  title:
    fontFamily: "\"Microsoft YaHei UI\", \"PingFang SC\", \"Hiragino Sans GB\", \"Noto Sans CJK SC\", sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.01em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, \"Noto Sans\", sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.72
    letterSpacing: "0.02em"
  label:
    fontFamily: "\"Microsoft YaHei UI\", \"PingFang SC\", \"Hiragino Sans GB\", \"Noto Sans CJK SC\", sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.12em"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  xxl: "24px"
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
    padding: "0 16px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.primary-light}"
    textColor: "{colors.surface}"
    rounded: "{rounded.pill}"
    height: "36px"
  nav-pill:
    backgroundColor: "{colors.surface-glass}"
    textColor: "{colors.text}"
    rounded: "{rounded.pill}"
    padding: "8px 14px"
  card-glass:
    backgroundColor: "{colors.surface-glass-strong}"
    textColor: "{colors.text-strong}"
    rounded: "{rounded.xxl}"
    padding: "24px"
  search-input:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.text-strong}"
    rounded: "{rounded.pill}"
    padding: "0 18px"
    height: "44px"
---

# Design System: Chen404 Frontend

## 1. Overview

**Creative North Star: "The Sakura Memory Journal"**

This interface should feel like a personal notebook that drifted into the browser, not a generic content platform. The public-facing experience is soft, airy, and a little dreamy: sakura-tinted light, hand-touched hero typography, translucent surfaces, scrapbook details, and generous breathing room. It should invite lingering, reading, and wandering. It is emotional, but never sugary. It is delicate, but never weak.

The authenticated product surfaces are a controlled contrast to that softness. Admin, profile, and management screens still belong to the same world, but the decorative layer quiets down so the user can finish tasks quickly. The rule is not "two unrelated styles." The rule is one emotional universe with three intensity levels: public storytelling, personal workspace, and operational control.

This system explicitly rejects generic AI-generated frontend aesthetics, especially purple-blue gradients, cyan-on-black techno mood, overused SaaS card stacks, dashboard noise, and visual gimmicks that do not deepen the journal-like atmosphere. It also rejects overly corporate utility UI that forgets this is a personal site with a clear owner voice.

**Key Characteristics:**
- Soft sakura pink is the leading emotional accent, not an everywhere color wash.
- Surfaces feel layered through mist, paper, light, and blur, not through heavy shadow or dense chrome.
- The homepage and memory-map pages may be expressive and cinematic.
- Profile and admin pages must stay calmer, denser, and more task-shaped.
- Typography mixes handwritten display moments with dependable reading and UI text.

## 2. Colors

The palette is built around warm neutrals, sakura pink accents, and a small amount of lavender mist. It should feel like spring light diffused through paper, glass, and memory.

### Primary
- **Sakura Signal** (`{colors.primary}`, `#fb7299`): the main action color. Use it for primary buttons, active navigation, focused links, highlighted icons, and small moments of emphasis that need emotional warmth.
- **Blossom Lift** (`{colors.primary-light}`, `#ff85a7`): the lighter edge of the accent gradient. Use it for button gradients, hero highlights, and hover brightness where the base primary would feel too dense.
- **Petal Depth** (`{colors.primary-dark}`, `#e44d78`): the committed accent edge for hover text, selected states, and moments that need slightly more authority without becoming harsh.

### Secondary
- **Lavender Mist** (`{colors.profile-mist}`, `#c7bdd9`): the supporting cool note. Use sparingly in profile and layered glass surfaces to keep the system from becoming monochrome pink.

### Tertiary
- **Memory Rose** (`{colors.profile-sakura}`, `#f59bbc`): the softer personal-space accent. This belongs especially in profile and scrapbook-like surfaces where the interface should feel intimate rather than promotional.
- **Travel Bloom** (`{colors.memory-accent}`, `#ef88ab`): the brighter travel accent used in the memory map, stamps, map highlights, and journal ornaments.

### Neutral
- **Paper Mist** (`{colors.page-bg}`, `#f4f5f7`): the default page field. This is the canvas behind most light-theme surfaces.
- **Clean Paper** (`{colors.surface}`, `#ffffff`): the core resting surface for cards, editors, menus, and content blocks.
- **Soft Wash** (`{colors.surface-soft}`, `#f5f5f5`): a quiet fill for inputs, chips, and low-emphasis panels.
- **Glass Veil** (`{colors.surface-glass}`, `#ffffffb8`): the lighter translucent layer for floating nav and action shells.
- **Glass Bloom** (`{colors.surface-glass-strong}`, `#ffffffd6`): the stronger translucent layer for hero-adjacent cards and premium-feeling panels.
- **Quiet Rule** (`{colors.border}`, `#e3e5e7`): the default border and separator neutral.
- **Soft Rule** (`{colors.border-light}`, `#f1f2f3`): the almost-disappearing border used for internal softness and subtle segmentation.
- **Ink** (`{colors.text-strong}`, `#212121`): the strongest reading color for titles and critical body text.
- **Warm Graphite** (`{colors.text}`, `#666666`): the default body and supporting interface text.
- **Faded Note** (`{colors.text-muted}`, `#999999`): metadata, tertiary labels, and quiet helper copy.
- **Night Petal** (`{colors.dark-page-bg}`, `#211d26`): the dark-theme page field.
- **Night Surface** (`{colors.dark-surface}`, `#2b2431`): the default dark surface.
- **Night Glass** (`{colors.dark-surface-elevated}`, `#352d3d`): the elevated dark surface for panels and stronger modules.
- **Moon Ink** (`{colors.dark-text-strong}`, `#f2ebf0`): the highest-priority text in dark theme.
- **Moon Copy** (`{colors.dark-text}`, `#c9bcc6`): body text in dark theme.
- **Moon Whisper** (`{colors.dark-text-muted}`, `#9b8d99`): tertiary copy in dark theme.

**The Accent Scarcity Rule.** Sakura pink must read like a voice, not wallpaper. On any standard product screen, keep strong accent usage to key interactive elements and select emphasis moments only.

**The Warm Neutral Rule.** Neutrals are never pure white or pure black. Every surface should feel lightly tinted toward rose, mauve, or warm grey, even when that tint is barely perceptible.

## 3. Typography

**Display Font:** `Patrick Hand` with `ZCOOL KuaiLe`, `Segoe Print`, and `Bradley Hand` fallbacks  
**Body Font:** `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`  
**Label/Mono Font:** UI Chinese sans stack built around `"Microsoft YaHei UI"`, `"PingFang SC"`, `"Hiragino Sans GB"`, and `"Noto Sans CJK SC"`

**Character:** Typography should split clearly between expression and utility. Public heroes may feel handwritten, soft, and a little theatrical. Everything interactive, editable, or information-dense must return to clean, legible UI typography immediately.

### Hierarchy
- **Display** (`400`, `clamp(2.9rem, 6.5vw, 5.15rem)`, `1.02`): reserved for hero headlines and rare emotional moments. It may feel handwritten or whimsical, but only at the top of the page.
- **Headline** (`700`, `clamp(1.5rem, 2.7vw, 2.5rem)`, `1.18`): used for page section titles, profile headings, memory-map titles, and primary panel headers.
- **Title** (`600`, `1.25rem`, `1.4`): used for article cards, component-level titles, and navigable content modules.
- **Body** (`400`, `0.9375rem`, `1.72`): default reading copy. Long-form content should stay within roughly `65ch` to `75ch` where layout allows.
- **Label** (`600`, `0.75rem`, `1.2`, `0.12em`): eyebrows, pills, overlines, compact metadata, and structured UI labels.

**The Two-Voice Rule.** Handwritten display typography is allowed only for atmosphere-setting surfaces. Buttons, form labels, nav items, admin UI, and dense content controls must stay in clean sans text.

**The No-Cute-UI Rule.** Do not let the decorative display voice leak into operational UI. The moment a settings screen or admin tool starts looking like stationery, it has gone too far.

## 4. Elevation

Depth in this system is a hybrid of soft shadow, translucent layering, and atmospheric gradients. Surfaces should feel lifted by light, not by weight. Most cards rely on pale borders, diffuse shadow, and blur to separate from the page. Dark mode deepens atmosphere rather than increasing contrast harshly.

### Shadow Vocabulary
- **Ambient Float** (`0 2px 8px rgba(0, 0, 0, 0.05)`): the light default lift for cards and small floating modules.
- **Soft Lift** (`0 4px 16px rgba(0, 0, 0, 0.08)`): the standard hover or mid-level panel elevation.
- **Hero Lift** (`0 8px 24px rgba(0, 0, 0, 0.12)`): reserved for larger hero surfaces, stronger overlay cards, and components that need visual anchoring.
- **Rose Atmosphere** (`0 10px 22px rgba(245, 155, 188, 0.08)` to `0 16px 34px rgba(245, 155, 188, 0.16)`): the colored shadow family used for profile, article, and sakura-accented interactive states.
- **Paper Glow** (`inset 0 1px 0 rgba(255, 255, 255, 0.72)` and related): the internal highlight layer that keeps glass and paper surfaces feeling light rather than muddy.

**The Float-Not-Weight Rule.** Elevation should suggest air and paper. If a component looks heavy, muddy, or metallic, the shadow is too dark or too dense.

**The Glass Discipline Rule.** Glass is permitted because it is already part of the project language, but only on key framing surfaces: top navigation, major panels, profile shells, hero-adjacent modules, and selected travel/journal elements. Do not default every card to blur.

## 5. Components

Components should preserve the same world while adjusting intensity by surface type: expressive on public story pages, restrained in personal workspace, calmest in admin.

### Buttons
- **Shape:** always pill-like or very soft (`36px` to `44px` height, `{rounded.pill}` / `999px` radius) unless the component is explicitly scrapbook-like.
- **Primary:** sakura gradient or solid sakura fill (`#fb7299` to `#ff85a7`) with white text. Primary buttons should feel buoyant and friendly, never corporate-flat.
- **Hover / Focus:** small upward lift, brighter fill, or stronger rose shadow. Focus must remain visible and precise.
- **Secondary / Ghost:** white or translucent backgrounds with rose-tinted borders and rose text. They should feel airy, not outlined and severe.

### Chips
- **Style:** rounded pills with pale fills, muted text, and minimal borders.
- **State:** selected chips may shift into stronger pink or warm white-pink fills. Unselected chips stay quiet and paper-like.

### Cards / Containers
- **Corner Style:** soft and generous. Standard content cards live around `16px` to `24px`. Premium or immersive panels can go to `30px` plus.
- **Background:** warm white, misted white, or translucent white-pink blends. Cards should feel like paper sheets, glass petals, or scrapbook tiles.
- **Shadow Strategy:** diffuse, never hard-edged. Prefer dual-layer ambient shadow plus a faint internal highlight.
- **Border:** extremely soft border treatment. Borders should separate, not announce themselves.
- **Internal Padding:** comfortable and asymmetric when needed. Use `24px` as a common anchor, then vary around it for rhythm.

### Inputs / Fields
- **Style:** rounded, soft, and lightly inset into the interface. Search inputs can sit on pale fills like `#f7f8fb`; form fields can adopt slightly stronger shells in profile and settings.
- **Focus:** use rose-tinted focus rings or border shifts. Focus should feel warm and intentional, not browser-default harsh.
- **Error / Disabled:** preserve softness. Error states should use rose-red warmth, not alarming pure red unless the situation is truly destructive.

### Navigation
- **Style:** floating nav pills and action shells are a signature pattern in the public UI. They may use translucent surfaces, blur, and fine inner highlights.
- **Active state:** use sakura tint, pale rose fills, and modest shadow instead of thick underline systems.
- **Mobile treatment:** the mobile nav may become a right-side sheet, but it should remain within the same warm, translucent material family.

### Hero
- **Role:** every major public route may open with a cinematic hero. This is where the handwritten voice, sakura wave transitions, and emotional subtitle rhythm live.
- **Image treatment:** backgrounds are softened and lightly desaturated so text remains calm and readable.
- **Motion:** the hero may hint downward movement and pulse subtitle text, but the motion must feel like invitation, not spectacle.

### Journal / Memory Components
- **Style:** scrapbook and travel-memory components are allowed to be more tactile than the rest of the app. Tape corners, stamps, flower marks, and layered paper fields are legitimate here.
- **Constraint:** even in this expressive area, everything still needs good hierarchy and clear actions. Memory-themed decoration must never obscure content structure.

### Admin Workspace
- **Style:** admin panels should inherit the color system and rounding, but they must reduce decorative noise. Fewer gradients, less blur, flatter structure.
- **Constraint:** task flow outranks atmosphere. Admin is still part of the brand universe, but it is not a mood board.

## 6. Do's and Don'ts

### Do:
- **Do** keep the public-facing UI emotionally warm, light, and slightly dreamy, especially on home, about, and memory-map surfaces.
- **Do** separate expressive display moments from operational UI moments. Public heroes may be handwritten; control surfaces must not be.
- **Do** use sakura pink as the main emotional accent and reserve it for primary actions, active states, and deliberate emphasis.
- **Do** keep surfaces lightly tinted and softly layered with pale borders, misty gradients, and restrained blur.
- **Do** allow profile and memory-map pages to have their own sub-moods while clearly remaining inside the same core palette and rounding system.
- **Do** keep motion gentle and purposeful: hover lift, subtitle pulse, subtle reveal, scroll invitation.
- **Do** preserve strong readable body text and consistent Chinese UI typography in all task-oriented views.
- **Do** treat dark mode as moonlit sakura, not as a separate neon product.

### Don't:
- **Don't** drift into generic AI tool marketing. No dark mode with purple gradients, neon accents, glassmorphism everywhere, glowing particles, or cyan-on-black techno styling.
- **Don't** drift into SaaS landing-page cliches. No hero-metric layouts, identical-card feature grids, sparkline decoration, or fake productivity-dashboard polish.
- **Don't** use gradient text for headings or panel titles in new work. Existing uses should be treated as exceptions to phase out, not a pattern to repeat.
- **Don't** let every surface become a glass card. Blur is a special material here, not the default answer to layout.
- **Don't** use hard black, stark white, or blue-grey enterprise neutrals that break the warm journal atmosphere.
- **Don't** make admin screens cute. They can be soft, but they must stay decisive, legible, and efficient.
- **Don't** use thick colored side borders, loud decorative stripes, or obvious template ornaments to fake hierarchy.
- **Don't** reuse the same card proportions, padding, and accent treatment everywhere. Rhythm matters.
