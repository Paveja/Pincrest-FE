---
name: pincrest-follow-api-contract
description: "The public profile API provides authenticated-viewer follow state via isFollowing; follow actions use existing endpoints."
type: project
updated: 2026-11-04T09:59:04.505Z
---

Pincrest frontend integration contract: GET /api/v1/users/:username includes isFollowing boolean based on the authenticated session (false for unauthenticated requests; never accept a viewer ID from the client). Existing POST/DELETE /api/v1/users/:id/follow actions perform follow/unfollow. Why it matters: initial profile action state must come from the backend and update only after successful mutation. Apply this contract for frontend work; backend is not present in the frontend workspace.
