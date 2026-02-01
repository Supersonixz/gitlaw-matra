import { getAllConstitutions, fetchConstitutionData } from '@/utils/dataLoader';
import { notFound, redirect } from 'next/navigation';
import DeepLinkView from '@/components/DeepLinkView';
import type { Metadata } from 'next';
import { formatYearByLocale, getAlternateOpenGraphLocale, getOpenGraphLocale, pickLocaleFromAcceptLanguage } from '@/utils/i18n';

// Generate all possible combinations for static export
export async function generateStaticParams() {
    const constitutions = getAllConstitutions();
    const params = [];

    for (const left of constitutions) {
        for (const right of constitutions) {
            if (left.id !== right.id) {
                params.push({ slug: `${left.id}-vs-${right.id}` });
            }
        }
    }
    return params;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    let siteUrl =
        process.env.SITE_URL ??
        process.env.NEXT_PUBLIC_SITE_URL ??
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.matradiff.org/');

    let acceptLanguage: string | null = null;
    try {
        const { headers } = await import('next/headers');
        const h = await headers();
        acceptLanguage = h.get('accept-language');
    } catch {
        // Ignore: may run at build time
    }
    const locale = pickLocaleFromAcceptLanguage(acceptLanguage);

    if (!siteUrl) {
        try {
            const { headers } = await import('next/headers');
            const h = await headers();
            const proto = h.get('x-forwarded-proto') ?? 'http';
            const host = h.get('x-forwarded-host') ?? h.get('host');
            if (host) siteUrl = `${proto}://${host}`;
        } catch {
            // Ignore: may run at build time
        }
    }

    if (!siteUrl) siteUrl = 'http://localhost:3000';

    const { slug } = await params;

    const parts = slug.split('-vs-');
    if (parts.length !== 2) {
        notFound();
    }

    const [leftId, rightId] = parts;
    // --- BUSINESS RULE: con2495 must always be compared with con2475 ---
    if (leftId === 'con2495' || rightId === 'con2495') {
        const canonicalSlug = 'con2475-vs-con2495';
        if (slug !== canonicalSlug) {
            redirect(`/${canonicalSlug}`);
        }
    }

    const constitutions = getAllConstitutions();
    const leftExists = constitutions.some(c => c.id === leftId);
    const rightExists = constitutions.some(c => c.id === rightId);
    if (!leftExists || !rightExists) {
        notFound();
    }

    let leftData, rightData;
    try {
        [leftData, rightData] = await Promise.all([
            fetchConstitutionData(leftId),
            fetchConstitutionData(rightId)
        ]);
    } catch {
        notFound();
    }

    if (!leftData?.meta || !rightData?.meta) {
        notFound();
    }

    const title =
        locale === 'th'
            ? "สืบย้อนหลังรัฐธรรมนูญ"
            : "Constitutional Evolution" 
    const description =
        locale === 'th'
            ? `เปรียบเทียบกฎหมาย ${formatYearByLocale(leftData.meta.year, 'th')} กับ ${formatYearByLocale(rightData.meta.year, 'th')}`
            : `Compare law ${formatYearByLocale(leftData.meta.year, 'en')} vs ${formatYearByLocale(rightData.meta.year, 'en')}`;
    return {
        metadataBase: new URL(siteUrl),
        title,
        description,
        alternates: {
            canonical: `/${slug}`
        },
        openGraph: {
            url: new URL(`/${slug}`, siteUrl),
            title,
            description,
            locale: getOpenGraphLocale(locale),
            alternateLocale: getAlternateOpenGraphLocale(locale),
            images: [
                {
                    url: new URL('/icon.png', siteUrl),
                    width: 512,
                    height: 512,
                    alt: 'Thai Matra Diff'
                }
            ]
        },
        twitter: {
            card: 'summary',
            title,
            description,
            images: [new URL('/icon.png', siteUrl)]
        }
    };
}

export default async function DeepLinkPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    const parts = slug.split('-vs-');

    if (parts.length !== 2) {
        notFound();
    }

    const [leftId, rightId] = parts;

    // --- BUSINESS RULE: con2495 must always be compared with con2475 ---
    if (leftId === 'con2495' || rightId === 'con2495') {
        const canonicalSlug = 'con2475-vs-con2495';
        if (slug !== canonicalSlug) {
            redirect(`/${canonicalSlug}`);
        }
    }

    const constitutions = getAllConstitutions();
    const leftExists = constitutions.some(c => c.id === leftId);
    const rightExists = constitutions.some(c => c.id === rightId);

    if (!leftExists || !rightExists) {
        notFound();
    }

    let leftData, rightData;
    try {
        [leftData, rightData] = await Promise.all([
            fetchConstitutionData(leftId),
            fetchConstitutionData(rightId)
        ]);
    } catch (error) {
        console.error(`Failed to load data for ${slug}`, error);
        notFound();
    }

    if (!leftData.meta || !rightData.meta) {
        notFound();
    }

    return (
        <DeepLinkView
            initialLeftId={leftId}
            initialRightId={rightId}
            initialLeftData={leftData}
            initialRightData={rightData}
        />
    );
}
