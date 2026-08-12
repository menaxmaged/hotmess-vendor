# Day 7 — Instagram: Real OAuth

## Context

Instagram is currently folded into `profile/instagram/connect` as a bare toggle (`connect()`/`disconnect()`) — that shape can't work against the real endpoint. Confirmed live: **Instagram is now its own top-level resource**, real OAuth-code-exchange flow: `GET /vendor/instagram` (connection status), `POST /vendor/instagram/connect` (exchanges an OAuth code — not a toggle), `DELETE /vendor/instagram`.

## Scope

1. Extract Instagram out of `Modules/profile` into its own `Modules/instagram/` (decide during implementation whether it stays a `profile` sub-namespace or a fully separate module — either is fine, but the API calls must go through the real OAuth-code-exchange shape either way).
2. Find wherever the profile screen's Instagram tab currently handles the connect toggle and wire in the actual OAuth redirect/code-capture flow feeding `connect(code)`.
3. `disconnect()` → `DELETE /vendor/instagram`.

## Verification

1. `npx tsc --noEmit` clean.
2. Profile → Instagram tab: connect flow completes a real OAuth code exchange (not an instant toggle), status reflects real connection state, disconnect works.
