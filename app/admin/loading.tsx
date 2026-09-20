export default function AdminLoading() {
  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Sidebar skeleton */}
      <div className="hidden w-64 border-r border-white/10 bg-slate-900/80 p-4 lg:block">
        <div className="mb-6 h-8 w-32 animate-pulse rounded-lg bg-white/10" />
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-10 animate-pulse rounded-lg bg-white/5"
            />
          ))}
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 p-6">
        <div className="mb-6 h-8 w-48 animate-pulse rounded-lg bg-white/10" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-2xl border border-white/10 bg-white/5"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
