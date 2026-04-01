import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Photo Collage Gallery',
  description: 'Upload photos, build collages, and save to MongoDB.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
