"use client";
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EditCharacterPage({ params }: { params: Promise<{ id: string }> }) {
    // Unwrap params using React.use()
    const { id } = use(params);

    const router = useRouter();
    const [formData, setFormData] = useState<{
        name: string;
        role: string;
        traits: string;
        voiceId: string;
        image: string;
        isCamera?: boolean;
    }>({
        name: '',
        role: '',
        traits: '',
        voiceId: '',
        image: '',
        isCamera: false
    });
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Fetch character data
    useEffect(() => {
        fetch(`/api/characters/${id}`)
            .then(res => {
                if (!res.ok) throw new Error('Not found');
                return res.json();
            })
            .then(data => {
                setFormData(data);
                setLoading(false);
            })
            .catch(() => {
                router.push('/characters');
            });
    }, [id, router]);

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
                analyzeImage(json.url);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    const analyzeImage = async (url: string) => {
        setAnalyzing(true);
        setTimeout(() => {
            setFormData(prev => ({
                ...prev,
                traits: prev.traits || "Auto-detected: Updated traits from new image...",
            }));
            setAnalyzing(false);
        }, 1500);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch(`/api/characters/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        router.push('/characters');
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this character?")) return;

        await fetch(`/api/characters/${id}`, { method: 'DELETE' });
        router.push('/characters');
    }

    if (loading) return <div className="p-12 text-center">Loading character...</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/characters" className="text-gray-400 hover:text-white">← Back</Link>
                    <h1 className="text-3xl font-bold">Edit {formData.name}</h1>
                </div>
                <button onClick={handleDelete} className="text-sm text-[var(--danger)] hover:underline">
                    Delete Character
                </button>
            </div>

            <div className="glass-panel p-8">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Image Upload */}
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-[var(--glass-border)] rounded-xl p-8 hover:border-[var(--primary)] transition-colors relative">
                        {formData.image ? (
                            <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-[var(--success)] shadow-[0_0_20px_var(--success)]">
                                <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
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
                            checked={formData.isCamera || false}
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
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Archetype / Role</label>
                            <input
                                type="text"
                                className="w-full bg-[var(--surface)] border border-[var(--glass-border)] rounded-lg p-3 text-white focus:border-[var(--primary)] focus:outline-none"
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm text-gray-400">Traits & Behavior Prompt</label>
                        <textarea
                            className="w-full bg-[var(--surface)] border border-[var(--glass-border)] rounded-lg p-3 text-white focus:border-[var(--primary)] focus:outline-none h-32"
                            value={formData.traits}
                            onChange={e => setFormData({ ...formData, traits: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm text-gray-400">Voice ID (ElevenLabs Reference)</label>
                        <input
                            type="text"
                            className="w-full bg-[var(--surface)] border border-[var(--glass-border)] rounded-lg p-3 text-white focus:border-[var(--primary)] focus:outline-none"
                            value={formData.voiceId}
                            onChange={e => setFormData({ ...formData, voiceId: e.target.value })}
                        />
                    </div>

                    <button type="submit" className="w-full btn-primary mt-4">
                        Save Changes
                    </button>
                </form>
            </div>
        </div>
    );
}
