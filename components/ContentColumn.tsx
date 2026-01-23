'use client';
import { useMemo } from 'react';
import { ConstitutionContent, SectionContent } from '@/utils/dataLoader';
import { CATEGORY_COLORS } from '@/utils/categoryColors';
import { BookOpen, FileSearch } from 'lucide-react';
import { ConstitutionMeta } from '@/utils/dataLoader';

interface Props {
    content: ConstitutionContent;
    meta?: ConstitutionMeta;
    highlightKeyword?: string;
    onJumpToPage?: (page: number) => void;
    themeColor?: 'blue' | 'emerald';
}

export default function ContentColumn({ content, highlightKeyword, onJumpToPage, themeColor = 'blue' }: Props) {
    if (!content) return <div className="p-10 text-center text-slate-400">Loading...</div>;

    const accentColor = themeColor === 'blue' ? 'text-blue-700' : 'text-emerald-700';
    const bgColor = themeColor === 'blue' ? 'bg-blue-50' : 'bg-emerald-50';

    const { groupedSections, chapterOrder, richInfoMap } = useMemo(() => {
        const groups: Record<string, SectionContent[]> = {};
        const order: string[] = [];
        const richMap: Record<string, any> = {};

        if (content.richData) {
            content.richData.forEach((cat: any) => richMap[cat.category_name] = cat);
        }

        content.sections.forEach((sec) => {
            const chapter = sec.chapter_name || 'บททั่วไป';
            if (!groups[chapter]) {
                groups[chapter] = [];
                order.push(chapter);
            }
            groups[chapter].push(sec);
        });

        return { groupedSections: groups, chapterOrder: order, richInfoMap: richMap };
    }, [content]);

    return (
        <div className="h-full overflow-y-auto custom-scrollbar flex flex-col">

            {/* Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-100 z-10 shadow-sm flex items-center justify-between">
                <h3 className={`font-bold text-lg ${accentColor} flex items-center gap-2 line-clamp-1`}>
                    <BookOpen size={20} className="opacity-50" />
                    {content.name}
                </h3>
                <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">
                    {content.id}
                </span>
            </div>

            <div className="p-6 space-y-10 pb-20">
                {chapterOrder.map((chapterName) => {
                    const sections = groupedSections[chapterName];
                    const richInfo = richInfoMap[chapterName];
                    const isHighlight = highlightKeyword && chapterName.includes(highlightKeyword);
                    const catId = sections[0]?.category_id || 'general';
                    const catColor = CATEGORY_COLORS[catId] || '#999';

                    return (
                        <div key={chapterName}
                            className={`transition-all duration-500 ${isHighlight ? 'ring-2 ring-yellow-400 rounded-xl p-4 bg-yellow-50/50 shadow-sm' : ''}`}>

                            {/* หัวหมวด */}
                            <div className="flex items-center gap-3 mb-4 sticky top-[65px] z-5 bg-white/90 backdrop-blur py-2 -mx-2 px-2 rounded-lg w-fit shadow-sm border border-slate-100">
                                <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: catColor }}></span>
                                <h5 className="font-bold text-slate-800 text-base">{chapterName}</h5>
                            </div>

                            {/* AI Summary */}
                            {richInfo && (
                                <div className="mb-6 mx-2 p-5 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <span className="text-4xl">🤖</span>
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-2 mb-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                            <span>AI Summary</span>
                                            <div className="h-[1px] flex-1 bg-slate-200"></div>
                                        </div>
                                        <p className="text-sm text-slate-700 leading-relaxed font-thai-loop">
                                            {richInfo.ai_summary}
                                        </p>

                                        <div className="mt-3 flex gap-3 items-start bg-amber-50/80 p-3 rounded-lg border border-amber-100/50">
                                            <span className="text-lg">💡</span>
                                            <div>
                                                <span className="text-xs font-bold text-amber-800 block mb-0.5">จุดเปลี่ยนสำคัญ</span>
                                                <span className="text-xs text-amber-900/80 font-thai-loop leading-relaxed">
                                                    {richInfo.key_change}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Sections List */}
                            <div className="space-y-4 pl-4 border-l-2 border-slate-100 ml-2">
                                {sections.map((sec) => {
                                    // 🔥 ใช้เลขหน้าจาก Data (ที่โหลดมาจาก pdfPageMapping)
                                    const pageNum = sec.pageNumber || 1;

                                    return (
                                        <div key={sec.id} className="relative group/sec pl-2 transition-all hover:bg-slate-50 rounded-lg p-2 -ml-2">

                                            <div className="flex justify-between items-center mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-mono font-bold text-sm px-2 py-0.5 rounded ${bgColor} ${accentColor}`}>
                                                        ม.{sec.id}
                                                    </span>

                                                    {sec.status === 'VERIFIED' && (
                                                        <span className="w-2 h-2 rounded-full bg-emerald-400" title="Verified Data"></span>
                                                    )}
                                                    {sec.status === 'OCR_ONLY' && (
                                                        <span className="text-[9px] border border-slate-200 text-slate-400 px-1 rounded uppercase">OCR</span>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={() => onJumpToPage && onJumpToPage(pageNum)}
                                                    className="opacity-0 group-hover/sec:opacity-100 transition-all transform translate-x-2 group-hover/sec:translate-x-0 
                                                    flex items-center gap-1.5 text-[10px] bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 px-2 py-1 rounded shadow-sm"
                                                >
                                                    <FileSearch size={12} />
                                                    {/* แสดงเลขหน้าที่แม่นยำแล้ว */}
                                                    <span>ต้นฉบับ (น.{pageNum})</span>
                                                </button>
                                            </div>

                                            <p className="text-[15px] text-slate-700 leading-8 font-thai-loop text-justify tracking-wide">
                                                {sec.content}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}