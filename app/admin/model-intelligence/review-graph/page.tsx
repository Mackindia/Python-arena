"use client";

import { useEffect, useState } from "react";
import EnginePageLayout from "@/src/components/admin/EnginePageLayout";
import ReviewGraphDashboard from "@/src/components/admin/model-intelligence/ReviewGraphDashboard";

export default function ReviewGraphPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/model-intelligence/review-graph/stats");
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Failed to load review graph stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <EnginePageLayout
      title="Review Graph Intelligence Layer"
      category="Analytics"
      description="Design multi-tiered review pipelines for Architecture, Security, and Code Quality validation."
    >
      <ReviewGraphDashboard stats={stats} loading={loading} />
    </EnginePageLayout>
  );
}
