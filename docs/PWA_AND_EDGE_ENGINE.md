# GymVault PWA & Edge Deployment Architecture

Author: Dhani078  
Version: 2.5.0  
Status: Production Certified  
Last Updated: 2026-10-31  

---

## 1. Overview

GymVault is distributed as a hybrid progressive web application (PWA) and native mobile binary. On desktop and mobile browsers, the application is delivered via Vercel Edge network with zero server cold starts, full offline caching, and native-feeling viewport responsiveness.

Live Production URL: https://gymvault-app.vercel.app

---

## 2. Progressive Web App (PWA) Architecture

### Manifest Specification (web/manifest.json)
The web application is configured for standalone display mode, allowing mobile users on Chrome, Edge, and Safari to tap Add to Home Screen and launch GymVault without browser URL bars or navigation chrome.

Key Properties:
- Name: GymVault - The Adaptive Fitness & Recovery Engine
- Short Name: GymVault
- Display: standalone
- Background Color: #000000 (Pure AMOLED Pitch Black)
- Theme Color: #000000
- Orientation: portrait
- Categories: fitness, health, sports
- Maskable Icons: 192x192 and 512x512 with any maskable purpose support

---

## 3. Service Worker & Caching Strategy (web/sw.js)

The service worker implements an adaptive multi-tier caching strategy:

### Pre-cache Shell Assets
Upon installation, the service worker immediately downloads and caches critical application shell resources:
- / (Root HTML Shell)
- /manifest.json (PWA Metadata)
- /offline.html (Emergency Offline Fallback)
- /assets/icon.png (Primary App Icon)
- /assets/favicon.png (Favicon)

### Runtime Fetch Routing

1. Serverless API and External Cloud Calls
- Target: /api/*, *.supabase.co, *.doku.com
- Strategy: Network Only
- Reason: Payment verification, real-time auth, and database transactions must never return stale cached representations.

2. HTML Navigation Requests
- Target: mode === 'navigate'
- Strategy: Network First with Multi-Tier Cache Fallback
- Behavior: Tries network fetch first; if device is completely offline in a basement gym, serves cached root / or /index.html. If cache is missing, falls back gracefully to /offline.html.

3. Static Assets (JS bundles, CSS, Images, Fonts)
- Target: Scripts, icons, fonts, stylesheets
- Strategy: Stale-While-Revalidate
- Behavior: Serves cached copy instantly to ensure zero layout shift, then fetches fresh copy in the background and updates cache for next session.

---

## 4. Vercel Edge Rewrites & Header Security

### Rewrite Strategy (vercel.json)
Single Page Applications require catch-all rewrites to /index.html while protecting static assets from being hijacked:
- /ads.txt -> /api/ads.txt
- /robots.txt -> /robots.txt
- /sitemap.xml -> /sitemap.xml
- /manifest.json -> /manifest.json
- /sw.js -> /sw.js
- /privacy -> /privacy.html
- /terms -> /terms.html
- /llms.txt -> /llms.txt
- /offline -> /offline.html
- Non-static and non-API requests -> /index.html

### Security Headers
Every HTTP response from Vercel Edge includes defensive headers:
- X-Content-Type-Options: nosniff (Prevents MIME sniffing attacks)
- X-Frame-Options: SAMEORIGIN (Prevents unauthorized iframe clickjacking)
- Referrer-Policy: strict-origin-when-cross-origin (Protects sensitive URLs)
- Strict-Transport-Security: max-age=63072000; includeSubDomains; preload (Enforces HTTPS)
- Permissions-Policy: camera=(), microphone=(), geolocation=() (Restricts unrequested browser features)
- Service-Worker-Allowed: / on sw.js (Allows service worker to control entire scope)
