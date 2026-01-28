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
        const updatedClips = [...clips];

        // Step A: Audio Synthesis
        console.log("[Client] Starting Audio Generation...");
        const audioClips = [...updatedClips]; // Use the clips list we are working on

        // Process Audio Sequentially to avoid Rate Limits (429 / Concurrency)
        for (const [i, clip] of audioClips.entries()) {
            // Find character to get VoiceID
            const speakerChar = characters.find(c => c.name === clip.speaker);

            if (speakerChar && speakerChar.voiceId && clip.line && clip.line.trim().length > 0) {
                try {
                    // Slight delay to be nice to the API
                    if (i > 0) await new Promise(r => setTimeout(r, 250));

                    const res = await fetch('/api/audio/generate', {
                        method: 'POST',
                        body: JSON.stringify({
                            text: clip.line,
                            voiceId: speakerChar.voiceId
                        })
                    });

                    const data = await res.json();
                    if (data.audio) {
                        audioClips[i].audio = data.audio;
                        audioClips[i].audio_generated = true;
                    } else {
                        console.error(`[Audio] Failed for clip ${i}:`, data.error);
                    }
                } catch (e) {
                    console.error(`[Audio] Error clip ${i}`, e);
                }
            } else {
                console.log(`[Audio] No voice ID for ${clip.speaker}, skipping.`);
            }
        }

        setClips([...audioClips]);
        setSteps(s => ({ ...s, tts: true }));

        // Step B: Image-to-Animation
        setSteps(s => ({ ...s, video: true }));

        // PROCESS IN PARALLEL for speed
        console.log("[Client] Starting parallel image generation...");
        await Promise.all(updatedClips.map(async (clip, i) => {

            // Helper to determine reference from visual description
            const getReferenceForPrompt = async (prompt: string, speaker: string) => {
                // Find all characters mentioned in the prompt (Case Insensitive)
                const mentionedChars = characters.filter(c => prompt.toLowerCase().includes(c.name.toLowerCase()));

                // Prioritize acting characters (NOT camera operators)
                let foundChar = mentionedChars.find(c => !c.isCamera);

                // If visual doesn't name a visible actor, check if speaker is visible
                if (!foundChar) {
                    const speakerChar = characters.find(c => c.name === speaker);
                    // Only use speaker as reference if they are NOT a camera/POV character
                    if (speakerChar && !speakerChar.isCamera) {
                        foundChar = speakerChar;
                    }
                }

                if (foundChar && foundChar.image) {
                    console.log(`[Client] Matches ${foundChar.name} for prompt: "${prompt.substring(0, 20)}..."`);
                    return await urlToBase64(foundChar.image);
                }
                return undefined;
            };

            // Generate Start Frame
            if (clip.visual_start) {
                const referenceImageBase64 = await getReferenceForPrompt(clip.visual_start, clip.speaker);
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
                        console.error(`[Client] START Image Gen Error:`, data.error);
                        updatedClips[i].start_failed = true;
                    }
                } catch (e) {
                    updatedClips[i].start_failed = true;
                    console.error(`[Client] START for clip ${i} ERROR`, e);
                }
            }

            // Generate End Frame
            if (clip.visual_end) {
                const referenceImageBase64 = await getReferenceForPrompt(clip.visual_end, clip.speaker);
                try {
                    const res = await fetch('/api/image/generate', {
                        method: 'POST',
                        body: JSON.stringify({
                            prompt: clip.visual_end,
                            referenceImage: referenceImageBase64
                        })
                    });
                    const data = await res.json();
                    if (data.image) {
                        updatedClips[i].generated_end_image = data.image;
                        updatedClips[i].is_end_svg = data.isSvg;
                    } else {
                        console.error(`[Client] END Image Gen Error:`, data.error);
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

    // Regenerate a specific frame
    const regenerateImage = async (index: number, type: 'start' | 'end') => {
        const updatedClips = [...clips];
        const clip = updatedClips[index];

        // 1. Set to loading state (null)
        if (type === 'start') {
            updatedClips[index].generated_start_image = null;
            updatedClips[index].start_failed = false;
        } else {
            updatedClips[index].generated_end_image = null;
            updatedClips[index].end_failed = false;
        }
        setClips([...updatedClips]);

        // 2. Prepare Reference - SMART LOOKUP
        let referenceImageBase64 = undefined;
        const prompt = type === 'start' ? clip.visual_start : clip.visual_end;

        // Find char in prompt - Prioritize NON-CAMERA characters
        const mentionedChars = characters.filter(c => prompt.toLowerCase().includes(c.name.toLowerCase()));
        let foundChar = mentionedChars.find(c => !c.isCamera);

        if (!foundChar) {
            const speakerChar = characters.find(c => c.name === clip.speaker);
            if (speakerChar && !speakerChar.isCamera) {
                foundChar = speakerChar;
            }
        }

        if (foundChar && foundChar.image) {
            referenceImageBase64 = await urlToBase64(foundChar.image);
        }

        // 3. Generate
        try {
            const res = await fetch('/api/image/generate', {
                method: 'POST',
                body: JSON.stringify({
                    prompt: prompt,
                    referenceImage: referenceImageBase64
                })
            });
            const data = await res.json();

            // 4. Update State
            const finalClips = [...clips]; // re-read state in case of race? (Hooks handle this usually, but safe copy)
            if (data.image) {
                if (type === 'start') {
                    finalClips[index].generated_start_image = data.image;
                    finalClips[index].is_start_svg = data.isSvg;
                } else {
                    finalClips[index].generated_end_image = data.image;
                    finalClips[index].is_end_svg = data.isSvg;
                }
            } else {
                console.error(`[Client] Regenerate Image Error:`, data.error);
                if (type === 'start') finalClips[index].start_failed = true;
                else finalClips[index].end_failed = true;
            }
            setClips([...finalClips]);

        } catch (e) {
            console.error("Regeneration failed", e);
            const finalClips = [...clips];
            if (type === 'start') finalClips[index].start_failed = true;
            else finalClips[index].end_failed = true;
            setClips([...finalClips]);
        }
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
                <StepCard title="Step A: Audio Synthesis" status={steps.tts} icon="🎙️" tool="ElevenLabs (Live)" />
                <StepCard title="Step B: Act-One Bridge" status={steps.video} icon="🎭" tool="Runway/Hedra (Mock)" />
                <StepCard title="Step C: Auto-Editor" status={steps.edit} icon="✂️" tool="StoryTeller Engine" />
            </div>

            {/* Main Workspace */}
            <div className="glass-panel p-6 flex-1 flex flex-col gap-4">
                <h3 className="text-xl font-bold border-b border-[var(--glass-border)] pb-4">Master Timeline (9:16)</h3>
                <TimelineEditor clips={clips} onRegenerate={regenerateImage} />

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
