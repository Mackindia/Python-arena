"use client";

import { useState, useEffect } from "react";
import AppButton from "@/src/components/ui/AppButton";
import AppCard from "@/src/components/ui/AppCard";
import AppAlert from "@/src/components/ui/AppAlert";
import { Loader2, Upload, Trash2, Copy, Image as ImageIcon, Music, Film, Check } from "lucide-react";
import toast from "react-hot-toast";

type Asset = {
  _id: string;
  fileName: string;
  fileUrl: string;
  fileType: "image" | "audio" | "video" | "other";
  fileSize: number;
};

export default function MediaLibrary() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchAssets = async () => {
    try {
      const res = await fetch("/api/media/list");
      if (res.ok) {
        const data = await res.json();
        setAssets(data.assets);
      }
    } catch (error) {
      console.error("Failed to fetch assets", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error("File size exceeds 20MB limit");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        toast.success("File uploaded successfully!");
        fetchAssets();
      } else {
        const data = await res.json();
        toast.error(data.error || "Upload failed");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setUploading(false);
      // Clear input
      e.target.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      const res = await fetch("/api/media/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId: id }),
      });

      if (res.ok) {
        toast.success("Deleted!");
        setAssets(assets.filter(a => a._id !== id));
      }
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const copyToClipboard = (url: string, id: string) => {
    // Construct full URL if needed, but relative usually works in HTML
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("URL copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image": return <ImageIcon className="h-5 w-5 text-blue-400" />;
      case "audio": return <Music className="h-5 w-5 text-purple-400" />;
      case "video": return <Film className="h-5 w-5 text-emerald-400" />;
      default: return <Upload className="h-5 w-5 text-slate-400" />;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const totalUsed = assets.reduce((acc, a) => acc + a.fileSize, 0);
  const totalLimit = 20 * 1024 * 1024;
  const usagePercent = Math.min((totalUsed / totalLimit) * 100, 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Media Library</h2>
          <p className="text-sm text-slate-400">Total Storage: {formatSize(totalUsed)} / 20 MB</p>
          <div className="mt-2 h-1.5 w-48 overflow-hidden rounded-full bg-slate-800">
            <div 
              className={`h-full transition-all duration-500 ${usagePercent > 90 ? 'bg-red-500' : usagePercent > 70 ? 'bg-amber-500' : 'bg-cyan-500'}`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </div>
        <div className="relative">
          <input
            type="file"
            id="media-upload"
            className="hidden"
            accept="image/*,audio/*,video/*"
            onChange={handleUpload}
            disabled={uploading || totalUsed >= totalLimit}
          />
          <label 
            htmlFor="media-upload"
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition cursor-pointer bg-cyan-600 hover:bg-cyan-500 text-white ${uploading || totalUsed >= totalLimit ? 'opacity-50 pointer-events-none' : ''}`}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? "Uploading..." : totalUsed >= totalLimit ? "Storage Full" : "Upload Media"}
          </label>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
        </div>
      ) : assets.length === 0 ? (
        <AppCard className="border-dashed border-slate-800 bg-transparent text-center py-12">
          <p className="text-slate-500 italic">No files uploaded yet. Start by uploading an image or audio!</p>
        </AppCard>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {assets.map((asset) => (
            <AppCard key={asset._id} className="bg-slate-900/50 border-white/5 p-3 hover:border-white/10 transition-colors">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/10">
                  {getFileIcon(asset.fileType)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white" title={asset.fileName}>
                    {asset.fileName}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatSize(asset.fileSize)} • {asset.fileType}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => copyToClipboard(asset.fileUrl, asset._id)}
                    className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                    title="Copy Link"
                  >
                    {copiedId === asset._id ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(asset._id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </AppCard>
          ))}
        </div>
      )}
      
      <AppAlert variant="info">
        <p className="text-xs">
          <strong>Tip:</strong> After uploading, click the Copy icon and paste the link into your HTML code, like this: 
          <code className="ml-1 bg-black/40 px-1 rounded text-cyan-300">{"<img src=\"/uploads/...\">"}</code>
        </p>
      </AppAlert>
    </div>
  );
}
