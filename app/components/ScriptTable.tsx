export default function ScriptTable({ script }: { script: any[] }) {
    if (!script || script.length === 0) return null;

    return (
        <div className="glass-panel overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[var(--glass-border)] text-gray-400 text-xs uppercase tracking-wider">
                            <th className="p-4">Time</th>
                            <th className="p-4">Speaker</th>
                            <th className="p-4">Action / Visual</th>
                            <th className="p-4">Line</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--glass-border)]">
                        {script.map((row, i) => (
                            <tr key={i} className="hover:bg-[var(--glass-bg)] transition-colors">
                                <td className="p-4 text-xs font-mono text-gray-500">{row.time}</td>
                                <td className="p-4 font-bold text-[var(--secondary)]">{row.speaker}</td>
                                <td className="p-4 text-sm italic text-gray-400 space-y-2">
                                    <div>
                                        <span className="bg-gray-800/50 px-2 py-1 rounded text-xs mr-2 border border-gray-700">Action</span>
                                        {row.action}
                                    </div>
                                    {(row.visual_start || row.visual_end) && (
                                        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-800">
                                            <div>
                                                <span className="text-[10px] uppercase text-gray-500 block mb-1">Start Frame</span>
                                                <p className="text-xs text-gray-300">{row.visual_start}</p>
                                            </div>
                                            <div>
                                                <span className="text-[10px] uppercase text-gray-500 block mb-1">End Frame</span>
                                                <p className="text-xs text-gray-300">{row.visual_end}</p>
                                            </div>
                                        </div>
                                    )}
                                </td>
                                <td className="p-4 font-medium text-white">"{row.line}"</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
