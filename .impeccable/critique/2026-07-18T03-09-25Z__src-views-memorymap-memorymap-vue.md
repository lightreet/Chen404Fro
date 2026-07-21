---
target: src/views/MemoryMap/MemoryMap.vue reader
total_score: 28
p0_count: 0
p1_count: 0
timestamp: 2026-07-18T03-09-25Z
slug: src-views-memorymap-memorymap-vue
---
## Design Health Score

| Heuristic | Score | Key issue |
| --- | ---: | --- |
| Visibility of system status | 3 | Current travel and fragment are visible. |
| Match with the real world | 4 | Place, date, segments, and photos follow a natural reading order. |
| User control and freedom | 3 | Travel and fragment navigation remain visible. |
| Consistency and standards | 3 | Metadata alignment needed normalization across the header and fragment. |
| Error prevention | 3 | Existing disabled navigation states prevent invalid movement. |
| Recognition rather than recall | 4 | Segment labels and photo counts are visible. |
| Flexibility and efficiency | 2 | No keyboard shortcut is exposed for segment switching. |
| Aesthetic and minimalist design | 2 | The reader used mismatched text baselines and an overly distant album count. |
| Error recovery | 3 | Existing inline retry treatment is clear. |
| Help and documentation | 1 | No contextual help is needed for the core browsing task, but none is present. |
| **Total** | **28/40** | Good foundation, targeted typography and spacing polish required. |

## Anti-Patterns Verdict

The travel reader is structurally sound and avoids dashboard-heavy decoration. Its main defect was mechanical rather than conceptual: the same metadata appeared with different line metrics and ordering, while tab children were aligned on baselines instead of a shared center line. This made a compact reading surface look improvised.

The detector reported no findings for `TravelMemoryReader.vue`. Browser overlay injection was not attempted because the available Chrome evaluation surface is read-only; screenshot and layout-metric inspection were used instead.

## Priority Issues

- **P2 Metadata rhythm:** location/date used different vertical metrics in the trip header and selected fragment. Use one 20px metadata line and retain location before date.
- **P2 Segment-tab alignment:** the sequence number, title, and photo count were baseline-aligned despite mixed font sizes. Center them vertically and give each child an explicit line height.
- **P2 Album count grouping:** a short photo count sat at the far edge of a wide reader. Keep it adjacent to the album heading so the label is perceived as one unit.

## Resolution

The reader now uses shared metadata items, centered segment tabs, consistent location/date order, and a grouped album count. Browser verification confirmed 20px metadata rows, equal tab heights with center alignment, and a clean console.
