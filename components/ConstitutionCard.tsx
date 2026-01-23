'use client';
import { useState } from 'react';
import { CategoryData, DiffStatus } from '@/types';
import { ConstitutionMeta, findPageForCategory } from '@/utils/dataLoader';

interface Props {
    oldData?: CategoryData;
    newData?: CategoryData;
    oldMeta?: ConstitutionMeta;
    newMeta?: ConstitutionMeta;
    onJumpToPage?: (pageNum: number, elementId: string, side: 'left' | 'right') => void;
}

const getStatusColor = (status: DiffStatus = 'modified') => {
    switch (status) {
        case 'added': return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: '+' };
        case 'deleted': return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: '-' };
        case 'modified': return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: '~' };
        default: return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600', icon: '=' };
    }
};

const getPageForSection = (secNum: string): number => {
    if (secNum === 'Preamble') return 1;
    const n = parseInt(secNum);
    if (isNaN(n)) return 1;
    if (n <= 2) return 2;
    if (n <= 4) return 2;
    if (n <= 8) return 3;
    if (n <= 10) return 4;
    if (n <= 11) return 6;
    if (n <= 13) return 7;
    if (n <= 17) return 8;
    if (n <= 36) return 13;
    return 14;
};

export default function ConstitutionDiffCard({ oldData, newData, oldMeta, newMeta, onJumpToPage }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const status: DiffStatus = !oldData ? 'added' : !newData ? 'deleted' : 'modified';
    const colors = getStatusColor(status);

    return (
        <div className={`rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden border ${colors.border} bg-white group`}>

            {/* Header */}
            <div className={`${colors.bg} p-3 border-b ${colors.border} flex gap-3 items-start`}>
                <div className={`font-mono text-lg font-bold ${colors.text} w-6 text-center shrink-0`}>{colors.icon}</div>
                <div>
                    <div className={`text-xs font-bold uppercase tracking-wider ${colors.text} opacity-70`}>CONCEPT CHANGE</div>
                    <div className="text-gray-800 font-medium text-sm leading-snug mt-1">
                        {newData?.key_change || oldData?.key_change}
                    </div>
                </div>
            </div>

            <div className="flex flex-col divide-y divide-gray-100">

                {/* 🔴 OLD VERSION (ต้นฉบับ) */}
                {oldData && (
                    <div className="p-4 bg-red-50/30 relative">
                        <div className="absolute top-2 right-2 text-[10px] font-bold text-red-400 uppercase tracking-widest px-2 py-0.5 border border-red-100 rounded bg-white">
                            ๒๔๗๕ (ชั่วคราว)
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed mb-3 pt-4">{oldData.ai_summary}</p>

                        <button onClick={() => setIsOpen(!isOpen)} className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1">
                            {isOpen ? '▼ ซ่อนต้นฉบับ' : `► ดู ${oldData.section_count} มาตรา`}
                        </button>

                        {isOpen && (
                            <div className="mt-3 space-y-4 pl-3 border-l-2 border-red-200">
                                {oldData.sections.map((sec, idx) => {
                                    const pageNum = oldMeta ? findPageForCategory(oldMeta, oldData.category_id) : 1;
                                    const btnId = `btn-left-${oldData.category_id}-${idx}`;
                                    return (
                                        <div key={idx} className="flex flex-col gap-1 text-xs group/line">
                                            <div className="flex justify-between items-start gap-2">
                                                <span className="font-bold text-red-700 whitespace-nowrap">ม.{sec.section_number}</span>
                                                {/* ปุ่มย้ายมาอยู่ขวาบนของมาตรา */}
                                                <button
                                                    id={btnId}
                                                    onClick={(e) => { e.stopPropagation(); onJumpToPage?.(pageNum, btnId, 'left'); }}
                                                    className="shrink-0 text-[10px] border border-red-200 text-red-400 hover:bg-red-500 hover:text-white px-2 py-0.5 rounded transition-all opacity-50 group-hover/line:opacity-100"
                                                >
                                                    ◄ หน้า {pageNum}
                                                </button>
                                            </div>
                                            {/* แสดงเนื้อหาเต็มๆ ไม่ตัดคำ */}
                                            <div className="text-gray-600 leading-relaxed">
                                                {sec.content}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* 🟢 NEW VERSION (ฉบับใหม่) */}
                {newData && (
                    <div className="p-4 bg-emerald-50/30 relative">
                        <div className="absolute top-2 right-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest px-2 py-0.5 border border-emerald-100 rounded bg-white">
                            ๒๔๗๕ (ถาวร)
                        </div>
                        <p className="text-sm text-gray-800 font-medium leading-relaxed pt-4">{newData.ai_summary}</p>

                        <button onClick={() => setIsOpen(!isOpen)} className="text-xs text-emerald-600 hover:text-emerald-800 font-semibold flex items-center gap-1 mt-2">
                            {isOpen ? '▼ ซ่อนมาตราใหม่' : `► ดู ${newData.section_count} มาตรา`}
                        </button>

                        {isOpen && (
                            <div className="mt-3 space-y-4 pl-3 border-l-2 border-emerald-200">
                                {newData.sections.map((sec, idx) => {
                                    const pageNum = newMeta ? findPageForCategory(newMeta, newData.category_id) : 1;
                                    const btnId = `btn-right-${newData.category_id}-${idx}`;
                                    return (
                                        <div key={idx} className="flex flex-col gap-1 text-xs group/line">
                                            <div className="flex justify-between items-start gap-2">
                                                <span className="font-bold text-emerald-700 whitespace-nowrap">ม.{sec.section_number}</span>
                                                <button
                                                    id={btnId}
                                                    onClick={(e) => { e.stopPropagation(); onJumpToPage?.(pageNum, btnId, 'right'); }}
                                                    className="shrink-0 text-[10px] border border-emerald-200 text-emerald-500 hover:bg-emerald-500 hover:text-white px-2 py-0.5 rounded transition-all opacity-50 group-hover/line:opacity-100"
                                                >
                                                    หน้า {pageNum} ►
                                                </button>
                                            </div>
                                            {/* แสดงเนื้อหาเต็มๆ ไม่ตัดคำ */}
                                            <div className="text-gray-700 leading-relaxed">
                                                {sec.content}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}