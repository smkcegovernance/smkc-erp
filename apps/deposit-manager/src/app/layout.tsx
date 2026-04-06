import './globals.css';
import type { Metadata } from 'next';
import { ToastHost } from '@/components/Toast';

export const metadata: Metadata = {
  title: 'e-Nivesh',
  description: 'Deposit management portal for SMKC',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
      </head>
      <body className="min-h-screen bg-gray-50">
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white sticky top-0 z-50 border-b border-gray-200 backdrop-blur-xl shadow-sm">
            <nav className="container mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <img
                  src="/depositmanager/images/logo.png"
                  alt="SMKC Logo"
                  width={40}
                  height={40}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-md flex-shrink-0"
                />
                <div>
                  <h1 className="text-sm sm:text-xl font-bold text-gray-900">
                    Sangli, Miraj and Kupwad City Municipal Corporation
                  </h1>
                  <p className="text-xs text-gray-600 hidden sm:block">Deposit Management Portal</p>
                </div>
              </div>
            </nav>
          </header>
          <main>{children}</main>
          <ToastHost />
        </div>
      </body>
    </html>
  );
}
