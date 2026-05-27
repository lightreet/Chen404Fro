# Product

## Register

product

## Users

Readers who browse a personal blog with a strong owner voice, trusted friends who can access more intimate content like the memory map, and the site owner who writes, curates, configures, and manages the whole experience through the same frontend.

## Product Purpose

Chen404 is a personal blog frontend that combines public reading, private memory-keeping, light community interaction, and owner-side content operations. It must feel personal and memorable on the public side, while still being practical and efficient when the owner is writing articles, managing files, tuning AI settings, or handling requests.

## Current Product Surface

- Public reading: home, article detail, archive, category, tag, guestbook, about, public user page.
- Trust layer: trust request flow, friend-only memory map access, profile-side request status.
- Owner workbench: article editor, travel memory editor, music track editor, admin tabs for categories, site config, AI assistant, emojis, files, and trust requests.
- Companion layer: Live2D Lyra chat, SSE answers, article citations, related article suggestions, Sakura Radio mini-player.
- Sakura Radio: public music room, playlists, lyrics, shared player state, admin song and playlist maintenance, AI song metadata suggestions.

## Brand Personality

Warm, personal, softly crafted. The product should feel like a real person made it with taste and care, not like a generic template blog or a cloned SaaS dashboard. It should be expressive without becoming noisy, and gentle without becoming childish.

Three-word personality: **warm, dreamy, precise**.

## Anti-references

- **Generic AI tool marketing**: dark mode with purple gradients, neon accents, glassmorphism overload, glowing particles, cyan-on-black.
- **SaaS landing-page cliches**: hero metrics, card grids repeated with icon + title + copy, fake productivity polish.
- **Over-corporate dashboards**: cold enterprise neutrals, harsh data-table mood, no emotional tone.
- **Cute-but-chaotic anime UI**: excessive stickers, clutter, novelty typography in controls, decorative noise that harms usability.
- **One-style-fits-all pages**: treating homepage, memory map, profile, and admin as if they should all have identical visual intensity.

## Design Principles

1. **One universe, multiple intensities.** Public storytelling, personal workspace, and admin operations belong to the same system, but they should not all carry the same decorative load.
2. **Emotion serves clarity.** Atmosphere is part of the product, but content comprehension and task completion always win.
3. **Soft, not vague.** Rounded, warm, and airy does not mean weak hierarchy or muddy interfaces.
4. **Personal over platform-like.** The site should feel authored, remembered, and owned.
5. **Consistency through materials.** Color, softness, radius, text rhythm, and motion should unify the experience more than repeated layouts do.

## Current Gaps

- Search is still local/page-level; the AI `webSearchEnabled` switch is a reserved option, not real web search.
- Sakura Radio has the core listening and admin workflow, but not playlist deletion, listening history, favorites, comments, play counts, or system media controls.
- File management surfaces expose statistics and references, but cleanup policies and batch maintenance are not yet a full product workflow.
- Generated OpenAPI SDK exists, while business pages still use hand-written API modules.
- The visual cover system is now unified, but every new hero background still needs screenshot checks on desktop and mobile so the wave transition remains attached.
- Automated frontend testing is still thin compared with the number of interactive surfaces.

## Accessibility & Inclusion

- All core interaction paths should be keyboard usable with visible focus states.
- Text contrast should remain readable in both light and dark themes, especially on pink-tinted or translucent surfaces.
- Motion should stay subtle and should respect reduced-motion preferences when expanded later.
- Decorative layers must never block reading, clicking, or task completion.
- Public and admin surfaces should both remain usable on mobile, not merely visually compressed.
