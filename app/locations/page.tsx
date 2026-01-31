"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LocationDeck() {
    const [locations, setLocations] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/locations')
            .then(res => res.json())
            .then(data => setLocations(data));
    }, []);

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]">
                        Location Deck
                    </h1>
                    <p className="text-gray-400">Manage your recurring sets and backgrounds.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={async () => {
                            if (confirm("Delete ALL locations? This cannot be undone.")) {
                                const res = await fetch('/api/locations', { method: 'DELETE' });
                                if (res.ok) window.location.reload();
                            }
                        }}
                        className="btn-secondary flex items-center gap-2 border-red-900/50 hover:bg-red-900/20 text-red-500"
                    >
                        🗑️ Delete All
                    </button>
                    <Link href="/locations/new" className="btn-primary flex items-center gap-2 px-6 py-3">
                        <span className="text-2xl">+</span> Add New Location
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {locations.map((loc) => (
                    <div key={loc.id} className="glass-panel p-4 group hover:border-[var(--primary)] transition-colors relative">
                        <button
                            onClick={async (e) => {
                                e.preventDefault();
                                if (confirm(`Delete ${loc.name}?`)) {
                                    const res = await fetch(`/api/locations/${loc.id}`, { method: 'DELETE' });
                                    if (res.ok) window.location.reload();
                                }
                            }}
                            className="absolute top-2 right-2 z-20 bg-black/50 hover:bg-red-600 text-white p-2 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete Location"
                        >
                            🗑️
                        </button>
                        <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4 relative">
                            {loc.image ? (
                                loc.image.startsWith('<svg') ? (
                                    <div className="w-full h-full bg-gray-900" dangerouslySetInnerHTML={{ __html: loc.image }} />
                                ) : (
                                    <img src={loc.image} alt={loc.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                )
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-700">No Image</div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                <span className="text-xs text-gray-300">ID: {loc.id}</span>
                            </div>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-1">{loc.name}</h2>
                        <p className="text-sm text-gray-400 line-clamp-3">{loc.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
