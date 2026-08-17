# Emoji Infrastructure

This folder provides a reusable emoji infrastructure for comment/article/signature.

## Files

- `types.ts`: shared types for registry, policy, parser tokens.
- `scenePolicy.ts`: per-scene limits and allowed packs.
- `registry.ts`: local emoji metadata and lookup/query APIs.
- `parser.ts`: shortcode parser and conversion helpers.
- `renderers/*`: scene-level renderer adapters.
- `provider.ts`: loads backend-driven emoji metadata and falls back to the local registry when the request fails.

## Shortcode Convention

- Format: `:pack_item:`
- Example: `:basic_smile:`
- Unknown shortcode falls back to plain text.

## Runtime Flow

- `loadEmojiRegistry()` calls the backend `/emoji/items` wrapper.
- Backend fields such as `packCode` and `assetUrl` are normalized to the frontend `EmojiItem` shape.
- A successful response replaces the in-memory registry; a request failure keeps the bundled local registry so comments and articles still render.
- The admin UI already supports metadata maintenance and ZIP import.

## Future Extension

- Add image-based emoji assets while keeping shortcode storage unchanged.
- Replace the remaining `any`-based remote normalization with a generated or hand-maintained response type after the OpenAPI SDK is refreshed.

