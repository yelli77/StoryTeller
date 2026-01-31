import { useState, useRef } from 'react';

interface TimelineEditorProps {
    clips: any[];
    onRegenerate: (index: number) => void;
    onRegenerateVideo: (index: number) => void;
    onGenerateNext: (index: number) => void;
}

export default function TimelineEditor({ clips, onRegenerate, onRegenerateVideo, onGenerateNext }: TimelineEditorProps) {
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);
    const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);

    const playAudioForVideo = (index: number) => {
        const audio = audioRefs.current[index];
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(e => console.warn("Audio play blocked", e));
        }
    };

    if (!clips || clips.length === 0) {
        return (
            <div className="h-64 glass-panel flex items-center justify-center text-gray-500 border-dashed border-2 border-[var(--glass-border)]">
                No clips generated yet. Start the reactor.
            </div>
        );
    }

    return (
        <>
            <div className="glass-panel p-4 overflow-x-auto">
                <div className="flex gap-4 min-w-max pb-4">
                    {clips.map((clip, i) => (
                        <div key={i} className="flex flex-col gap-2 w-96 bg-gray-900/50 p-3 rounded-xl border border-[var(--glass-border)] hover:border-[var(--primary)] transition-colors">

                            {/* Header Info */}
                            <div className="flex justify-between items-center text-xs text-gray-500 uppercase tracking-wide">
                                <span className="font-mono">{clip.time || `0:0${i * 5}`}</span>
                                <span className="text-[var(--secondary)] font-bold">{clip.speaker}</span>
                            </div>

                            {/* Visuals Container */}
                            <div className="flex gap-2 h-64">
                                {/* Main Visual Frame (Sequential) */}
                                <div className="flex-1 relative group rounded-lg overflow-hidden border border-[var(--glass-border)] bg-black">
                                    <div className={`absolute top-1 left-1 z-10 text-[10px] text-white px-2 py-0.5 rounded backdrop-blur-md pointer-events-none ${clip.video ? 'bg-purple-600' : 'bg-black/70'}`}>
                                        {clip.video ? 'VIDEO' : 'START'}
                                    </div>

                                    {/* Actions Overlay */}
                                    <div className="absolute top-1 right-1 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {!clip.video && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onRegenerate(i); }}
                                                className="bg-black/70 hover:bg-[var(--primary)] text-white p-1.5 rounded backdrop-blur-md transition-colors"
                                                title="Regenerate Image"
                                            >
                                                ↻
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (clip.video) setZoomedImage(clip.video); // Zoom video if exists? Or just image
                                                else if (clip.generated_start_image) setZoomedImage(clip.generated_start_image);
                                            }}
                                            className="bg-black/70 hover:bg-white/20 text-white p-1.5 rounded backdrop-blur-md transition-colors"
                                            title="Zoom"
                                        >
                                            🔍
                                        </button>
                                    </div>

                                    {/* Loading Overlay */}
                                    {clip.loading && (
                                        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
                                            <div className="relative">
                                                <div className="w-16 h-16 border-4 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin"></div>
                                                <div className="absolute inset-0 flex items-center justify-center text-xl animate-pulse">☢️</div>
                                            </div>
                                            <p className="mt-4 text-xs font-bold text-[var(--primary)] uppercase tracking-widest animate-pulse">
                                                {clip.generated_start_image ? 'Alchemizing Video' : 'Syncing Grok Imagine'}
                                            </p>
                                        </div>
                                    )}

                                    {clip.video ? (
                                        <video
                                            src={clip.video}
                                            className="w-full h-full object-cover cursor-pointer"
                                            controls
                                            autoPlay
                                            loop
                                            onPlay={() => playAudioForVideo(i)}
                                        />
                                    ) : clip.video_failed ? (
                                        <div className="relative w-full h-full">
                                            {clip.generated_start_image && (
                                                <img
                                                    src={clip.generated_start_image}
                                                    className="w-full h-full object-cover opacity-40 grayscale"
                                                    alt="Frozen start frame"
                                                />
                                            )}
                                            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-black/60">
                                                <span className="text-2xl mb-2">🎬⚠️</span>
                                                <p className="text-[10px] text-red-400 font-mono line-clamp-3 mb-2">{clip.videoError || 'Video Failed'}</p>
                                                <button
                                                    onClick={() => onRegenerateVideo(i)}
                                                    className="text-[10px] bg-red-900/50 hover:bg-red-900/80 text-white px-3 py-1.5 rounded-full border border-red-500/50 transition-all font-bold"
                                                >
                                                    Retry Video
                                                </button>
                                            </div>
                                        </div>
                                    ) : clip.generated_start_image ? (
                                        <img
                                            src={clip.generated_start_image}
                                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-500"
                                            alt="Start Generated"
                                            onClick={() => setZoomedImage(clip.generated_start_image)}
                                        />
                                    ) : clip.start_failed ? (
                                        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gray-950">
                                            <span className="text-2xl mb-2">⚠️</span>
                                            <p className="text-[10px] text-red-400 font-mono line-clamp-3 mb-2">{clip.error || 'Generation Failed'}</p>
                                            <button
                                                onClick={() => onRegenerate(i)}
                                                className="text-[10px] bg-red-900/30 hover:bg-red-900/50 text-red-200 px-2 py-1 rounded"
                                            >
                                                Retry Image
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-700 p-4 text-center">
                                            {i === 0 ? (
                                                <div className="animate-pulse">⏳ Awaiting First Frame...</div>
                                            ) : (
                                                <div className="text-xs">
                                                    <span className="block text-xl mb-1">🔗</span>
                                                    Waiting for previous clip to finish...
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/90 to-transparent pt-8 pointer-events-none">
                                        <p className="text-[10px] text-gray-300 line-clamp-4 leading-tight">{clip.visual_start}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Script Info */}
                            <div className="space-y-2 mt-1">
                                <div className="bg-gray-800/50 p-2 rounded text-xs border border-gray-700/50">
                                    <span className="text-[var(--accent)] font-bold uppercase text-[10px] mr-2">Action</span>
                                    <span className="text-gray-400 italic">{clip.action}</span>
                                </div>
                                <div className="bg-[var(--primary)]/10 p-2 rounded text-sm border border-[var(--primary)]/20">
                                    <span className="text-white font-medium">"{clip.line}"</span>
                                    {clip.audio && (
                                        <div className="mt-2 pt-2 border-t border-[var(--primary)]/20 flex flex-col gap-2">
                                            <audio
                                                ref={el => { audioRefs.current[i] = el; }}
                                                controls
                                                className="w-full h-6 opacity-80 hover:opacity-100 transition-opacity"
                                                src={clip.audio}
                                            />

                                            {/* Sequential Generation Button */}
                                            {!clip.video && (i === 0 || (clips[i - 1] && clips[i - 1].video)) && (
                                                <button
                                                    onClick={() => onGenerateNext(i)}
                                                    disabled={clip.loading}
                                                    className={`w-full py-2 ${clip.loading ? 'bg-gray-700 cursor-not-allowed' : 'bg-[var(--primary)] hover:bg-[var(--primary)]/80'} text-white rounded text-xs font-bold transition-all flex items-center justify-center gap-2 mt-1`}
                                                >
                                                    {clip.loading ? (
                                                        <>
                                                            <span className="animate-spin text-lg">☢️</span>
                                                            ALCHEMIZING...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span>✨</span>
                                                            GENERATE SCENE
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {zoomedImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-8"
                    onClick={() => setZoomedImage(null)}
                >
                    <div className="relative max-w-full max-h-full">
                        <img
                            src={zoomedImage}
                            className="max-w-full max-h-full rounded-lg shadow-2xl border border-[var(--glass-border)]"
                            alt="Zoomed"
                        />
                        <p className="text-center text-gray-400 mt-4 text-sm">Click anywhere to close</p>
                    </div>
                </div>
            )}
        </>
    );
}
