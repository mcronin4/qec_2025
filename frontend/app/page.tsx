'use client';

import dynamic from 'next/dynamic';

// Dynamically import SnowplowSimulator with no SSR to avoid window/document errors during build
const SnowplowSimulator = dynamic(
  () => import('@/components/SnowplowSimulator'),
  { ssr: false }
);

export default function Home() {
  return <SnowplowSimulator />;
}

