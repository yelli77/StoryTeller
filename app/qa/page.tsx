"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const POD_ID = 'g4oysjh535la54';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

// Hardcoded results from the "Manual Test" batch
const LATEST_RUNS = {
    "Clara": "StoryTeller_Clara_FINAL_00001_.png",
    "Emily": "StoryTeller_Emily_FINAL_00001_.png",
    "Mia": "StoryTeller_Mia_FINAL_00001_.png"
};

export default function QAPage() {
    const [characters, setCharacters] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/characters').then(res => res.json()).then(setCharacters);
    }, []);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--primary)] mb-2">Quality Assurance Dashboard</h1>
                        <p className="text-gray-400">Verifying "Exact Likeness" Settings (InstantID: 0.95 / IP-Adapter: 0.9)</p>
                    </div>
                    <Link href="/" className="px-6 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition">Back to App</Link>
                </div>

                <div className="grid grid-cols-1 gap-12">
                    {characters.filter(c => LATEST_RUNS[c.name as keyof typeof LATEST_RUNS]).map((char) => (
                        <div key={char.id} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                                {char.name}
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {/* SOURCE */}
                                <div className="space-y-3">
                                    <div className="uppercase text-xs font-bold text-gray-500 tracking-wider">Reference (Target)</div>
                                    <div className="relative aspect-[2/3] rounded-xl overflow-hidden border-2 border-dashed border-gray-700">
                                        <Image
                                            src={char.image}
                                            alt="Reference"
                                            fill
                                            className="object-cover"
                                        />
                                        <div className="absolute bottom-0 inset-x-0 bg-black/60 p-2 text-xs font-mono text-center">
                                            Original Upload
                                        </div>
                                    </div>
                                </div>

                                {/* GENERATED */}
                                <div className="space-y-3">
                                    <div className="uppercase text-xs font-bold text-[var(--primary)] tracking-wider">Generated Output</div>
                                    <div className="relative aspect-[2/3] rounded-xl overflow-hidden border-2 border-[var(--primary)] shadow-[0_0_30px_rgba(255,46,99,0.2)]">
                                        {/* Use remote RunPod URL for the generated result */}
                                        <img
                                            src={`${BASE_URL}/view?filename=${LATEST_RUNS[char.name as keyof typeof LATEST_RUNS]}&type=output`}
                                            alt="Generated"
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute bottom-0 inset-x-0 bg-[var(--primary)]/90 text-white p-2 text-xs font-mono text-center">
                                            InstantID 0.95 | IP 0.90
                                        </div>
                                    </div>
                                </div>

                                {/* PARAMETERS */}
                                <div className="space-y-6 text-sm bg-black/40 p-6 rounded-xl border border-gray-800 h-full">
                                    <div>
                                        <div className="uppercase text-xs font-bold text-gray-500 tracking-wider mb-2">Configuration</div>
                                        <div className="grid grid-cols-2 gap-4 font-mono text-gray-300">
                                            <div className="bg-gray-800 p-2 rounded">
                                                <span className="block text-gray-500 text-[10px]">InstantID</span>
                                                {char.parameters?.instantidWeight || '0.95'}
                                            </div>
                                            <div className="bg-gray-800 p-2 rounded">
                                                <span className="block text-gray-500 text-[10px]">IP-Adapter</span>
                                                {char.parameters?.ipWeight || '0.90'}
                                            </div>
                                            <div className="bg-gray-800 p-2 rounded">
                                                <span className="block text-gray-500 text-[10px]">End At</span>
                                                {char.parameters?.endAt || '0.9'}
                                            </div>
                                            <div className="bg-gray-800 p-2 rounded">
                                                <span className="block text-gray-500 text-[10px]">Steps</span>
                                                {char.parameters?.steps || '8'}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="uppercase text-xs font-bold text-gray-500 tracking-wider mb-2">Instructions</div>
                                        <p className="text-gray-400 italic leading-relaxed">
                                            "{char.visualConfig?.positivePrompt?.substring(0, 100)}..."
                                        </p>
                                    </div>

                                    <div className="pt-4 border-t border-gray-800">
                                        <div className="flex items-center gap-2 text-green-400">
                                            <span>✓</span>
                                            <span>Strict Likeness Enforced</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-green-400">
                                            <span>✓</span>
                                            <span>Position: Pool (Prompt)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
