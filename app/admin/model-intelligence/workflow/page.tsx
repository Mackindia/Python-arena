"use client";

import { useEffect, useState } from "react";
import EnginePageLayout from "@/src/components/admin/EnginePageLayout";
import WorkflowDashboard from "@/src/components/admin/model-intelligence/WorkflowDashboard";

export default function WorkflowPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/model-intelligence/workflow/stats");
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Failed to load workflow stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <EnginePageLayout
      title="Workflow Recommendation Engine"
      category="Automation"
      description="Design and orchestrate multi-model execution pipelines and review graphs."
    >
      <WorkflowDashboard stats={stats} loading={loading} />
    </EnginePageLayout>
  );
}
