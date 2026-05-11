"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";

export default function ClerkUserSync() {
  const { isLoaded, isSignedIn, user } = useUser();
  const lastSyncedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.id) {
      return;
    }

    if (lastSyncedUserId.current === user.id) {
      return;
    }

    lastSyncedUserId.current = user.id;

    void fetch("/api/sync-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
  }, [isLoaded, isSignedIn, user?.id]);

  return null;
}