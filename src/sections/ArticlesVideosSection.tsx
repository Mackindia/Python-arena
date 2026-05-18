"use client";

import { useEffect, useState } from "react";
import { Calendar, ExternalLink, Cpu, AlertCircle } from "lucide-react";
import ScrollReveal from "@/src/components/ScrollReveal";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1677442136019-21780efad99a?w=600&auto=format&fit=crop&q=60";

export default function ArticlesVideosSection() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchNews = async (page: number) => {
    setLoading(true);
    try {
      // Limit to 8 items per page for clean grid display (grid-cols-4 * 2 rows)
      const response = await fetch(`/api/ai-news?page=${page}&limit=8`);
      const data = await response.json();

      if (data.success) {
        setArticles(data.articles);
        setCurrentPage(data.currentPage);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("News Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews(1);
  }, []);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchNews(newPage);
      // Smooth scroll back to top of the articles section
      const element = document.getElementById("articles-videos");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <section id="articles-videos" className="px-4 py-20 bg-slate-950 text-white sm:px-6 lg:px-10 border-y border-slate-900 relative overflow-hidden">
      {/* Decorative gradient glowing backgrounds */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl relative z-10">
        <ScrollReveal>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-800/40 text-cyan-400 text-xs font-semibold mb-3">
            <Cpu className="h-3.5 w-3.5" />
            Live AI Pulse
          </div>
          <h2 className="text-3xl font-extrabold sm:text-4xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            AI News & Updates
          </h2>
          <p className="mt-3 max-w-2xl text-slate-400 text-base leading-relaxed">
            Stay ahead of the curve with dynamically synced articles and updates from the leading edge of AI innovation.
          </p>
        </ScrollReveal>

        <div className="mt-12">
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 animate-pulse">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden h-[380px] flex flex-col">
                  <div className="bg-slate-800/50 h-48 w-full" />
                  <div className="p-5 flex-1 flex flex-col space-y-3 justify-between">
                    <div className="space-y-2">
                      <div className="h-3 bg-slate-800/60 rounded w-1/4" />
                      <div className="h-5 bg-slate-800/60 rounded w-3/4" />
                      <div className="h-3 bg-slate-800/60 rounded w-full" />
                      <div className="h-3 bg-slate-800/60 rounded w-5/6" />
                    </div>
                    <div className="h-8 bg-slate-800/60 rounded-xl w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && articles.length === 0 && (
            <div className="text-center py-20 text-slate-500 bg-slate-900/20 border border-slate-800/60 rounded-2xl flex flex-col items-center justify-center">
              <AlertCircle className="h-10 w-10 mb-3 text-slate-600" />
              Failed to load articles. Please refresh the page.
            </div>
          )}

          {!loading && articles.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {articles.map((article: any, index) => (
                  <ScrollReveal key={article._id || index} delay={index * 0.04}>
                    <a
                      href={article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-black/30 border border-cyan-500/20 rounded-2xl overflow-hidden hover:border-cyan-400 transition-all duration-300 hover:scale-[1.02] flex flex-col h-full group"
                    >
                      <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                        <img
                          src={article.image || FALLBACK_IMAGE}
                          alt={article.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e: any) => {
                            e.target.src = FALLBACK_IMAGE;
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent" />
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <p className="text-cyan-300 text-xs mb-2 flex items-center gap-1.5 font-mono">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(article.publishedAt || article.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>

                          <h3 className="text-white font-semibold line-clamp-2 mb-3 group-hover:text-cyan-300 transition-colors duration-300">
                            {article.title}
                          </h3>

                          <p className="text-gray-400 text-sm line-clamp-3 leading-relaxed">
                            {article.description}
                          </p>
                        </div>

                        <div className="mt-5 text-cyan-400 text-sm font-medium flex items-center gap-1.5">
                          Read More 
                          <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </a>
                  </ScrollReveal>
                ))}
              </div>

              {/* Dynamic Pagination Controls */}
              {totalPages > 1 && (
                <ScrollReveal>
                  <div className="mt-12 flex items-center justify-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-xs font-semibold rounded-xl border border-cyan-500/20 bg-cyan-950/20 text-cyan-400 hover:bg-cyan-950/40 disabled:opacity-30 disabled:pointer-events-none transition-all duration-300"
                    >
                      Previous
                    </button>
                    
                    {Array.from({ length: totalPages }).map((_, idx) => {
                      const pageNum = idx + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-9 h-9 text-xs font-semibold rounded-xl border transition-all duration-300 ${
                            currentPage === pageNum
                              ? "bg-cyan-500 border-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                              : "border-cyan-500/20 bg-cyan-950/10 text-cyan-400 hover:bg-cyan-950/30"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 text-xs font-semibold rounded-xl border border-cyan-500/20 bg-cyan-950/20 text-cyan-400 hover:bg-cyan-950/40 disabled:opacity-30 disabled:pointer-events-none transition-all duration-300"
                    >
                      Next
                    </button>
                  </div>
                </ScrollReveal>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
