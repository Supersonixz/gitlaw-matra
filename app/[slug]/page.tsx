import { getAllConstitutions, fetchConstitutionData } from '@/utils/dataLoader';
import { notFound, redirect } from 'next/navigation';
import DeepLinkView from '@/components/DeepLinkView';

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
