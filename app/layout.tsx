import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import 'glisse/styles.css';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jakarta',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Solana Sniper — Apple Fluid Trading Terminal',
  description:
    'High-frequency Solana token sniper dashboard engineered with Apple Human Interface Guidelines, fluid spring physics, translucent materials, and mobile-first SwiftUI ergonomics.',
  openGraph: {
    title: 'Solana Sniper — Apple Fluid Trading Terminal',
    description:
      'High-frequency Solana token sniper dashboard engineered with Apple Human Interface Guidelines, fluid spring physics, translucent materials, and mobile-first SwiftUI ergonomics.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Solana Sniper — Apple Fluid Trading Terminal',
    description:
      'High-frequency Solana token sniper dashboard engineered with Apple Human Interface Guidelines, fluid spring physics, translucent materials, and mobile-first SwiftUI ergonomics.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#111114',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${jakarta.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body
        suppressHydrationWarning
        className="min-h-screen selection:bg-[#0091ff]/30 selection:text-white antialiased"
      >
        {children}
      </body>
    </html>
  );
}
