// app/layout.tsx
import "leaflet/dist/leaflet.css"; // <--- Add this here!
import "./globals.css";
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ["latin"] });



// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link 
          rel="stylesheet" 
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" 
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}