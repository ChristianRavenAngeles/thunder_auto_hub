import './globals.css'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from '@/components/ui/ThemeProvider'

export const metadata = {
  title: 'Thunder Auto Hub',
  description: 'Premium home-service car wash, detailing, and coating. Book online now.',
  keywords: 'car wash, detailing, ceramic coating, home service, Arayat, Pampanga',
  manifest: '/manifest.json',
  openGraph: {
    title: 'Thunder Auto Hub',
    description: 'Premium home-service car wash, detailing, and coating.',
    type: 'website',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FFD200',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Bebas+Neue&family=Barlow:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Barlow+Condensed:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Thunder" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--surface)',
                color: 'var(--text)',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                fontFamily: 'var(--font-dm-sans)',
              },
              success: { iconTheme: { primary: '#FFD200', secondary: '#0B0B0B' } },
              error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
