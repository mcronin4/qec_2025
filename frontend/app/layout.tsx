import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'QEC 2025',
  description: 'QEC 2025 Application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-100 dark:bg-gray-900">{children}</body>
    </html>
  )
}

