import React, { useMemo } from 'react';
import { CategoryOverview, ConstitutionMeta, Constitution } from '@/utils/dataLoader';
import { CATEGORY_ORDER } from '@/types';
import { CATEGORY_COLORS } from '@/utils/categoryColors';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface Props {
    leftMeta: ConstitutionMeta;
    rightMeta: ConstitutionMeta;
    categories: CategoryOverview[];
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    // Selection Props
    leftId: string;
    setLeftId: (id: string) => void;
    rightId: string;
    setRightId: (id: string) => void;

    allConstitutions: Constitution[];
    // Interactivity
    onCategoryClick?: (id: string) => void;
}

// 1. Calculate "Weight" of each category (Total Page Ratio)
const calculateWeight = (meta: ConstitutionMeta) => {
    const weights: Record<string, number> = {};
    meta.pages.flat().forEach(p => {
        weights[p.categoryId] = (weights[p.categoryId] || 0) + p.pageRatio;
    });
    // Convert to % relative to total pages
    Object.keys(weights).forEach(k => {
        weights[k] = (weights[k] / meta.pageCount) * 100;
    });
    return weights;
};

function ConceptDiff({
    leftMeta, rightMeta, categories, isCollapsed, onToggleCollapse,
    leftId, setLeftId, rightId, setRightId, allConstitutions, onCategoryClick
}: Props) {

    const leftWeights = useMemo(() => calculateWeight(leftMeta), [leftMeta]);
    const rightWeights = useMemo(() => calculateWeight(rightMeta), [rightMeta]);

    return (
        <div className={`w-full select-none bg-white/80 backdrop-blur border-b border-gray-200 px-4 md:px-8 shadow-sm z-20 relative transition-all duration-300 ${isCollapsed ? 'py-1' : 'py-4'}`}>

            {/* Toggle Button - Centered Absolute */}
            <button
                onClick={onToggleCollapse}
                className="absolute left-1/2 -translate-x-1/2 -bottom-3 z-30 bg-white border border-gray-200 rounded-b-lg px-3 py-0.5 shadow-sm text-slate-400 hover:text-blue-500 hover:shadow-md transition-all flex items-center justify-center"
            >
                {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>

            {/* Legend */}
            <div className={`
                flex gap-2 overflow-x-auto py-1 mb-1 px-1
                transition-all duration-300 ease-in-out
                [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']
                ${isCollapsed ? 'opacity-0 h-0 py-0 mb-0 pointer-events-none' : 'opacity-100 h-auto pointer-events-auto'}
            `}>
                {CATEGORY_ORDER.map(cat => {
                    const color = CATEGORY_COLORS[cat.id] || "#ccc";
                    const hasContent = (leftWeights[cat.id] || 0) > 0 || (rightWeights[cat.id] || 0) > 0;

                    return (
                        <button
                            key={cat.id}
                            onClick={() => hasContent && onCategoryClick?.(cat.id)}
                            disabled={!hasContent}
                            className={`flex items-center gap-1.5 shrink-0 px-2 py-1 rounded-full border text-[10px] font-medium transition-colors ${hasContent
                                    ? 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100 hover:border-blue-200 hover:text-blue-600 cursor-pointer'
                                    : 'bg-slate-50/50 border-slate-100 text-slate-300 cursor-not-allowed grayscale opacity-60'
                                }`}
                            title={cat.name}
                        >
                            <span className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: color }}></span>
                            <span className="whitespace-nowrap">{cat.name}</span>
                        </button>
                    );
                })}
            </div>

            {/* Comparison Area - Collapsible */}
            <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isCollapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'}`}>
                <div className="overflow-hidden">
                    <div className="flex flex-col md:flex-row gap-1 md:gap-8 items-stretch pt-2">

                        {/* --- LEFT SIDE --- */}
                        <div className="flex-1 flex flex-col gap-2 group/left">
                            <div className="flex justify-between items-end px-1 gap-3">
                                {/* Left Selector */}
                                <div className="relative flex-1 group/select">
                                    <div className="absolute inset-0 bg-white border border-slate-200 shadow-sm rounded-xl group-hover/select:border-blue-300 group-hover/select:shadow-md transition-all -z-10" />
                                    <select
                                        value={leftId}
                                        onChange={(e) => setLeftId(e.target.value)}
                                        className="appearance-none bg-transparent font-bold text-sm text-slate-800 w-full cursor-pointer hover:text-blue-700 focus:outline-none py-2 pl-3 pr-8 truncate transition-colors"
                                    >
                                        {allConstitutions.map(c => (
                                            <option
                                                key={c.id}
                                                value={c.id}
                                                disabled={c.id === rightId}
                                                className={c.id === rightId ? "text-gray-300" : ""}
                                            >
                                                {c.year} - {c.name} {c.id === rightId ? "(เลือกอยู่ฝั่งขวา)" : ""}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover/select:text-blue-500 pointer-events-none transition-colors" />
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono shrink-0 pb-2">{leftMeta.pageCount} หน้า</div>
                            </div>

                            <div className="h-2 md:h-4 w-full flex rounded-xl overflow-hidden bg-slate-100 relative shadow-inner ring-1 ring-slate-200/50">
                                {categories.map(cat => {
                                    const width = leftWeights[cat.id] || 0;
                                    if (width === 0) return null;
                                    return (
                                        <div
                                            key={cat.id}
                                            style={{ width: `${width}%`, backgroundColor: cat.color }}
                                            className="h-full hover:brightness-110 hover:scale-y-110 transition-all duration-200 relative group"
                                        >
                                            {/* Tooltip */}
                                            <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap z-30 pointer-events-none shadow-xl transform translate-y-1 group-hover:translate-y-0 transition-transform">
                                                <div className="font-bold mb-0.5">{cat.title}</div>
                                                <div className="text-slate-300 font-mono text-[9px]">{width.toFixed(1)}%</div>
                                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* --- VS Separator --- */}
                        <div className="relative flex items-center justify-center py-0">
                            <div className="hidden md:flex absolute inset-0 items-center justify-center">
                                <div className="w-full h-px bg-slate-200"></div>
                            </div>
                            <div className="hidden md:flex absolute inset-0 items-center justify-center">
                                <div className="h-full w-px bg-slate-200"></div>
                            </div>
                            <div className="hidden md:flex relative z-10 bg-white rounded-full p-1.5 border border-slate-100 shadow-sm text-[10px] font-black text-slate-400">
                                VS
                            </div>
                        </div>

                        {/* --- RIGHT SIDE --- */}
                        <div className="flex-1 flex flex-col gap-2 group/right">
                            <div className="flex justify-between items-end px-1 md:flex-row gap-3">
                                {/* Right Selector */}
                                <div className="relative flex-1 text-right md:order-1 order-0 ml-auto group/select">
                                    <div className="absolute inset-0 bg-white border border-slate-200 shadow-sm rounded-xl group-hover/select:border-blue-300 group-hover/select:shadow-md transition-all -z-10" />
                                    <select
                                        value={rightId}
                                        onChange={(e) => setRightId(e.target.value)}
                                        className="appearance-none bg-transparent font-bold text-sm text-slate-800 w-full cursor-pointer hover:text-blue-700 focus:outline-none py-2 pl-3 md:pl-8 pr-3 truncate transition-colors md:text-right md:dir-rtl"
                                    >
                                        {allConstitutions.map(c => (
                                            <option
                                                key={c.id}
                                                value={c.id}
                                                disabled={c.id === leftId}
                                                className={c.id === leftId ? "text-gray-300" : ""}
                                            >
                                                {c.year} - {c.name} {c.id === leftId ? "(เลือกอยู่ฝั่งซ้าย)" : ""}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown size={16} className="absolute right-3 md:left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover/select:text-blue-500 pointer-events-none transition-colors" />
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono shrink-0 md:order-0 order-1 pb-2">{rightMeta.pageCount} หน้า</div>
                            </div>

                            <div className="h-2 md:h-4 w-full flex rounded-xl overflow-hidden bg-slate-100 relative shadow-inner ring-1 ring-slate-200/50 flex-row">
                                {categories.map(cat => {
                                    const width = rightWeights[cat.id] || 0;
                                    if (width === 0) return null;
                                    return (
                                        <div
                                            key={cat.id}
                                            style={{ width: `${width}%`, backgroundColor: cat.color }}
                                            className="h-full hover:brightness-110 hover:scale-y-110 transition-all duration-200 relative group"
                                        >
                                            {/* Tooltip */}
                                            <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap z-30 pointer-events-none shadow-xl transform translate-y-1 group-hover:translate-y-0 transition-transform">
                                                <div className="font-bold mb-0.5">{cat.title}</div>
                                                <div className="text-slate-300 font-mono text-[9px]">{width.toFixed(1)}%</div>
                                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

export default React.memo(ConceptDiff);