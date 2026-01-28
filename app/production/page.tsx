"use client";
import { useState, useEffect } from 'react';
import TimelineEditor from '../components/TimelineEditor';

// Mock script data if none found
const MOCK_SCRIPT = [
    { time: "0:00", speaker: "Clara", action: "looking confused", line: "Wait, is today Tuesday?" },
    { time: "0:04", speaker: "Ben", action: "facepalm", line: "It's our anniversary, Clara." },
    { time: "0:08", speaker: "Clara", action: "panicking", line: "I knew that! I was testing you!" },
];

export default function ProductionPage() {
    const [steps, setSteps] = useState({ tts: false, video: false, edit: false });
    const [loading, setLoading] = useState(false);
    const [clips, setClips] = useState<any[]>([]);
    const [characters, setCharacters] = useState<any[]>([]);

    // Load script from session storage on mount
    useEffect(() => {
        const stored = sessionStorage.getItem('currentScript');
        if (stored) {
            setClips(JSON.parse(stored));
        }

        // Fetch characters for image mapping
        fetch('/api/characters')
            .then(res => res.json())
            .then(data => setCharacters(data))
            .catch(err => console.error("Failed to load characters", err));
    }, []);

    // Helper to convert image URL to base64
    const urlToBase64 = async (url: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            return new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            console.error("Failed to load reference image:", url, e);
            return undefined;
        }
    };

    // Simulate the production pipeline
    const startProduction = async () => {
        setLoading(true);

        // Step A: Audio Synthesis
        await new Promise(r => setTimeout(r, 1500));
        setSteps(s => ({ ...s, tts: true }));

        // Step B: Image-to-Animation
        setSteps(s => ({ ...s, video: true }));

        const updatedClips = [...clips];

        // PROCESS IN PARALLEL for speed
        console.log("[Client] Starting parallel image generation...");
        await Promise.all(updatedClips.map(async (clip, i) => {
            let referenceImageBase64 = undefined;

            // Find character reference image
            const char = characters.find(c => c.name === clip.speaker);
            if (char && char.image) {
                console.log(`[Client] Loading reference image for ${char.name}...`);
                referenceImageBase64 = await urlToBase64(char.image);
            }

            // Generate Start Frame
            if (clip.visual_start) {
                try {
                    const res = await fetch('/api/image/generate', {
                        method: 'POST',
                        body: JSON.stringify({
                            prompt: clip.visual_start,
                            referenceImage: referenceImageBase64
                        })
                    });
                    const data = await res.json();
                    if (data.image) {
                        updatedClips[i].generated_start_image = data.image; // Can be SVG string or Data URL
                        updatedClips[i].is_start_svg = data.isSvg;
                    } else {
                        updatedClips[i].start_failed = true;
                    }
                } catch (e) {
                    updatedClips[i].start_failed = true;
                    console.error(`[Client] START for clip ${i} ERROR`, e);
                }
            }

            // Generate End Frame
            if (clip.visual_end) {
                try {
                    const res = await fetch('/api/image/generate', {
                        method: 'POST',
                        body: JSON.stringify({
                            prompt: clip.visual_end,
                            referenceImage: referenceImageBase64 // Use same reference
                        })
                    });
                    const data = await res.json();
                    if (data.image) {
                        updatedClips[i].generated_end_image = data.image;
                        updatedClips[i].is_end_svg = data.isSvg;
                    } else {
                        updatedClips[i].end_failed = true;
                    }
                } catch (e) {
                    updatedClips[i].end_failed = true;
                    console.error(`[Client] END for clip ${i} ERROR`, e);
                }
            }
        }));

        console.log("[Client] All parallel requests finished.");
        setClips([...updatedClips]);

        setSteps(s => ({ ...s, video: true }));

        // Step C: Auto-Editor
        await new Promise(r => setTimeout(r, 1000));
        setSteps(s => ({ ...s, edit: true }));

        setLoading(false);
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto h-full flex flex-col">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--danger)] to-[var(--primary)]">
                        Production Reactor
                    </h1>
                    <p className="text-gray-400">Synthesize, Animate, Assemble.</p>
                </div>

                <button
                    onClick={startProduction}
                    disabled={loading || steps.edit}
                    className={`btn-primary px-8 py-4 text-xl flex items-center gap-3 ${steps.edit ? 'bg-green-600 cursor-default shadow-none' : ''}`}
                >
                    {loading ? <span className="animate-spin">☢️</span> : steps.edit ? '✅ Complete' : '☢️ Ignite Reactor'}
                </button>
            </div>

            {/* Pipeline Status */}
            <div className="grid grid-cols-3 gap-4">
                <StepCard title="Step A: Audio Synthesis" status={steps.tts} icon="🎙️" tool="ElevenLabs (Mock)" />
                <StepCard title="Step B: Act-One Bridge" status={steps.video} icon="🎭" tool="Runway/Hedra (Mock)" />
                <StepCard title="Step C: Auto-Editor" status={steps.edit} icon="✂️" tool="StoryTeller Engine" />
            </div>

            {/* Main Workspace */}
            <div className="glass-panel p-6 flex-1 flex flex-col gap-4">
                <h3 className="text-xl font-bold border-b border-[var(--glass-border)] pb-4">Master Timeline (9:16)</h3>
                <TimelineEditor clips={clips} />

                {steps.edit && (
                    <div className="flex justify-end gap-4 mt-auto pt-4 border-t border-[var(--glass-border)]">
                        <button className="btn-secondary">Preview Full Render</button>
                        <a href="/launchpad" className="btn-primary">
                            Proceed to Launchpad →
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}

function StepCard({ title, status, icon, tool }: any) {
    return (
        <div className={`glass-panel p-4 flex items-center gap-4 transition-all ${status ? 'border-[var(--success)]' : 'opacity-70'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${status ? 'bg-[var(--success)] text-black' : 'bg-gray-800'}`}>
                {status ? '✓' : icon}
            </div>
            <div>
                <h4 className="font-bold text-sm">{title}</h4>
                <p className="text-xs text-gray-400">{tool}</p>
            </div>
        </div>
    );
}
