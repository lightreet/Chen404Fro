# Emoji Infrastructure

This folder provides a reusable emoji infrastructure for comment/article/signature.

## Files

- `types.ts`: shared types for registry, policy, parser tokens.
- `scenePolicy.ts`: per-scene limits and allowed packs.
- `registry.ts`: local emoji metadata and lookup/query APIs.
- `parser.ts`: shortcode parser and conversion helpers.
- `renderers/*`: scene-level renderer adapters.
- `provider.ts`: extension point for future backend-driven emoji metadata.

## Shortcode Convention

- Format: `:pack_item:`
- Example: `:basic_smile:`
- Unknown shortcode falls back to plain text.

## Future Extension

- Replace `loadEmojiRegistry()` in `provider.ts` with backend API.
- Add management UI to configure enable/sort/pack.
- Add image-based emoji assets while keeping shortcode storage unchanged.

