export default function LearnLoading() {
  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-6 lg:p-10">
      <div className="mx-auto max-w-7xl">
        {/* Header skeleton */}
        <div className="mb-8 h-24 animate-pulse rounded-2xl border border-white/10 bg-white/5" />

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-2xl border border-white/10 bg-white/5"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
