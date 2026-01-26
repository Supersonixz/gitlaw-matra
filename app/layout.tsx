import type { Metadata } from "next";
import { Outfit, Sarabun } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const sarabun = Sarabun({
  weight: ["300", "400", "500", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-sarabun",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Thai Matra Diff",
  description: "Visualizing the Evolution of Thai Constitutions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body
        className={`${outfit.variable} ${sarabun.variable} font-sans antialiased bg-slate-100 text-slate-900 selection:bg-blue-100 selection:text-blue-900`}
      >
        {children}
      </body>
    </html>
  );
}
