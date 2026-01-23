'use client';

import React, { useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import ContentColumn from './ContentColumn';
import { ConstitutionContent, ConstitutionMeta } from '@/utils/dataLoader';
import { ChevronLeft, ChevronRight, FileText, X } from 'lucide-react';

// Setup Worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Props {
    leftData: ConstitutionContent;
    rightData: ConstitutionContent;
    leftMeta?: ConstitutionMeta;
    rightMeta?: ConstitutionMeta;
}

export default function LiquidPDFLayout({ leftData, rightData, leftMeta, rightMeta }: Props) {
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
        ref: React.RefObject<HTMLDivElement | null>,
        meta?: ConstitutionMeta
    ) => {
        const pdfUrl = `/${data.id}.pdf`;
        const bgColor = 'bg-slate-900';
        const borderColor = side === 'left' ? 'border-r' : 'border-l';
        const pageCount = meta?.pageCount || 15;

        return (
            <div
                className={`relative transition-all duration-500 ease-in-out flex flex-col shadow-2xl z-20 ${borderColor} border-slate-700 ${bgColor}
                ${isOpen ? 'w-[350px] opacity-100 translate-x-0' : 'w-0 opacity-0 overflow-hidden'}`}
            >
                {/* Header ของ PDF Panel */}
                <div className="flex items-center justify-between px-4 py-3 bg-black/40 backdrop-blur-md border-b border-white/10 text-white sticky top-0 z-10 shrink-0">
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
                        {Array.from(new Array(pageCount), (_, index) => {
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
                                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 font-mono bg-black/50 px-2 rounded-full whitespace-nowrap">
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
            {renderPDFSidebar(leftData, 'left', showLeftPdf, setShowLeftPdf, leftPdfRef, leftMeta)}

            {/* 👈 Toggle Button Left (ลอยอยู่มุมซ้ายล่าง) */}
            {!showLeftPdf && (
                <button
                    onClick={() => setShowLeftPdf(true)}
                    className="absolute left-4 bottom-4 z-30 bg-slate-800 text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform hover:bg-blue-600 flex items-center gap-2 pr-4 pl-3 group"
                >
                    <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
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
                        meta={leftMeta}
                        onJumpToPage={(p) => handleJump(p, 'left')}
                        themeColor="blue"
                    />
                </div>

                {/* Right Content */}
                <div className="flex-1 h-full overflow-hidden bg-white relative">
                    <div className={`absolute top-0 right-0 w-1 h-full bg-emerald-500 z-10 opacity-50`} />
                    <ContentColumn
                        content={rightData}
                        meta={rightMeta}
                        onJumpToPage={(p) => handleJump(p, 'right')}
                        themeColor="emerald"
                    />
                </div>

            </div>

            {/* 👉 Toggle Button Right (ลอยอยู่มุมขวาล่าง) */}
            {!showRightPdf && (
                <button
                    onClick={() => setShowRightPdf(true)}
                    className="absolute right-4 bottom-4 z-30 bg-slate-800 text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform hover:bg-emerald-600 flex items-center gap-2 pl-4 pr-3 group"
                >
                    <span className="text-xs font-bold">ต้นฉบับขวา</span>
                    <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                </button>
            )}

            {/* 👉 RIGHT PDF SIDEBAR */}
            {renderPDFSidebar(rightData, 'right', showRightPdf, setShowRightPdf, rightPdfRef, rightMeta)}

        </div>
    );
}