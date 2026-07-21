---
target: 旅行地图三栏工作台
total_score: 34
p0_count: 0
p1_count: 0
timestamp: 2026-07-17T16-17-22Z
slug: src-views-memorymap-memorymap-vue
---
# Memory Map layout critique

## Design health

The page has a coherent atlas palette and a strong map-led structure, but the first implementation compressed too many fixed-width elements into the timeline rail and allowed the reader image to dominate the first viewport. The corrected version now has a clear three-column hierarchy, shared panel top edge, consistent reader inset, and a readable media proportion.

## Anti-patterns verdict

The initial state showed generated-dashboard symptoms: several independently styled header bands, a crowded rail with date/cover/status/title competing for width, and an oversized content image. The deterministic detector found no rule violations, confirming that the defect was visual composition rather than a syntactic anti-pattern. Browser measurement was therefore the decisive signal.

## Priority issues addressed

- **P1 Timeline compression:** the 310px panel had only 120px for its content and 82px for the active title after the status badge. Date and status now share a metadata line, while title width is 164px at wide desktop and 134px at 1440px.
- **P1 Reader media dominance:** the lead image measured 883×497px. Reader content is now capped at 800px and the lead image at 800×375px on wide desktop, with responsive fallback at narrower widths.
- **P1 Alignment drift:** timeline and map headers previously measured 116px and 61px. They now measure 60px and 61px, and reader header, summary, tabs, story, gallery heading, and media use the same inset.
- **P2 Responsive structure:** verified three columns at 1440px (280 / 440 / remaining space) and the intended two-column collapse at 1280px.

## Evidence

- Chrome wide desktop: 1920×989 viewport, all panels start at y=184; no console warnings or errors.
- Chrome mid desktop: 1440×900 viewport; timeline titles remain readable and reader media scales to 580×272px.
- Deterministic scan: zero findings.
- Element boundary and production build: passed.
