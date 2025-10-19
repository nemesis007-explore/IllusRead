import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ebook Illustrator',
  description: 'Upload, read, and illustrate e-books',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header style={{ padding: '12px 16px', borderBottom: '1px solid #eee' }}>
          <h1 style={{ margin: 0, fontSize: 18 }}>Ebook Illustrator</h1>
        </header>
        <main style={{ minHeight: 'calc(100vh - 56px)' }}>{children}</main>
      </body>
    </html>
  );
}
