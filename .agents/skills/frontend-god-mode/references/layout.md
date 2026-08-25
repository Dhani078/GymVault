# Layout & Spatial Rules — Frontend God Mode

## Asymmetric Layout Rules
- Avoid centered, predictable symmetric hero layouts.
- Left column: Monumental headline with high-contrast subtitle, live status indicators, core tech pills, and paired CTA buttons.
- Right column: Interactive high-tech studio device frame mounting live simulators, code contracts, or verified photographic portraits.

## Viewport Standards
- Never use `h-screen` which breaks on mobile browsers with URL bars. Always use `min-h-[100dvh]` or `min-h-[92vh]`.
- Enforce strict `overflow-x-hidden` on root wrappers to eliminate horizontal scroll jumps on mobile.

## Bento Grid Architecture
- 12-column grid (`grid grid-cols-1 lg:grid-cols-12 gap-8`).
- Combine diverse visual archetypes: Credential Cards (span-4), Technical Narrative (span-8), Live Status & Latency Radar (span-12), Concrete Metric Dials (span-12 / 3-col split).
