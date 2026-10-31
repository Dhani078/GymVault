# GymVault Design System & Visual Architecture

Author: Dhani078  
Version: 2.5.0  
Status: Production Certified  
Last Updated: 2026-10-31  

---

## 1. Design Philosophy

GymVault is designed with an uncompromising performance-first aesthetic engineered for dark strength facilities and high-intensity lifting environments:
- Pure Pitch Black AMOLED Backgrounds: Eliminates battery drain on OLED mobile displays and reduces ocular strain during low-light evening training sessions.
- High-Contrast Electric Lime Accents: Directs athlete focus to primary interactive elements, completed sets, and active rest timers.
- Clean Editorial Typography: Utilizes geometric Inter sans-serif font weights with zero decorative fluff or AI boilerplate cards.
- 120 FPS Hardware Accelerated Surfaces: Telemetry lines and charts rendered directly on the GPU via Shopify Skia and Reanimated worklets.

---

## 2. Color Palette & Token Architecture

All colors are centralized in theme.js and contexts/ThemeContext.js:

| Token Name | Hex Value | Semantic Usage |
| ---------- | --------- | -------------- |
| background | #000000 | Primary AMOLED canvas background |
| surface | #0E0E0F | Elevated content containers and modal backdrops |
| card | #161618 | Interactive cards, routine items, check-in widgets |
| inputBg | #1E1E21 | Form inputs, search fields, plate calculator inputs |
| border | #252528 | Subtle structural separation lines |
| primary | #D4F53C | Electric Lime brand accent, primary CTA buttons |
| text | #FFFFFF | Primary high-emphasis headings and data metrics |
| textMuted | #909096 | WCAG 2.2 AA compliant secondary labels and units |
| danger | #EF4444 | High-fatigue alerts, plate delete, cancel buttons |
| warning | #F59E0B | Stabilizer overlap notices, deload suggestions |
| info | #38BDF8 | Voice recognition recording indicators, hydration |

---

## 3. Typography Hierarchy

GymVault uses the Inter font family with tabular numeral support for jitter-free live timer rendering:

- Display Numbers (1RM / Total Volume): 28px to 36px, Weight: Bold (700), Font Feature: 'tnum'
- Section Headings (H1 / H2): 20px to 24px, Weight: Bold (700), Color: #FFFFFF
- Card Titles (H3): 15px to 16px, Weight: SemiBold (600), Color: #FFFFFF
- Body Text: 13px to 14px, Weight: Regular (400), Color: #D1D5DB
- Secondary / Captions: 11px to 12px, Weight: Medium (500), Color: #909096
- Badges / Micro Cues: 9px to 10px, Weight: Bold (700), Letter Spacing: 0.5px

---

## 4. Haptic Feedback Guidelines (Mobile Native)

Haptic impulses via expo-haptics provide physical confirmation without requiring visual verification:

- Button Tap / Tab Switch: Haptics.selectionAsync() (Subtle click)
- Set Check Complete: Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
- Personal Record Broken: Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
- Rest Timer Expired: Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
- Error / Kinetic Warning: Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)

---

## 5. Accessibility & Responsive Breakpoints

- Minimum Touch Target: 44px by 44px bounding box for all interactive buttons and icons.
- Screen Reader Support: All icon-only controls provide explicit accessibilityRole and accessibilityLabel properties.
- Responsive Breakpoint: 768px threshold cleanly partitions mobile PWA navigation from the widescreen desktop landing page and admin analytics workspace.
