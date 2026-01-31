'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ConstitutionData, getAllConstitutions, fetchConstitutionData } from '@/utils/dataLoader';
import ConceptDiff from '@/components/ConceptDiff';
import WelcomeHero from '@/components/WelcomeHero';
import dynamic from 'next/dynamic';

const LiquidPDFLayout = dynamic(() => import('@/components/LiquidPDFLayout'), { ssr: false });
const MemoizedLayout = React.memo(LiquidPDFLayout);

interface Props {
    initialLeftId: string;
    initialRightId: string;
    initialLeftData: ConstitutionData;
    initialRightData: ConstitutionData;
}

export default function DeepLinkView({
    initialLeftId,
    initialRightId,
    initialLeftData,
    initialRightData
}: Props) {
    // State UI (Dropdown & URL)
    const [leftId, setLeftId] = useState(initialLeftId);
    const [rightId, setRightId] = useState(initialRightId);

    // State Data (Content)
    const [leftData, setLeftData] = useState(initialLeftData);
    const [rightData, setRightData] = useState(initialRightData);

    const [isLoading, setIsLoading] = useState(false);
    const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
    const [targetCategory, setTargetCategory] = useState<string | null>(null);

    // กัน Race Condition
    const activeRequest = useRef<string>("");

    const allConstitutions = useMemo(() => getAllConstitutions(), []);

    const updateComparison = async (newLeftId: string, newRightId: string) => {
        setLeftId(newLeftId);
        setRightId(newRightId);

        const newUrl = `/${newLeftId}-vs-${newRightId}`;
        window.history.pushState(null, '', newUrl);

        // (Cache check)
        if (newLeftId === leftData.meta.id && newRightId === rightData.meta.id) {
            return;
        }

        setIsLoading(true);
        const requestId = `${newLeftId}-${newRightId}`;
        activeRequest.current = requestId;

        try {
            // เช็คว่าต้องโหลดฝั่งไหนบ้าง
            const leftPromise = newLeftId !== leftData.meta.id ? fetchConstitutionData(newLeftId) : Promise.resolve(leftData);
            const rightPromise = newRightId !== rightData.meta.id ? fetchConstitutionData(newRightId) : Promise.resolve(rightData);

            const [newLeftData, newRightData] = await Promise.all([leftPromise, rightPromise]);

            if (activeRequest.current === requestId) {
                setLeftData(newLeftData);
                setRightData(newRightData);
            }
        } catch (error) {
            console.error("Error swapping constitution:", error);
        } finally {
            if (activeRequest.current === requestId) {
                setIsLoading(false);
            }
        }
    };

    const handleLeftChange = (newId: string) => {
        if (newId === leftId) return;
        if (newId === 'con2495') {
            updateComparison('con2475', 'con2495');
        } else {
            updateComparison(newId, rightId);
        }
    };

    const handleRightChange = (newId: string) => {
        if (newId === rightId) return;
        if (newId === 'con2495') {
            updateComparison('con2475', 'con2495');
        } else {
            updateComparison(leftId, newId);
        }
    };

    useEffect(() => {
        const onPopState = async () => {
            const path = window.location.pathname.replace('/', '');
            const parts = path.split('-vs-');
            if (parts.length === 2) {
                const [l, r] = parts;
                setLeftId(l);
                setRightId(r);
                setIsLoading(true);
                const [dl, dr] = await Promise.all([fetchConstitutionData(l), fetchConstitutionData(r)]);
                setLeftData(dl);
                setRightData(dr);
                setIsLoading(false);
            }
        };
        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, []);

    return (
        <main className="h-screen w-full bg-slate-50 overflow-hidden">
            {/* Scroll Snap Container (Vertical) */}
            <div className="h-full w-full overflow-y-auto snap-y snap-mandatory scroll-smooth">

                {/* Hero Section - Snap Start */}
                <div className="w-full min-h-screen shrink-0 snap-start flex flex-col justify-center relative z-10">
                    <WelcomeHero />
                </div>

                {/* Workspace Section - Snap Start */}
                <div id="workspace" className="w-full min-h-screen shrink-0 snap-start bg-slate-200 flex flex-col relative">
                    <div className="shrink-0 sticky top-0 z-30 bg-slate-200/95 backdrop-blur-sm">
                        {isLoading && (
                            <div className="absolute top-0 left-0 w-full h-1 bg-blue-200 overflow-hidden z-50">
                                <div className="h-full bg-blue-600 animate-pulse w-full origin-left transform scale-x-50"></div>
                            </div>
                        )}

                        <ConceptDiff
                            leftMeta={leftData.meta}
                            rightMeta={rightData.meta}
                            categories={leftData.categories}
                            isCollapsed={isHeaderCollapsed}
                            onToggleCollapse={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
                            leftId={leftId}
                            setLeftId={handleLeftChange}
                            rightId={rightId}
                            setRightId={handleRightChange}
                            allConstitutions={allConstitutions}
                            onCategoryClick={setTargetCategory}
                        />
                    </div>

                    <div className="flex-1 overflow-hidden flex flex-col relative min-h-0 bg-white shadow-inner">
                        <div className="flex-1 min-h-0">
                            {/* Memoized Component */}
                            <MemoizedLayout
                                leftData={leftData.content}
                                rightData={rightData.content}
                                leftMeta={leftData.meta}
                                rightMeta={rightData.meta}
                                headerCollapsed={isHeaderCollapsed}
                                targetCategory={targetCategory}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
