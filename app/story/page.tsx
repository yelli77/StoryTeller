"use client";
import { useState, useEffect } from 'react';
import ScriptTable from '../components/ScriptTable';
import { useRouter } from 'next/navigation';

export default function StoryPage() {
    const [topic, setTopic] = useState('');
    const [duration, setDuration] = useState(16);
    const [locations, setLocations] = useState<any[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [script, setScript] = useState([]);
    const router = useRouter();

    useEffect(() => {
        fetch('/api/locations')
            .then(res => res.json())
            .then(data => {
                setLocations(data);
                if (data.length > 0) setSelectedLocation(data[0].id);
            })
            .catch(err => console.error("Failed to fetch locations", err));
    }, []);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic) return;

        setLoading(true);
        setScript([]);

        // Find full location object
        const locationObj = locations.find(l => l.id === selectedLocation);

        try {
            const res = await fetch('/api/story/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic,
                    duration,
                    location: locationObj
                })
            });
            const data = await res.json();
            if (data.script) {
                setScript(data.script);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSendToProduction = () => {
        if (!script || script.length === 0) return;
        sessionStorage.setItem('currentScript', JSON.stringify(script));
        router.push('/production');
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="text-center space-y-2">
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]">
                    Story Engine
                </h1>
                <p className="text-gray-400">Turn a simple idea into a full viral script in seconds.</p>
            </div>

            <div className="glass-panel p-8">
                <form onSubmit={handleGenerate} className="flex flex-col gap-4">
                    <div className="flex gap-4">
                        <select
                            className="flex-1 bg-[var(--surface)] border border-[var(--glass-border)] rounded-xl p-4 text-white text-lg focus:border-[var(--primary)] focus:outline-none transition-colors"
                            value={selectedLocation}
                            onChange={e => setSelectedLocation(e.target.value)}
                        >
                            {locations.map(loc => (
                                <option key={loc.id} value={loc.id}>
                                    📍 {loc.name}
                                </option>
                            ))}
                        </select>
                        <input
                            type="number"
                            className="w-32 bg-[var(--surface)] border border-[var(--glass-border)] rounded-xl p-4 text-white text-lg focus:border-[var(--primary)] focus:outline-none transition-colors text-center"
                            placeholder="Sec"
                            value={duration}
                            onChange={e => setDuration(Number(e.target.value))}
                            min={5}
                            max={120}
                        />
                    </div>

                    <div className="flex gap-4">
                        <input
                            type="text"
                            className="flex-[3] bg-[var(--surface)] border border-[var(--glass-border)] rounded-xl p-4 text-white text-lg focus:border-[var(--primary)] focus:outline-none transition-colors"
                            placeholder="Enter a topic (e.g. 'Ben forgets the anniversary again')"
                            value={topic}
                            onChange={e => setTopic(e.target.value)}
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className={`btn-primary text-lg px-8 flex items-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <>
                                    <span className="animate-spin">⚡</span> Generating...
                                </>
                            ) : (
                                <>
                                    <span>✨</span> Spin Scenario
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {script.length > 0 && (
                <div className="animate-float" style={{ animationDuration: '0.5s', animationIterationCount: 1 }}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Generated Script</h2>
                        <div className="flex gap-2">
                            <button className="text-xs bg-[var(--surface)] hover:bg-[var(--glass-border)] text-gray-300 px-3 py-2 rounded transition-colors">
                                Export PDF
                            </button>
                            <button onClick={handleSendToProduction} className="text-xs btn-primary px-4 py-2 rounded">
                                → Send to Production
                            </button>
                        </div>
                    </div>
                    <ScriptTable script={script} />
                </div>
            )}
        </div>
    );
}
