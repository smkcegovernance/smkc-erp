import type { Metadata } from 'next'
import './globals.css'
import AuthShell from './components/AuthShell'

export const metadata: Metadata = {
  title: 'SMKC ERP',
  description: 'SMKC Enterprise Resource Planning',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthShell>{children}</AuthShell>
      </body>
    </html>
  )
}
