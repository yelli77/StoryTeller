"use client";
import { useState, useEffect, useRef } from 'react';
import TimelineEditor, { Clip } from '../components/TimelineEditor';

interface Character {
    id: string;
    name: string;
    role: string;
    traits: string;
    image?: string;
    isCamera?: boolean;
    voiceId?: string;
    visualConfig?: Record<string, any>;
    parameters?: Record<string, any>;
}

export default function ProductionPage() {
    const [steps, setSteps] = useState({ tts: false, video: false, edit: false });
    const [loading, setLoading] = useState(false);

    // Pattern: functional initializer for sessionStorage to avoid hydration mismatch and lint errors
    const [clips, setClips] = useState<Clip[]>([]);
    const [characters, setCharacters] = useState<Character[]>([]);
    const [globalScene, setGlobalScene] = useState('');

    // Ref to track clips for async access
    const clipsRef = useRef<Clip[]>([]);
    // Track abort controllers for each clip
    const abortControllers = useRef<{ [key: number]: AbortController }>({});

    useEffect(() => {
        clipsRef.current = clips;
    }, [clips]);

    // Load initial data
    useEffect(() => {
        const stored = sessionStorage.getItem('currentScript');
        if (stored) {
            try {
                setClips(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse stored script", e);
            }
        }

        // Fetch characters
        fetch('/api/characters')
            .then(res => res.json())
            .then(data => setCharacters(data))
            .catch(err => console.error("Failed to load characters", err));
    }, []);

    // Helper to convert image URL to base64
    const urlToBase64 = async (url: string): Promise<string | undefined> => {
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

        return refs.filter((r): r is string => r !== null);
    };

    // Helper to inject character traits and global scene into the prompt
    const enhancePrompt = (originalPrompt: string) => {
        const relevantChars = characters.filter(c => originalPrompt.toLowerCase().includes(c.name.toLowerCase()));

        let characterContext = '';
        if (relevantChars.length > 0) {
            characterContext = relevantChars.map(c => `[Appearance of ${c.name}: ${c.traits}]`).join(" ");
        }

        const sceneContext = globalScene.trim() ? `Location: ${globalScene}.` : '';

        return `${sceneContext} ${originalPrompt}. ${characterContext}. (Cinematic photorealistic style, 8k, raw photo, highly detailed:1.3)`.trim();
    };

    // Sequential Generator for a specific clip
    const generateNextClip = async (index: number) => {
        console.log(`[Client] Starting generation for clip ${index}`);

        const controller = new AbortController();
        abortControllers.current[index] = controller;

        setClips(prev => {
            const next = [...prev];
            if (next[index]) next[index] = { ...next[index], loading: true, status: 'Initializing...', progress: 5 };
            return next;
        });

        try {
            const clip = clipsRef.current[index];
            if (!clip) {
                console.warn(`[Client] Clip ${index} not found in state, skipping.`);
                return;
            }

            let startImage = clip.generated_start_image;

            // If not the first clip, extract from previous video
            if (index > 0 && clipsRef.current[index - 1]?.video) {
                console.log(`[Client] Chaining Clip ${index} to Clip ${index - 1}`);
                setClips(prev => {
                    const next = [...prev];
                    next[index] = { ...next[index], status: 'Extracting bridge frame...', progress: 15 };
                    return next;
                });

                try {
                    startImage = await extractLastFrame(clipsRef.current[index - 1].video!);
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
                setClips(prev => {
                    const next = [...prev];
                    next[index] = { ...next[index], status: 'Synthesizing First Frame...', progress: 25 };
                    return next;
                });

                const mentionedChars = characters.filter(c =>
                    clip.visual_start?.toLowerCase().includes(c.name.toLowerCase()) && !c.isCamera
                );
                const char = mentionedChars[0];
                const visualConfig = char ? { ...(char.visualConfig || {}), ...(char.parameters || {}) } : undefined;

                const refs = await getReferencesForPrompt(clip.visual_start || '');

                const res = await fetch('/api/image/generate', {
                    method: 'POST',
                    signal: controller.signal,
                    body: JSON.stringify({
                        prompt: enhancePrompt(clip.visual_start || ''),
                        referenceImages: refs,
                        visualConfig: visualConfig
                    })
                });
                const data = await res.json();
                if (data.image) {
                    startImage = data.image;
                    setClips(prev => {
                        const next = [...prev];
                        next[index] = { ...next[index], generated_start_image: startImage as string, start_failed: false, status: 'Frame Anchored', progress: 50 };
                        return next;
                    });
                } else {
                    setClips(prev => {
                        const next = [...prev];
                        next[index] = { ...next[index], start_failed: true, error: data.error, loading: false, status: 'Image failed' };
                        return next;
                    });
                    return;
                }
            }

            // Generate Video
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

            let audioUrl = clip.audio;
            if (!audioUrl && clip.line?.trim()) {
                setClips(prev => {
                    const next = [...prev];
                    next[index] = { ...next[index], status: 'Awaiting Voice Synth...', progress: 55 };
                    return next;
                });
                for (let j = 0; j < 10; j++) {
                    if (controller.signal.aborted) throw new Error("Aborted");
                    await new Promise(r => setTimeout(r, 500));
                    if (clipsRef.current[index]?.audio) {
                        audioUrl = clipsRef.current[index].audio;
                        break;
                    }
                }
            }

            const isLipSync = !!audioUrl && !!clip.line?.trim() && !clip.speaker?.includes("NARRATOR");

            setClips(prev => {
                const next = [...prev];
                next[index] = { ...next[index], status: isLipSync ? 'Lip-Syncing Blackwell...' : 'Alchemizing Video...', progress: 65 };
                return next;
            });

            const res = await fetch('/api/video/generate', {
                method: 'POST',
                signal: controller.signal,
                body: JSON.stringify({
                    prompt: isLipSync
                        ? enhancePrompt(`Talking video of ${clip.speaker}. Only ${clip.speaker} is speaking, everyone else is silent. High quality, detailed facial expressions.`)
                        : enhancePrompt(`Cinematic shot of ${clip.visual_start}`),
                    startImage: startImage,
                    duration: 2,
                    type: isLipSync ? 'lipsync' : 'standard',
                    audioUrl: isLipSync ? audioUrl : undefined,
                    speaker: clip.speaker
                })
            });

            const data = await res.json();
            setClips(prev => {
                const next = [...prev];
                if (data.video) {
                    next[index] = { ...next[index], video: data.video, video_generated: true, video_failed: false, video_type: isLipSync ? 'lipsync' : 'standard', status: 'Complete', progress: 100 };
                } else {
                    next[index] = { ...next[index], video_failed: true, videoError: data.error || "Video Generation Failed", status: 'Video failed' };
                }
                return next;
            });
        } catch (e: unknown) {
            if (e instanceof Error && e.name === 'AbortError') {
                console.log(`[Client] Clip ${index} generation cancelled.`);
                setClips(prev => {
                    const next = [...prev];
                    next[index] = { ...next[index], loading: false, status: 'Cancelled', progress: 0 };
                    return next;
                });
            } else {
                console.error(`[Sequential Gen] Error for clip ${index}`, e);
                setClips(prev => {
                    const next = [...prev];
                    next[index] = { ...next[index], video_failed: true, videoError: e instanceof Error ? e.message : 'Unknown error', status: 'Error occurred' };
                    return next;
                });
            }
        } finally {
            delete abortControllers.current[index];
            setClips(prev => {
                const next = [...prev];
                next[index] = { ...next[index], loading: false };
                return next;
            });
        }
    };

    const cancelGeneration = (index: number) => {
        if (abortControllers.current[index]) {
            abortControllers.current[index].abort();
            delete abortControllers.current[index];
        }
    };

    const startProduction = async () => {
        setLoading(true);
        generateNextClip(0);

        for (let i = 0; i < clips.length; i++) {
            const clip = clips[i];
            const speakerChar = characters.find(c => c.name === clip.speaker);
            if (speakerChar && speakerChar.voiceId && clip.line?.trim()) {
                try {
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

    const regenerateImage = async (index: number) => {
        setClips(prev => {
            const next = [...prev];
            if (next[index]) next[index] = { ...next[index], generated_start_image: null, start_failed: false, loading: true };
            return next;
        });

        try {
            const clip = clips[index];
            const mentionedChars = characters.filter(c =>
                clip.visual_start?.toLowerCase().includes(c.name.toLowerCase()) && !c.isCamera
            );
            const char = mentionedChars[0];
            const visualConfig = char ? { ...(char.visualConfig || {}), ...(char.parameters || {}) } : undefined;

            const refs = await getReferencesForPrompt(clip.visual_start || '');
            const res = await fetch('/api/image/generate', {
                method: 'POST',
                body: JSON.stringify({
                    prompt: enhancePrompt(clip.visual_start || ''),
                    referenceImages: refs,
                    visualConfig: visualConfig
                })
            });
            const data = await res.json();

            setClips(prev => {
                const next = [...prev];
                if (data.image) {
                    next[index] = { ...next[index], generated_start_image: data.image as string, start_failed: false };
                } else {
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

    const regenerateVideo = async (index: number) => {
        setClips(prev => {
            const next = [...prev];
            if (next[index]) {
                next[index] = {
                    ...next[index],
                    video: undefined,
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

            <div className="glass-panel p-4 flex gap-4 items-center bg-blue-900/10 border-blue-500/30">
                <div className="text-2xl">🌍</div>
                <div className="flex-1">
                    <label className="text-[10px] uppercase font-bold text-blue-400 tracking-widest">Global Scene Consistency (Environment)</label>
                    <input
                        className="w-full bg-transparent border-none text-white placeholder-gray-600 focus:ring-0 text-sm"
                        placeholder="e.g. In a cozy dimly lit cafe at night, cinematic rainy window..."
                        value={globalScene}
                        onChange={e => setGlobalScene(e.target.value)}
                    />
                </div>
                <div className="text-[10px] text-gray-500 max-w-[150px] leading-tight italic">
                    This scene will be forced into every generation to keep the backdrop consistent.
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <StepCard title="Step A: Audio Synthesis" status={steps.tts} icon="🎙️" tool="ElevenLabs (Live)" />
                <StepCard title="Step B: Act-One Bridge" status={steps.video} icon="🎭" tool="RunPod (Blackwell 5090)" />
                <StepCard title="Step C: Auto-Editor" status={steps.edit} icon="✂️" tool="StoryTeller Engine" />
            </div>

            <div className="glass-panel p-6 flex-1 flex flex-col gap-4">
                <h3 className="text-xl font-bold border-b border-[var(--glass-border)] pb-4">Master Timeline (9:16)</h3>
                <TimelineEditor
                    clips={clips}
                    onRegenerate={regenerateImage}
                    onRegenerateVideo={regenerateVideo}
                    onGenerateNext={generateNextClip}
                    onCancel={cancelGeneration}
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

function StepCard({ title, status, icon, tool }: { title: string, status: boolean, icon: string, tool: string }) {
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
