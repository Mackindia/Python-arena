"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BookmarkedLesson = {
  id: string;
  lessonSlug: string;
  subjectSlug: string;
  classSlug: string;
  lessonTitle: string;
  lessonThumbnail: string;
  lessonDescription: string;
  href: string;
  savedAt: string;
};

export type UseSavedLessonsReturn = {
  bookmarks: BookmarkedLesson[];
  total: number;
  hasMore: boolean;
  loading: boolean;
  error: string;
  loadMore: () => void;
  refetch: () => void;
};

// ─── useSavedLessons ─────────────────────────────────────────────────────────

type ListState = {
  bookmarks: BookmarkedLesson[];
  total: number;
  page: number;
  hasMore: boolean;
  loading: boolean;
  error: string;
};

type ListAction =
  | { type: "FETCH_START"; reset: boolean }
  | { type: "FETCH_SUCCESS"; bookmarks: BookmarkedLesson[]; total: number; hasMore: boolean; page: number }
  | { type: "FETCH_ERROR"; error: string }
  | { type: "LOAD_MORE" };

function listReducer(state: ListState, action: ListAction): ListState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: "", ...(action.reset ? { bookmarks: [], page: 1 } : {}) };
    case "FETCH_SUCCESS":
      return {
        ...state,
        loading: false,
        total: action.total,
        hasMore: action.hasMore,
        page: action.page,
        bookmarks:
          action.page === 1
            ? action.bookmarks
            : [...state.bookmarks, ...action.bookmarks],
      };
    case "FETCH_ERROR":
      return { ...state, loading: false, error: action.error };
    case "LOAD_MORE":
      return { ...state, page: state.page + 1 };
    default:
      return state;
  }
}

const LIST_LIMIT = 12;

export function useSavedLessons(): UseSavedLessonsReturn {
  const [state, dispatch] = useReducer(listReducer, {
    bookmarks: [],
    total: 0,
    page: 1,
    hasMore: false,
    loading: true,
    error: "",
  });

  const fetchKey = useRef(0);

  const fetch_ = useCallback(async (page: number, reset = false) => {
    const key = ++fetchKey.current;
    dispatch({ type: "FETCH_START", reset });

    try {
      const res = await fetch(
        `/api/lms/bookmarks?page=${page}&limit=${LIST_LIMIT}`,
      );
      const data = await res.json();
      if (fetchKey.current !== key) return;

      if (!res.ok) {
        dispatch({ type: "FETCH_ERROR", error: data.message || "Failed to load saved lessons" });
        return;
      }

      dispatch({
        type: "FETCH_SUCCESS",
        bookmarks: data.bookmarks ?? [],
        total: data.total ?? 0,
        hasMore: data.hasMore ?? false,
        page,
      });
    } catch {
      if (fetchKey.current === key) {
        dispatch({ type: "FETCH_ERROR", error: "Failed to load saved lessons" });
      }
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetch_(1, true);
  }, [fetch_]);

  const loadMore = useCallback(() => {
    if (!state.loading && state.hasMore) {
      fetch_(state.page + 1, false);
    }
  }, [fetch_, state.loading, state.hasMore, state.page]);

  const refetch = useCallback(() => {
    fetch_(1, true);
  }, [fetch_]);

  return {
    bookmarks: state.bookmarks,
    total: state.total,
    hasMore: state.hasMore,
    loading: state.loading,
    error: state.error,
    loadMore,
    refetch,
  };
}

// ─── useBookmark (single lesson toggle) ──────────────────────────────────────

export type UseBookmarkParams = {
  subjectSlug: string;
  classSlug: string;
  lessonSlug: string;
  /** Initial state from server (avoids a client-side fetch on first render) */
  initialBookmarked?: boolean;
};

export type UseBookmarkReturn = {
  bookmarked: boolean;
  toggling: boolean;
  error: string;
  toggle: () => Promise<void>;
};

export function useBookmark({
  subjectSlug,
  classSlug,
  lessonSlug,
  initialBookmarked = false,
}: UseBookmarkParams): UseBookmarkReturn {
  const [bookmarked, setBookmarked] = useReducer(
    (_: boolean, next: boolean) => next,
    initialBookmarked,
  );
  const [toggling, setToggling] = useReducer((_: boolean, next: boolean) => next, false);
  const [error, setError] = useReducer((_: string, next: string) => next, "");

  // Sync with server on mount if no initial value provided (initialBookmarked defaults to false
  // — only skip the check if the caller explicitly passes true)
  useEffect(() => {
    if (initialBookmarked) return; // trust the passed-in value

    let active = true;
    fetch(
      `/api/lms/bookmarks?check=${encodeURIComponent(lessonSlug)}&subject=${encodeURIComponent(subjectSlug)}&class=${encodeURIComponent(classSlug)}`,
    )
      .then((r) => r.json())
      .then((d) => {
        if (active && typeof d.bookmarked === "boolean") setBookmarked(d.bookmarked);
      })
      .catch(() => {/* non-fatal */});

    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectSlug, classSlug, lessonSlug]);

  const toggle = useCallback(async () => {
    if (toggling) return;
    setToggling(true);
    setError("");

    // Optimistic update
    setBookmarked(!bookmarked);

    try {
      const res = await fetch("/api/lms/bookmarks/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subjectSlug, class: classSlug, lesson: lessonSlug }),
      });
      const data = await res.json();

      if (!res.ok) {
        setBookmarked(bookmarked); // revert
        setError(data.message || "Failed to update bookmark");
        return;
      }

      setBookmarked(data.bookmarked);
    } catch {
      setBookmarked(bookmarked); // revert
      setError("Network error. Please try again.");
    } finally {
      setToggling(false);
    }
  }, [bookmarked, toggling, subjectSlug, classSlug, lessonSlug]);

  return { bookmarked, toggling, error, toggle };
}
