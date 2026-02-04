import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";
import "maplibre-gl/dist/maplibre-gl.css";
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ["latin"], preload: false });

export const metadata = {
  title: 'TerraGuard AI | Intelligent Reforestation',
  description: 'Moving from one-time planting to decadal ecosystem survival.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>{children}</body>
    </html>
  );
}