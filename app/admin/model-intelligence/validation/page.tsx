"use client";

import { useEffect, useState } from "react";
import EnginePageLayout from "@/src/components/admin/EnginePageLayout";
import ValidationDashboard from "@/src/components/admin/model-intelligence/ValidationDashboard";

export default function ValidationPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/model-intelligence/validation/stats");
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Failed to load validation stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <EnginePageLayout
      title="Recommendation Validation Layer"
      category="Analytics"
      description="Validate auto-routing recommendations before enabling live execution."
    >
      <ValidationDashboard stats={stats} loading={loading} />
    </EnginePageLayout>
  );
}
