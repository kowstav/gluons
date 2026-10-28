import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: { default: 'Gluons · A little AI. A lot more time.', template: '%s · Gluons' },
  description:
    'AI help for customer calls, orders, stock and everyday records. Setup support, owner approval, and a trial you can measure.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
