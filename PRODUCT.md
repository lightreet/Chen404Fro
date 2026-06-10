# Product

## Register

product

## Product Purpose

Chen404 is a personal blog frontend that combines public reading, private memory keeping, light community interaction, companion listening, and owner-side content operations.

It should feel authored by a real person with taste and memory. The public side invites reading, wandering, listening, and leaving a note. The private side preserves trusted travel memories. The owner side stays practical enough for writing, editing, reviewing, uploading, and configuring.

The product is not a generic blog shell. It is a small personal world with usable tools inside it.

## Users

- **Public readers** browse articles, categories, archives, music, guestbook, about, and public profiles.
- **Trusted friends** can access more intimate surfaces such as the travel memory map and travel details.
- **The site owner** writes articles, edits travel memories, manages music, handles trust requests, uploads files, tunes AI settings, and curates the site.

## Experience Model

Chen404 has one emotional universe, but every surface needs a different intensity.

| Surface | Routes | Product job | Design intensity | Quality target |
| --- | --- | --- | --- | --- |
| Editorial reading | `/`, `/category`, `/category/:id`, `/archive`, `/article/:id`, `/tag`, `/tag/:id` | Help readers find and read content | Balanced to expressive | Clear hierarchy, calm article rhythm, enough personality to feel owned |
| Social note | `/guestbook` | Let visitors leave a short message and read others | Balanced | Warm, legible, conversational, not a plain form dump |
| Companion listening | `/music` | Let readers browse and play Sakura Radio | Expressive product UI | Tactile, musical, familiar controls, no nightclub or dashboard mood |
| Private travel atlas | `/memory-map`, `/memory-map/detail/:id` | Let trusted friends browse places, routes, photos, and memories | Expressive but structured | Travel atlas first, scrapbook second, clear map/detail relationship |
| Personal workspace | `/profile`, `/trust-request` | Let users manage identity and request status | Calm | Task-shaped, readable, emotionally soft but not decorative |
| Owner workbench | editors and `/admin` | Let the owner create and maintain content | Quiet and efficient | Fast scanning, stable actions, consistent controls |

## Current Product Surface

- Public reading: home, article detail, archive, category, tag, guestbook, about, public user page.
- Trust layer: trust request flow, friend-only memory map access, profile-side request status.
- Owner workbench: article editor, travel memory editor, music track editor, admin tabs for categories, site config, AI assistant, emojis, files, and trust requests.
- Companion layer: Live2D Lyra chat, SSE answers, article citations, related article suggestions, Sakura Radio mini-player.
- Sakura Radio: public music room, playlists, lyrics, shared player state, admin song and playlist maintenance, AI song metadata suggestions.

## Page Experience Assessment

This section is a product-level design brief for future UI work.

### Home

The homepage currently has the strongest public-reading rhythm: a cinematic hero, a clear article feed, and article cards that feel more personal than generic. Preserve the broad structure.

Improve by making the transition from hero to article list less dependent on decorative wave effects and by keeping the article feed readable before adding more atmosphere.

### Category

The category page is clear but ordinary. Its product job is browsing by topic, so it should remain simple. It can gain a little more editorial character through icon treatment, count hierarchy, and empty category states, not through heavier cards.

### Archive

The archive is a utility reading surface. It should feel like a timeline ledger: compact, chronological, and easy to scan. It should not become cinematic or heavily decorated.

### Music Hall

The music page is one of the better product surfaces. The record/player metaphor supports the task, the controls are familiar, and the shelf/workbench structure gives the page a real product job. Preserve its tactile warmth and compact player control language.

Future work should reduce repeated decorative shells, keep controls consistent, and make list/table switching feel like one system.

### Guestbook

The guestbook should feel like a small message desk, not only a comment form. The current page is usable but visually plainer than the rest of the public world.

Improve the form/message relationship: the composer, message list, reply state, and moderation affordances should share one conversational material system.

### Travel Memory Map

The travel map now has the right product skeleton: a public access cover, a travel index rail, a real map surface with graceful fallback, and a selected-place detail panel. The remaining weakness is not missing structure, but inconsistent tone between the locked state, the live map surface, and the paper-like detail materials.

The target is **private travel atlas**, not aquarium, not SaaS map dashboard, not decorative notebook page. The map page should feel like opening a personal atlas on a desk: map, selected place, route, photo evidence, and gallery all belonging to the same physical scene.

The `新增旅游地点` entry is acceptable because it supports the owner workflow. Preserve that workflow, but keep it visually subordinate to the browsing experience.

### Travel Memory Detail

The travel detail page now has the right itinerary/article split: photo hero, fragment list, support rail, mini map, album, and adjacent navigation are coordinated. The remaining work is mostly rhythm and density, not missing information architecture.

The target is **travel article with itinerary rail**: photo-led hero, location/date context, story fragments, compact album, map, and previous/next navigation should feel coordinated. Side information should support reading, not arrive as a late pile of cards.

## Brand Personality

Warm, personal, softly crafted, and precise.

The site should feel like a real person made it with taste and care, not like a generic template blog or a cloned SaaS dashboard. It should be expressive without becoming noisy, gentle without becoming childish, and emotional without becoming vague.

Three-word personality: **warm, dreamy, precise**.

The refined rule: **dreamy at the entrance, precise at the task.**

## Product Principles

1. **One universe, multiple intensities.** Public storytelling, personal travel memories, companion listening, and owner operations belong to the same product, but they should not all carry the same decorative load.
2. **Experience before ornament.** A design is better only when it improves orientation, hierarchy, readability, task completion, or emotional fit.
3. **Real content is the design material.** Article titles, Chinese copy, photos, music metadata, comments, map locations, and empty states must look composed with actual data.
4. **Personal over platform-like.** The site should feel authored, remembered, and owned.
5. **Familiar controls, personal atmosphere.** Buttons, forms, players, maps, filters, and navigation should be recognizable first. Personality lives in spacing, materials, copy, imagery, and moments of delight.
6. **Surface-specific composition.** Home can be cinematic, archive should be compact, music can be tactile, map should be atlas-like, admin should be calm.
7. **Evidence beats intent.** If screenshots show overlap, weak hierarchy, poor contrast, or mismatched mood, the design doc must change or the UI must change.

## Anti-References

- **Generic AI tool marketing**: dark mode with purple gradients, neon accents, glassmorphism overload, glowing particles, cyan-on-black.
- **SaaS landing-page cliches**: hero metrics, repeated icon-card grids, fake productivity polish, decorative sparkline mood.
- **Over-corporate dashboards**: cold enterprise neutrals, harsh data-table mood, no owner voice.
- **Cute-but-chaotic anime UI**: excessive stickers, clutter, novelty typography in controls, decorative noise that harms usability.
- **One-style-fits-all pages**: treating homepage, memory map, profile, guestbook, archive, and admin as if they should all have identical visual intensity.
- **Scrapbook overload**: tape, stamps, flowers, paper texture, rings, and torn edges competing with actual photos, maps, and text.
- **Mismatched hero imagery**: atmospheric backgrounds that do not match the route's product job, such as an underwater travel-map hero when the surface needs an atlas/travel desk.
- **Generic photo-blog travel detail**: huge image hero plus repeated full-width cards without itinerary structure, map context, or compact navigation.

## Current Gaps

- Travel memory map now has the correct atlas scaffolding, but the locked-state cover, the real map surface, and the selected-detail paper still need a tighter shared material language.
- Travel memory detail now has the correct support rail structure, but the reading rhythm, media density, and desktop/mobile transitions still need refinement.
- Guestbook needs a more coherent message-desk pattern for composer, message cards, replies, and moderation actions.
- Archive should remain compact and utility-led while still fitting Chen404's material language.
- Sakura Radio has strong foundations, but playlist deletion, listening history, favorites, comments, play counts, and system media controls are still missing.
- File management surfaces expose statistics and references, but cleanup policies and batch maintenance are not yet a full product workflow.
- Generated OpenAPI SDK exists, while business pages still use hand-written API modules.
- Automated frontend testing is still thin compared with the number of interactive surfaces.

## Accessibility & Inclusion

- All core interaction paths should be keyboard usable with visible focus states.
- Text contrast must remain readable in both light and dark themes, especially on pink-tinted or translucent surfaces.
- Motion should respect reduced-motion preferences. Product surfaces should use motion for state and feedback before decoration.
- Decorative layers must never block reading, clicking, scrolling, map attribution, media controls, or task completion.
- Public and admin surfaces should both remain usable on mobile, not merely visually compressed.
- Chinese copy must be tested with realistic lengths. Buttons, cards, tabs, map labels, music metadata, and comment actions must not rely on short placeholder text.
