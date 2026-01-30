'use client';

import React from 'react';
import { BookOpen, Layers, ExternalLink, ArrowRight, MousePointerClick, AlertCircle } from 'lucide-react';

export default function WelcomeHero() {

    const steps = [
        {
            id: 1,
            icon: MousePointerClick,
            title: "เลือกคู่เปรียบเทียบ",
            desc: "เลือกฉบับรัฐธรรมนูญฝั่งซ้ายและขวาจาก Dropdown เพื่อเริ่มการเปรียบเทียบ",
            color: "text-blue-600",
            bg: "bg-blue-50",
            border: "border-blue-100"
        },
        {
            id: 2,
            icon: Layers,
            title: "วิเคราะห์โครงสร้าง",
            desc: "ดูสัดส่วนความสำคัญของแต่ละหมวดผ่านแถบสี Visualization เปรียบเทียบสองฉบับ",
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            border: "border-indigo-100"
        },
        {
            id: 3,
            icon: BookOpen,
            title: "อ่านเนื้อหารายมาตรา",
            desc: "อ่านและเปรียบเทียบเนื้อหาต้นฉบับแบบ Side-by-Side พร้อมไฮไลท์ส่วนที่แตกต่าง",
            color: "text-purple-600",
            bg: "bg-blue-20",
            border: "border-blue-100"
        }
    ];

    const sources = [
        { name: "WeVis ReConstitution", url: "https://reconstitution.wevis.info/" },
        { name: "Parliament Museum", url: "https://parliamentmuseum.go.th/constitution.html" },
        { name: "OpenTypoon OCR", url: "https://opentyphoon.ai/model/typhoon-ocr" }
    ];

    const [isLegalOpen, setIsLegalOpen] = React.useState(false);
    const legalRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (legalRef.current && !legalRef.current.contains(event.target as Node)) {
                setIsLegalOpen(false);
            }
        }
        if (isLegalOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isLegalOpen]);

    const Step1Icon = steps[0].icon;
    const Step2Icon = steps[1].icon;
    const Step3Icon = steps[2].icon;

    return (
        <section className="relative select-none h-100dvh py-10 flex flex-col items-start justify-center bg-slate-50 text-slate-900 overflow-hidden selection:bg-blue-100 selection:text-blue-900">
            {/* Ambient Background - Optimized: Reduced blur complexity and removed heavy animations */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-blue-100/40 via-slate-50 to-slate-50 translate-z-0"></div>
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]"></div>

            {/* Static Glows - Optimized: Removed mix-blend-multiply which causes heavy repaints on resize */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 px-4 sm:px-6 max-w-6xl mx-auto w-full flex flex-col ">

                {/* Hero Header */}
                <div className="text-center space-y-8 mb-10 animate-fade-in-up w-auto">
                    <div className="inline-flex items-center justify-center pl-2 pr-4 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 text-sm font-medium tracking-wide mb-4 shadow-sm hover:border-blue-300 transition-colors">
                        <span className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full mr-2 text-[10px]">⚖️</span>
                        Interactive Constitution Discovery
                    </div>

                    <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-slate-900 leading-tight py-2 mb-2">
                        MATRA <span className="font-serif italic font-light text-transparent bg-clip-text bg-linear-to-r from-slate-500 to-slate-800 px-2 pb-1">มาตรา</span>
                    </h1>

                    <p className="text-lg md:text-2xl text-slate-500 font-light max-w-2xl mx-auto leading-relaxed">
                        สำรวจวิวัฒนาการรัฐธรรมนูญไทย ผ่านการวิเคราะห์โครงสร้าง<br className="hidden md:block" />
                        และเปรียบเทียบความเปลี่ยนแปลงในแต่ละยุคสมัย
                    </p>
                </div>

                {/* Steps: Tech Bento Grid */}
                <div className="w-full max-w-5xl mx-auto mb-10 px-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

                        {/* Item 1: Large Feature Block */}
                        <div className="md:col-span-8 group relative p-8 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 transition-colors duration-300 overflow-hidden">

                            <div className="absolute top-0 right-0 p-8 opacity-60 group-hover:opacity-80 transition-opacity">
                                <div className="flex -space-x-8 scale-100 transform origin-top-right">
                                    <div className="lg:w-24 lg:h-32 w-12 h-16 bg-slate-900 border border-slate-700 rounded-lg shadow-sm -rotate-12 flex flex-col items-center justify-center transition-transform duration-500 ease-out will-change-transform group-hover:-rotate-12 group-hover:-translate-x-3">
                                        <div className="w-16 h-1 bg-slate-400 mb-2"></div>
                                        <div className="w-10 h-1 bg-slate-500"></div>
                                    </div>
                                    <div className="lg:w-24 lg:h-32 w-12 h-16 bg-blue-100 border border-blue-200 rounded-lg shadow-sm rotate-6 z-10 flex flex-col items-center justify-center transition-transform duration-500 ease-out will-change-transform group-hover:rotate-12 group-hover:translate-x-2">
                                        <div className="w-16 h-1 bg-blue-400 mb-2"></div>
                                        <div className="w-10 h-1 bg-blue-300"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="hidden lg:block absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-50 transition-opacity">
                                <Step1Icon size={120} strokeWidth={0.5} />
                            </div>
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="mb-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-50 text-blue-600 border border-blue-100">STEP 01</div>
                                        <div className="h-px w-8 bg-blue-200"></div>
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">{steps[0].title}</h3>
                                    <p className="text-slate-500 font-light leading-relaxed max-w-md">{steps[0].desc}</p>
                                </div>

                            </div>
                        </div>

                        {/* Item 2: Side Block */}
                        <div className="md:col-span-4 group relative py-6 px-8 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 transition-colors duration-300 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <div className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-50 text-indigo-600 border border-indigo-100">STEP 02</div>
                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:rotate-12 transition-transform duration-300">
                                        <Step2Icon size={24} />
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-slate-900 mb-2">{steps[1].title}</h3>
                                <p className="text-slate-500 font-light text-sm leading-relaxed">{steps[1].desc}</p>
                            </div>
                            <div className="mb-1 flex flex-wrap gap-2">
                                {[...Array(12)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-3 h-3 rounded-full ${['bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-teal-500', 'bg-rose-500', 'bg-amber-500'][i % 6]
                                            } opacity-80`}
                                    ></div>
                                ))}
                            </div>
                        </div>

                        {/* Item 3: Full Width Bottom */}
                        <div className="md:col-span-12 group relative p-6 md:p-8 rounded-2xl bg-linear-to-br from-[#2f8db98d] to-[#096cae50] text-white overflow-hidden shadow-lg shadow-[#09a7dc]/20">
                            {/* Background Tech Pattern */}
                            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

                            {/* Decorative Blur */}
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/20 rounded-full blur-3xl pointer-events-none group-hover:bg-white/30 transition-colors"></div>

                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-start gap-6">
                                    <div className="hidden md:flex p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20 group-hover:bg-white/20 transition-colors shadow-inner">
                                        <Step3Icon size={32} className="text-white" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/20 text-white border border-white/30 backdrop-blur-md">STEP 03</div>
                                            <span className="text-cyan-50 text-xs font-mono uppercase tracking-wider font-semibold">Final Analysis</span>
                                        </div>
                                        <h3 className="text-xl md:text-2xl font-bold text-white mb-2 tracking-tight">{steps[2].title}</h3>
                                        <p className="text-cyan-50/90 font-light max-w-xl text-sm md:text-base leading-relaxed">{steps[2].desc}</p>
                                    </div>
                                </div>

                            </div>
                        </div>

                    </div>
                </div>

                {/* CTA and Compact Footer */}
                <div className="flex flex-col items-center gap-6 animate-fade-in-up delay-200 w-full mt-4">
                    <button
                        onClick={() => document.getElementById('workspace')?.scrollIntoView({ behavior: 'smooth' })}
                        className="group relative inline-flex items-center justify-center px-8 py-3.5 font-semibold text-white transition-all duration-200 bg-slate-900 font-lg rounded-full hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 focus:ring-offset-white"
                    >
                        <span className="mr-2">Start Analysis</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        <div className="absolute inset-0 rounded-full ring-2 ring-white/20 group-hover:ring-white/40 transition-all"></div>
                    </button>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-y-3 gap-x-6 text-[10px] md:text-xs text-slate-500 relative z-20">
                        {/* Sources */}
                        <div className="flex items-center gap-2">
                            <span className="text-slate-400 font-medium">Data Sources:</span>
                            <div className="flex items-center gap-3">
                                {sources.map((s, i) => (
                                    <a key={i} href={s.url} target="_blank" rel="noreferrer" className="hover:text-blue-600 transition-colors flex items-center gap-1">
                                        {s.name} <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                                    </a>
                                ))}
                            </div>
                        </div>

                        <div className="hidden md:block w-px h-3 bg-slate-300"></div>

                        {/* License Toggle (Popover) */}
                        <div className="relative" ref={legalRef}>
                            <button
                                onClick={() => setIsLegalOpen(!isLegalOpen)}
                                className="flex items-center gap-1.5 cursor-pointer hover:text-slate-800 transition-colors select-none focus:outline-none"
                            >
                                <AlertCircle className="w-3 h-3" />
                                <span>Legal & License</span>
                            </button>

                            {isLegalOpen && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-[300px] md:w-[400px] p-4 rounded-xl bg-white border border-slate-200 shadow-xl text-left z-50 animate-in fade-in slide-in-from-bottom-2 ring-1 ring-slate-900/5">
                                    <div className="mb-3 p-2.5 bg-amber-50 rounded-lg border border-amber-100 flex gap-2 items-start">
                                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                        <p className="text-[10px] text-amber-900 leading-relaxed">
                                            <span className="font-semibold text-amber-700">ข้อควรระวัง:</span> ข้อมูลบนเว็บไซต์ผ่านการแปลงเป็นรูปแบบดิจิทัลเพื่อการประมวลผล อาจมีความคลาดเคลื่อนทางเทคนิค
                                            โปรดตรวจสอบความถูกต้องเทียบกับ <span className="font-medium underline decoration-amber-300">เอกสาร PDF ต้นฉบับ</span> ที่แนบมาในแต่ละฉบับอีกครั้งเพื่อการอ้างอิงที่สมบูรณ์
                                        </p>
                                    </div>
                                    <p className="text-[10px] text-slate-500 mb-2 font-semibold">
                                        มาตรา ๗ สิ่งต่อไปนี้ไม่ถือว่าเป็นงานอันมีลิขสิทธิ์ตาม พ.ร.บ. ลิขสิทธิ์ พ.ศ. ๒๕๓๗
                                    </p>
                                    <ul className="text-[10px] text-slate-500 space-y-1 pl-4 list-decimal marker:text-slate-400 mb-3">
                                        <li>ข่าวประจำวัน และข้อเท็จจริงต่าง ๆ ที่มีลักษณะเป็นเพียงข่าวสาร</li>
                                        <li>รัฐธรรมนูญ และกฎหมาย</li>
                                        <li>ระเบียบ ข้อบังคับ ประกาศ คำสั่ง คำชี้แจง และหนังสือโต้ตอบของหน่วยงานรัฐ</li>
                                        <li>คำพิพากษา คำสั่ง คำวินิจฉัย และรายงานของทางราชการ</li>
                                        <li>คำแปลและการรวบรวมสิ่งต่าง ๆ ข้างต้นที่หน่วยงานรัฐจัดทำขึ้น</li>
                                    </ul>
                                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                        <span className="text-[10px] text-slate-400">Open source under <span className="font-semibold text-slate-600">MIT License</span></span>
                                    </div>
                                    {/* Arrow Tip */}
                                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-slate-200 transform rotate-45"></div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
