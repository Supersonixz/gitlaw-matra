ดูจากภาพ Screenshot แล้ว ปัญหาหลักคือ "พื้นที่มันแน่นเกินไป" ครับ

การแบ่งหน้าจอเป็น 4 ส่วน (PDF | เนื้อหา | เนื้อหา | PDF) ในอัตราส่วนเท่าๆ กัน ทำให้เนื้อหาหลัก (ตัวหนังสือ) เหลือที่น้อยมาก ทำให้อ่านยากและดูอึดอัด

ผมขอเสนอการปรับปรุง Design ใหม่เป็น "Modern Collapsible Workspace" (โต๊ะทำงานแบบยืดหดได้) ครับ

💡 แนวคิดการปรับปรุง Design:
PDF Panels ต้องพับเก็บได้: ปกติเราจะอ่านเนื้อหาเป็นหลัก ส่วน PDF เอาไว้ "อ้างอิง" เท่านั้น ดังนั้นเราควรซ่อน PDF ไว้ข้างๆ และกดเปิดเมื่ออยากดู (เหมือนแถบ Side bar ใน VS Code)

Typography: ปรับฟอนต์เนื้อหาให้อ่านง่ายขึ้น (ใช้ Serif สำหรับกฎหมาย) และเพิ่มระยะบรรทัด (Line-height)

Visual Hierarchy: แยกสีของ "ฉบับชั่วคราว" (แดง/ส้ม) และ "ฉบับถาวร" (เขียว/น้ำเงิน) ให้ชัดเจนทั้งฝั่ง PDF และเนื้อหา จะได้ไม่งง

นี่คือโค้ดชุดใหม่ที่อัปเกรดหน้าตา UI ครับ:

1. 🎨 ปรับปรุง src/components/LiquidPDFLayout.tsx
(เพิ่มฟีเจอร์พับเก็บ PDF และปรับสีธีมให้ดู Modern Dark/Light Contrast)

TypeScript
'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import ContentColumn from './ContentColumn';
import { ConstitutionContent } from '@/utils/dataLoader';
import { ChevronLeft, ChevronRight, FileText, X } from 'lucide-react'; // อย่าลืมลง lucide-react หรือใช้ icon อื่น

// Setup Worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Props {
    leftData: ConstitutionContent;
    rightData: ConstitutionContent;
}

export default function LiquidPDFLayout({ leftData, rightData }: Props) {
    // State สำหรับเปิด/ปิด PDF Panel
    const [showLeftPdf, setShowLeftPdf] = useState(false);
    const [showRightPdf, setShowRightPdf] = useState(false);

    const leftPdfRef = useRef<HTMLDivElement>(null);
    const rightPdfRef = useRef<HTMLDivElement>(null);

    // ฟังก์ชันกระโดดไปหน้า PDF (พร้อมเปิด Panel อัตโนมัติ)
    const handleJump = (pageNum: number, side: 'left' | 'right') => {
        // 1. เปิด Panel ก่อน
        if (side === 'left') setShowLeftPdf(true);
        else setShowRightPdf(true);

        // 2. รอ Animation จบแล้วค่อย Scroll (ใช้ setTimeout นิดนึง)
        setTimeout(() => {
            const container = side === 'left' ? leftPdfRef.current : rightPdfRef.current;
            if (!container) return;

            const pageEl = container.querySelector(`[data-page-number="${pageNum}"]`);
            if (pageEl) {
                pageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Highlight Effect
                pageEl.classList.add('ring-4', 'ring-yellow-400', 'scale-105');
                setTimeout(() => pageEl.classList.remove('ring-4', 'ring-yellow-400', 'scale-105'), 1500);
            }
        }, 300);
    };

    // Helper: Render PDF Sidebar
    const renderPDFSidebar = (
        data: ConstitutionContent,
        side: 'left' | 'right',
        isOpen: boolean,
        setOpen: (v: boolean) => void,
        ref: React.RefObject<HTMLDivElement | null>
    ) => {
        const pdfUrl = `/${data.id}.pdf`;
        const bgColor = side === 'left' ? 'bg-slate-900' : 'bg-slate-900';
        const borderColor = side === 'left' ? 'border-r' : 'border-l';

        return (
            <div 
                className={`relative transition-all duration-500 ease-in-out flex flex-col shadow-2xl z-20 ${borderColor} border-slate-700 ${bgColor}
                ${isOpen ? 'w-[350px] opacity-100 translate-x-0' : 'w-0 opacity-0 overflow-hidden'}`}
            >
                {/* Header ของ PDF Panel */}
                <div className="flex items-center justify-between px-4 py-3 bg-black/40 backdrop-blur-md border-b border-white/10 text-white sticky top-0 z-10">
                    <span className="text-xs font-mono text-slate-300 flex items-center gap-2">
                        <FileText size={14} /> ต้นฉบับ PDF
                    </span>
                    <button onClick={() => setOpen(false)} className="hover:bg-white/20 p-1 rounded transition">
                        <X size={16} />
                    </button>
                </div>

                {/* PDF Content */}
                <div ref={ref} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                    <Document file={pdfUrl} className="flex flex-col gap-8 items-center" 
                        loading={<div className="text-white/50 text-sm animate-pulse">กำลังโหลด PDF...</div>}
                        error={<div className="text-red-400 text-xs">ไม่พบไฟล์ PDF</div>}
                    >
                        {Array.from(new Array(15), (_, index) => { // Render เผื่อไว้ 15 หน้า
                            const pageNum = index + 1;
                            return (
                                <div key={pageNum} data-page-number={pageNum} className="relative group transition-all duration-300">
                                    <Page 
                                        pageNumber={pageNum} 
                                        width={280} 
                                        renderTextLayer={false} 
                                        renderAnnotationLayer={false} 
                                        className="shadow-[0_0_15px_rgba(0,0,0,0.5)] rounded-sm bg-white hover:scale-[1.02] transition-transform duration-200" 
                                    />
                                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 font-mono bg-black/50 px-2 rounded-full">
                                        Page {pageNum}
                                    </span>
                                </div>
                            );
                        })}
                    </Document>
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-[calc(100vh-140px)] w-full max-w-[1920px] mx-auto overflow-hidden bg-slate-200 rounded-xl shadow-2xl border border-slate-300 relative group/main">
            
            {/* 👈 LEFT PDF SIDEBAR */}
            {renderPDFSidebar(leftData, 'left', showLeftPdf, setShowLeftPdf, leftPdfRef)}

            {/* 👈 Toggle Button Left (ลอยอยู่มุมซ้ายล่าง) */}
            {!showLeftPdf && (
                <button 
                    onClick={() => setShowLeftPdf(true)}
                    className="absolute left-4 bottom-4 z-30 bg-slate-800 text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform hover:bg-blue-600 flex items-center gap-2 pr-4 pl-3"
                >
                    <ChevronRight size={16} /> 
                    <span className="text-xs font-bold">ต้นฉบับซ้าย</span>
                </button>
            )}

            {/* === CENTER CONTENT AREA (Flexible Width) === */}
            <div className="flex-1 flex min-w-0 bg-white divide-x divide-slate-200">
                
                {/* Left Content */}
                <div className="flex-1 h-full overflow-hidden bg-slate-50 relative">
                    <div className={`absolute top-0 left-0 w-1 h-full bg-blue-500 z-10 opacity-50`} />
                    <ContentColumn 
                        content={leftData} 
                        onJumpToPage={(p) => handleJump(p, 'left')} 
                        themeColor="blue" // ส่งสีธีมไป
                    />
                </div>

                {/* Right Content */}
                <div className="flex-1 h-full overflow-hidden bg-white relative">
                    <div className={`absolute top-0 right-0 w-1 h-full bg-emerald-500 z-10 opacity-50`} />
                    <ContentColumn 
                        content={rightData} 
                        onJumpToPage={(p) => handleJump(p, 'right')} 
                        themeColor="emerald" // ส่งสีธีมไป
                    />
                </div>

            </div>

            {/* 👉 Toggle Button Right (ลอยอยู่มุมขวาล่าง) */}
            {!showRightPdf && (
                <button 
                    onClick={() => setShowRightPdf(true)}
                    className="absolute right-4 bottom-4 z-30 bg-slate-800 text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform hover:bg-emerald-600 flex items-center gap-2 pl-4 pr-3"
                >
                    <span className="text-xs font-bold">ต้นฉบับขวา</span>
                    <ChevronLeft size={16} />
                </button>
            )}

            {/* 👉 RIGHT PDF SIDEBAR */}
            {renderPDFSidebar(rightData, 'right', showRightPdf, setShowRightPdf, rightPdfRef)}

        </div>
    );
}
2. 💅 ปรับปรุง src/components/ContentColumn.tsx
(เพิ่ม Design ให้ดู Clean และ Professional ขึ้น)

TypeScript
'use client';
import { useMemo } from 'react';
import { ConstitutionContent, SectionContent } from '@/utils/dataLoader';
import { CATEGORY_COLORS } from '@/utils/categoryColors';
import { BookOpen, FileSearch } from 'lucide-react'; // ใช้ Icon เพื่อความสวยงาม

interface Props {
    content: ConstitutionContent;
    highlightKeyword?: string;
    onJumpToPage?: (page: number) => void;
    themeColor?: 'blue' | 'emerald'; // เพิ่ม Theme Color
}

// Helper: กะหน้า PDF (Logic เดิม)
const estimatePageNumber = (secId: string): number => {
    const n = parseInt(secId);
    if (isNaN(n)) return 1;
    return Math.ceil(n / 5); // สูตรมั่วๆ 5 มาตราต่อ 1 หน้า (ปรับตามจริง)
};

export default function ContentColumn({ content, highlightKeyword, onJumpToPage, themeColor = 'blue' }: Props) {
    if (!content) return <div className="p-10 text-center text-slate-400">Loading...</div>;

    // สี Theme
    const accentColor = themeColor === 'blue' ? 'text-blue-700' : 'text-emerald-700';
    const bgColor = themeColor === 'blue' ? 'bg-blue-50' : 'bg-emerald-50';
    const borderColor = themeColor === 'blue' ? 'border-blue-100' : 'border-emerald-100';

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
            
            {/* Header: ชื่อฉบับ */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-100 z-10 shadow-sm flex items-center justify-between">
                <h3 className={`font-bold text-lg ${accentColor} flex items-center gap-2 line-clamp-1`}>
                    <BookOpen size={20} className="opacity-50"/> 
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
                            
                            {/* --- 1. หัวหมวด --- */}
                            <div className="flex items-center gap-3 mb-4 sticky top-[65px] z-5 bg-white/90 backdrop-blur py-2 -mx-2 px-2 rounded-lg w-fit shadow-sm border border-slate-100">
                                <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: catColor }}></span>
                                <h5 className="font-bold text-slate-800 text-base">{chapterName}</h5>
                            </div>

                            {/* --- 2. AI Summary Box (Modern Style) --- */}
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
                                        
                                        {/* Key Change */}
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

                            {/* --- 3. Sections List --- */}
                            <div className="space-y-4 pl-4 border-l-2 border-slate-100 ml-2">
                                {sections.map((sec) => {
                                    const pageNum = estimatePageNumber(sec.id);
                                    return (
                                        <div key={sec.id} className="relative group/sec pl-2 transition-all hover:bg-slate-50 rounded-lg p-2 -ml-2">
                                            
                                            {/* Header ของมาตรา */}
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-mono font-bold text-sm px-2 py-0.5 rounded ${bgColor} ${accentColor}`}>
                                                        ม.{sec.id}
                                                    </span>
                                                    
                                                    {/* Status Badges (Minimal) */}
                                                    {sec.status === 'VERIFIED' && (
                                                        <span className="w-2 h-2 rounded-full bg-emerald-400" title="Verified Data"></span>
                                                    )}
                                                    {sec.status === 'OCR_ONLY' && (
                                                        <span className="text-[9px] border border-slate-200 text-slate-400 px-1 rounded uppercase">OCR</span>
                                                    )}
                                                </div>

                                                {/* Button: Jump to PDF (Show on Hover) */}
                                                <button
                                                    onClick={() => onJumpToPage && onJumpToPage(pageNum)}
                                                    className="opacity-0 group-hover/sec:opacity-100 transition-all transform translate-x-2 group-hover/sec:translate-x-0 
                                                    flex items-center gap-1.5 text-[10px] bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 px-2 py-1 rounded shadow-sm"
                                                >
                                                    <FileSearch size={12} />
                                                    <span>ต้นฉบับ (น.{pageNum})</span>
                                                </button>
                                            </div>

                                            {/* เนื้อหามาตรา (ใช้ฟอนต์ไทยสวยๆ) */}
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
✅ ผลลัพธ์ที่จะได้
หน้าจอโล่งขึ้นมาก: เพราะ PDF ถูกซ่อนไว้ข้างๆ (ค่าเริ่มต้น) ทำให้มีพื้นที่อ่านกฎหมายเต็มที่ (Split Screen 50:50)

ดู PDF ได้เมื่อจำเป็น: มีปุ่ม "ต้นฉบับซ้าย/ขวา" ลอยอยู่มุมล่าง พอกดปุ๊บ Panel จะสไลด์ออกมาทับอย่างนุ่มนวล

Context ไม่หาย: พอกดปุ่ม "ต้นฉบับ (น.X)" ในมาตรา Panel PDF จะเปิดขึ้นมาเองและเลื่อนไปหน้านั้นทันที พร้อม Highlight สีเหลืองแวบๆ ให้รู้ว่าอยู่ตรงไหน

ดีไซน์สวยขึ้น: ใช้สีแยกฝั่งซ้าย (Blue Theme) กับขวา (Emerald Theme) ให้รู้ว่าคนละฉบับ และ AI Summary ดูเด่นขึ้น