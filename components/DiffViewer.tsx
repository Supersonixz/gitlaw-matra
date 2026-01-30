'use client';
import React, { useMemo } from 'react';
import { SectionContent } from '@/utils/dataLoader';
import { alignSections, DiffRow } from '@/utils/diffEngine';
import DiffSection from './DiffSection';
import { DisplayRow } from '@/types/diffView';
import { CATEGORY_ORDER } from '@/types';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';

interface Props {
    leftSections: SectionContent[];
    rightSections: SectionContent[];
    onJumpToPage?: (page: number, side: 'left' | 'right') => void;
    forceMobileMode?: boolean;
    targetCategory?: string | null;
}


function DiffViewerComponent({ leftSections, rightSections, onJumpToPage, forceMobileMode = false, targetCategory }: Props) {
    const virtuosoRef = React.useRef<VirtuosoHandle>(null);

    const rawRows = useMemo(() => alignSections(leftSections, rightSections), [leftSections, rightSections]);
    const displayRows = useMemo(() => {
        const result: DisplayRow[] = [];
        let bufferRemoves: DiffRow[] = [];
        let bufferAdds: DiffRow[] = [];
        const flushBuffers = () => {
            const maxLen = Math.max(bufferRemoves.length, bufferAdds.length);
            for (let i = 0; i < maxLen; i++) {
                const rem = bufferRemoves[i];
                const add = bufferAdds[i];
                const mainSource = rem || add;
                result.push({
                    key: `compact-${rem?.key || 'x'}-${add?.key || 'y'}`,
                    status: mainSource.status,
                    isCompact: true,
                    left: rem?.left || undefined,
                    right: add?.right || undefined,
                    categoryId: mainSource.categoryId,
                    categoryTitle: mainSource.categoryTitle,
                    sectionId: mainSource.sectionId,
                    aiSummary: mainSource.aiSummary,
                    keyChange: mainSource.keyChange,
                    leftAiSummary: mainSource.leftAiSummary,
                    rightAiSummary: mainSource.rightAiSummary,
                    leftKeyChange: mainSource.leftKeyChange,
                    rightKeyChange: mainSource.rightKeyChange
                });
            }
            bufferRemoves = [];
            bufferAdds = [];
        };
        rawRows.forEach(row => {
            if (row.status === 'MODIFIED' || row.status === 'MATCH') {
                flushBuffers();
                result.push(row);
            } else if (row.status === 'REMOVE') {
                bufferRemoves.push(row);
            } else if (row.status === 'ADD') {
                bufferAdds.push(row);
            }
        });
        flushBuffers();
        return result;
    }, [rawRows]);

    const groupedRows = useMemo(() => {
        // Use a Map to ensure unique groups by Title (visual header)
        // This handles cases where data might be interleaved or IDs slightly different
        const groupsMap = new Map<string, { id: string; title: string; rows: DisplayRow[] }>();
        const groups: { id: string; title: string; rows: DisplayRow[] }[] = [];

        displayRows.forEach(row => {
            const key = row.categoryTitle?.trim() || 'Unknown';

            if (groupsMap.has(key)) {
                groupsMap.get(key)!.rows.push(row);
            } else {
                const newGroup = {
                    id: row.categoryId,
                    title: row.categoryTitle,
                    rows: [row]
                };
                groups.push(newGroup);
                groupsMap.set(key, newGroup);
            }
        });


        // Sort groups based on CATEGORY_ORDER
        const orderMap = new Map(CATEGORY_ORDER.map((c, i) => [c.id, i]));

        groups.sort((a, b) => {
            const idxA = orderMap.has(a.id) ? orderMap.get(a.id)! : 999;
            const idxB = orderMap.has(b.id) ? orderMap.get(b.id)! : 999;
            return idxA - idxB;
        });

        return groups;
    }, [displayRows]);

    // Scroll Effect
    React.useEffect(() => {
        if (targetCategory && virtuosoRef.current) {
            const index = groupedRows.findIndex(g => g.id === targetCategory);
            if (index !== -1) {
                virtuosoRef.current.scrollToIndex({
                    index,
                    align: 'start',
                    behavior: 'smooth',
                });
            }
        }
    }, [targetCategory, groupedRows]);
    const [expandedState, setExpandedState] = React.useState<Record<string, boolean>>({});

    const toggleSection = React.useCallback((title: string) => {
        setExpandedState(prev => ({ ...prev, [title]: !prev[title] }));
    }, []);

    // Also reset expanded state when data changes if needed,
    // but preserving it might be better.
    // However, if sections change completely, we might want to reset.
    // For now, let's keep it simple.

    return (
        <div className="w-full h-full flex flex-col font-sans text-sm bg-slate-50/50">

            <div
                className={`${forceMobileMode ? 'hidden' : 'hidden md:grid'} select-none grid-cols-2 gap-4 bg-white/95 backdrop-blur z-20 border-b border-slate-200 shadow-sm px-4 py-2 font-bold text-slate-500 uppercase text-xs tracking-wider shrink-0`}
            >
                <div className="text-center">Reference Document</div>
                <div className="text-center">Comparison Document</div>
            </div>

            <div className="flex-1 min-h-0">
                <Virtuoso
                    ref={virtuosoRef}
                    style={{ height: '100%' }}
                    data={groupedRows}
                    className="custom-scrollbar"
                    overscan={150}
                    itemContent={(index, group) => (
                        <div className="px-4 pb-4">
                            <DiffSection
                                key={`${group.id}-${index}`}
                                group={group}
                                onJumpToPage={onJumpToPage}
                                forceMobileMode={forceMobileMode}
                                isExpanded={!!expandedState[group.title]}
                                onToggle={toggleSection}
                            />
                        </div>
                    )}
                />
            </div>
        </div>
    );
}

export default React.memo(DiffViewerComponent);