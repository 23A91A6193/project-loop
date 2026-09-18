import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BookVerse | Online Book Store & Smart Rental Management System',
  description: 'Book store inventory management and 2% daily rental calculations (flat ₹5 for same-day/1-hour return) with upfront security deposits, customer retention tracking, and renewal settlements.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-slate-950 text-slate-100 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
