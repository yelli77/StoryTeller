"use client";
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Character {
    id: string;
    name: string;
    role: string;
    traits: string;
    image?: string;
    isCamera?: boolean;
}

export default function CharacterCard({ character: initialChar }: { character: Character }) {
    const router = useRouter();
    const [character, setCharacter] = useState(initialChar);
    const [toggling, setToggling] = useState(false);

    const toggleCamera = async () => {
        setToggling(true);
        const newState = !character.isCamera;

        try {
            const res = await fetch('/api/characters', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: character.id, isCamera: newState })
            });

            if (res.ok) {
                setCharacter(prev => ({ ...prev, isCamera: newState }));
                router.refresh(); // Refresh data in parent
            }
        } catch (e) {
            console.error("Failed to toggle camera mode", e);
        } finally {
            setToggling(false);
        }
    };

    return (
        <div className={`glass-panel p-4 flex flex-col items-center text-center relative overflow-hidden group transition-all ${character.isCamera ? 'border-dashed border-gray-600 bg-gray-900/40' : ''}`}>
            {/* POV Toggle */}
            <button
                onClick={toggleCamera}
                disabled={toggling}
                className={`absolute top-2 left-2 z-10 p-1.5 rounded-full backdrop-blur-md border transition-all ${character.isCamera
                    ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                    : 'bg-black/30 text-gray-500 border-gray-600 hover:text-white hover:bg-black/80'}`}
                title={character.isCamera ? "POV Mode (Invisible Cameraman)" : "Visible Actor"}
            >
                {toggling ? '...' : character.isCamera ? '🎥' : '👤'}
            </button>

            {/* Status Badge */}
            {character.isCamera && (
                <div className="absolute top-12 left-2 z-10 text-[10px] bg-black/80 text-[var(--primary)] px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                    POV
                </div>
            )}

            <div className={`w-32 h-32 rounded-full overflow-hidden mb-4 border-2 shadow-[0_0_15px_var(--primary-glow)] relative transition-all ${character.isCamera ? 'grayscale opacity-50 border-gray-700 shadow-none' : 'border-[var(--primary)]'}`}>
                {character.image ? (
                    <img
                        src={character.image}
                        alt={character.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center text-2xl">?</div>
                )}
            </div>

            <h3 className="text-xl font-bold text-white mb-1">{character.name}</h3>
            <p className="text-sm text-[var(--secondary)] font-medium mb-2">{character.role}</p>
            <p className="text-xs text-gray-400 line-clamp-3">{character.traits}</p>

            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <Link
                    href={`/characters/${character.id}`}
                    className="text-xs bg-black/50 hover:bg-[var(--primary)] text-white px-3 py-1.5 rounded backdrop-blur-sm"
                >
                    Edit
                </Link>
                <button
                    onClick={async (e) => {
                        e.preventDefault();
                        if (confirm(`Delete ${character.name}?`)) {
                            const res = await fetch(`/api/characters/${character.id}`, { method: 'DELETE' });
                            if (res.ok) router.refresh();
                        }
                    }}
                    className="text-xs bg-black/50 hover:bg-red-600 text-white px-3 py-1.5 rounded backdrop-blur-sm"
                >
                    🗑️
                </button>
            </div>
        </div>
    );
}
