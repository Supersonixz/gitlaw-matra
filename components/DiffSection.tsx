'use client';
import React from 'react';
import { DisplayRow } from '@/types/diffView';
import DiffRowItem from './DiffRowItem';

// --- Reusable Component for Semantic Blocks ---
const SemanticBlock = ({
    title,
    iconColor,
    iconPath,
    leftText,
    rightText,
    fallbackText,
    forceMobileMode
}: {
    title: string;
    iconColor: string;
    iconPath: React.ReactNode;
    leftText?: string;
    rightText?: string;
    fallbackText?: string;
    forceMobileMode: boolean;
}) => {
    if (!leftText && !rightText && !fallbackText) return null;

    return (
        <div className="group relative rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all hover:shadow-md">
            {/* Header Strip */}
            <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/50 px-4 py-3">
                <div className={`flex items-center justify-center rounded-lg p-1.5 ${iconColor}`}>
                    {iconPath}
                </div>
                <h4 className="text-sm font-bold uppercase tracking-wide text-slate-700">
                    {title}
                </h4>
            </div>

            {/* Content Body */}
            <div className="p-5">
                {fallbackText && !leftText && !rightText ? (
                    // Fallback Case (Single Block)
                    <p className="text-sm leading-relaxed text-slate-600">
                        {fallbackText}
                    </p>
                ) : (
                    // Comparison Grid
                    <div className={`grid gap-6 ${forceMobileMode ? 'grid-cols-1' : 'md:grid-cols-[1fr_auto_1fr]'}`}>

                        {/* Left Side (Reference) */}
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-300"></span>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Reference (เดิม)
                                </span>
                            </div>
                            <div className="rounded-xl bg-slate-50 p-3.5 text-sm leading-relaxed text-slate-600 border border-slate-100/50 min-h-[80px]">
                                {leftText || <span className="text-slate-300 italic">ไม่มีข้อมูล</span>}
                            </div>
                        </div>

                        {/* Divider / Arrow */}
                        <div className={`flex items-center justify-center opacity-30 ${forceMobileMode ? 'rotate-90 py-2' : ''}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-slate-400">
                                <path d="M5 12h14" />
                                <path d="m12 5 7 7-7 7" />
                            </svg>
                        </div>

                        {/* Right Side (Comparison) */}
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`h-1.5 w-1.5 rounded-full ${title === 'AI Summary' ? 'bg-blue-400' : 'bg-amber-400'}`}></span>
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${title === 'AI Summary' ? 'text-blue-600/70' : 'text-amber-600/70'}`}>
                                    Comparison (ใหม่)
                                </span>
                            </div>
                            <div className={`rounded-xl p-3.5 text-sm leading-relaxed font-medium border min-h-[80px]
                                ${title === 'AI Summary'
                                    ? 'bg-blue-50/50 text-slate-700 border-blue-100/50'
                                    : 'bg-amber-50/50 text-slate-800 border-amber-100/50'
                                }
                            `}>
                                {rightText || <span className="text-slate-400/70 italic">ไม่มีการเปลี่ยนแปลง</span>}
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
};


const DiffSection = React.memo(({ group, onJumpToPage, forceMobileMode, isExpanded, onToggle }: {
    group: { id: string; title: string; rows: DisplayRow[] };
    onJumpToPage?: (p: number, s: 'left' | 'right') => void;
    forceMobileMode: boolean;
    isExpanded: boolean;
    onToggle: (id: string) => void;
}) => {
    const firstRow = group.rows[0];
    const rowCount = group.rows.length;

    // Check if we have any semantic content to show
    const hasAiContent = firstRow.leftAiSummary || firstRow.rightAiSummary || firstRow.aiSummary;
    const hasKeyChange = firstRow.leftKeyChange || firstRow.rightKeyChange || firstRow.keyChange;

    const classGroupItem = "space-y-1 relative z-0 mt-2";

    // Memoize Activity Cells to prevent frequent recalculation during expansion animations
    const activityCells = React.useMemo(() => {
        return group.rows.slice(0, 120).map((row, i) => {
            let colorClass = "bg-slate-200"; // MATCH
            if (row.status === 'ADD') colorClass = "bg-emerald-400";
            else if (row.status === 'REMOVE') colorClass = "bg-rose-400";
            else if (row.status === 'MODIFIED') colorClass = "bg-amber-400";

            return (
                <div key={i} className={`w-2.5 h-2.5 rounded-[2px] ${colorClass} opacity-90`} />
            );
        });
    }, [group.rows]);

    const handleToggle = React.useCallback(() => onToggle(group.title), [onToggle, group.title]);

    return (
        <section key={`section-${group.id}`} className="relative">
            {/* --- Sticky Header (Cleaned up) --- */}
            <div
                className={`
                    sticky z-30 px-0 
                    bg-slate-50/95 backdrop-blur-sm
                    transition-all duration-200 top-0 cursor-pointer group/header
                `}
                onClick={handleToggle}
            >
                <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
                    <div className="flex items-center gap-3 bg-white pl-3 pr-5 py-1.5 rounded-full border border-slate-200 shadow-sm transition-all group-hover/header:shadow-md group-hover/header:border-blue-200 group-hover/header:ring-2 group-hover/header:ring-blue-50">
                        <button
                            className={`p-1.5 rounded-full bg-slate-100 text-slate-500 transition-all duration-300 ${isExpanded ? 'rotate-180 bg-blue-100 text-blue-600' : 'rotate-0'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                            </svg>
                        </button>
                        <div className="flex flex-col md:flex-row md:items-baseline md:gap-3">
                            <h3 className="text-sm md:text-base font-bold text-slate-700 uppercase tracking-widest whitespace-normal text-center select-none">
                                {group.title}
                            </h3>
                            {!isExpanded && (
                                <span className="text-[10px] font-bold text-slate-400">
                                    ({rowCount} items)
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
                </div>
            </div>

            {/* --- Activity Cells (Collapsed State) --- */}
            {!isExpanded && (
                <div
                    className="mx-4 md:mx-0 mt-2 p-3 bg-slate-50/40 border border-slate-100/50 rounded-xl flex flex-col items-center gap-2 cursor-pointer hover:bg-slate-50 hover:border-blue-100 transition-all group/activity"
                    onClick={handleToggle}
                    title="Click to expand"
                >
                    <div className="grid grid-cols-10 gap-1">
                        {activityCells}
                    </div>
                    {group.rows.length > 120 && (
                        <div className="text-[10px] text-slate-400 font-mono self-center">
                            +{group.rows.length - 120} more...
                        </div>
                    )}
                </div>
            )}

            {/* --- Main Content (Expanded State) --- */}
            {isExpanded && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="min-h-0">

                        {/* --- Semantic Analysis Area (AI Summary & Key Change) --- */}
                        {(hasAiContent || hasKeyChange) && (
                            <div className={`mt-4 mb-8 flex flex-col gap-6 ${forceMobileMode ? '' : 'mx-4 md:mx-8'}`}>

                                {/* AI Summary Block */}
                                <SemanticBlock
                                    title="AI Summary"
                                    iconColor="text-blue-600 bg-blue-100"
                                    iconPath={
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    }
                                    leftText={firstRow.leftAiSummary}
                                    rightText={firstRow.rightAiSummary}
                                    fallbackText={firstRow.aiSummary}
                                    forceMobileMode={forceMobileMode}
                                />

                                {/* Key Change Block */}
                                <SemanticBlock
                                    title="Key Change"
                                    iconColor="text-amber-600 bg-amber-100"
                                    iconPath={
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    }
                                    leftText={firstRow.leftKeyChange}
                                    rightText={firstRow.rightKeyChange}
                                    fallbackText={firstRow.keyChange}
                                    forceMobileMode={forceMobileMode}
                                />

                            </div>
                        )}

                        {/* --- Content Rows --- */}
                        <div className={classGroupItem}>
                            {group.rows.map(row => (
                                <DiffRowItem
                                    key={row.key}
                                    row={row}
                                    onJumpToPage={onJumpToPage}
                                    forceMobileMode={forceMobileMode}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
});

DiffSection.displayName = 'DiffSection';
export default DiffSection;