export default function Home() {
  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-4xl font-bold mb-2">Welcome Back, Creator</h2>
        <p className="text-gray-400">Ready to automate your next viral hit?</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Quick Stats / Actions */}
        <div className="glass-panel p-6 animate-float" style={{ animationDelay: '0s' }}>
          <h3 className="text-gray-400 text-sm mb-2">Active Characters</h3>
          <p className="text-4xl font-bold text-white">4</p>
        </div>
        <div className="glass-panel p-6 animate-float" style={{ animationDelay: '0.2s' }}>
          <h3 className="text-gray-400 text-sm mb-2">Scripts Generated</h3>
          <p className="text-4xl font-bold text-[var(--secondary)]">12</p>
        </div>
        <div className="glass-panel p-6 animate-float" style={{ animationDelay: '0.4s' }}>
          <h3 className="text-gray-400 text-sm mb-2">Videos Produced</h3>
          <p className="text-4xl font-bold text-[var(--primary)]">8</p>
        </div>
        <div className="glass-panel p-6 animate-float" style={{ animationDelay: '0.6s' }}>
          <h3 className="text-gray-400 text-sm mb-2">Avg. Views</h3>
          <p className="text-4xl font-bold text-[var(--success)]">25k</p>
        </div>
      </div>

      <div className="glass-panel p-8 mt-8">
        <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
        <div className="flex gap-4">
          <a href="/story" className="btn-primary">New Script</a>
          <a href="/studio" className="btn-primary bg-purple-600 hover:bg-purple-500 border-purple-400">Manual Studio</a>
          <a href="/characters" className="btn-secondary">Add Character</a>
        </div>
      </div>
    </div>
  );
}
