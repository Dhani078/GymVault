import React from 'react';

// Pada versi Web, Google AdMob tidak berjalan di browser.
// Komponen ini mengembalikan null agar versi Web bersih tanpa placeholder teks iklan.
export default function DummyAdBanner() {
  return null;
}
