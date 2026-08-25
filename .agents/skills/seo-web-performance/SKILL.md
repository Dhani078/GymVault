---
name: seo-web-performance
description: Panduan optimasi Core Web Vitals (LCP, FID, CLS), metadata Next.js 16 (OpenGraph, Twitter Cards, JSON-LD schema), image preloading, font display swap, dan caching CDN.
---

# SEO & Web Performance Skill

> Optimasi Core Web Vitals, Search Engine Visibility, dan Social Media Preview.

## 1. Next.js 16 Metadata API
Konfigurasi metadata di `src/app/layout.tsx` atau `src/app/page.tsx`:
```ts
export const metadata: Metadata = {
  title: 'Muhammad Rizki Ramadhani | Full-Stack Software Engineer',
  description: 'Portofolio resmi Muhammad Rizki Ramadhani — Mahasiswa Teknik Informatika UNISKA & Full-Stack Developer spesialis Next.js, React 19, TypeScript, dan Supabase.',
  keywords: ['Muhammad Rizki Ramadhani', 'Web Developer Banjarmasin', 'Next.js Developer', 'React 19', 'Full-Stack Developer'],
  authors: [{ name: 'Muhammad Rizki Ramadhani' }],
  openGraph: {
    title: 'Muhammad Rizki Ramadhani | Full-Stack Software Engineer',
    description: 'Portofolio resmi & showcase proyek web modern.',
    url: 'https://mrr-dev.vercel.app',
    siteName: 'MRR.DEV',
    images: [{ url: '/mrr.jpg', width: 1200, height: 630, alt: 'MRR.DEV' }],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Muhammad Rizki Ramadhani | Full-Stack Software Engineer',
    description: 'Portofolio resmi & showcase proyek web modern.',
    images: ['/mrr.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};
```

## 2. Core Web Vitals Optimization Checklist
- **LCP (Largest Contentful Paint < 1.2s)**:
  - Berikan properti `priority` pada gambar di atas lipatan layar (*above-the-fold*).
  - Gunakan format modern WebP/AVIF via `next/image`.
- **CLS (Cumulative Layout Shift < 0.05)**:
  - Selalu sertakan `width`, `height`, atau `fill` dengan container ber-aspect-ratio pada elemen media.
- **INP (Interaction to Next Paint < 100ms)**:
  - Hindari thread-blocking event listeners pada `window` scroll atau resize.
  - Gunakan passive event listeners (`{ passive: true }`).
