"use client";
import { useState } from 'react';

export default function LaunchpadPage() {
    const [topic, setTopic] = useState('');
    const [metadata, setMetadata] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        const res = await fetch('/api/metadata/generate', {
            method: 'POST',
            body: JSON.stringify({ topic: topic || "Couple Argument about Anniversary" }) // Default for demo
        });
        const data = await res.json();
        setMetadata(data);
        setLoading(false);
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="text-center">
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--success)] to-[var(--primary)]">
                    Launchpad
                </h1>
                <p className="text-gray-400">Optimize for the algorithm & Deploy.</p>
            </div>

            <div className="glass-panel p-8 space-y-6">
                <div className="flex gap-4">
                    <input
                        className="flex-1 bg-[var(--surface)] border border-[var(--glass-border)] rounded-xl p-3"
                        placeholder="Context for Metadata (e.g. Script Topic)"
                        value={topic}
                        onChange={e => setTopic(e.target.value)}
                    />
                    <button onClick={handleGenerate} className="btn-secondary whitespace-nowrap">
                        {loading ? 'Analyzing...' : 'Generate Viral Hooks'}
                    </button>
                </div>

                {metadata && (
                    <div className="space-y-6 animate-float" style={{ animationIterationCount: 1 }}>
                        <div>
                            <h3 className="text-sm font-bold text-gray-400 mb-2 uppercase">Viral Title Options</h3>
                            <div className="space-y-2">
                                {metadata.titles.map((t: string, i: number) => (
                                    <div key={i} className="bg-[var(--surface)] p-3 rounded-lg border border-[var(--glass-border)] flex justify-between items-center hover:border-[var(--primary)] cursor-pointer group">
                                        <span>{t}</span>
                                        <span className="text-xs bg-[var(--primary)] text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100">Select</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-gray-400 mb-2 uppercase">Smart Tags</h3>
                            <div className="flex flex-wrap gap-2">
                                {metadata.tags.map((t: string, i: number) => (
                                    <span key={i} className="text-xs bg-[var(--surface)] border border-[var(--glass-border)] px-3 py-1 rounded-full text-[var(--secondary)]">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-[var(--glass-border)]">
                            <button
                                onClick={() => setUploading(true)}
                                disabled={uploading}
                                className={`w-full btn-primary py-4 text-xl flex items-center justify-center gap-3 ${uploading ? 'bg-red-600' : ''}`}
                            >
                                {uploading ? (
                                    'Uploading to YouTube...'
                                ) : (
                                    <>
                                        <span>🚀</span> Launch to YouTube
                                    </>
                                )}
                            </button>
                            {uploading && <p className="text-center text-xs text-gray-400 mt-2">Simulating API handshake...</p>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
