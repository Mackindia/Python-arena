"use client";

import { useEffect, useState, useCallback } from "react";
import type {
  ClassProgress,
  SubjectProgress,
  UserProgressDashboard,
} from "@/lib/lms-progress-enhanced";

// ============================================================================
// Class Progress Hook
// ============================================================================

type UseClassProgressResult = {
  progress: ClassProgress | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useClassProgress(classSlug: string): UseClassProgressResult {
  const [progress, setProgress] = useState<ClassProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/lms/progress/class/${classSlug}`);

      if (!response.ok) {
        throw new Error("Failed to fetch class progress");
      }

      const data = await response.json();
      setProgress(data.progress);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [classSlug]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  return { progress, loading, error, refetch: fetchProgress };
}

// ============================================================================
// Subject Progress Hook
// ============================================================================

type UseSubjectProgressResult = {
  progress: SubjectProgress | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useSubjectProgress(subjectSlug: string): UseSubjectProgressResult {
  const [progress, setProgress] = useState<SubjectProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/lms/progress/subject/${subjectSlug}`);

      if (!response.ok) {
        throw new Error("Failed to fetch subject progress");
      }

      const data = await response.json();
      setProgress(data.progress);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [subjectSlug]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  return { progress, loading, error, refetch: fetchProgress };
}

// ============================================================================
// Progress Dashboard Hook
// ============================================================================

type UseProgressDashboardResult = {
  dashboard: UserProgressDashboard | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useProgressDashboard(): UseProgressDashboardResult {
  const [dashboard, setDashboard] = useState<UserProgressDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/lms/progress/dashboard");

      if (!response.ok) {
        throw new Error("Failed to fetch progress dashboard");
      }

      const data = await response.json();
      setDashboard(data.dashboard);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { dashboard, loading, error, refetch: fetchDashboard };
}

// ============================================================================
// Progress Analytics Hook
// ============================================================================

type ProgressAnalytics = {
  totalCompleted: number;
  totalViewed: number;
  completionRatePercent: number;
  lessonsPerWeek: number;
  activityByDate: Record<string, number>;
};

type UseProgressAnalyticsResult = {
  analytics: ProgressAnalytics | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useProgressAnalytics(): UseProgressAnalyticsResult {
  const [analytics, setAnalytics] = useState<ProgressAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/lms/progress/analytics");

      if (!response.ok) {
        throw new Error("Failed to fetch progress analytics");
      }

      const data = await response.json();
      setAnalytics(data.analytics);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { analytics, loading, error, refetch: fetchAnalytics };
}
