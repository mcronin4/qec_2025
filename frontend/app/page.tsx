import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-5xl font-bold mb-4">
        Welcome to QEC 2025
      </h1>
      <p className="text-xl text-gray-600 text-center max-w-600 mb-8">
        Your Next.js application is ready to go!
      </p>
      <Link
        href="/snowplow"
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Go to Snowplow Simulation
      </Link>
    </main>
  )
}

