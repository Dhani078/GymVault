import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';

const CHROME_PATH = 'C:\\Users\\Anomali\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe';
const TARGET_URL = process.env.AUDIT_URL || 'https://gymvault-app.vercel.app';
const PORT = 9222;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function runAudit() {
  console.log('🚀 Spawning headless Chrome...');
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--user-data-dir=C:\\Users\\Anomali\\AppData\\Local\\Temp\\chrome-gym-audit',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ], { stdio: 'ignore' });

  try {
    let versionData = null;
    for (let i = 0; i < 20; i++) {
      await sleep(300);
      try {
        versionData = await getJson(`http://127.0.0.1:${PORT}/json/version`);
        if (versionData && versionData.webSocketDebuggerUrl) break;
      } catch (_e) {}
    }

    if (!versionData) {
      throw new Error('Chrome failed to start or listen on port ' + PORT);
    }
    console.log('✔ Chrome active, browser version:', versionData['Browser']);

    const targets = await getJson(`http://127.0.0.1:${PORT}/json/list`);
    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    const wsUrl = pageTarget.webSocketDebuggerUrl;

    console.log('✔ Connecting to page target WebSocket:', wsUrl);
    const ws = new WebSocket(wsUrl);

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    const callbacks = new Map();
    const consoleLogs = [];
    const jsExceptions = [];
    const networkFailures = [];

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks.has(msg.id)) {
        const { resolve, reject } = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      } else if (msg.method === 'Runtime.consoleAPICalled') {
        const text = msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
        consoleLogs.push({ type: msg.params.type, text });
      } else if (msg.method === 'Runtime.exceptionThrown') {
        jsExceptions.push(msg.params.exceptionDetails);
      } else if (msg.method === 'Network.loadingFailed') {
        networkFailures.push(msg.params);
      }
    };

    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        callbacks.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    async function evaluate(expression) {
      const res = await send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true
      });
      if (res.exceptionDetails) {
        throw new Error(res.exceptionDetails.text || 'Eval error');
      }
      return res.result?.value;
    }

    await send('Runtime.enable');
    await send('Page.enable');
    await send('Network.enable');

    console.log(`🌐 Navigating to ${TARGET_URL}...`);
    await send('Page.navigate', { url: TARGET_URL });
    await sleep(4000); // Wait for React/Expo bundle to mount

    const title = await evaluate('document.title');
    console.log('✔ Document Title:', title);

    // Viewport tests
    const viewports = [
      { name: 'Mobile Standard', width: 390, height: 844, mobile: true },
      { name: 'Mobile Compact', width: 320, height: 568, mobile: true },
      { name: 'Desktop Standard', width: 1280, height: 800, mobile: false }
    ];

    console.log('\n--- Viewport Overflow & Rendering Audit ---');
    for (const vp of viewports) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 2,
        mobile: vp.mobile
      });
      await sleep(1000);

      const metrics = await evaluate(`(() => {
        const docWidth = document.documentElement.scrollWidth;
        const bodyWidth = document.body.scrollWidth;
        const winWidth = window.innerWidth;
        const maxScroll = Math.max(docWidth, bodyWidth);
        return {
          winWidth,
          maxScroll,
          hasOverflow: maxScroll > winWidth,
          overflowDiff: maxScroll - winWidth,
          rootText: document.getElementById('root') ? document.getElementById('root').innerText.slice(0, 200) : 'NO_ROOT'
        };
      })()`);

      console.log(`[${vp.name} (${vp.width}x${vp.height})] Overflow: ${metrics.hasOverflow ? '❌ YES (+' + metrics.overflowDiff + 'px)' : '✔ ZERO'}`);

      if (vp.name === 'Desktop Standard' || vp.name === 'Mobile Standard') {
        const shot = await send('Page.captureScreenshot', { format: 'png' });
        if (shot && shot.data) {
          const fileName = vp.mobile ? 'chrome-audit-mobile.png' : 'chrome-audit-desktop.png';
          const outPath = `E:\\Hermesproject\\GYM\\artifacts\\${fileName}`;
          fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
          console.log(`📸 Screenshot captured: ${outPath}`);
        }
      }
    }

    // Inspect elements and switcher
    console.log('\n--- DOM Structure & Switcher Audit ---');
    const domCheck = await evaluate(`(() => {
      const root = document.getElementById('root');
      const buttons = Array.from(document.querySelectorAll('div[role="button"], button, a')).map(el => el.innerText.trim()).filter(Boolean);
      return {
        hasRoot: !!root,
        rootChildrenCount: root ? root.children.length : 0,
        buttonLabels: buttons.slice(0, 15),
        bodySnippet: document.body.innerText.slice(0, 400).replace(/\\n+/g, ' ')
      };
    })()`);

    console.log('Root Element Present:', domCheck.hasRoot);
    console.log('Buttons Detected:', domCheck.buttonLabels);
    console.log('Body Text Snippet:', domCheck.bodySnippet);

    // PWA & Service Worker Audit
    console.log('\n--- PWA & Manifest Audit ---');
    const pwaCheck = await evaluate(`(() => {
      const manifestEl = document.querySelector('link[rel="manifest"]');
      const hasSw = 'serviceWorker' in navigator;
      const themeColor = document.querySelector('meta[name="theme-color"]')?.content;
      return {
        hasManifest: !!manifestEl,
        manifestHref: manifestEl?.href || null,
        hasServiceWorkerSupport: hasSw,
        themeColor
      };
    })()`);
    console.log('Manifest Link:', pwaCheck.hasManifest ? `✔ FOUND (${pwaCheck.manifestHref})` : '❌ MISSING');
    console.log('Service Worker API:', pwaCheck.hasServiceWorkerSupport ? '✔ SUPPORTED' : '❌ NOT SUPPORTED');
    console.log('Theme Color:', pwaCheck.themeColor || 'NOT SET');

    // SEO & Structured Data Audit
    console.log('\n--- SEO & Social Metadata Audit ---');
    const seoCheck = await evaluate(`(() => {
      const ldJsonEl = document.querySelector('script[type="application/ld+json"]');
      let ldJsonValid = false;
      let ldType = null;
      if (ldJsonEl) {
        try {
          const parsed = JSON.parse(ldJsonEl.innerText);
          ldType = parsed['@type'];
          ldJsonValid = true;
        } catch (_e) {}
      }
      return {
        hasLdJson: ldJsonValid,
        schemaType: ldType,
        ogTitle: document.querySelector('meta[property="og:title"]')?.content,
        ogImage: document.querySelector('meta[property="og:image"]')?.content,
        twitterCard: document.querySelector('meta[name="twitter:card"]')?.content,
        canonical: document.querySelector('link[rel="canonical"]')?.href
      };
    })()`);
    console.log('Schema.org JSON-LD:', seoCheck.hasLdJson ? `✔ VALID (@type: ${seoCheck.schemaType})` : '❌ INVALID/MISSING');
    console.log('OpenGraph Title:', seoCheck.ogTitle || 'MISSING');
    console.log('Twitter Card:', seoCheck.twitterCard || 'MISSING');
    console.log('Canonical URL:', seoCheck.canonical || 'MISSING');

    // Web Vitals & Real-Time Navigation Performance Timing
    console.log('\n--- Web Vitals & Performance Telemetry ---');
    const perfTiming = await evaluate(`(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      const mem = performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) : null;
      if (!nav) return { available: false, heapMb: mem };
      return {
        available: true,
        dnsMs: Math.round(nav.domainLookupEnd - nav.domainLookupStart),
        tcpMs: Math.round(nav.connectEnd - nav.connectStart),
        ttfbMs: Math.round(nav.responseStart - nav.requestStart),
        domReadyMs: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
        loadMs: Math.round(nav.loadEventEnd - nav.startTime),
        heapMb: mem
      };
    })()`);
    if (perfTiming.available) {
      console.log(`DNS Lookup: ${perfTiming.dnsMs}ms | TCP Connect: ${perfTiming.tcpMs}ms`);
      console.log(`TTFB: ${perfTiming.ttfbMs}ms | DOM Ready: ${perfTiming.domReadyMs}ms | Full Load: ${perfTiming.loadMs}ms`);
      if (perfTiming.heapMb) console.log(`JS Heap Usage: ${perfTiming.heapMb} MB`);
    } else {
      console.log('Navigation timing entry not yet finalized.');
    }

    console.log('\n--- Console Logs Captured (' + consoleLogs.length + ') ---');
    for (const log of consoleLogs) {
      const prefix = log.type === 'error' ? '❌' : (log.type === 'warning' ? '⚠️' : 'ℹ️');
      console.log(`${prefix} [${log.type}] ${log.text}`);
    }

    console.log('\n--- Uncaught JS Exceptions (' + jsExceptions.length + ') ---');
    for (const ex of jsExceptions) {
      console.log(`❌ EXCEPTION: ${ex.text} at ${ex.url}:${ex.lineNumber}:${ex.columnNumber}`);
    }

    console.log('\n--- Network Failures (' + networkFailures.length + ') ---');
    for (const net of networkFailures) {
      console.log(`❌ NET FAIL: ${net.errorText} (type: ${net.type})`);
    }

    ws.close();
  } finally {
    console.log('\n🛑 Terminating Chrome headless process...');
    chromeProc.kill('SIGKILL');
  }
}

runAudit().catch(err => {
  console.error('Audit run failed:', err);
  process.exit(1);
});
