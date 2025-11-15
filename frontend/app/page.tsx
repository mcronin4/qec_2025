import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-5xl font-bold mb-4">
        Welcome to QEC 2025
      </h1>

      <div className="flex gap-4">
        <Link
          href="/snowplow"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Snowplow Simulation
        </Link>
        <Link
          href="/compare"
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Compare Strategies
        </Link>
      </div>
    </main>
  )
}

