---
name: caveman-commit
description: >
  Generate terse, ultra-compact Conventional Commit messages. No filler,
  exact type, scope, and single-line summary. Trigger with /caveman-commit
  or "caveman commit".
argument-hint: "[staged|all]"
license: MIT
---

# Caveman Commit

Generate high-density Conventional Commit messages.

## Format
`<type>(<scope>): <terse imperative description>`

## Examples
- `feat(profile): modularize subcomponents into components/profile`
- `fix(auth): prevent unauthorized role escalation trigger`
- `perf(web): hardware-accelerated skia 120fps chart rendering`
- `sec(payment): atomic rpc verification for qris dana promo`
