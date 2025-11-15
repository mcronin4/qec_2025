'use client';

import dynamic from 'next/dynamic';

// Dynamically import StrategyComparison with no SSR to avoid window/document errors during build
const StrategyComparison = dynamic(
  () => import('@/components/StrategyComparison'),
  { ssr: false }
);

export default function ComparePage() {
  return <StrategyComparison />;
}

