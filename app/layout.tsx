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
  title: "Thai Matra Diff - Visualizing Constitutional Evolution",
  description: "Explore and compare the evolution of Thai Constitutions side-by-side. Analyze changes in specific Matras (Articles) across different eras to understand the legal history of Thailand.",
  keywords: ["Thai Constitution", "Thailand Law", "Ratthathammanun", "Matra Diff", "Legal Comparison", "Thai Politics"],
  authors: [{ name: "GitLaw Team" }],
  openGraph: {
    title: "Thai Matra Diff - Visualizing Constitutional Evolution",
    description: "Compare Thai Constitutions side-by-side. Visualize how the law has changed over time.",
    url: "https://www.matradiff.org", // Assuming Vercel deployment or similar
    siteName: "Thai Matra Diff",
    locale: "th_TH",
    type: "website",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Thai Matra Diff Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Thai Matra Diff",
    description: "Visualizing the Evolution of Thai Constitutions",
    images: ["/opengraph-image.png"],
  },
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
