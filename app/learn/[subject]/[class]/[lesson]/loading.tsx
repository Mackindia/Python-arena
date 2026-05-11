export default function LessonLoading() {
  return (
    <main className="min-h-screen bg-black px-4 py-14 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="h-5 w-56 animate-pulse rounded bg-white/10" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
          <div className="h-[480px] animate-pulse rounded-2xl bg-white/10" />
          <div className="h-[480px] animate-pulse rounded-2xl bg-white/10" />
        </div>
      </div>
    </main>
  );
}
