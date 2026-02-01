"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Character {
    id: string;
    name: string;
    traits: string;
    image?: string;
    visualConfig?: any;
    parameters?: any;
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

    const selectedChar = characters.find(c => c.id === selectedCharId);
    const selectedLoc = locations.find(l => l.id === selectedLocId);

    const [status, setStatus] = useState<string>('');

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        setResultImage(null);
        setStatus('Initializing...');

        try {
            // Build the final prompt
            let finalPrompt = customPrompt;

            // If location selected, append location context
            if (selectedLoc) {
                finalPrompt = `${finalPrompt}. Location: ${selectedLoc.name}, ${selectedLoc.description}`;
            }

            console.log("[Studio] Final Prompt:", finalPrompt);

            // Get character reference image if available
            let referenceImages: string[] = [];
            if (selectedChar?.image) {
                setStatus('Loading Actor Profile...');
                const response = await fetch(selectedChar.image);
                const blob = await response.blob();
                const reader = new FileReader();
                const base64 = await new Promise<string>((resolve) => {
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                });
                referenceImages = [base64];
            }

            const mergedConfig = selectedChar
                ? { ...(selectedChar.visualConfig || {}), ...(charParams(selectedChar)) }
                : undefined;

            setStatus('Alchemizing on Blackwell...');
            const res = await fetch('/api/image/generate', {
                method: 'POST',
                body: JSON.stringify({
                    prompt: finalPrompt,
                    referenceImages,
                    visualConfig: mergedConfig
                })
            });

            const data = await res.json();
            if (data.image) {
                setResultImage(data.image);
            } else {
                setError(data.error || 'Failed to generate');
            }
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
            setStatus('');
        }
    };

    // Helper for char params
    const charParams = (c: any) => c.parameters || {};

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
                                        <img src={char.image} alt={char.name} className="w-full h-full object-cover" />
                                        <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 text-[10px] text-center">{char.name}</div>
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
                                        <img src={loc.image} alt={loc.name} className="w-full h-full object-cover" />
                                        <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 text-[10px] text-center">{loc.name}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Prompt Input */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Action Prompt</label>
                            <textarea
                                className="w-full bg-black/50 border border-gray-700 rounded-xl p-4 text-white h-32 focus:border-[var(--primary)] focus:outline-none transition-colors"
                                placeholder="Describe exactly what happens... (e.g. smiling at camera, holding a cup of coffee)"
                                value={customPrompt}
                                onChange={e => setCustomPrompt(e.target.value)}
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

                    {/* Preview of Final Prompt (Transparency) */}
                    <div className="bg-black/40 border border-gray-800 p-4 rounded-xl text-xs space-y-2">
                        <p className="text-gray-500 font-bold">SYSTEM PROMPT (SENT TO ENGINE):</p>
                        <p className="text-gray-400 font-mono">
                            {customPrompt || '[Action]'}
                            {selectedChar && ` . Char: ${selectedChar.name} (Seed: ${selectedChar.parameters?.manualSeed || 'Auto'})`}
                            {selectedLoc && ` . Location: ${selectedLoc.name}`}
                        </p>
                    </div>
                </div>

                {/* Result Side */}
                <div className="flex flex-col gap-4">
                    <div className="glass-panel min-h-[600px] flex flex-col relative overflow-hidden bg-black/40 border-dashed border-2 border-gray-800">
                        {resultImage ? (
                            <div className="absolute inset-0 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-800">
                                {/* Compare: Original */}
                                <div className="flex-1 bg-black/40 flex flex-col relative">
                                    <div className="p-2 text-[10px] uppercase font-bold text-gray-400 bg-black/60 sticky top-0 z-10 flex justify-between">
                                        <span>Reference (Source)</span>
                                        <span className="text-[var(--primary)]">Target Likeness</span>
                                    </div>
                                    <div className="flex-1 relative m-4">
                                        <img
                                            src={selectedChar?.image || '/placeholder.png'}
                                            alt="Ref"
                                            className="w-full h-full object-contain opacity-90 mx-auto"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = "https://placehold.co/400x400?text=Identity+Locked";
                                            }}
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
                                        <img src={resultImage} alt="Result" className="w-full h-full object-contain" />
                                    </div>
                                </div>
                            </div>
                        ) : loading ? (
                            <div className="text-center space-y-4">
                                <div className="text-6xl animate-bounce">⚡</div>
                                <p className="text-[var(--primary)] animate-pulse uppercase tracking-[0.2em] font-bold">Requesting Blackwell 5090...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center space-y-4 p-8">
                                <div className="text-5xl">⚠️</div>
                                <p className="text-red-500 font-mono text-sm">{error}</p>
                                <button onClick={handleGenerate} className="text-[var(--primary)] underline font-bold">Retry</button>
                            </div>
                        ) : (
                            <div className="text-center text-gray-700 space-y-2">
                                <div className="text-6xl mb-4 text-gray-800">🖼️</div>
                                <p className="text-lg">Generated Frame will appear here.</p>
                                <p className="text-sm">Select options and hit 'Take Shot'</p>
                            </div>
                        )}
                    </div>

                    {resultImage && (
                        <div className="flex gap-4">
                            <button className="flex-1 btn-secondary">Download HD</button>
                            <button className="flex-1 btn-primary bg-indigo-600 hover:bg-indigo-500 border-indigo-400 shadow-[0_0_20px_rgba(79,70,229,0.4)]">🎞️ Animate (Video)</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
