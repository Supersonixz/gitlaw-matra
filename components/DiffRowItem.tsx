'use client';
import React, { memo } from 'react';
import { DisplayRow } from '@/types/diffView';
import PdfButton from './PdfButton';

const getCardStyle = (status: string, isCompact: boolean, hasData: boolean, side: 'left' | 'right') => {
    if (side === 'left') {
        return (status === 'REMOVE' || (isCompact && hasData)) ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200';
    } else {
        return (status === 'ADD' || (isCompact && hasData))
            ? 'bg-emerald-50 border-emerald-200'
            : status === 'MODIFIED'
                ? 'bg-amber-50 border-amber-200'
                : 'bg-white border-slate-200';
    }
};

function DiffRowItem({ row, onJumpToPage, forceMobileMode }: { row: DisplayRow, onJumpToPage?: (p: number, s: 'left' | 'right') => void, forceMobileMode: boolean }) {
    const { status, left, right, isCompact } = row;
    const cardBase = "rounded-lg border shadow-sm transition-shadow duration-200 hover:shadow-md h-full flex flex-col group/card p-3 mb-1 relative";
    const emptyState = forceMobileMode ? "hidden" : "hidden md:block h-full border-none bg-transparent invisible";

    const leftStyle = getCardStyle(status, !!isCompact, !!left, 'left');
    const rightStyle = getCardStyle(status, !!isCompact, !!right, 'right');

    const gridClass = forceMobileMode
        ? "grid grid-cols-1 gap-2 items-start group"
        : "grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 items-start group";

    const labelClass = forceMobileMode
        ? "text-[9px] font-bold text-slate-400 uppercase mr-2 bg-slate-100 px-1 rounded"
        : "md:hidden text-[9px] font-bold text-slate-400 uppercase mr-2 bg-slate-100 px-1 rounded";

    // --- MATCH STATUS: Special Mobile View ---
    if (status === 'MATCH') {
        const DesktopView = (
            <div className={`hidden md:grid grid-cols-2 md:gap-4 items-start group w-full ${forceMobileMode ? '!hidden' : ''}`}>
                <div className="relative w-full">
                    <div className={`${cardBase} ${leftStyle}`}>
                        <div className="flex-1 text-xs text-slate-700 leading-relaxed text-justify block">
                            {left?.pageNumber && <PdfButton pageNumber={left.pageNumber} side="left" onJumpToPage={onJumpToPage} />}
                            <span className="font-mono font-bold text-slate-700 select-none text-xs">#{left?.id}</span>
                            <span className="md:hidden text-[9px] font-bold text-slate-400 uppercase mr-2 bg-slate-100 px-1 rounded">REF</span>
                            {left?.content && <ExpandableText content={left.content} />}
                        </div>
                    </div>
                </div>
                <div className="relative w-full">
                    <div className={`${cardBase} ${rightStyle}`}>
                        <div className="flex-1 text-xs text-slate-700 leading-relaxed text-justify block">
                            {right?.pageNumber && <PdfButton pageNumber={right.pageNumber} side="right" onJumpToPage={onJumpToPage} />}
                            <span className="font-mono font-bold text-slate-700 select-none text-xs">#{right?.id}</span>
                            <span className="md:hidden text-[9px] font-bold text-slate-400 uppercase mr-2 bg-slate-100 px-1 rounded">NEW</span>
                            {right?.content && <ExpandableText content={right.content} />}
                        </div>
                    </div>
                </div>
            </div>
        );

        const MobileView = (
            <div className={`md:hidden w-full ${forceMobileMode ? '!block' : ''}`}>
                <div className={`${cardBase} bg-white border-slate-200 border-dashed opacity-80`}>
                    <div className="flex-1 text-xs text-slate-600 leading-relaxed text-justify block">
                        <div className="flex items-center gap-2 mb-2">

                            <span className="font-mono font-bold text-slate-500 select-none text-xs">#{left?.id}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                                MATCH
                            </span>
                            <div className="flex  flex-1 gap-1 justify-between">
                                {left?.pageNumber && <PdfButton pageNumber={left.pageNumber} side="left" onJumpToPage={onJumpToPage} />}
                                {right?.pageNumber && right.pageNumber !== left?.pageNumber && <PdfButton pageNumber={right.pageNumber} side="right" onJumpToPage={onJumpToPage} />}
                            </div>
                        </div>
                        {left?.content && <ExpandableText content={left.content} />}
                    </div>
                </div>
            </div>
        );

        return (
            <div className="w-full">
                {DesktopView}
                {MobileView}
            </div>
        );
    }

    // --- NON-MATCH STATUS (or fallback) ---
    return (
        <div className={gridClass}>
            <div className="relative w-full">
                {left ? (
                    <div className={`${cardBase} ${leftStyle}`}>
                        <div className="flex-1  text-xs  text-slate-700 leading-relaxed text-justify block">
                            {left.pageNumber && <PdfButton pageNumber={left.pageNumber} side="left" onJumpToPage={onJumpToPage} />}
                            <span className="font-mono font-bold text-slate-700 select-none text-xs">#{left.id}</span>
                            <span className={labelClass}>REF</span>
                            {isCompact && <span className="text-[9px] text-red-400 font-bold bg-white/50 px-1 rounded mr-1">REMOVED</span>}
                            {left.content && <ExpandableText content={left.content} />}
                        </div>
                    </div>
                ) : (
                    <div className={emptyState} aria-hidden="true" />
                )}
            </div>
            <div className="relative w-full">
                {right ? (
                    <div className={`${cardBase} ${rightStyle}`}>
                        <div className="flex-1   text-xs  text-slate-700 leading-relaxed text-justify block">
                            {right.pageNumber && <PdfButton pageNumber={right.pageNumber} side="right" onJumpToPage={onJumpToPage} />}
                            <span className="font-mono font-bold text-slate-700 select-none text-xs">#{right.id}</span>
                            <span className={labelClass}>NEW</span>
                            {isCompact && <span className="text-[9px] text-emerald-400 font-bold bg-white/50 px-1 rounded mr-1">NEW</span>}
                            {right.content && <ExpandableText content={right.content} />}
                        </div>
                    </div>
                ) : (
                    <div className={emptyState} aria-hidden="true" />
                )}
            </div>
        </div>
    );
}

// Helper Component for Expandable Text
const ExpandableText = ({ content }: { content: string }) => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const MAX_LENGTH = 300; // Characters before truncation

    const shouldTruncate = content.length > MAX_LENGTH;

    const displayedContent = (!isExpanded && shouldTruncate)
        ? content.slice(0, MAX_LENGTH)
        : content;

    const formattedContent = React.useMemo(() => formatText(displayedContent), [displayedContent]);

    return (
        <div
            className={`relative ${shouldTruncate ? 'cursor-pointer' : ''}`}
            onClick={(e) => {
                if (shouldTruncate) {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                }
            }}
        >
            {formattedContent}
            {!isExpanded && shouldTruncate && <span className="text-slate-400 select-none">... </span>}

            {shouldTruncate && (
                <button
                    onClick={(e) => {
                        e.stopPropagation(); // Double safety, though parent handles it now too
                        setIsExpanded(!isExpanded);
                    }}
                    className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-slate-400 hover:text-slate-600 uppercase tracking-wide transition-colors ml-1 select-none"
                    type="button"
                >
                    {isExpanded ? 'Collapse' : 'More'}
                </button>
            )}
        </div>
    );
};

// Helper to format text with nice line breaks for list items like (1), (2) or ก. ข.
const formatText = (text: string) => {
    if (!text) return null;

    // PROTECT ABBREVIATIONS: "พ.ศ." and "พ.ร.บ."
    // Replace them with safe tokens so they don't get split by the regex
    const SAFE_BE = "___BE___";
    const SAFE_ACT = "___ACT___";

    const safeText = text
        .replace(/พ\.ศ\./g, SAFE_BE)
        .replace(/พ\.ร\.บ\./g, SAFE_ACT);

    // Split by (1), (2)... or ก. ข. (Thai bullets) or digits 1. 2.
    // Regex explanation:
    // (\(\d+\))  -> Matches (1), (20)
    // ([ก-ฮ]\.)  -> Matches ก., ข. (Simple Thai bullet)
    // ( {2,})    -> Matches 2 or more spaces
    // (?:\r\n|\r|\n) -> Matches newlines

    const parts = safeText.split(/(\(\d+\)|[ก-ฮ]\.| {2,}|(?:\r\n|\r|\n))/g);

    return parts.map((part, index) => {
        // Restore abbreviations
        const displayPart = part
            .replace(new RegExp(SAFE_BE, 'g'), "พ.ศ.")
            .replace(new RegExp(SAFE_ACT, 'g'), "พ.ร.บ.");

        // Handle explicit newlines
        if (/^[\r\n]+$/.test(part)) {
            return <br key={index} className="mb-2" />;
        }

        // Handle multiple spaces -> Treat as linebreak
        if (/^ {2,}$/.test(part)) {
            return <br key={index} className="mb-2" />;
        }

        const isListHeader = /^\(\d+\)$/.test(part) || /^[ก-ฮ]\.$/.test(part);

        if (isListHeader) {
            // Check if we should break line
            // Don't break if:
            // - First item
            // - Prev part is newline or double space (they already break)
            // - Prev part is short content (e.g. just "และ" or empty)

            const prevPart = index > 0 ? parts[index - 1] : "";
            const isNewline = /^[\r\n]+$/.test(prevPart);
            const isDoubleSpace = /^ {2,}$/.test(prevPart);

            // Keep on same line if previous content is short (e.g. < 30 chars). Increased slightly to handle "มาตรา 98 ยกเว้น"
            const isShort = prevPart.trim().length < 30;

            // SPECIAL CHECK: If we have Number -> Number (e.g. (15) -> (2)), force break if sequence resets (2 <= 15)
            let sequenceReset = false;

            // Check if current is (N) and previous header was (M)
            // We need to look back at parts[index-2] which should be the previous header if index-1 was short content
            if (index > 1 && /^\(\d+\)$/.test(part)) {
                const prevHeader = parts[index - 2];
                if (/^\(\d+\)$/.test(prevHeader)) {
                    const currNum = parseInt(part.replace(/\D/g, ''), 10);
                    const prevNum = parseInt(prevHeader.replace(/\D/g, ''), 10);

                    // If current number is less than or equal to previous, assume it's a new list/dedent -> Force break
                    if (currNum <= prevNum) {
                        sequenceReset = true;
                    }
                }
            }

            const shouldBreak = index > 0 && !isNewline && !isDoubleSpace && (!isShort || sequenceReset);

            return (
                <React.Fragment key={index}>
                    {shouldBreak && <br className="block mb-2" />}
                    <span className="font-bold text-slate-900 inline-block mr-1">{displayPart}</span>
                </React.Fragment>
            );
        }

        return <span key={index}>{displayPart}</span>;
    });
};

export default memo(DiffRowItem);
