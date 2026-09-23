import React from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

export default function VercelTelemetry() {
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
