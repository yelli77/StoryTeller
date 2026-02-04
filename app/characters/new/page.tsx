"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface CharacterParams {
    instantidWeight: number;
    guidance: number;
    pulidWeight: number;
    endAt: number;
    steps: number;
    sampler: string;
}

interface VisualConfig {
    positivePrompt: string;
    negativePrompt: string;
}

interface CharacterFormData {
    name: string;
    role: string;
    traits: string;
    voiceId: string;
    image: string;
    isCamera: boolean;
    parameters: CharacterParams;
    visualConfig: VisualConfig;
}

export default function NewCharacterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState<CharacterFormData>({
        name: '',
        role: '',
        traits: '',
        voiceId: '',
        image: '',
        isCamera: false,
        parameters: {
            instantidWeight: 0.8,
            guidance: 3.5,
            pulidWeight: 1.0,
            endAt: 1.0,
            steps: 25,
            sampler: 'euler'
        },
        visualConfig: {
            positivePrompt: '',
            negativePrompt: ''
        }
    });
    const [analyzing, setAnalyzing] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Handle Image Upload
    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const data = new FormData();
        data.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: data
            });
            const json = await res.json();
            if (json.url) {
                setFormData(prev => ({ ...prev, image: json.url }));

                // Trigger "Consistency Check" / Auto-Describe
                analyzeImage();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    const analyzeImage = async () => {
        setAnalyzing(true);
        // Simulate Gemini Vision processing delay
        setTimeout(() => {
            setFormData(prev => ({
                ...prev,
                traits: prev.traits || "Auto-detected: Sharp jawline, casual hoodie, expressive eyebrows. (Gemini Vision Mock)",
                role: prev.role || "The Chill Best Friend"
            }));
            setAnalyzing(false);
        }, 1500);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch('/api/characters', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        router.push('/characters');
    };

    const updateParam = (key: keyof CharacterParams, val: string | number) => {
        setFormData(prev => ({
            ...prev,
            parameters: { ...prev.parameters, [key]: val }
        }));
    };

    const updateVisual = (key: keyof VisualConfig, val: string) => {
        setFormData(prev => ({
            ...prev,
            visualConfig: { ...prev.visualConfig, [key]: val }
        }));
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div className="flex items-center gap-4">
                <Link href="/characters" className="text-gray-400 hover:text-white">← Back</Link>
                <h1 className="text-3xl font-bold">New Character</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Visual Identity Column */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="glass-panel p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* Image Upload */}
                            <div className="flex flex-col items-center justify-center border-2 border-dashed border-[var(--glass-border)] rounded-xl p-8 hover:border-[var(--primary)] transition-colors relative">
                                {formData.image ? (
                                    <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-[var(--success)] shadow-[0_0_20px_var(--success)]">
                                        <Image
                                            src={formData.image}
                                            alt="Preview"
                                            fill
                                            className="object-cover"
                                            sizes="128px"
                                        />
                                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity z-10">
                                            <span className="text-xs">Change</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <div className="text-4xl mb-2">📸</div>
                                        <p className="text-gray-400 text-sm">{uploading ? 'Uploading...' : 'Upload Master Image'}</p>
                                    </div>
                                )}
                                <input type="file" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                            </div>

                            {/* AI Analysis Status */}
                            {analyzing && (
                                <div className="text-center text-[var(--secondary)] animate-pulse text-sm">
                                    ✨ Gemini is analyzing facial consistency & style...
                                </div>
                            )}

                            <div className="flex items-center gap-4 bg-[var(--surface)] p-4 rounded-lg border border-[var(--glass-border)]">
                                <input
                                    type="checkbox"
                                    id="isCamera"
                                    checked={formData.isCamera}
                                    onChange={e => setFormData({ ...formData, isCamera: e.target.checked })}
                                    className="w-5 h-5 accent-[var(--primary)]"
                                />
                                <label htmlFor="isCamera" className="flex flex-col cursor-pointer">
                                    <span className="font-bold text-white">POV Character (Invisible)</span>
                                    <span className="text-xs text-gray-400">Character is the cameraperson and never shown fully in frame.</span>
                                </label>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400">Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-[var(--surface)] border border-[var(--glass-border)] rounded-lg p-3 text-white focus:border-[var(--primary)] focus:outline-none"
                                        placeholder="e.g. Maya"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400">Archetype / Role</label>
                                    <input
                                        type="text"
                                        className="w-full bg-[var(--surface)] border border-[var(--glass-border)] rounded-lg p-3 text-white focus:border-[var(--primary)] focus:outline-none"
                                        placeholder="e.g. The Overthinker"
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Traits & Behavior Prompt</label>
                                <textarea
                                    className="w-full bg-[var(--surface)] border border-[var(--glass-border)] rounded-lg p-3 text-white focus:border-[var(--primary)] focus:outline-none h-32"
                                    placeholder="Describe how they act, speak, and move..."
                                    value={formData.traits}
                                    onChange={e => setFormData({ ...formData, traits: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Voice ID (ElevenLabs Reference)</label>
                                <input
                                    type="text"
                                    className="w-full bg-[var(--surface)] border border-[var(--glass-border)] rounded-lg p-3 text-white focus:border-[var(--primary)] focus:outline-none"
                                    placeholder="e.g. 21m00Tcm4TlvDq8ikWAM"
                                    value={formData.voiceId}
                                    onChange={e => setFormData({ ...formData, voiceId: e.target.value })}
                                />
                            </div>

                            <button type="submit" className="w-full btn-primary mt-4">
                                Save New Character
                            </button>
                        </form>
                    </div>

                    {/* Visual Prompt Overrides */}
                    <div className="glass-panel p-8 border-t-4 border-[var(--primary)]">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <span>🎨</span> Visual Engine Prompts
                        </h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Fixed Positive Prompt (Anatomical Match)</label>
                                <textarea
                                    className="w-full bg-black/50 border border-gray-800 rounded-lg p-3 text-white focus:border-[var(--primary)] focus:outline-none h-24 font-mono text-xs"
                                    value={formData.visualConfig?.positivePrompt || ''}
                                    onChange={e => updateVisual('positivePrompt', e.target.value)}
                                    placeholder="e.g. (massive head:1.8), (no neck:2.2)..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Fixed Negative Prompt</label>
                                <textarea
                                    className="w-full bg-black/50 border border-gray-800 rounded-lg p-3 text-white focus:border-[var(--primary)] focus:outline-none h-24 font-mono text-xs"
                                    value={formData.visualConfig?.negativePrompt || ''}
                                    onChange={e => updateVisual('negativePrompt', e.target.value)}
                                    placeholder="e.g. (slender:1.5), (long neck:2.0)..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Technical Parameters Column */}
                <div className="space-y-8">
                    <div className="glass-panel p-6 border-t-4 border-[var(--secondary)]">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <span>⚙️</span> Engine Settings
                        </h3>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <label className="text-xs text-gray-400 font-bold uppercase">InstantID Weight</label>
                                    <span className="text-[var(--secondary)] font-mono">{formData.parameters?.instantidWeight || 0.8}</span>
                                </div>
                                <input
                                    type="range" min="0" max="1.5" step="0.05"
                                    className="w-full accent-[var(--secondary)]"
                                    value={formData.parameters?.instantidWeight || 0.8}
                                    onChange={e => updateParam('instantidWeight', parseFloat(e.target.value))}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <label className="text-xs text-gray-400 font-bold uppercase">Flux Guidance</label>
                                    <span className="text-[var(--secondary)] font-mono">{formData.parameters?.guidance || 3.5}</span>
                                </div>
                                <input
                                    type="range" min="1" max="10" step="0.1"
                                    className="w-full accent-[var(--secondary)]"
                                    value={formData.parameters?.guidance || 3.5}
                                    onChange={e => updateParam('guidance', parseFloat(e.target.value))}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <label className="text-xs text-gray-400 font-bold uppercase">Native PuLID Weight</label>
                                    <span className="text-[var(--primary)] font-mono">{formData.parameters?.pulidWeight || 1.0}</span>
                                </div>
                                <input
                                    type="range" min="0" max="1.5" step="0.05"
                                    className="w-full accent-[var(--primary)]"
                                    value={formData.parameters?.pulidWeight || 1.0}
                                    onChange={e => updateParam('pulidWeight', parseFloat(e.target.value))}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <label className="text-xs text-gray-400 font-bold uppercase">End Application (Step %)</label>
                                    <span className="text-[var(--secondary)] font-mono">{formData.parameters?.endAt || 1.0}</span>
                                </div>
                                <input
                                    type="range" min="0" max="1.0" step="0.05"
                                    className="w-full accent-[var(--secondary)]"
                                    value={formData.parameters?.endAt || 1.0}
                                    onChange={e => updateParam('endAt', parseFloat(e.target.value))}
                                />
                            </div>

                            <div className="pt-4 border-t border-gray-800 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-gray-500 font-bold uppercase">Steps</label>
                                        <input
                                            type="number"
                                            className="w-full bg-black/50 border border-gray-800 rounded p-2 text-xs text-white"
                                            value={formData.parameters?.steps || 15}
                                            onChange={e => updateParam('steps', parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-gray-500 font-bold uppercase">Sampler</label>
                                        <select
                                            className="w-full bg-black/50 border border-gray-800 rounded p-2 text-xs text-white"
                                            value={formData.parameters?.sampler || 'euler'}
                                            onChange={e => updateParam('sampler', e.target.value)}
                                        >
                                            <option value="euler">Euler</option>
                                            <option value="euler_ancestral">Euler A</option>
                                            <option value="dpmpp_2m">DPM++ 2M</option>
                                            <option value="heun">Heun</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
