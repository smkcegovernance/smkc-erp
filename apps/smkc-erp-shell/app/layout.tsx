import type { Metadata } from 'next'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './globals.css'
import AuthShell from './components/AuthShell'
import { LanguageProvider } from './lib/i18n/LanguageContext'
import { DeptProvider } from './lib/DeptContext'

export const metadata: Metadata = {
  title: 'SMKC ERP',
  description: 'SMKC Enterprise Resource Planning',
  icons: {
    icon: '/assets/SMKC_NEW_LOGO_PNG.png',
    apple: '/assets/SMKC_NEW_LOGO_PNG.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <DeptProvider>
            <AuthShell>{children}</AuthShell>
          </DeptProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
