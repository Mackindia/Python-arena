import ArticlesVideosSection from "@/src/sections/ArticlesVideosSection";

// Static page - no server rendering needed
export const dynamic = "force-static";

export default function ArticlesPage() {
  return (
    <div className="bg-slate-950 min-h-screen">
      <ArticlesVideosSection />
    </div>
  );
}
