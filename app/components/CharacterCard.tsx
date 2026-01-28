import Image from 'next/image';
import Link from 'next/link';

interface Character {
    id: string;
    name: string;
    role: string;
    traits: string;
    image?: string;
}

export default function CharacterCard({ character }: { character: Character }) {
    return (
        <div className="glass-panel p-4 flex flex-col items-center text-center relative overflow-hidden group">
            <div className="w-32 h-32 rounded-full overflow-hidden mb-4 border-2 border-[var(--primary)] shadow-[0_0_15px_var(--primary-glow)] relative">
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

            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link
                    href={`/characters/${character.id}`}
                    className="text-xs bg-black/50 hover:bg-[var(--primary)] text-white px-3 py-1.5 rounded backdrop-blur-sm"
                >
                    Edit
                </Link>
            </div>
        </div>
    );
}
