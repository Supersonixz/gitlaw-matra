'use client';
import { useState, useMemo } from 'react';
import { getCatColor } from '@/utils/categoryColors';

// Type ให้ตรงกับไฟล์ JSON ของเรา
interface Section {
    section_number: string;
    content: string;
    status?: string;
    similarity?: number;
}

interface CategoryData {
    constitution_year: number;
    category_id: string;
    category_name: string;
    ai_summary: string;
    key_change: string;
    section_count: number;
    sections: Section[];
}

interface Props {
    data: CategoryData[];
    title?: string;
}

export default function ConstitutionViewer({ data, title = "รัฐธรรมนูญฉบับสมบูรณ์" }: Props) {
    // เลือกหมวดแรกเป็น Default
    const [activeCatId, setActiveCatId] = useState<string>(data[0]?.category_id || '');

    // คำนวณจำนวนมาตราทั้งหมดเพื่อทำ DNA Bar width
    const totalSections = useMemo(() => data.reduce((acc, curr) => acc + curr.section_count, 0), [data]);

    // หาข้อมูลของหมวดที่เลือกอยู่
    const activeData = useMemo(() => data.find(c => c.category_id === activeCatId), [data, activeCatId]);

    return (
        <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-100 font-sans">

            {/* --- HEADER & DNA BAR --- */}
            <div className="bg-slate-50 p-6 border-b border-slate-200">
                <h1 className="text-2xl font-black text-slate-800 mb-4 tracking-tight">{title}</h1>

                {/* DNA Bar Container */}
                <div className="h-10 w-full flex rounded-lg overflow-hidden shadow-inner bg-slate-200 cursor-pointer">
                    {data.map((cat) => {
                        if (cat.section_count === 0) return null;
                        const widthPct = (cat.section_count / totalSections) * 100;
                        const isActive = cat.category_id === activeCatId;

                        return (
                            <div
                                key={cat.category_id}
                                onClick={() => setActiveCatId(cat.category_id)}
                                className={`h-full relative group transition-all duration-200 hover:brightness-110 ${isActive ? 'brightness-110 ring-2 ring-offset-2 ring-black/20 z-10' : 'opacity-90'}`}
                                style={{ width: `${widthPct}%`, backgroundColor: getCatColor(cat.category_id) }}
                            >
                                {/* Tooltip */}
                                <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-20 pointer-events-none">
                                    {cat.category_name} ({cat.section_count} ม.)
                                </div>
                                <div
                                    style={{ width: `${widthPct}%`, backgroundColor: getCatColor(cat.category_id) }}
                                >
                                    {/* เพิ่มเส้นกั้นบางๆ */}
                                    <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-white/20"></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="text-xs text-slate-400 mt-2 text-right">
                    คลิกที่แถบสีเพื่อดูรายละเอียดแต่ละหมวด
                </div>
            </div>

            {/* --- ACTIVE CONTENT AREA --- */}
            {activeData ? (
                <div className="flex flex-col md:flex-row min-h-[600px]">

                    {/* LEFT: AI Summary (30%) */}
                    <div className="md:w-1/3 bg-slate-50/50 p-6 border-r border-slate-100">
                        <div className="sticky top-6">
                            <span
                                className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white mb-4 shadow-sm"
                                style={{ backgroundColor: getCatColor(activeData.category_id) }}
                            >
                                {activeData.category_name}
                            </span>

                            <h3 className="font-bold text-slate-700 mb-2">🤖 บทสรุปจาก AI</h3>
                            <p className="text-sm text-slate-600 leading-relaxed mb-6 font-thai-loop">
                                {activeData.ai_summary}
                            </p>

                            <h3 className="font-bold text-slate-700 mb-2">💡 จุดเปลี่ยนสำคัญ (Key Change)</h3>
                            <div className="text-sm text-slate-600 leading-relaxed bg-amber-50 p-3 rounded-lg border border-amber-100 font-thai-loop">
                                {activeData.key_change}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Section List (70%) */}
                    <div className="md:w-2/3 p-6 bg-white overflow-y-auto h-[800px] custom-scrollbar">
                        <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
                            📜 รายละเอียดมาตรา
                            <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                {activeData.section_count} มาตรา
                            </span>
                        </h3>

                        <div className="space-y-4">
                            {activeData.sections.map((sec) => (
                                <div key={sec.section_number} className="group relative pl-4 border-l-2 hover:border-l-4 transition-all duration-200 border-slate-200 hover:border-blue-400 py-1">

                                    {/* Section Header */}
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-slate-900">มาตรา {sec.section_number}</span>

                                        {/* Status Badge (ถ้ามี) */}
                                        {sec.status === 'VERIFIED' && (
                                            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">
                                                ✅ Verified
                                            </span>
                                        )}
                                        {sec.status === 'REVIEW_NEEDED' && (
                                            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">
                                                ⚠️ Review Needed
                                            </span>
                                        )}
                                        {sec.status === 'OCR_ONLY' && (
                                            <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold">
                                                🤖 OCR
                                            </span>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <p className="text-slate-700 leading-7 font-thai-loop">
                                        {sec.content}
                                    </p>

                                    {/* Debug Info (Hover to see) */}
                                    {sec.similarity !== undefined && (
                                        <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 text-[10px] text-slate-300">
                                            Sim: {(sec.similarity * 100).toFixed(0)}%
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            ) : (
                <div className="p-12 text-center text-slate-400">
                    กรุณาเลือกหมวดหมู่จากแถบด้านบน
                </div>
            )}
        </div>
    );
}