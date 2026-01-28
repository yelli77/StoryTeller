"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewLocationPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [generating, setGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isSvg, setIsSvg] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleGeneratePreview = async () => {
        if (!description) return;
        setGenerating(true);
        setGeneratedImage(null);

        try {
            const res = await fetch('/api/image/generate', {
                method: 'POST',
                body: JSON.stringify({ prompt: `Environmental shot: ${description}` })
            });
            const json = await res.json();

            if (json.error) {
                alert(`Image Generation Failed: ${json.error}`);
            }

            if (json.image) {
                setGeneratedImage(json.image);
                setIsSvg(json.isSvg);
            }
        } catch (e: any) {
            console.error("Preview generation error", e);
            alert("Failed to generate preview: " + e.message);
        } finally {
            setGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!name || !description || !generatedImage) return;
        setSaving(true);

        try {
            await fetch('/api/locations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    description,
                    image: generatedImage
                })
            });
            router.push('/locations');
        } catch (e) {
            console.error("Failed to save location", e);
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]">
                    Scout New Location
                </h1>
                <p className="text-gray-400">Define a new set piece for your stories.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Form */}
                <div className="glass-panel p-6 space-y-6">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Location Name</label>
                        <input
                            type="text"
                            className="w-full bg-gray-900 border border-[var(--glass-border)] rounded-lg p-3 text-white focus:border-[var(--primary)] outline-none"
                            placeholder="e.g. Dark Alleyway"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Visual Description</label>
                        <textarea
                            className="w-full h-40 bg-gray-900 border border-[var(--glass-border)] rounded-lg p-3 text-white focus:border-[var(--primary)] outline-none resize-none"
                            placeholder="Describe the lighting, colors, objects, and atmosphere..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                        <p className="text-xs text-gray-500 mt-2">More detail = better consistency.</p>
                    </div>

                    <button
                        onClick={handleGeneratePreview}
                        disabled={generating || !description}
                        className={`w-full btn-secondary py-3 ${generating ? 'opacity-50' : ''}`}
                    >
                        {generating ? 'Scouting...' : 'Generate Preview'}
                    </button>
                </div>

                {/* Preview */}
                <div className="glass-panel p-6 flex flex-col">
                    <h3 className="text-lg font-bold mb-4 text-gray-300">Location Snapshot</h3>
                    <div className="flex-1 bg-black rounded-lg overflow-hidden border border-[var(--glass-border)] flex items-center justify-center relative group">
                        {generatedImage ? (
                            isSvg ? (
                                <div className="w-full h-full bg-gray-900" dangerouslySetInnerHTML={{ __html: generatedImage }} />
                            ) : (
                                <img src={generatedImage} alt="Preview" className="w-full h-full object-cover" />
                            )
                        ) : (
                            <div className="text-center text-gray-600">
                                <span className="text-4xl block mb-2">📷</span>
                                <p>Preview will appear here</p>
                            </div>
                        )}

                        {generating && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                                <div className="animate-spin text-4xl text-[var(--primary)]">⚡</div>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 pt-6 border-t border-[var(--glass-border)]">
                        <button
                            onClick={handleSave}
                            disabled={!generatedImage || !name || saving}
                            className={`w-full btn-primary py-4 text-lg font-bold ${saving ? 'opacity-50' : ''}`}
                        >
                            {saving ? 'Securing Location...' : 'Confirm & Save Location'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
