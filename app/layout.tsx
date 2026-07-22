import type { Metadata } from "next";
import { Inter, Archivo_Black } from "next/font/google";
import { NewsletterPopup } from "@/components/newsletter-popup";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  axes: ["opsz"],
});

const archivoBlack = Archivo_Black({
  variable: "--font-archivo",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MAYOWA — AI UGC Studio",
  description:
    "MAYOWA creates AI UGC videos, AI product imagery, and websites for brands. Real content, zero cameras. Message us on WhatsApp.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${archivoBlack.variable} dark h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-black font-sans text-white">
        {children}
        <NewsletterPopup />
      </body>
    </html>
  );
}
