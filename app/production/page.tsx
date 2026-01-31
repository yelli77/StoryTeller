"use client";
import { useState, useEffect, useRef } from 'react';
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

    // Ref to track clips for async access (avoids stale closures and async setState issues)
    const clipsRef = useRef<any[]>([]);
    useEffect(() => {
        clipsRef.current = clips;
    }, [clips]);

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

    // Helper to extract the last frame of a video
    const extractLastFrame = async (videoUrl: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.src = videoUrl;
            video.crossOrigin = 'anonymous';
            video.muted = true;

            video.onloadedmetadata = () => {
                video.currentTime = Math.max(0, video.duration - 0.1);
            };

            video.onseeked = () => {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(video, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                } else {
                    reject("Canvas context failed");
                }
            };
            video.onerror = (e) => reject("Video loading failed: " + e);
        });
    };

    // Helper to determine references from visual description
    const getReferencesForPrompt = async (prompt: string) => {
        const mentionedChars = characters.filter(c =>
            prompt.toLowerCase().includes(c.name.toLowerCase()) && !c.isCamera
        );

        const refs = await Promise.all(
            mentionedChars.map(async (c) => {
                if (c.image) return await urlToBase64(c.image);
                return null;
            })
        );

        return refs.filter(r => r !== null) as string[];
    };

    // Helper to inject character traits into the prompt
    const enhancePrompt = (originalPrompt: string) => {
        let enhancedPrompt = originalPrompt;
        const relevantChars = characters.filter(c => originalPrompt.toLowerCase().includes(c.name.toLowerCase()));
        if (relevantChars.length > 0) {
            const traitsDescription = relevantChars.map(c => `${c.name}: ${c.traits}`).join(". ");
            enhancedPrompt = `${originalPrompt}. (Character details: ${traitsDescription})`;
        }
        return enhancedPrompt;
    };

    // Sequential Generator for a specific clip
    const generateNextClip = async (index: number) => {
        console.log(`[Client] Starting generation for clip ${index}`);

        // Set loading state immediately
        setClips(prev => {
            const next = [...prev];
            if (next[index]) next[index] = { ...next[index], loading: true };
            return next;
        });

        try {
            // Use ref for stable access to current state
            const clip = clipsRef.current[index];
            if (!clip) {
                console.warn(`[Client] Clip ${index} not found in state, skipping.`);
                return;
            }

            let startImage = clip.generated_start_image;

            // If not the first clip, extract from previous video
            if (index > 0 && clipsRef.current[index - 1]?.video) {
                console.log(`[Client] Chaining Clip ${index} to Clip ${index - 1}`);
                try {
                    startImage = await extractLastFrame(clipsRef.current[index - 1].video);
                    setClips(prev => {
                        const next = [...prev];
                        next[index] = { ...next[index], generated_start_image: startImage };
                        return next;
                    });
                } catch (err) {
                    console.error("Frame extraction failed", err);
                }
            }

            // Generate Image if missing
            if (!startImage) {
                const refs = await getReferencesForPrompt(clip.visual_start);
                const res = await fetch('/api/image/generate', {
                    method: 'POST',
                    body: JSON.stringify({ prompt: enhancePrompt(clip.visual_start), referenceImages: refs })
                });
                const data = await res.json();
                if (data.image) {
                    startImage = data.image;
                    // INTERMEDIATE UPDATE: Show the frame immediately!
                    setClips(prev => {
                        const next = [...prev];
                        next[index] = { ...next[index], generated_start_image: startImage, start_failed: false };
                        return next;
                    });
                } else {
                    setClips(prev => {
                        const next = [...prev];
                        next[index] = { ...next[index], start_failed: true, error: data.error };
                        return next;
                    });
                }
            }

            // Generate Video (Lip-Sync if dialogue, otherwise standard Kling)
            if (!startImage) {
                console.warn(`[Sequential Gen] Skipping video for clip ${index} - No start image available.`);
                setClips(prev => {
                    const next = [...prev];
                    next[index] = { ...next[index], video_failed: true, videoError: "Image generation skipped.", loading: false };
                    return next;
                });
                return;
            }

            console.log(`[Client] Requesting video generation for clip ${index}`);

            // Wait for audio if we want to do lip-sync
            let audioUrl = clip.audio;
            if (!audioUrl && clip.line?.trim()) {
                console.log(`[Client] Waiting for audio of clip ${index} for lip-sync...`);
                // Poll for audio up to 5 seconds
                for (let j = 0; j < 10; j++) {
                    await new Promise(r => setTimeout(r, 500));
                    if (clipsRef.current[index]?.audio) {
                        audioUrl = clipsRef.current[index].audio;
                        break;
                    }
                }
            }

            const isLipSync = !!audioUrl && !!clip.line?.trim() && !clip.speaker?.includes("NARRATOR");

            const res = await fetch('/api/video/generate', {
                method: 'POST',
                body: JSON.stringify({
                    prompt: isLipSync ? `Talking video of ${clip.speaker}. Only ${clip.speaker} is speaking, everyone else is silent.` : `Cinematic shot of ${clip.visual_start}`,
                    startImage: startImage,
                    duration: clip.duration || 5,
                    type: isLipSync ? 'lipsync' : 'standard',
                    audioUrl: isLipSync ? audioUrl : undefined,
                    speaker: clip.speaker
                })
            });
            const data = await res.json();
            setClips(prev => {
                const next = [...prev];
                if (data.video) {
                    next[index] = { ...next[index], video: data.video, video_generated: true, video_failed: false, video_type: isLipSync ? 'lipsync' : 'standard' };
                } else {
                    next[index] = { ...next[index], video_failed: true, videoError: data.error || "Video Generation Failed" };
                }
                return next;
            });
        } catch (e) {
            console.error(`[Sequential Gen] Error for clip ${index}`, e);
            setClips(prev => {
                const next = [...prev];
                next[index] = { ...next[index], video_failed: true, videoError: (e as Error).message };
                return next;
            });
        } finally {
            setClips(prev => {
                const next = [...prev];
                next[index] = { ...next[index], loading: false };
                return next;
            });
        }
    };

    const startProduction = async () => {
        setLoading(true);

        // Step 0: Start First Visual Scene INSTANTLY
        generateNextClip(0);

        // Step A: Audio Synthesis (Sequential but non-blocking for visuals)
        for (let i = 0; i < clips.length; i++) {
            const clip = clips[i];
            const speakerChar = characters.find(c => c.name === clip.speaker);
            if (speakerChar && speakerChar.voiceId && clip.line?.trim()) {
                try {
                    // Small delay to avoid API hammering
                    if (i > 0) await new Promise(r => setTimeout(r, 200));

                    const res = await fetch('/api/audio/generate', {
                        method: 'POST',
                        body: JSON.stringify({ text: clip.line, voiceId: speakerChar.voiceId })
                    });
                    const data = await res.json();
                    if (data.audio) {
                        setClips(prev => {
                            const next = [...prev];
                            next[i] = { ...next[i], audio: data.audio, audio_generated: true };
                            return next;
                        });
                    }
                } catch (e) {
                    console.error(`[Audio] Error clip ${i}`, e);
                }
            }
        }

        setSteps(s => ({ ...s, tts: true, video: true, edit: true }));
        setLoading(false);
    };

    // Regenerate a specific frame
    const regenerateImage = async (index: number) => {
        setClips(prev => {
            const next = [...prev];
            if (next[index]) next[index] = { ...next[index], generated_start_image: null, start_failed: false, loading: true };
            return next;
        });

        try {
            const clip = clips[index];
            const refs = await getReferencesForPrompt(clip.visual_start);
            const res = await fetch('/api/image/generate', {
                method: 'POST',
                body: JSON.stringify({
                    prompt: enhancePrompt(clip.visual_start),
                    referenceImages: refs
                })
            });
            const data = await res.json();

            setClips(prev => {
                const next = [...prev];
                if (data.image) {
                    next[index] = { ...next[index], generated_start_image: data.image, start_failed: false };
                } else {
                    console.error(`[Client] Regenerate Image Error:`, data.error);
                    next[index] = { ...next[index], start_failed: true, error: data.error };
                }
                return next;
            });
        } catch (e) {
            console.error("Regeneration failed", e);
            setClips(prev => {
                const next = [...prev];
                next[index] = { ...next[index], start_failed: true };
                return next;
            });
        } finally {
            setClips(prev => {
                const next = [...prev];
                next[index] = { ...next[index], loading: false };
                return next;
            });
        }
    };

    // Regenerate a specific video
    const regenerateVideo = async (index: number) => {
        setClips(prev => {
            const next = [...prev];
            if (next[index]) {
                next[index] = {
                    ...next[index],
                    video: null,
                    video_generated: false,
                    video_failed: false
                };
            }
            return next;
        });

        await generateNextClip(index);
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
                <StepCard title="Step B: Act-One Bridge" status={steps.video} icon="🎭" tool="Kie.ai (Grok Imagine)" />
                <StepCard title="Step C: Auto-Editor" status={steps.edit} icon="✂️" tool="StoryTeller Engine" />
            </div>

            {/* Main Workspace */}
            <div className="glass-panel p-6 flex-1 flex flex-col gap-4">
                <h3 className="text-xl font-bold border-b border-[var(--glass-border)] pb-4">Master Timeline (9:16)</h3>
                <TimelineEditor
                    clips={clips}
                    onRegenerate={regenerateImage}
                    onRegenerateVideo={regenerateVideo}
                    onGenerateNext={generateNextClip}
                />

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
