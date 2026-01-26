'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { pdfjs } from 'react-pdf';
import DiffViewer from './DiffViewer';
import { ConstitutionContent, ConstitutionMeta } from '@/utils/dataLoader';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useDebouncedElementWidth, useDebouncedWindowWidth } from '@/utils/useDebouncedDimensions';
import PDFSidebar, { PDFSidebarRef } from './PDFSidebar';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Props {
    leftData: ConstitutionContent;
    rightData: ConstitutionContent;
    leftMeta?: ConstitutionMeta;
    rightMeta?: ConstitutionMeta;
    headerCollapsed?: boolean;
}

const getSidebarStyle = (isOpen: boolean, side: 'left' | 'right') => {
    if (!isOpen) {
        return {
            visibility: 'hidden' as const,
            position: 'absolute' as const,
            top: 0,
            bottom: 0,
            [side]: 0,
            zIndex: -1,
            opacity: 0,
            pointerEvents: 'none' as const,
            transform: side === 'left' ? 'translateX(-100%)' : 'translateX(100%)'
        };
    }
    return {
        visibility: 'visible' as const,
        position: 'relative' as const,
        zIndex: 50,
        opacity: 1,
        pointerEvents: 'auto' as const,
        transform: 'translateX(0)'
    };
};

function LiquidPDFLayout({ leftData, rightData, leftMeta, rightMeta, headerCollapsed = false }: Props) {
    const [showLeftPdf, setShowLeftPdf] = useState(false);
    const [showRightPdf, setShowRightPdf] = useState(false);

    const leftPdfRef = useRef<PDFSidebarRef>(null);
    const rightPdfRef = useRef<PDFSidebarRef>(null);

    const centerRef = useRef<HTMLDivElement>(null);

    const windowWidth = useDebouncedWindowWidth(150);
    const centerWidth = useDebouncedElementWidth(centerRef, 100);
    const isMobile = windowWidth > 0 && windowWidth < 768;
    const isContentNarrow = centerWidth > 0 && centerWidth < 400;
    const isCanOpenBothPDF = windowWidth > 1170;

    const toggleLeft = useCallback((val: boolean) => {
        if (val && (isMobile || !isCanOpenBothPDF)) setShowRightPdf(false);
        setShowLeftPdf(val);
    }, [isMobile, isCanOpenBothPDF]);

    const toggleRight = useCallback((val: boolean) => {
        if (val && (isMobile || !isCanOpenBothPDF)) setShowLeftPdf(false);
        setShowRightPdf(val);
    }, [isMobile, isCanOpenBothPDF]);

    if ((isMobile || !isCanOpenBothPDF) && showLeftPdf && showRightPdf) {
        setShowRightPdf(false);
    }

    //lock mobile scroll when open pdf
    useEffect(() => {
        if (isMobile && (showLeftPdf || showRightPdf)) {
            document.body.style.overflow = 'hidden';
            document.body.style.touchAction = 'none';
        } else {
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
        }

        return () => {
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
        };
    }, [isMobile, showLeftPdf, showRightPdf]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (showRightPdf) {
                    toggleRight(false);
                } else if (showLeftPdf) {
                    toggleLeft(false);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showLeftPdf, showRightPdf, toggleLeft, toggleRight]);

    const handleJump = useCallback((pageNum: number, side: 'left' | 'right') => {
        if (side === 'left') toggleLeft(true);
        else toggleRight(true);

        setTimeout(() => {
            const sidebarRef = side === 'left' ? leftPdfRef.current : rightPdfRef.current;
            if (sidebarRef) {
                sidebarRef.scrollToPage(pageNum);
            }
        }, 350);
    }, [toggleLeft, toggleRight]);


    return (
        <div className={`flex flex-1 w-full max-w-[2000px] mx-auto overflow-hidden bg-slate-200 rounded-xl shadow-2xl border border-slate-300 relative group/main transition-all duration-300 ${headerCollapsed ? 'h-[98dvh]' : 'h-[80dvh] md:h-[84dvh]'}`}>
            {/* Mobile Backdrop */}
            {isMobile && (showLeftPdf || showRightPdf) && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 touch-none"
                    onClick={() => {
                        if (showLeftPdf) toggleLeft(false);
                        if (showRightPdf) toggleRight(false);
                    }}
                    onTouchMove={(e) => e.preventDefault()}
                    aria-hidden="true"
                />
            )}
            <div style={getSidebarStyle(showLeftPdf, 'left')} className="transition-all duration-300 ease-in-out h-full">
                <PDFSidebar
                    key={`left-${isMobile ? 'mobile' : 'desktop'}`}
                    ref={leftPdfRef}
                    side="left"
                    data={leftData}
                    meta={leftMeta}
                    isOpen={showLeftPdf}
                    isMobile={isMobile}
                    windowWidth={windowWidth}
                    onClose={() => toggleLeft(false)}
                />
            </div>

            <div ref={centerRef} className="flex-1 flex min-w-0 bg-white relative z-0 transition-all duration-300 h-full">
                <div className={`
                    fixed md:absolute left-4 bottom-6 z-[60] 
                    transition-all duration-300 
                    ${showLeftPdf ? '-translate-x-24 opacity-0' : 'translate-x-0 opacity-100'}
                `}>
                    <button onClick={() => toggleLeft(true)} className="bg-slate-800 text-white p-3 md:py-2 md:px-4 rounded-full shadow-xl hover:bg-blue-600 flex items-center gap-2 transition-all hover:scale-105 active:scale-95">
                        <ChevronRight size={18} /> <span className="text-xs font-bold hidden md:inline">Original</span>
                    </button>
                </div>

                <div className={`
                    fixed md:absolute right-4 bottom-6 z-[60] 
                    transition-all duration-300 
                    ${showRightPdf ? 'translate-x-24 opacity-0' : 'translate-x-0 opacity-100'}
                `}>
                    <button onClick={() => toggleRight(true)} className="bg-slate-800 text-white p-3 md:py-2 md:px-4 rounded-full shadow-xl hover:bg-emerald-600 flex items-center gap-2 transition-all hover:scale-105 active:scale-95">
                        <span className="text-xs font-bold hidden md:inline">Changed</span> <ChevronLeft size={18} />
                    </button>
                </div>

                <div className="flex-1 w-full h-full overflow-hidden bg-slate-50/50">
                    <DiffViewer
                        leftSections={leftData.sections}
                        rightSections={rightData.sections}
                        onJumpToPage={handleJump}
                        forceMobileMode={isContentNarrow}
                    />
                </div>
            </div>

            <div style={getSidebarStyle(showRightPdf, 'right')} className="transition-all duration-300 ease-in-out h-full">
                <PDFSidebar
                    key={`right-${isMobile ? 'mobile' : 'desktop'}`}
                    ref={rightPdfRef}
                    side="right"
                    data={rightData}
                    meta={rightMeta}
                    isOpen={showRightPdf}
                    isMobile={isMobile}
                    windowWidth={windowWidth}
                    onClose={() => toggleRight(false)}
                />
            </div>
        </div>
    );
}

export default React.memo(LiquidPDFLayout);