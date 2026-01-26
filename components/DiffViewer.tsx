'use client';
import React, { useMemo } from 'react';
import { SectionContent } from '@/utils/dataLoader';
import { alignSections, DiffRow } from '@/utils/diffEngine';
import DiffSection from './DiffSection';
import { DisplayRow } from '@/types/diffView';
import { Virtuoso } from 'react-virtuoso';

interface Props {
    leftSections: SectionContent[];
    rightSections: SectionContent[];
    onJumpToPage?: (page: number, side: 'left' | 'right') => void;
    forceMobileMode?: boolean;
}


function DiffViewerComponent({ leftSections, rightSections, onJumpToPage, forceMobileMode = false }: Props) {

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
                    sectionId: mainSource.sectionId
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
        const groups: { id: string; title: string; rows: DisplayRow[] }[] = [];
        displayRows.forEach(row => {
            const lastGroup = groups[groups.length - 1];
            if (lastGroup && lastGroup.id === row.categoryId) {
                lastGroup.rows.push(row);
            } else {
                groups.push({
                    id: row.categoryId,
                    title: row.categoryTitle,
                    rows: [row]
                });
            }
        });
        return groups;
    }, [displayRows]);
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
                            />
                        </div>
                    )}
                />
            </div>
        </div>
    );
}

export default React.memo(DiffViewerComponent);