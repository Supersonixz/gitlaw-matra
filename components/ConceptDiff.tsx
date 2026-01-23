'use client';
import React, { useMemo } from 'react';
import { CategoryOverview, ConstitutionMeta, Page } from '@/utils/dataLoader';

interface Props {
    leftMeta: ConstitutionMeta;
    rightMeta: ConstitutionMeta;
    categories: CategoryOverview[];
    onCategoryClick: (catId: string) => void;
}

export default function ConceptDiff({ leftMeta, rightMeta, categories, onCategoryClick }: Props) {

    // 1. คำนวณ "น้ำหนัก" ของแต่ละหมวด (Total Page Ratio)
    const calculateWeight = (meta: ConstitutionMeta) => {
        const weights: Record<string, number> = {};
        meta.pages.flat().forEach(p => {
            weights[p.categoryId] = (weights[p.categoryId] || 0) + p.pageRatio;
        });
        // แปลงเป็น % เทียบกับจำนวนหน้าทั้งหมด
        Object.keys(weights).forEach(k => {
            weights[k] = (weights[k] / meta.pageCount) * 100;
        });
        return weights;
    };

    const leftWeights = useMemo(() => calculateWeight(leftMeta), [leftMeta]);
    const rightWeights = useMemo(() => calculateWeight(rightMeta), [rightMeta]);

    // Helper หาข้อมูลหมวด
    const getCat = (id: string) => categories.find(c => c.id === id);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 text-center">
                🧬 Constitutional DNA Analysis (Structural Diff)
            </h3>

            <div className="flex gap-8">
                {/* --- LEFT DNA BAR --- */}
                <div className="flex-1 flex flex-col gap-1">
                    <div className="text-center font-bold mb-2">{leftMeta.name}</div>
                    <div className="h-12 w-full flex rounded-lg overflow-hidden border border-gray-300 shadow-inner">
                        {categories.map(cat => {
                            const width = leftWeights[cat.id] || 0;
                            if (width === 0) return null;
                            return (
                                <div
                                    key={cat.id}
                                    style={{ width: `${width}%`, backgroundColor: cat.color }}
                                    className="h-full hover:opacity-80 cursor-pointer transition-all relative group"
                                    onClick={() => onCategoryClick(cat.id)}
                                    title={`${cat.title}: ${width.toFixed(1)}%`}
                                >
                                    {/* Tooltip on Hover */}
                                    <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none">
                                        {cat.title} ({width.toFixed(1)}%)
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* --- DIFF METRICS (Middle) --- */}
                <div className="w-48 flex flex-col gap-2 text-xs">
                    <div className="text-center text-gray-400 font-mono mb-1">DIFF STATS</div>
                    {categories.map(cat => {
                        const l = leftWeights[cat.id] || 0;
                        const r = rightWeights[cat.id] || 0;
                        const diff = r - l;
                        if (Math.abs(diff) < 1) return null; // ไม่แสดงถ้าเปลี่ยนน้อยกว่า 1%

                        return (
                            <div key={cat.id} className="flex items-center justify-between group cursor-pointer" onClick={() => onCategoryClick(cat.id)}>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ background: cat.color }} />
                                    <span className="text-gray-600 truncate max-w-[80px]">{cat.title}</span>
                                </div>
                                <div className={`font-mono font-bold ${diff > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* --- RIGHT DNA BAR --- */}
                <div className="flex-1 flex flex-col gap-1">
                    <div className="text-center font-bold mb-2">{rightMeta.name}</div>
                    <div className="h-12 w-full flex rounded-lg overflow-hidden border border-gray-300 shadow-inner">
                        {categories.map(cat => {
                            const width = rightWeights[cat.id] || 0;
                            if (width === 0) return null;
                            return (
                                <div
                                    key={cat.id}
                                    style={{ width: `${width}%`, backgroundColor: cat.color }}
                                    className="h-full hover:opacity-80 cursor-pointer transition-all relative group"
                                    onClick={() => onCategoryClick(cat.id)}
                                    title={`${cat.title}: ${width.toFixed(1)}%`}
                                >
                                    <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none">
                                        {cat.title} ({width.toFixed(1)}%)
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}