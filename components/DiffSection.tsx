
'use client';
import React from 'react';
import { DisplayRow } from '@/types/diffView';
import DiffRowItem from './DiffRowItem';

const DiffSection = React.memo(({ group, onJumpToPage, forceMobileMode }: {
    group: { id: string; title: string; rows: DisplayRow[] };
    onJumpToPage?: (p: number, s: 'left' | 'right') => void;
    forceMobileMode: boolean;
}) => {
    const firstRow = group.rows[0];
    const classGroupItem = forceMobileMode
        ? "space-y-1 relative z-0 mt-2"
        : "space-y-1 relative z-0 mt-2";

    return (
        <section key={`section-${group.id}`} className="relative mb-8 pt-8">
            <div
                className={`
                    sticky z-30 py-2 px-4 -mx-4 
                    bg-slate-100/95 backdrop-blur border-b border-slate-200 shadow-sm
                    transition-all duration-200 top-0
                `}
            >
                <div className="flex items-center gap-4">
                    <h3 className="text-xs md:text-lg font-bold text-slate-700 uppercase tracking-widest bg-white px-4 py-1 rounded-lg border border-slate-200 shadow-sm whitespace-normal text-center">
                        {group.title}
                    </h3>
                    <div className="h-px flex-1 bg-slate-300"></div>
                </div>
            </div>

            {(firstRow.aiSummary || firstRow.keyChange) && (
                <div className={`mt-6 mb-6 pb-4 grid grid-cols-1 ${forceMobileMode ? '' : 'md:grid-cols-3 md:mx-4'} gap-4`}>
                    {firstRow.aiSummary && (
                        <div className={`bg-slate-100/50 p-4 rounded-lg text-xs leading-relaxed text-slate-600 border border-slate-200/50 ${forceMobileMode ? '' : 'md:col-span-2'}`}>
                            <strong>Summary</strong> {firstRow.aiSummary}
                        </div>
                    )}
                    {firstRow.keyChange && (
                        <div className="bg-amber-50/50 p-4 rounded-lg text-xs leading-relaxed text-slate-700 border border-amber-100/50">
                            <strong>Key Change</strong> {firstRow.keyChange}
                        </div>
                    )}
                </div>
            )}

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
        </section>
    );
});

DiffSection.displayName = 'DiffSection';
export default DiffSection;