import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AuthProvider } from "@/hooks/useAuth"
import { WorkspaceProvider } from "@/hooks/useWorkspace"
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CallTrack - Know Where Every Call Comes From',
  description: 'Track, attribute, and optimize your inbound calls. Understand which marketing channels drive real phone conversations with CallTrack.',
  authors: [{ name: 'CallTrack' }],
  openGraph: {
    title: 'CallTrack - Call Tracking & Attribution SaaS',
    description: 'Track, attribute, and optimize your inbound calls. Understand which marketing channels drive real phone conversations.',
    type: 'website',
    images: ['https://lovable.dev/opengraph-image-p98pqg.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CallTrack - Call Tracking & Attribution SaaS',
    description: 'Track, attribute, and optimize your inbound calls. Understand which marketing channels drive real phone conversations.',
    images: ['https://lovable.dev/opengraph-image-p98pqg.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
          <Sonner />
        </Providers>
      </body>
    </html>
  )
}

