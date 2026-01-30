'use client';

import React, { useRef, useImperativeHandle, useState } from 'react';
import { Document, Page } from 'react-pdf';
import { FileText, X } from 'lucide-react';
import { ConstitutionContent, ConstitutionMeta } from '@/utils/dataLoader';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';

interface PDFSidebarProps {
    side: 'left' | 'right';
    data: ConstitutionContent;
    meta?: ConstitutionMeta;
    isOpen: boolean;
    isMobile: boolean;
    windowWidth: number;
    onClose: () => void;
}

export interface PDFSidebarRef {
    scrollToPage: (pageNumber: number) => void;
}

const PDFSidebar = React.forwardRef<PDFSidebarRef, PDFSidebarProps>(({
    side,
    data,
    meta,
    isOpen,
    isMobile,
    windowWidth,
    onClose
}, ref) => {

    const virtuosoRef = useRef<VirtuosoHandle>(null);
    const [highlightPage, setHighlightPage] = useState<number | null>(null);

    const pdfUrl = React.useMemo(() => `/${data.id}.pdf`, [data.id]);
    const pageCount = React.useMemo(() => meta?.pageCount || 15, [meta?.pageCount]);
    const pageWidth = React.useMemo(() => isMobile ? (windowWidth * 0.75) - 32 : 380, [isMobile, windowWidth]);
    const pageHeight = React.useMemo(() => pageWidth * 1.414, [pageWidth]); // อัตราส่วน A4

    useImperativeHandle(ref, () => ({
        scrollToPage: (pageNumber: number) => {
            if (virtuosoRef.current) {
                virtuosoRef.current.scrollToIndex({
                    index: pageNumber - 1,
                    align: 'center',
                    behavior: 'smooth'
                });

                setHighlightPage(pageNumber);
                setTimeout(() => setHighlightPage(null), 2000);
            }
        }
    }));

    const containerClasses = `
        bg-slate-900 border-slate-700 shadow-2xl flex flex-col 
        h-full w-full ${isMobile ? 'min-w-[75vw]' : 'min-w-[450px]'}
        ${isMobile
            ? `fixed top-0 bottom-0 z-[60] transition-transform duration-300 ease-out 
               ${side === 'left' ? 'left-0 border-r' : 'right-0 border-l'} 
               ${isOpen ? 'translate-x-0' : (side === 'left' ? '-translate-x-full' : 'translate-x-full')}`
            : `relative z-0 h-full border-slate-700 overflow-hidden`
        }
    `;

    return (
        <React.Fragment>
            <div className={containerClasses}>
                {/* Header */}
                <div className="flex rounded-md overflow-hidden items-center justify-between px-3 py-2 bg-black/40 backdrop-blur-md border-b border-white/10 text-white shrink-0 z-10">
                    <span className="hidden md:flex text-xs font-mono text-slate-300   items-center gap-2">
                        <FileText size={14} /> {side === 'left' ? 'Ref (Left)' : 'Comp (Right)'}
                    </span>
                    <button onClick={onClose} className="md:flex hidden hover:bg-white/20 p-2 rounded-full transition active:bg-white/30">
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden bg-slate-900/95 relative overscroll-contain">
                    <Document
                        file={pdfUrl}
                        className="h-full"
                        loading={
                            <div className="flex items-center justify-center h-full text-white/50 text-sm">
                                Loading PDF...
                            </div>
                        }
                        error={
                            <div className="flex items-center justify-center h-full text-red-400 text-sm p-4 text-center">
                                ไม่สามารถโหลดไฟล์ PDF ได้ ({pdfUrl})
                            </div>
                        }
                    >
                        <Virtuoso
                            ref={virtuosoRef}
                            style={{ height: '100%', width: '100%' }}
                            totalCount={pageCount}
                            className="custom-scrollbar overscroll-contain"
                            overscan={2}
                            itemContent={(index) => {
                                const pageNum = index + 1;
                                const isHighlighted = highlightPage === pageNum;

                                return (
                                    <div className="flex justify-center py-6 w-full">
                                        <div className={`relative transition-transform duration-300 ${isHighlighted ? 'scale-105' : ''}`}>
                                            <Page
                                                pageNumber={pageNum}
                                                width={pageWidth}
                                                renderTextLayer={false}
                                                renderAnnotationLayer={false}
                                                className={`shadow-[0_0_15px_rgba(0,0,0,0.5)] rounded-sm bg-white transition-all duration-300 ${isHighlighted ? 'ring-4 ring-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.5)]' : ''}`}
                                                loading={
                                                    <div
                                                        style={{ width: pageWidth, height: pageHeight }}
                                                        className="bg-white/10 shadow-lg rounded-sm animate-pulse flex items-center justify-center"
                                                    >
                                                        <span className="text-white/20 text-xs">Loading Page {pageNum}...</span>
                                                    </div>
                                                }
                                            />
                                            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 font-mono bg-black/40 px-2 py-0.5 rounded-full">
                                                Page {pageNum}
                                            </span>
                                        </div>
                                    </div>
                                );
                            }}
                        />
                    </Document>
                </div>
            </div>
        </React.Fragment>
    );
});

PDFSidebar.displayName = 'PDFSidebar';

export default React.memo(PDFSidebar);