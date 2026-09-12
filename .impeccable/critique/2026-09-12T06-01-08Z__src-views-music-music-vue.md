---
timestamp: 2026-09-12T06-01-08Z
slug: src-views-music-music-vue
---
---
target: src/views/Music/Music.vue
scope: desktop player surface
assessment: sequential
---

# Desktop music player refinement

The user's screenshot and a fresh browser inspection agree: the player combined a pink/lavender outer gradient, an inset pseudo-element frame, an opaque tab header with a divider, a separate lyric gradient, and a tinted scrollbar track. The two-column composition, record graphic, and lyric/queue controls remain appropriate. The requested change is to reduce these structural layers.

Resolved: one theme surface and one outside border; no inset frame or header divider; transparent lyric/queue surfaces and scroll track. Text, selected states, and controls now use semantic theme colors. The selected lyric retains emphasis, and keyboard focus remains visible.

Evidence: before/after computed-style snapshots and screenshots in temp/frontend/2026-09-12-music-panel. Tested lyrics and queue in light/dark themes, 1920px and 1280px desktop viewports, and the separate 413px mobile route branch.

Detector: 3 existing findings in Music.vue (two layout-property transitions and one category sidebar border). These concern the spectrum/category area rather than the reported layered player background. No detector overlay server was started. Source/visual assessment was recorded before detector output; assessments were sequential in this focused implementation task.
