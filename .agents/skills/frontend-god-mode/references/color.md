# Color System — Frontend God Mode

## Palette Guidelines

### 1. Deep Obsidian Luxury Canvas
- **Deepest Void**: `#06080D`
- **Surface Elevation 1**: `#0D111A` (Alpha 0.85-0.95 with `backdrop-blur-2xl`)
- **Surface Elevation 2**: `#131826`
- **Hairline Border**: `rgba(255, 255, 255, 0.08)` to `rgba(255, 255, 255, 0.15)`
- **Hover Border**: `rgba(56, 189, 248, 0.4)` (Cyan tint)

### 2. Chromatic Accent Hierarchy
- **Primary Hero Accent**: Electric Cyan (`#00F0FF` / `#38BDF8`)
- **Secondary Accent**: Royal Indigo (`#6366F1`)
- **Success & Live Telemetry**: Emerald Node (`#10B981` / `#34D399`)
- **Attention / Build Engine**: Golden Amber (`#F59E0B`)

### 3. Shadows
- Never use untinted flat black or grey shadows.
- Always use color-tinted diffusion shadows matching the element's primary glow (e.g. `box-shadow: 0 10px 30px -10px rgba(56, 189, 248, 0.25)`).
