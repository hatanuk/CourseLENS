import type { Metadata } from 'next';
import { JetBrains_Mono, Montserrat, Michroma, Outfit } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  variable: '--font-sans',
  subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
  weight: '400',
  variable: '--font-mono',
  subsets: ['latin'],
});

const michroma = Michroma({
  weight: '400',
  variable: '--font-logo',
  subsets: ['latin'],
});


export const metadata: Metadata = {
  title: 'Lens',
  description: 'Document-centric study app with RAG',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${jetbrainsMono.variable} ${michroma.variable}`}>
        {children}
      </body>
    </html>
  );
}
