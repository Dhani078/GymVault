---
name: shadcn-radix
description: Standar industri untuk komponen UI modern berbasis Radix UI Primitives dan Tailwind CSS. Menyediakan pedoman aksesibilitas WCAG, keyboard navigation, modal drawers, popovers, dan headless primitives.
---

# shadcn/ui & Radix Primitives Skill

> Standar komponen web modern, accessible, type-safe, dan headless.

## 1. Core Principles
- **Headless & Accessible**: Gunakan Radix Primitives (`@radix-ui/react-*`) untuk logic, focus management, dan keyboard accessibility (Tab, Enter, Escape).
- **Tailwind Composition**: Gabungkan styling dengan `cn()` utility (`clsx` + `tailwind-merge`).
- **No Unnecessary Re-renders**: Komponen UI harus modular, terisolasi, dan tidak memicu re-render di luar konteksnya.

## 2. Standard Utilities (`src/lib/utils.ts`)
```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## 3. Best Practices
- Pastikan semua dialog, drawer, dan popover memiliki atribut `aria-describedby` dan `aria-labelledby`.
- Gunakan `AnimatePresence` dari Framer Motion hanya saat unmounting komponen dinamis.
- Hindari inline style dinamis yang dapat memicu hydration warning.
