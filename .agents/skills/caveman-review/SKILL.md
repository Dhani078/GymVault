---
name: caveman-review
description: >
  Single-pass code review with terse, one-line actionable findings.
  Focus on bugs, performance drains, and security risks. Trigger with
  /caveman-review or "caveman review".
argument-hint: "[diff|file|all]"
license: MIT
---

# Caveman Review

One line per finding. Location, problem, fix.

## Format
`[file:line] PROBLEM -> FIX`

## Example
- `[ProfileScreen.js:42] Inline object in prop creates new reference every render -> Wrap in useMemo`
- `[api/payment-notify.js:18] Missing origin check on CORS -> Validate trusted domain headers`
