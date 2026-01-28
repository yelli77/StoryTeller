"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
    const pathname = usePathname();

    const navItems = [
        { name: 'Dashboard', path: '/', icon: '🏠' },
        { name: 'Character Deck', path: '/characters', icon: '👥' },
        { name: 'Story Engine', path: '/story', icon: '✍️' },
        { name: 'Production', path: '/production', icon: '🎬' },
        { name: 'Launchpad', path: '/launchpad', icon: '🚀' },
    ];

    return (
        <aside className="w-64 glass-panel m-4 flex flex-col h-[calc(100vh-2rem)]">
            <div className="p-6 border-b border-[var(--glass-border)]">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]">
                    StoryTeller
                </h1>
                <p className="text-xs text-gray-400 mt-1">AI Shorts Studio</p>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                    ? 'bg-[var(--primary)] text-white shadow-[0_0_15px_var(--primary-glow)]'
                                    : 'text-gray-400 hover:bg-[var(--glass-border)] hover:text-white'
                                }`}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-[var(--glass-border)]">
                <div className="glass-panel p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-500"></div>
                    <div>
                        <p className="text-sm font-bold">Creator</p>
                        <p className="text-xs text-[var(--success)]">● Online</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
