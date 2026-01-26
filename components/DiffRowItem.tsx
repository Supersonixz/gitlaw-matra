'use client';
import React, { memo } from 'react';
import { DisplayRow } from '@/types/diffView';
import PdfButton from './PdfButton';

function DiffRowItem({ row, onJumpToPage, forceMobileMode }: { row: DisplayRow, onJumpToPage?: (p: number, s: 'left' | 'right') => void, forceMobileMode: boolean }) {
    const { status, left, right, isCompact } = row;
    const cardBase = "rounded-lg border shadow-sm transition-all hover:shadow-md h-full flex flex-col group/card p-3 mb-1 relative";
    const emptyState = forceMobileMode ? "hidden" : "hidden md:block h-full border-none bg-transparent invisible";
    const leftStyle = (status === 'REMOVE' || (isCompact && left)) ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200';
    const rightStyle = (status === 'ADD' || (isCompact && right)) ? 'bg-emerald-50 border-emerald-200' : status === 'MODIFIED' ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200';




    const gridClass = forceMobileMode
        ? "grid grid-cols-1 gap-2 items-start group"
        : "grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 items-start group";

    const labelClass = forceMobileMode
        ? "text-[9px] font-bold text-slate-400 uppercase mr-2 bg-slate-100 px-1 rounded"
        : "md:hidden text-[9px] font-bold text-slate-400 uppercase mr-2 bg-slate-100 px-1 rounded";

    return (
        <div className={gridClass}>
            <div className="relative w-full">
                {left ? (
                    <div className={`${cardBase} ${leftStyle}`}>
                        <div className="flex-1 font-thai-loop text-xs md:text-base text-slate-700 leading-relaxed text-justify block">
                            {left.pageNumber && <PdfButton pageNumber={left.pageNumber} side="left" onJumpToPage={onJumpToPage} />}
                            <span className="font-mono font-bold text-slate-700 select-none text-xs">#{left.id}</span>
                            <span className={labelClass}>REF</span>
                            {isCompact && <span className="text-[9px] text-red-400 font-bold bg-white/50 px-1 rounded mr-1">REMOVED</span>}
                            {left.content}
                        </div>
                    </div>
                ) : (
                    <div className={emptyState} aria-hidden="true" />
                )}
            </div>
            <div className="relative w-full">
                {right ? (
                    <div className={`${cardBase} ${rightStyle}`}>
                        <div className="flex-1 font-thai-loop text-xs md:text-base text-slate-700 leading-relaxed text-justify block">
                            {right.pageNumber && <PdfButton pageNumber={right.pageNumber} side="right" onJumpToPage={onJumpToPage} />}
                            <span className="font-mono font-bold text-slate-700 select-none text-xs">#{right.id}</span>
                            <span className={labelClass}>NEW</span>
                            {isCompact && <span className="text-[9px] text-emerald-400 font-bold bg-white/50 px-1 rounded mr-1">NEW</span>}
                            {right.content}
                        </div>
                    </div>
                ) : (
                    <div className={emptyState} aria-hidden="true" />
                )}
            </div>
        </div>
    );
}

export default memo(DiffRowItem);
