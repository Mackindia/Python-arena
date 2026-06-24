"use client";

import { useEffect, useState } from "react";
import ModelRegistryTable from "@/src/components/admin/model-intelligence/ModelRegistryTable";
import ModelDetailModal from "@/src/components/admin/model-intelligence/ModelDetailModal";
import EnginePageLayout from "@/src/components/admin/EnginePageLayout";
import { BrainCircuit, Settings, Activity } from "lucide-react";

export default function ModelIntelligencePage() {
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<any | null>(null);

  const fetchModels = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/model-registry");
      const data = await res.json();
      if (data.models) {
        setModels(data.models);
      }
    } catch (error) {
      console.error("Failed to fetch models", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  return (
    <EnginePageLayout
      title="Model Intelligence Engine"
      category="Automation"
      description="Orchestrate AI routing, manage model recommendations, and analyze prompt workflows."
      quickActions={[
        {
          label: "Refresh Registry",
          onClick: fetchModels,
          icon: Activity
        }
      ]}
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-2 mb-2">
              <BrainCircuit className="h-5 w-5 text-cyan-400" />
              <p className="text-sm font-semibold text-white">Active Models</p>
            </div>
            <p className="text-3xl font-bold text-white">{models.filter((m) => m.isActive).length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="h-5 w-5 text-fuchsia-400" />
              <p className="text-sm font-semibold text-white">Registry Size</p>
            </div>
            <p className="text-3xl font-bold text-white">{models.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-5 w-5 text-emerald-400" />
              <p className="text-sm font-semibold text-white">Router Status</p>
            </div>
            <p className="text-xl font-bold text-emerald-400 mt-2">Ready</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="mb-4 text-lg font-semibold text-white">Model Registry</h2>
          {loading ? (
            <p className="text-slate-400">Loading models...</p>
          ) : (
            <ModelRegistryTable models={models} onView={(model) => setSelectedModel(model)} />
          )}
        </div>
      </div>

      {selectedModel && (
        <ModelDetailModal
          model={selectedModel}
          onClose={() => setSelectedModel(null)}
          onRefresh={fetchModels}
        />
      )}
    </EnginePageLayout>
  );
}
