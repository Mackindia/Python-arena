"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const HASH_PREFIX = "#/educational-ai";

export default function HashEducationalAIRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const hash = window.location.hash || "";
    if (!hash.startsWith(HASH_PREFIX)) {
      return;
    }

    const remainder = hash.slice(HASH_PREFIX.length);
    const normalized = remainder.startsWith("/") ? remainder : remainder ? `/${remainder}` : "";
    const target = `/educational-ai${normalized}`;

    router.replace(target);
  }, [router]);

  return null;
}
