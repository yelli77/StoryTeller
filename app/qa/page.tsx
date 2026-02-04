"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const POD_ID = '9f4cwila6ehy9g';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

export default function QAPage() {
    const [characters, setCharacters] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/characters').then(res => res.json()).then(setCharacters);
    }, []);

    const variants = [
        { id: 'Bodysuit', label: 'Masterpiece V16 Benchmark', prefix: 'V16_BENCHMARK_SPREAD' },
        { id: 'Naked', label: 'Masterpiece V16 Benchmark', prefix: 'V16_BENCHMARK_SPREAD' }
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--primary)] mb-2">Character Flux Dashboard</h1>
                        <p className="text-gray-400">Verifying "Flux.1-Dev" (One-Click Template Workflow)</p>
                    </div>
                    <Link href="/" className="px-6 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition">Back to App</Link>
                </div>

                <div className="grid grid-cols-1 gap-12">
                    {characters.map((char) => (
                        <div key={char.id} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
                            <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
                                <h2 className="text-3xl font-bold flex items-center gap-3">
                                    <span className="w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>
                                    {char.name}
                                </h2>
                                <div className="text-sm font-mono text-gray-500 uppercase">Actor ID: {char.id}</div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                                {/* ORIGINAL REFERENCE */}
                                <div className="space-y-3">
                                    <div className="uppercase text-xs font-bold text-gray-500 tracking-wider">Original Upload</div>
                                    <div className="relative aspect-[2/3] rounded-xl overflow-hidden border-2 border-dashed border-gray-700">
                                        <Image
                                            src={char.image}
                                            alt="Reference"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                </div>

                                {/* VARIANTS (V16 BENCHMARK) */}
                                {variants.map(v => (
                                    <div key={v.id} className="space-y-3">
                                        <div className="uppercase text-xs font-bold text-[var(--secondary)] tracking-wider">{v.label}</div>
                                        <div className="relative aspect-[2/3] rounded-xl overflow-hidden border-2 border-[var(--secondary)]/30 group">
                                            <img
                                                src={`${BASE_URL}/view?filename=${v.prefix}_00001_.png&type=output`}
                                                alt={`${char.name} ${v.id}`}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = "https://placehold.co/896x1152/222/555?text=Generating...";
                                                }}
                                            />
                                            <div className="absolute bottom-0 inset-x-0 bg-black/80 backdrop-blur-sm p-3 text-[10px] font-mono border-t border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                                Path: {v.prefix}_00001_.png
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* TECH SPECS */}
                                <div className="bg-black/60 p-6 rounded-xl border border-gray-800 self-start">
                                    <h4 className="text-[var(--primary)] font-bold text-xs uppercase tracking-widest mb-4">Flux.1-Dev Engine</h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-500">Model</span>
                                            <span className="text-green-400 font-mono">Flux-Dev (FP8)</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-500">Guidance</span>
                                            <span className="text-gray-300 font-mono">3.5 (Balanced)</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-500">Steps</span>
                                            <span className="text-gray-300 font-mono">25-30 Precison</span>
                                        </div>
                                        <div className="pt-4 mt-2 border-t border-gray-800">
                                            <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                                <span className="text-green-500">✓</span> No Halos
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1">
                                                <span className="text-green-500">✓</span> High Fidelity Prompting
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-blue-900/20 border border-blue-500/30 p-6 rounded-xl">
                    <h3 className="text-blue-400 font-bold mb-2 flex items-center gap-2">
                        <span className="animate-pulse">●</span> Note for Creator
                    </h3>
                    <p className="text-sm text-blue-200/70 leading-relaxed">
                        The images above are loaded directly from your RunPod instance via a proxy URL. If an image shows a placeholder, it means the generation for that specific character variant is still in progress. Each 4K Pro image takes approximately 45-60 seconds to process.
                    </p>
                </div>
            </div>
        </div>
    );
}
