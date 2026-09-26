# GOAL2WL — Hard WL Challenge

## Important
The static demo cannot securely issue real WL. Clearing browser data can reset client-side state, so the production version must use a server/database as the source of truth.

## Game difficulty
The scoring window is intentionally narrow:
- goalkeeper moves faster
- goalkeeper covers a wider area
- shot requires higher power
- target must be meaningfully away from the keeper
- central/easy shots are rejected

## Production architecture
Frontend (GitHub Pages) -> `/claim` API / Supabase Edge Function -> database unique constraint on wallet -> WL status.

Recommended database rule:
`UNIQUE(wallet_address)`

The API should only issue WL after a server-verified game result and should atomically reserve one WL slot.

## V4 presentation
2.5D stadium perspective, lighting, generated WebAudio kick/shot/save/goal/crowd sounds. No external audio assets required.
