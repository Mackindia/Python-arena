"use client";

import { useState, useEffect } from "react";

export function useEngineStorage() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentlyUsed, setRecentlyUsed] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const favs = localStorage.getItem("python_arena_fav_engines");
    const recents = localStorage.getItem("python_arena_recent_engines");
    if (favs) {
      try {
        setFavorites(JSON.parse(favs));
      } catch {
        /* Ignore */
      }
    }
    if (recents) {
      try {
        setRecentlyUsed(JSON.parse(recents));
      } catch {
        /* Ignore */
      }
    }
    setMounted(true);
  }, []);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const updated = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem("python_arena_fav_engines", JSON.stringify(updated));
      return updated;
    });
  };

  const recordUsage = (id: string) => {
    setRecentlyUsed((prev) => {
      const filtered = prev.filter((x) => x !== id);
      const updated = [id, ...filtered].slice(0, 4);
      localStorage.setItem("python_arena_recent_engines", JSON.stringify(updated));
      return updated;
    });
  };

  return { favorites, recentlyUsed, toggleFavorite, recordUsage, mounted };
}
