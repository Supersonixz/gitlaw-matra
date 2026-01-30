
'use client';
import React from 'react';
import { DisplayRow } from '@/types/diffView';
import DiffRowItem from './DiffRowItem';

const DiffSection = React.memo(({ group, onJumpToPage, forceMobileMode, isExpanded, onToggle }: {
    group: { id: string; title: string; rows: DisplayRow[] };
    onJumpToPage?: (p: number, s: 'left' | 'right') => void;
    forceMobileMode: boolean;
    isExpanded: boolean;
    onToggle: () => void;
}) => {
    const firstRow = group.rows[0];
    const rowCount = group.rows.length;
    const classGroupItem = forceMobileMode
        ? "space-y-1 relative z-0 mt-2"
        : "space-y-1 relative z-0 mt-2";


    return (
        <section key={`section-${group.id}`} className="relative mb-8 pt-8">
            <div
                className={`
                    sticky z-30 py-2 px-4 -mx-4 
                    bg-slate-100/95 backdrop-blur border-b border-slate-200 shadow-sm
                    transition-all duration-200 top-0 cursor-pointer hover:bg-slate-200/90 group/header
                `}
                onClick={onToggle}
            >
                <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-slate-300"></div>
                    <div className="flex items-center gap-2 bg-white px-4 py-1 rounded-lg border border-slate-200 shadow-sm transition-all group-hover/header:shadow-md group-hover/header:border-slate-300">
                        <button
                            className={`p-1 rounded-full transition-transform duration-200 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-slate-500">
                                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                            </svg>
                        </button>
                        <h3 className="text-xs md:text-lg font-bold text-slate-700 uppercase tracking-widest whitespace-normal text-center select-none">
                            {group.title}
                        </h3>
                        {!isExpanded && (
                            <span className="ml-2 px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                                {rowCount} items
                            </span>
                        )}
                    </div>
                    <div className="h-px flex-1 bg-slate-300"></div>
                </div>
            </div>

            {isExpanded && (
                <>
                    {(firstRow.aiSummary || firstRow.keyChange) && (
                        <div className={`mt-6 mb-8 grid grid-cols-1 ${forceMobileMode ? '' : 'md:grid-cols-3 md:mx-4'} gap-6`}>
                            {firstRow.aiSummary && (
                                <div className={`
                                    relative overflow-hidden rounded-xl border border-blue-100 bg-linear-to-br from-blue-50 to-white 
                                    p-5 shadow-sm hover:shadow-md transition-shadow duration-300
                                    ${forceMobileMode ? '' : 'md:col-span-2'}
                                `}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="p-1.5 bg-blue-100 rounded-md">
                                            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <h4 className="text-sm font-bold text-blue-900 uppercase tracking-wide">
                                            AI Summary
                                        </h4>
                                    </div>
                                    <p className="text-sm leading-relaxed text-slate-700 font-medium">
                                        {firstRow.aiSummary}
                                    </p>
                                </div>
                            )}
                            {firstRow.keyChange && (
                                <div className={`
                                    relative overflow-hidden rounded-xl border border-orange-100 bg-linear-to-br from-orange-50 to-white 
                                    p-5 shadow-sm hover:shadow-md transition-shadow duration-300
                                `}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="p-1.5 bg-orange-100 rounded-md">
                                            <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                        </div>
                                        <h4 className="text-sm font-bold text-orange-900 uppercase tracking-wide">
                                            Key Change
                                        </h4>
                                    </div>
                                    <p className="text-sm leading-relaxed text-slate-800">
                                        {firstRow.keyChange}
                                    </p>
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
                </>
            )}
        </section>
    );
});

DiffSection.displayName = 'DiffSection';
export default DiffSection;