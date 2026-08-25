---
name: ui-ux-pro-max
description: AI skill that provides design intelligence for building professional UI/UX across multiple platforms and frameworks. Includes 79 UI styles, 192 color palettes, 74 font pairings, responsive patterns, anti-pattern rules, and pre-delivery checklists.
---

# UI/UX Pro Max Skill (v2.0)

> Design intelligence engine for generating world-class UI/UX, design systems, and frontend components.

---

## 1. Core Design Engine

When building or reviewing UI/UX interfaces:
1. **Determine User Intent & Aesthetic Family**:
   - *Dark Brutalist / Cyberpunk*: Monospace labels, high contrast accents (`#D6FF3F`, `#00F0FF`), hairline grid borders, tactile cards.
   - *Modern Glassmorphism & Bento Grid*: Backdrop blur (`backdrop-blur-md`), subtle borders (`rgba(255,255,255,0.08)`), multi-layer depth, rounded corners.
   - *Minimalist Editorial*: Generous whitespace, refined typography (Serif / Geometric Sans), intentional imagery, subtle scroll reveals.
2. **Palette Harmony & Contrast**:
   - Ensure a minimum contrast ratio of 4.5:1 for normal text (WCAG AA).
   - Use semantic colors: Primary Brand, Accent/Action, Surface/Card, Border/Hairline, and Muted text.
3. **Typography Structure**:
   - Clear visual hierarchy: Display Heading -> H1 -> H2 -> Body -> Monospace Caption/Badge.
   - Pair fonts intentionally (e.g. Display font for hero headers, clean Sans for body readability, Monospace for technical badges).

---

## 2. Pre-Delivery Checklist
- [ ] **No emojis as primary action icons**: Use Lucide React or SVG icons.
- [ ] **Interactive States**: `cursor-pointer`, active compression (`scale(0.97)`), and smooth hover states on all interactive elements.
- [ ] **Responsive Breakpoints**: Flawless layout at 375px (mobile), 768px (tablet), 1024px (laptop), and 1440px+ (desktop).
- [ ] **Reduced Motion**: Respect `@media (prefers-reduced-motion: reduce)`.
- [ ] **Resilient Layouts**: Text and badges wrap gracefully without clipping or overlapping.
- [ ] **Image Optimization**: Priority loading on hero images, explicit aspect ratios, and smooth blur-up placeholders.
