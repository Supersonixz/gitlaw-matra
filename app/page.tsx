'use client';
import ConceptDiff from '@/components/ConceptDiff';
import WelcomeHero from '@/components/WelcomeHero';
import dynamic from 'next/dynamic';
// Import dynamically to avoid SSR issues with react-pdf
const LiquidPDFLayout = dynamic(() => import('@/components/LiquidPDFLayout'), { ssr: false });
import { getAllConstitutions, getConstitutionData } from '@/utils/dataLoader';
import { useState, useMemo } from 'react';

const DEFAULT_LEFT_ID = 'con2475temp';
const DEFAULT_RIGHT_ID = 'con2475';

export default function SemanticDiffPage() {
  const [leftId, setLeftId] = useState(DEFAULT_LEFT_ID);
  const [rightId, setRightId] = useState(DEFAULT_RIGHT_ID);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);

  const leftData = useMemo(() => getConstitutionData(leftId), [leftId]);
  const rightData = useMemo(() => getConstitutionData(rightId), [rightId]);
  const allConstitutions = useMemo(() => getAllConstitutions(), []);


  return (
    <main className="bg-slate-200 font-sans">

      {/* 0. Welcome Section */}
      <div className="relative z-10">
        <WelcomeHero />
      </div>

      {/* Main App Container - Sticky to top, full height */}

      {/* Header & Controls - Migrated to ConceptDiff */}
      {/* <SmartHeader ... /> removed */}

      {leftData.meta && rightData.meta && (
        <div className="shrink-0">
          <ConceptDiff
            leftMeta={leftData.meta}
            rightMeta={rightData.meta}
            categories={leftData.categories}
            isCollapsed={isHeaderCollapsed}
            onToggleCollapse={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
            leftId={leftId}
            setLeftId={setLeftId}
            rightId={rightId}
            setRightId={setRightId}
            allConstitutions={allConstitutions}
          />
        </div>
      )}
      <div id="workspace" className="flex-1 overflow-hidden flex flex-col">


        {/* Main Workspace */}
        {/* 2. LIQUID LAYOUT (PDF + CONTENT) */}
        <div className="flex-1 min-h-0">
          {leftData.content && rightData.content && (
            <LiquidPDFLayout
              leftData={leftData.content}
              rightData={rightData.content}
              leftMeta={leftData.meta}
              rightMeta={rightData.meta}
              headerCollapsed={isHeaderCollapsed}
            />
          )}
        </div>

      </div>
    </main>
  );
}