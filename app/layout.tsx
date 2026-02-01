import type { Metadata } from "next";
import { Outfit, Sarabun } from "next/font/google";
import "./globals.css";
import { getAlternateOpenGraphLocale, getOpenGraphLocale, pickLocaleFromAcceptLanguage } from "@/utils/i18n";
import ToasterProvider from "@/components/ToasterProvider";

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

const baseMetadataByLocale: Record<"th" | "en", Pick<Metadata, "title" | "description">> = {
  th: {
    title: "Thai Matra Diff - สำรวจวิวัฒนาการรัฐธรรมนูญไทย",
    description: "เปรียบเทียบรัฐธรรมนูญไทยแบบเคียงข้าง วิเคราะห์ความเปลี่ยนแปลงของมาตราตามยุคสมัย",
  },
  en: {
    title: "Thai Matra Diff - Visualizing Constitutional Evolution",
    description:
      "Explore and compare the evolution of Thai Constitutions side-by-side. Analyze changes in specific Matras (Articles) across different eras to understand the legal history of Thailand.",
  },
};

const getSiteUrl = async () => {
  const envUrl = process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl;

  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    const proto = h.get("x-forwarded-proto") ?? "http";
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) return `${proto}://${host}`;
  } catch {
    // Ignore: may run at build time
  }

  return "http://localhost:3000";
};

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = await getSiteUrl();
  let acceptLanguage: string | null = null;
  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    acceptLanguage = h.get("accept-language");
  } catch {
    // Ignore: may run at build time
  }
  const locale = pickLocaleFromAcceptLanguage(acceptLanguage);
  const baseMetadata = baseMetadataByLocale[locale];

  return {
    ...baseMetadata,
    metadataBase: new URL(siteUrl),
    openGraph: {
      title: baseMetadata.title as string,
      description: baseMetadata.description as string,
      url: siteUrl,
      siteName: "Thai Matra Diff",
      locale: getOpenGraphLocale(locale),
      alternateLocale: getAlternateOpenGraphLocale(locale),
      type: "website",
      images: [
        {
          url: new URL("/icon.png", siteUrl),
          width: 512,
          height: 512,
          alt: "Thai Matra Diff",
        },
      ],
    },
    twitter: {
      card: "summary",
      title: "Thai Matra Diff",
      description: "Visualizing the Evolution of Thai Constitutions",
      images: [new URL("/icon.png", siteUrl)],
    },
  };
}

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
        <ToasterProvider />
        {children}
      </body>
    </html>
  );
}
