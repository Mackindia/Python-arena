export default function AdminSettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="mt-2 text-sm text-slate-300">Configure categories, class levels, moderation and platform defaults.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-semibold">Category System</h2>
          <p className="mt-2 text-sm text-slate-300">Default taxonomy: AI, Python, Computer Science and Class 6-12.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-semibold">Publishing Rules</h2>
          <p className="mt-2 text-sm text-slate-300">Use draft, published, archived states for all lessons and courses.</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <a href="/admin/ordering" className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm hover:bg-black/40">Open content ordering</a>
        <a href="/admin/moderation" className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm hover:bg-black/40">Open moderation queue</a>
      </div>
    </div>
  );
}
