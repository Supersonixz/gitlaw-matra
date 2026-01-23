'use client';
import ConceptDiff from '@/components/ConceptDiff';
import dynamic from 'next/dynamic';
// Import dynamically to avoid SSR issues with react-pdf
const LiquidPDFLayout = dynamic(() => import('@/components/LiquidPDFLayout'), { ssr: false });
import { getAllConstitutions, getConstitutionData } from '@/utils/dataLoader';
import { useState } from 'react';

const DEFAULT_LEFT_ID = 'con2475temp';
const DEFAULT_RIGHT_ID = 'con2475'; // ลองเทียบ Temp กับ Perm ดู

export default function SemanticDiffPage() {
  const [leftId, setLeftId] = useState(DEFAULT_LEFT_ID);
  const [rightId, setRightId] = useState(DEFAULT_RIGHT_ID);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const leftData = getConstitutionData(leftId);
  const rightData = getConstitutionData(rightId);
  const allConstitutions = getAllConstitutions();

  const handleCategoryClick = (catId: string) => {
    setActiveCategory(catId);
  };

  return (
    <main className="h-screen bg-slate-200 flex flex-col font-sans overflow-hidden">

      {/* Header & Controls (Fixed Top) */}
      <header className="bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm z-50 px-8 py-4 flex items-center justify-between shrink-0 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <span className="text-xl">🧬</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight font-sans">CONSTITUTION DNA</h1>
            <p className="text-xs text-slate-500 font-medium tracking-wide text-indigo-500 uppercase">Structural Analysis System</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-100/50 p-1.5 rounded-2xl border border-white/50 shadow-inner">
          {/* Left Selector */}
          <div className="relative group">
            <select
              value={leftId}
              onChange={(e) => setLeftId(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 rounded-xl border-none text-sm font-bold bg-white text-slate-700 shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none cursor-pointer hover:bg-slate-50 transition-colors w-64 truncate"
            >
              {allConstitutions.map(c => <option key={c.id} value={c.id}>{c.year} - {c.name}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              ▼
            </div>
          </div>

          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-black text-xs shadow-inner">
            VS
          </div>

          {/* Right Selector */}
          <div className="relative group">
            <select
              value={rightId}
              onChange={(e) => setRightId(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 rounded-xl border-none text-sm font-bold bg-white text-slate-700 shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none cursor-pointer hover:bg-slate-50 transition-colors w-64 truncate"
            >
              {allConstitutions.map(c => <option key={c.id} value={c.id}>{c.year} - {c.name}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              ▼
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 p-4 overflow-hidden flex flex-col gap-4">

        {/* 1. DNA Bar (ย่อให้เล็กลงหน่อย) */}
        {leftData.meta && rightData.meta && (
          <div className="shrink-0 h-24">
            <ConceptDiff
              leftMeta={leftData.meta}
              rightMeta={rightData.meta}
              categories={leftData.categories}
              onCategoryClick={handleCategoryClick}
            />
          </div>
        )}

        {/* 2. LIQUID LAYOUT (PDF + CONTENT) */}
        <div className="flex-1 min-h-0">
          {leftData.content && rightData.content && (
            <LiquidPDFLayout
              leftData={leftData.content}
              rightData={rightData.content}
              leftMeta={leftData.meta}
              rightMeta={rightData.meta}
            />
          )}
        </div>

      </div>
    </main>
  );
}