"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

type SearchBarProps = {
  placeholders: string[];
};

type SearchResult = {
  _id: string;
  title?: string;
  slug?: string;
  subject?: string;
  classLevel?: string;
  question?: string;
  kind?: string;
  url?: string;
  href?: string;
};

type SearchResponse = {
  results: {
    courses: SearchResult[];
    lessons: SearchResult[];
    quizzes: SearchResult[];
    resources: SearchResult[];
  };
};

export default function SearchBar({ placeholders }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [remoteResults, setRemoteResults] = useState<SearchResponse["results"] | null>(null);
  const [remoteError, setRemoteError] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) {
      return placeholders.slice(0, 3);
    }

    const value = query.toLowerCase();
    return placeholders.filter((item) => item.toLowerCase().includes(value)).slice(0, 6);
  }, [query, placeholders]);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 2) {
      setRemoteResults(null);
      setRemoteError("");
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      setRemoteError("");

      const response = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
      const data = await response.json();

      if (!response.ok) {
        setRemoteError(data.message || "Search failed");
        setRemoteResults(null);
      } else {
        setRemoteResults(data.results);
      }

      setLoading(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="rounded-2xl border border-cyan-400/20 bg-slate-950 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
      <label className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">Search Topics</label>
      <div className="mt-2 flex items-center gap-2 rounded-lg border border-white/15 bg-slate-900 px-3 py-2">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Python loops, AI ethics, class 11 functions"
          className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {filtered.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setQuery(item)}
            className="rounded-full border border-white/15 bg-slate-900 px-3 py-1 text-xs text-slate-200 transition hover:bg-slate-800"
          >
            {item}
          </button>
        ))}
      </div>

      {loading ? <p className="mt-3 text-xs text-slate-400">Searching database...</p> : null}
      {remoteError ? <p className="mt-3 text-xs text-rose-300">{remoteError}</p> : null}

      {remoteResults ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-slate-900 p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-cyan-200">Courses</p>
            <ul className="mt-2 space-y-1 text-xs text-slate-300">
              {remoteResults.courses.length ? remoteResults.courses.map((item) => (
                <li key={item._id}>
                  {item.href ? (
                    <Link href={item.href} className="hover:text-cyan-200">
                      {item.title}
                    </Link>
                  ) : item.title}
                </li>
              )) : <li>No matches</li>}
            </ul>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-900 p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-cyan-200">Lessons</p>
            <ul className="mt-2 space-y-1 text-xs text-slate-300">
              {remoteResults.lessons.length ? remoteResults.lessons.map((item) => (
                <li key={item._id}>
                  {item.href ? (
                    <Link href={item.href} className="hover:text-cyan-200">
                      {item.title}
                    </Link>
                  ) : item.title}
                </li>
              )) : <li>No matches</li>}
            </ul>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-900 p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-cyan-200">Quizzes</p>
            <ul className="mt-2 space-y-1 text-xs text-slate-300">
              {remoteResults.quizzes.length ? remoteResults.quizzes.map((item) => (
                <li key={item._id}>
                  {item.href ? (
                    <Link href={item.href} className="hover:text-cyan-200">
                      {item.question}
                    </Link>
                  ) : item.question}
                </li>
              )) : <li>No matches</li>}
            </ul>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-900 p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-cyan-200">Resources</p>
            <ul className="mt-2 space-y-1 text-xs text-slate-300">
              {remoteResults.resources.length ? remoteResults.resources.map((item) => (
                <li key={item._id}>
                  {item.url ? (
                    <Link href={item.url} target="_blank" rel="noreferrer" className="hover:text-cyan-200">
                      {item.title}
                    </Link>
                  ) : item.title}
                </li>
              )) : <li>No matches</li>}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
