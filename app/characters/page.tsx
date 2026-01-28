"use client";
import { useEffect, useState } from 'react';
import CharacterCard from '../components/CharacterCard';
import Link from 'next/link';

interface Character {
    id: string;
    name: string;
    role: string;
    traits: string;
    image?: string;
    voiceId?: string;
}

export default function CharactersPage() {
    const [characters, setCharacters] = useState<Character[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/characters')
            .then(res => res.json())
            .then(data => {
                setCharacters(data);
                setLoading(false);
            });
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        Character Deck
                    </h1>
                    <p className="text-gray-400 text-sm">Manage your cast</p>
                </div>
                <Link href="/characters/new" className="btn-primary flex items-center gap-2">
                    <span>+ Add Character</span>
                </Link>
            </div>

            {loading ? (
                <div className="text-center p-12 text-gray-500 animate-pulse">Loading cast...</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {characters.map(char => (
                        <CharacterCard key={char.id} character={char} />
                    ))}

                    {/* Add New Placeholder/Button Card if empty or just as visual cue */}
                    {characters.length === 0 && (
                        <div className="col-span-full text-center p-12 glass-panel">
                            <p className="text-xl mb-4">No characters yet.</p>
                            <Link href="/characters/new" className="text-[var(--primary)] underline">Create your first actor</Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
