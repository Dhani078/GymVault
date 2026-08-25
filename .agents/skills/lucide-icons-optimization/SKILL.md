---
name: lucide-icons-optimization
description: Panduan efisiensi tree-shaking icon library di Next.js 16, pemakaian named imports, pencegahan bundle bloat, dan SVG inline rendering optimal.
---

# Lucide Icons Optimization Skill

> Efisiensi bundle size, tree-shaking, dan performa SVG icon.

## 1. Import Rules
- **Named Direct Imports**: Selalu gunakan named import dari `lucide-react` (misal `import { Send, Terminal } from 'lucide-react';`).
- **Next.js Package Optimization**: Pastikan `next.config.ts` mengoptimalkan `lucide-react` untuk tree-shaking:
```ts
// next.config.ts
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
};
```

## 2. Icon Sizing & Accessibility
- Berikan explicit `aria-hidden="true"` pada icon dekoratif.
- Berikan `aria-label` pada icon button tanpa teks pendamping.
- Gunakan ukuran standar: `w-4 h-4` (16px) untuk inline badge, `w-5 h-5` (20px) untuk navigasi, `w-6 h-6` (24px) untuk feature icon.
