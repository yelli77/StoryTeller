export default function TimelineEditor({ clips }: { clips: any[] }) {
    if (!clips || clips.length === 0) {
        return (
            <div className="h-64 glass-panel flex items-center justify-center text-gray-500 border-dashed border-2 border-[var(--glass-border)]">
                No clips generated yet. Start the reactor.
            </div>
        );
    }

    return (
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
                                <div className="absolute top-1 left-1 z-10 bg-black/70 text-[10px] text-white px-2 py-0.5 rounded backdrop-blur-md">START</div>
                                {clip.generated_start_image ? (
                                    clip.is_start_svg ? (
                                        <div className="w-full h-full bg-gray-900" dangerouslySetInnerHTML={{ __html: clip.generated_start_image }} />
                                    ) : (
                                        <img src={clip.generated_start_image} className="w-full h-full object-cover" alt="Start Generated" />
                                    )
                                ) : clip.start_failed ? (
                                    <div className="w-full h-full flex items-center justify-center text-red-500 font-bold text-2xl bg-red-900/20 border border-red-500/50">❌</div>
                                ) : clip.imageUrl ? (
                                    <img src={clip.imageUrl} className="w-full h-full object-cover opacity-80" alt="Start Placeholder" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-2xl animate-pulse">⏳</div>
                                )}
                                <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/90 to-transparent pt-8">
                                    <p className="text-[10px] text-gray-300 line-clamp-4 leading-tight">{clip.visual_start}</p>
                                </div>
                            </div>

                            {/* End Frame */}
                            <div className="flex-1 relative group rounded-lg overflow-hidden border border-[var(--glass-border)] bg-black">
                                <div className="absolute top-1 left-1 z-10 bg-black/70 text-[10px] text-white px-2 py-0.5 rounded backdrop-blur-md">END</div>
                                {clip.generated_end_image ? (
                                    clip.is_end_svg ? (
                                        <div className="w-full h-full bg-gray-900" dangerouslySetInnerHTML={{ __html: clip.generated_end_image }} />
                                    ) : (
                                        <img src={clip.generated_end_image} className="w-full h-full object-cover" alt="End Generated" />
                                    )
                                ) : clip.end_failed ? (
                                    <div className="w-full h-full flex items-center justify-center text-red-500 font-bold text-2xl bg-red-900/20 border border-red-500/50">❌</div>
                                ) : clip.imageUrl ? (
                                    <img src={clip.imageUrl} className="w-full h-full object-cover opacity-60 grayscale-[30%]" alt="End Placeholder" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-2xl animate-pulse">⏳</div>
                                )}
                                <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/90 to-transparent pt-8">
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
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
