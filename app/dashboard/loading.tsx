export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-black p-4 sm:p-6 lg:p-10">
      <div className="mx-auto max-w-7xl">
        {/* Header skeleton */}
        <div className="mb-8 h-32 animate-pulse rounded-[2rem] border border-white/10 bg-white/5" />
        
        {/* Stats grid skeleton */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl border border-white/10 bg-white/5"
            />
          ))}
        </div>

        {/* Content skeleton */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-64 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
          <div className="h-64 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
        </div>
      </div>
    </div>
  );
}
