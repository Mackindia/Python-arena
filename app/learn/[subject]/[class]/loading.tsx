export default function ClassLoading() {
  return (
    <main className="min-h-screen bg-black px-4 py-14 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="h-5 w-52 animate-pulse rounded bg-white/10" />
        <div className="mt-5 h-10 w-80 animate-pulse rounded bg-white/10" />
        <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr]">
          <div className="h-96 animate-pulse rounded-2xl bg-white/10" />
          <div className="h-96 animate-pulse rounded-2xl bg-white/10" />
        </div>
      </div>
    </main>
  );
}
