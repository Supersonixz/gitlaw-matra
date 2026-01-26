const PdfButton = ({ pageNumber, side, onJumpToPage }: { pageNumber: number, side: 'left' | 'right', onJumpToPage?: (p: number, s: 'left' | 'right') => void }) => (
    <button
        onClick={(e) => {
            e.stopPropagation();
            onJumpToPage?.(pageNumber, side);
        }}
        className="float-right ml-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-slate-200 bg-white text-[10px] font-medium text-slate-400 shadow-sm transition-all hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 cursor-pointer select-none"
        title={`Open PDF at page ${pageNumber}`}
    >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
            <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clipRule="evenodd" />
        </svg>
        PDF
    </button>
);

export default PdfButton;
