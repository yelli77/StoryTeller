"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Character {
    id: string;
    name: string;
    traits: string;
    image?: string;
    visualConfig?: Record<string, any>;
    parameters?: Record<string, any>;
    referenceImages?: string[];
}

interface Location {
    id: string;
    name: string;
    description: string;
    image?: string;
}

export default function StudioPage() {
    const [characters, setCharacters] = useState<Character[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [selectedCharId, setSelectedCharId] = useState<string>('');
    const [selectedLocId, setSelectedLocId] = useState<string>('');
    const [customPrompt, setCustomPrompt] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Technical Tuning States
    const [instantidWeight, setInstantidWeight] = useState(0.7);
    const [ipWeight, setIpWeight] = useState(0.65);
    const [locationWeight, setLocationWeight] = useState(0.6);
    const [steps, setSteps] = useState(15);
    const [guidance, setGuidance] = useState(3.5);
    const [pulidWeight, setPulidWeight] = useState(1.0);
    const [charPositive, setCharPositive] = useState('');
    const [charNegative, setCharNegative] = useState('');

    useEffect(() => {
        // Load Characters
        fetch('/api/characters')
            .then(res => res.json())
            .then(data => setCharacters(data));

        // Load Locations
        fetch('/api/locations')
            .then(res => res.json())
            .then(data => setLocations(data));
    }, []);

    // Sync character params when selection changes
    useEffect(() => {
        const char = characters.find(c => c.id === selectedCharId);
        if (char) {
            if (char.parameters?.steps) setSteps(char.parameters.steps);
            if (char.parameters?.guidance) setGuidance(char.parameters.guidance);
            if (char.parameters?.pulidWeight) setPulidWeight(char.parameters.pulidWeight);
            setCharPositive(char.visualConfig?.positivePrompt || '');
            setCharNegative(char.visualConfig?.negativePrompt || '');
        }
    }, [selectedCharId, characters]);

    const selectedChar = characters.find(c => c.id === selectedCharId);
    const selectedLoc = locations.find(l => l.id === selectedLocId);

    const [status, setStatus] = useState<string>('');

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        setResultImage(null);
        setStatus('Initializing...');

        try {
            // Enhanced scene building logic
            let finalPrompt = "";

            if (customPrompt && customPrompt.trim()) {
                finalPrompt = customPrompt;
            }

            if (selectedLoc) {
                const locContext = `at a ${selectedLoc.name}, ${selectedLoc.description}`;
                finalPrompt = finalPrompt
                    ? `${finalPrompt}, ${locContext}`
                    : `Full shot of character ${locContext}`;
            }

            // Ensure we have a prompt
            if (!finalPrompt) finalPrompt = "raw photo, professional photography";

            console.log("[Studio] Final Prompt:", finalPrompt);

            // Get character reference images (Main + Gallery)
            let referenceImages: string[] = [];

            // 1. Add references from the gallery if they exist
            if (selectedChar?.referenceImages && selectedChar.referenceImages.length > 0) {
                referenceImages = [...selectedChar.referenceImages];
            }

            // 2. Add/Prepend the main image as the primary InstantID reference
            if (selectedChar?.image) {
                // If it's already in the list, move it to front, otherwise add it
                referenceImages = [selectedChar.image, ...referenceImages.filter(img => img !== selectedChar.image)];
            }

            // Convert local paths to base64 if needed (usually handled by backend if they are public paths, 
            // but generateRunpodImage in runpod.ts supports local paths too).
            // Actually, runpod.ts uploadImageToPod handles local public paths.

            const mergedConfig = selectedChar
                ? { ...(selectedChar.visualConfig || {}), ...(charParams(selectedChar)) }
                : undefined;

            setStatus('Alchemizing on Blackwell...');
            const res = await fetch('/api/image/generate', {
                method: 'POST',
                body: JSON.stringify({
                    prompt: finalPrompt,
                    referenceImages,
                    visualConfig: {
                        instantidWeight,
                        ipWeight,
                        locationWeight,
                        steps,
                        guidance,
                        pulidWeight,
                        positivePrompt: charPositive,
                        negativePrompt: charNegative,
                        characterTraits: selectedChar?.traits
                    },
                    locationImage: selectedLoc?.image
                })
            });

            const data = await res.json();
            console.log("[Studio] Generation Result:", data);
            if (data.image) {
                const cacheBuster = `&t=${Date.now()}`;
                setResultImage(data.image + cacheBuster);
                setStatus('');
            } else {
                console.error("[Studio] No image in response:", data);
                setError(data.error || 'The Alchemist returned no image. Check logs.');
            }
        } catch (err) {
            console.error("[Studio] Generation Error:", err);
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    // Helper for char params
    const charParams = (c: Character) => c.parameters || {};

    return (
        <div className="max-w-6xl mx-auto space-y-8 p-4">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold text-white">Manual Studio</h1>
                    <p className="text-gray-400">1:1 Control over Character, Location and Prompt.</p>
                </div>
                <Link href="/" className="btn-secondary">Back to Cockpit</Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Configuration Side */}
                <div className="space-y-6">
                    <div className="glass-panel p-6 space-y-6">
                        {/* Character Selection */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-[var(--primary)] uppercase tracking-wider">Actor</label>
                            <div className="grid grid-cols-3 gap-2">
                                {characters.map(char => (
                                    <button
                                        key={char.id}
                                        onClick={() => setSelectedCharId(char.id === selectedCharId ? '' : char.id)}
                                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedCharId === char.id ? 'border-[var(--primary)] ring-2 ring-[var(--primary-glow)] scale-95' : 'border-gray-800'}`}
                                    >
                                        {char.image && (
                                            <Image
                                                src={char.image}
                                                alt={char.name}
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 768px) 33vw, 200px"
                                            />
                                        )}
                                        <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 text-[10px] text-center z-10">{char.name}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Location Selection */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-[var(--secondary)] uppercase tracking-wider">Set / Location</label>
                            <div className="grid grid-cols-3 gap-2">
                                {locations.map(loc => (
                                    <button
                                        key={loc.id}
                                        onClick={() => setSelectedLocId(loc.id === selectedLocId ? '' : loc.id)}
                                        className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${selectedLocId === loc.id ? 'border-[var(--secondary)] ring-2 ring-[var(--secondary-glow)] scale-95' : 'border-gray-800'}`}
                                    >
                                        {loc.image && (
                                            <Image
                                                src={loc.image}
                                                alt={loc.name}
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 768px) 33vw, 200px"
                                            />
                                        )}
                                        <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 text-[10px] text-center z-10">{loc.name}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Prompt Input */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Action Prompt</label>
                            <textarea
                                className="w-full bg-black/50 border border-gray-700 rounded-xl p-4 text-white h-24 text-sm focus:border-[var(--primary)] focus:outline-none transition-colors"
                                placeholder="Describe exactly what happens... (e.g. smiling at camera, holding a cup of coffee)"
                                value={customPrompt}
                                onChange={e => setCustomPrompt(e.target.value)}
                            />
                        </div>

                        {/* Base Identity & Negative Edit */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Base Identity Prompt</label>
                                <textarea
                                    className="w-full bg-black/50 border border-gray-800 rounded-lg p-2 text-[10px] text-gray-400 h-20 focus:border-[var(--primary)] focus:outline-none transition-colors"
                                    value={charPositive}
                                    onChange={e => setCharPositive(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Base Exclusions (Negative)</label>
                                <textarea
                                    className="w-full bg-black/50 border border-gray-800 rounded-lg p-2 text-[10px] text-red-900/40 h-20 focus:border-red-900/50 focus:outline-none transition-colors font-mono"
                                    value={charNegative}
                                    onChange={e => setCharNegative(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Technical Tuning */}
                        <div className="space-y-4 pt-4 border-t border-gray-800">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Character Likeness</label>
                                <span className="text-[var(--primary)] text-xs font-mono bg-[var(--primary)]/10 px-2 py-0.5 rounded">{instantidWeight.toFixed(2)}</span>
                            </div>
                            <input
                                type="range" min="0.1" max="1.0" step="0.05"
                                value={instantidWeight} onChange={e => setInstantidWeight(parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
                            />

                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Character Soul (IP-Adapter)</label>
                                <span className="text-[var(--primary)] text-xs font-mono bg-[var(--primary)]/10 px-2 py-0.5 rounded">{ipWeight.toFixed(2)}</span>
                            </div>
                            <input
                                type="range" min="0.1" max="1.0" step="0.05"
                                value={ipWeight} onChange={e => setIpWeight(parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
                            />

                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Environment Influence</label>
                                <span className="text-[var(--secondary)] text-xs font-mono bg-[var(--secondary)]/10 px-2 py-0.5 rounded">{locationWeight.toFixed(2)}</span>
                            </div>
                            <input
                                type="range" min="0.1" max="1.0" step="0.05"
                                value={locationWeight} onChange={e => setLocationWeight(parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[var(--secondary)]"
                            />

                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Precision (Steps)</label>
                                <span className="text-gray-400 text-xs font-mono bg-gray-800 px-2 py-0.5 rounded">{steps}</span>
                            </div>
                            <input
                                type="range" min="4" max="50" step="1"
                                value={steps} onChange={e => setSteps(parseInt(e.target.value))}
                                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-gray-500"
                            />

                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Guidance (Flux)</label>
                                <span className="text-[var(--primary)] text-xs font-mono bg-[var(--primary)]/10 px-2 py-0.5 rounded">{guidance.toFixed(1)}</span>
                            </div>
                            <input
                                type="range" min="1.0" max="10.0" step="0.1"
                                value={guidance} onChange={e => setGuidance(parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
                            />

                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Native PuLID Likeness</label>
                                <span className="text-[var(--primary)] text-xs font-mono bg-[var(--primary)]/10 px-2 py-0.5 rounded">{pulidWeight.toFixed(2)}</span>
                            </div>
                            <input
                                type="range" min="0.1" max="2.0" step="0.05"
                                value={pulidWeight} onChange={e => setPulidWeight(parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
                            />
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={loading}
                            className={`w-full py-4 rounded-xl text-xl font-bold transition-all flex items-center justify-center gap-3 ${loading ? 'bg-gray-700' : 'btn-primary shadow-[0_0_30px_rgba(255,46,99,0.3)]'}`}
                        >
                            {loading ? (
                                <>
                                    <span className="animate-spin text-2xl">☢️</span>
                                    {status || 'Alchemizing...'}
                                </>
                            ) : (
                                <>
                                    <span>📸</span> Take Shot
                                </>
                            )}
                        </button>
                    </div>

                    <div className="bg-black/40 border border-gray-800 p-4 rounded-xl text-[10px] space-y-3 font-mono">
                        <div>
                            <p className="text-gray-500 font-bold mb-1 uppercase tracking-tighter">POSITIVE ENGINE PROMPT:</p>
                            <p className="text-gray-400 italic leading-relaxed">
                                <span className="opacity-50">(Style: Photo 1.3), </span>
                                {charPositive && <><span className="text-[var(--primary)]">{charPositive}</span>, </>}
                                {selectedChar?.traits && <><span className="text-gray-500">{selectedChar.traits}</span>, </>}
                                {customPrompt ? <><span className="text-white">{customPrompt}</span></> : <span className="opacity-30">[Action Prompt]</span>}
                                {selectedLoc && <>, at <span className="text-[var(--secondary)]">{selectedLoc.name}</span></>}
                                <span className="opacity-50">, (Quality: 8k, Detailed...)</span>
                            </p>
                        </div>
                        {charNegative && (
                            <div>
                                <p className="text-red-900/50 font-bold mb-1 uppercase tracking-tighter">ENGINE NEGATIVE (EXCLUSIONS):</p>
                                <p className="text-red-900/40 italic leading-relaxed">{charNegative}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Result Side */}
                <div className="flex flex-col gap-4">
                    <div className="glass-panel min-h-[600px] flex flex-col relative overflow-hidden bg-black/40 border-dashed border-2 border-gray-800">
                        {resultImage ? (
                            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-800 min-h-[600px] w-full">
                                {/* Compare: Original */}
                                <div className="flex-1 bg-black/40 flex flex-col relative">
                                    <div className="p-2 text-[10px] uppercase font-bold text-gray-400 bg-black/60 sticky top-0 z-10 flex justify-between">
                                        <span>Reference (Source)</span>
                                        <span className="text-[var(--primary)]">Target Likeness</span>
                                    </div>
                                    <div className="flex-1 relative m-4">
                                        <img
                                            src={selectedChar?.image || 'https://placehold.co/400x400?text=Identity+Locked'}
                                            alt="Ref"
                                            className="w-full h-full object-contain opacity-90 mx-auto"
                                        />
                                    </div>
                                </div>
                                {/* Compare: Generated */}
                                <div className="flex-1 flex flex-col relative">
                                    <div className="p-2 text-[10px] uppercase font-bold text-[var(--primary)] bg-black/60 sticky top-0 z-10 flex justify-between">
                                        <span>Result (AI)</span>
                                        <span>Generated Shot</span>
                                    </div>
                                    <div className="flex-1 relative m-4">
                                        <img
                                            src={resultImage}
                                            alt="Result"
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : loading ? (
                            <div className="text-center space-y-4 m-auto">
                                <div className="text-6xl animate-bounce">⚡</div>
                                <p className="text-[var(--primary)] animate-pulse uppercase tracking-[0.2em] font-bold">Requesting Blackwell 5090...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center space-y-4 p-8 m-auto">
                                <div className="text-5xl">⚠️</div>
                                <p className="text-red-500 font-mono text-sm">{error}</p>
                                <button onClick={handleGenerate} className="text-[var(--primary)] underline font-bold">Retry</button>
                            </div>
                        ) : (
                            <div className="text-center text-gray-700 space-y-2 m-auto">
                                <div className="text-6xl mb-4 text-gray-800">🖼️</div>
                                <p className="text-lg">Generated Frame will appear here.</p>
                                <p className="text-sm">Select options and hit &apos;Take Shot&apos;</p>
                            </div>
                        )}
                    </div>

                    {resultImage && (
                        <div className="flex gap-4">
                            <button className="flex-1 btn-secondary">Download HD</button>
                            <button
                                onClick={async () => {
                                    setLoading(true);
                                    setStatus('Animating character...');
                                    try {
                                        const res = await fetch('/api/video/generate', {
                                            method: 'POST',
                                            body: JSON.stringify({
                                                prompt: customPrompt || "smiling and moving slightly",
                                                startImage: resultImage,
                                                duration: 2,
                                                visualConfig: {
                                                    characterTraits: selectedChar?.traits,
                                                    instantidWeight,
                                                    ipWeight
                                                }
                                            })
                                        });
                                        const data = await res.json();
                                        if (data.video) {
                                            window.location.href = `/player?jobId=${data.video}`;
                                        } else {
                                            setError(data.error || "Animation failed");
                                        }
                                    } catch (err) {
                                        setError("Connection error");
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                                className="flex-1 btn-primary bg-indigo-600 hover:bg-indigo-500 border-indigo-400 shadow-[0_0_20px_rgba(79,70,229,0.4)]"
                            >
                                🎞️ Animate (Video)
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
