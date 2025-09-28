import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BRMH Authentication',
  description: 'Secure authentication portal for BRMH',
  keywords: ['authentication', 'brmh', 'security', 'login', 'signup'],
  authors: [{ name: 'BRMH Team' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'noindex, nofollow',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
