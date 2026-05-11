"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────

export type LessonSearchItem = {
  id: string;
  title: string;
  slug: string;
  description: string;
  subject: { id: string; name: string; slug: string };
  class: { id: string; name: string; slug: string };
  thumbnail: string;
  pdfUrl: string;
  href: string;
};

export type LessonSearchMeta = {
  query: string;
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

export type LessonSearchResult = {
  items: LessonSearchItem[];
  meta: LessonSearchMeta;
};

export type UseSearchParams = {
  query: string;
  subject: string;
  class: string;
  page: number;
  limit?: number;
};

export type UseSearchReturn = {
  data: LessonSearchResult | null;
  loading: boolean;
  error: string;
  refetch: () => void;
};

// ─── Helper ────────────────────────────────────────────────────────────────

function buildSearchUrl(params: UseSearchParams): string {
  const sp = new URLSearchParams();
  if (params.query.trim()) sp.set("q", params.query.trim());
  if (params.subject) sp.set("subject", params.subject);
  if (params.class) sp.set("class", params.class);
  if (params.page > 1) sp.set("page", String(params.page));
  if (params.limit && params.limit !== 9) sp.set("limit", String(params.limit));
  return `/api/lms/lessons/search?${sp.toString()}`;
}

const DEBOUNCE_MS = 280;
const MIN_QUERY_LEN = 2;

// ─── Hook ──────────────────────────────────────────────────────────────────

/**
 * useSearch
 *
 * Debounced LMS lesson search hook. Fires when query length >= 2 or a filter
 * (subject / class) is active. Aborts in-flight requests when params change.
 *
 * Usage:
 *   const { data, loading, error } = useSearch({ query, subject, class: cls, page });
 */
export function useSearch(params: UseSearchParams): UseSearchReturn {
  const [data, setData] = useState<LessonSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fetchKey, setFetchKey] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasActiveFilter = params.subject || params.class;
  const canSearch = params.query.trim().length >= MIN_QUERY_LEN || Boolean(hasActiveFilter);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  useEffect(() => {
    if (!canSearch) {
      setData(null);
      setError("");
      setLoading(false);
      return;
    }

    // Clear previous timer
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      // Abort any in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError("");

      try {
        const url = buildSearchUrl(params);
        const res = await fetch(url, { signal: controller.signal });
        const json = await res.json();

        if (!res.ok) {
          setError((json as { message?: string }).message ?? "Search failed");
          setData(null);
          return;
        }

        setData(json as LessonSearchResult);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError("Search is temporarily unavailable.");
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.query, params.subject, params.class, params.page, params.limit, fetchKey, canSearch]);

  // Abort on unmount
  useEffect(() => () => { abortRef.current?.abort(); }, []);

  return { data, loading, error, refetch };
}

// ─── Filter data hook ──────────────────────────────────────────────────────

export type SubjectOption = { slug: string; name: string };
export type ClassOption = {
  _id?: string;
  slug: string;
  name: string;
  subject?: string;
};

export type UseFilterOptionsReturn = {
  subjects: SubjectOption[];
  classes: ClassOption[];
  loadingSubjects: boolean;
  loadingClasses: boolean;
};

/**
 * useFilterOptions
 *
 * Fetches subjects on mount. Fetches classes filtered by subject when
 * `selectedSubject` changes. Results are cached locally per subject slug.
 */
export function useFilterOptions(selectedSubject: string): UseFilterOptionsReturn {
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const classCache = useRef<Map<string, ClassOption[]>>(new Map());

  // Fetch subjects once on mount
  useEffect(() => {
    let cancelled = false;
    setLoadingSubjects(true);

    fetch("/api/lms/subjects")
      .then((r) => r.json())
      .then((data: { subjects?: SubjectOption[] }) => {
        if (!cancelled) setSubjects(data.subjects ?? []);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingSubjects(false); });

    return () => { cancelled = true; };
  }, []);

  // Fetch classes when subject changes
  useEffect(() => {
    const cacheKey = selectedSubject || "__all__";

    if (classCache.current.has(cacheKey)) {
      setClasses(classCache.current.get(cacheKey)!);
      return;
    }

    let cancelled = false;
    setLoadingClasses(true);

    const url = selectedSubject
      ? `/api/lms/classes?subject=${encodeURIComponent(selectedSubject)}`
      : "/api/lms/classes";

    fetch(url)
      .then((r) => r.json())
      .then((data: { classes?: ClassOption[] }) => {
        if (!cancelled) {
          const list = data.classes ?? [];
          classCache.current.set(cacheKey, list);
          setClasses(list);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingClasses(false); });

    return () => { cancelled = true; };
  }, [selectedSubject]);

  return { subjects, classes, loadingSubjects, loadingClasses };
}
