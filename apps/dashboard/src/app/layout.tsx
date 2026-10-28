import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: { default: 'Gluons · A little AI. A lot more time.', template: '%s · Gluons' },
  description:
    'Reusable AI operations for small businesses. Expert-built integrations, owner-approved actions, and lower-cost intelligence.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
