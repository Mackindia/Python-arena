export default function EducationalAILoading() {
  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-6 lg:p-10">
      <div className="mx-auto max-w-7xl">
        {/* Header skeleton */}
        <div className="mb-8 h-32 animate-pulse rounded-[2rem] border border-white/10 bg-white/5" />

        {/* Tools grid skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-2xl border border-white/10 bg-white/5"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
