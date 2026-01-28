import { useState } from 'react';

interface TimelineEditorProps {
    clips: any[];
    onRegenerate: (index: number, type: 'start' | 'end') => void;
}

export default function TimelineEditor({ clips, onRegenerate }: TimelineEditorProps) {
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);

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
                                {/* Start Frame */}
                                <div className="flex-1 relative group rounded-lg overflow-hidden border border-[var(--glass-border)] bg-black">
                                    <div className={`absolute top-1 left-1 z-10 text-[10px] text-white px-2 py-0.5 rounded backdrop-blur-md pointer-events-none ${clip.video ? 'bg-purple-600' : 'bg-black/70'}`}>
                                        {clip.video ? 'VIDEO' : 'START'}
                                    </div>

                                    {/* Actions Overlay */}
                                    <div className="absolute top-1 right-1 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onRegenerate(i, 'start'); }}
                                            className="bg-black/70 hover:bg-[var(--primary)] text-white p-1.5 rounded backdrop-blur-md transition-colors"
                                            title="Regenerate Image"
                                        >
                                            ↻
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (clip.generated_start_image) setZoomedImage(clip.generated_start_image);
                                            }}
                                            className="bg-black/70 hover:bg-white/20 text-white p-1.5 rounded backdrop-blur-md transition-colors"
                                            title="Zoom"
                                        >
                                            🔍
                                        </button>
                                    </div>

                                    {clip.video ? (
                                        <video
                                            src={clip.video}
                                            className="w-full h-full object-cover cursor-pointer"
                                            controls
                                            autoPlay
                                            loop
                                            muted
                                        />
                                    ) : clip.generated_start_image ? (
                                        clip.is_start_svg ? (
                                            <div
                                                className="w-full h-full bg-gray-900 cursor-pointer"
                                                dangerouslySetInnerHTML={{ __html: clip.generated_start_image }}
                                                onClick={() => setZoomedImage(clip.generated_start_image)} // Fallback if no SVG preview
                                            />
                                        ) : (
                                            <img
                                                src={clip.generated_start_image}
                                                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-500"
                                                alt="Start Generated"
                                                onClick={() => setZoomedImage(clip.generated_start_image)}
                                            />
                                        )
                                    ) : clip.start_failed ? (
                                        <button
                                            onClick={() => onRegenerate(i, 'start')}
                                            className="w-full h-full flex flex-col items-center justify-center text-red-500 hover:bg-red-900/10 transition-colors"
                                        >
                                            <span className="text-2xl font-bold">↻</span>
                                            <span className="text-xs">Retry</span>
                                        </button>
                                    ) : clip.imageUrl ? (
                                        <img src={clip.imageUrl} className="w-full h-full object-cover opacity-80" alt="Start Placeholder" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-2xl animate-pulse">⏳</div>
                                    )}
                                    <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/90 to-transparent pt-8 pointer-events-none">
                                        <p className="text-[10px] text-gray-300 line-clamp-4 leading-tight">{clip.visual_start}</p>
                                    </div>
                                </div>

                                {/* End Frame */}
                                <div className="flex-1 relative group rounded-lg overflow-hidden border border-[var(--glass-border)] bg-black">
                                    <div className="absolute top-1 left-1 z-10 bg-black/70 text-[10px] text-white px-2 py-0.5 rounded backdrop-blur-md pointer-events-none">END</div>

                                    {/* Actions Overlay */}
                                    <div className="absolute top-1 right-1 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onRegenerate(i, 'end'); }}
                                            className="bg-black/70 hover:bg-[var(--primary)] text-white p-1.5 rounded backdrop-blur-md transition-colors"
                                            title="Regenerate Image"
                                        >
                                            ↻
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (clip.generated_end_image) setZoomedImage(clip.generated_end_image);
                                            }}
                                            className="bg-black/70 hover:bg-white/20 text-white p-1.5 rounded backdrop-blur-md transition-colors"
                                            title="Zoom"
                                        >
                                            🔍
                                        </button>
                                    </div>

                                    {clip.generated_end_image ? (
                                        clip.is_end_svg ? (
                                            <div
                                                className="w-full h-full bg-gray-900 cursor-pointer"
                                                dangerouslySetInnerHTML={{ __html: clip.generated_end_image }}
                                                onClick={() => setZoomedImage(clip.generated_end_image)}
                                            />
                                        ) : (
                                            <img
                                                src={clip.generated_end_image}
                                                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-500"
                                                alt="End Generated"
                                                onClick={() => setZoomedImage(clip.generated_end_image)}
                                            />
                                        )
                                    ) : clip.end_failed ? (
                                        <button
                                            onClick={() => onRegenerate(i, 'end')}
                                            className="w-full h-full flex flex-col items-center justify-center text-red-500 hover:bg-red-900/10 transition-colors"
                                        >
                                            <span className="text-2xl font-bold">↻</span>
                                            <span className="text-xs">Retry</span>
                                        </button>
                                    ) : clip.imageUrl ? (
                                        <img src={clip.imageUrl} className="w-full h-full object-cover opacity-60 grayscale-[30%]" alt="End Placeholder" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-2xl animate-pulse">⏳</div>
                                    )}
                                    <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/90 to-transparent pt-8 pointer-events-none">
                                        <p className="text-[10px] text-gray-300 line-clamp-4 leading-tight">{clip.visual_end}</p>
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
                                        <div className="mt-2 pt-2 border-t border-[var(--primary)]/20">
                                            <audio controls className="w-full h-6 opacity-80 hover:opacity-100 transition-opacity" src={clip.audio} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Lightbox Modal */}
            {zoomedImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-8"
                    onClick={() => setZoomedImage(null)}
                >
                    <div className="relative max-w-full max-h-full">
                        {zoomedImage.startsWith('<svg') ? (
                            <div
                                className="w-[80vw] h-[80vh] bg-gray-900 rounded-xl"
                                dangerouslySetInnerHTML={{ __html: zoomedImage }}
                            />
                        ) : (
                            <img
                                src={zoomedImage}
                                className="max-w-full max-h-full rounded-lg shadow-2xl border border-[var(--glass-border)]"
                                alt="Zoomed"
                            />
                        )}
                        <p className="text-center text-gray-400 mt-4 text-sm">Click anywhere to close</p>
                    </div>
                </div>
            )}
        </>
    );
}
