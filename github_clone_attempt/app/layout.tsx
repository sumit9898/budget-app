import './globals.css';
import type { Metadata } from 'next';
import { ThemeScript } from '@/components/ThemeScript';

export const metadata: Metadata = {
  title: 'iWork ➜ Office Converter',
  description: 'Convert Pages, Numbers, and Keynote to Office formats with an Apple-inspired UI.',
  openGraph: {
    title: 'iWork ➜ Office Converter',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="bg-bg text-fg antialiased">{children}</body>
    </html>
  );
}

