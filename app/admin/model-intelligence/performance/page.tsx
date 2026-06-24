"use client";

import { useEffect, useState } from "react";
import EnginePageLayout from "@/src/components/admin/EnginePageLayout";
import PerformanceDashboard from "@/src/components/admin/model-intelligence/PerformanceDashboard";

export default function PerformancePage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tuning, setTuning] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/model-intelligence/performance");
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Failed to load performance stats");
    } finally {
      setLoading(false);
    }
  };

  const runTuner = async () => {
    setTuning(true);
    try {
      await fetch("/api/admin/model-intelligence/tune", { method: "POST" });
      await fetchStats(); // Refresh stats after tune
    } finally {
      setTuning(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <EnginePageLayout
      title="Adaptive Learning & Optimization Engine"
      category="Analytics"
      description="Monitor model drift, view live leaderboards, and trigger registry self-tuning."
    >
      <PerformanceDashboard stats={stats} loading={loading} onTune={runTuner} isTuning={tuning} />
    </EnginePageLayout>
  );
}
