"use client";

import { useState, useEffect, useCallback } from "react";
import { FolderOpen, Code, Globe, Trash2, Pencil, Eye, Search, ChevronDown, ChevronRight, AlertTriangle, X, Loader2, LayoutGrid, List as ListIcon, HardDrive, ExternalLink } from "lucide-react";
import Link from "next/link";

type Program = {
  _id: string;
  title: string;
  htmlCode?: string;
  cssCode?: string;
  jsCode?: string;
  pythonCode?: string;
  updatedAt: string;
  sizeBytes: number;
};

type UserFolder = {
  user: {
    clerkId: string;
    fullName: string;
    email: string;
    studentClass?: string;
  };
  webPrograms: Program[];
  pythonPrograms: Program[];
  totalPrograms: number;
  totalSizeBytes: number;
};

function formatBytes(bytes: number, decimals = 1) {
  if (!+bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function ProgramManager() {
  const [folders, setFolders] = useState<UserFolder[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalWebPrograms: 0, totalPythonPrograms: 0, totalPrograms: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "web" | "python">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"highest_usage" | "lowest_usage" | "most_programs">("highest_usage");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Modals
  const [deleteModal, setDeleteModal] = useState<{ id?: string; type: string; title?: string; deleteAll?: boolean; userId?: string } | null>(null);
  const [viewModal, setViewModal] = useState<{ program: Program; type: string } | null>(null);
  const [editModal, setEditModal] = useState<{ program: Program; type: string } | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit state
  const [editTitle, setEditTitle] = useState("");
  const [editHtml, setEditHtml] = useState("");
  const [editCss, setEditCss] = useState("");
  const [editJs, setEditJs] = useState("");
  const [editPython, setEditPython] = useState("");

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (typeFilter !== "all") params.set("type", typeFilter);
      params.set("sort", sortBy);
      
      const res = await fetch(`/api/admin/programs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setFolders(data.folders);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch programs:", error);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, sortBy]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchPrograms();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, typeFilter, fetchPrograms]);

  const toggleFolder = (userId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/admin/programs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deleteModal),
      });
      if (res.ok) {
        setDeleteModal(null);
        setDeleteConfirmText("");
        fetchPrograms();
      } else {
         console.error("Delete failed");
      }
    } catch (error) {
      console.error("Delete error", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditModal = (program: Program, type: string) => {
    setEditTitle(program.title);
    if (type === "web") {
      setEditHtml(program.htmlCode || "");
      setEditCss(program.cssCode || "");
      setEditJs(program.jsCode || "");
    } else {
      setEditPython(program.pythonCode || "");
    }
    setEditModal({ program, type });
    setViewModal(null); // Close view modal if opening edit from it
  };

  const handleSave = async () => {
    if (!editModal) return;
    setIsSaving(true);
    try {
      const updates: any = { title: editTitle, id: editModal.program._id, type: editModal.type };
      if (editModal.type === "web") {
        updates.htmlCode = editHtml;
        updates.cssCode = editCss;
        updates.jsCode = editJs;
      } else {
        updates.pythonCode = editPython;
      }

      const res = await fetch("/api/admin/programs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        setEditModal(null);
        fetchPrograms();
      }
    } catch (error) {
      console.error("Save error", error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderProgramList = (programs: Program[], type: "web" | "python") => {
    if (viewMode === "grid") {
      return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {programs.map((prog) => (
            <div key={prog._id} className={`group flex flex-col rounded-[20px] border border-white/10 bg-slate-900/40 p-5 shadow-lg transition hover:bg-slate-900/80 ${type === "web" ? "hover:border-cyan-400/40" : "hover:border-amber-400/40"}`}>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 ${type === "web" ? "bg-cyan-400/10" : "bg-amber-400/10"}`}>
                    {type === "web" ? <Globe className="h-5 w-5 text-cyan-400" /> : <Code className="h-5 w-5 text-amber-400" />}
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[10px] font-medium text-slate-400">
                    <HardDrive className="h-3 w-3" /> {formatBytes(prog.sizeBytes || 0)}
                  </span>
                </div>
                <h5 className="mt-4 font-semibold text-white truncate text-base" title={prog.title}>{prog.title}</h5>
                <p className="mt-1.5 text-xs text-slate-400">Updated {new Date(prog.updatedAt).toLocaleDateString()}</p>
              </div>
              <div className="mt-5 grid grid-cols-4 gap-2">
                <button onClick={() => setViewModal({ program: prog, type })} className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"><Eye className="h-3.5 w-3.5"/> View</button>
                <button onClick={() => openEditModal(prog, type)} className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"><Pencil className="h-3.5 w-3.5"/> Edit</button>
                <Link href={`/dashboard/${type === "web" ? "code" : "python"}?adminProgramId=${prog._id}`} target="_blank" className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-cyan-500/10 py-2 text-xs font-medium text-cyan-300 transition hover:bg-cyan-500/20"><ExternalLink className="h-3.5 w-3.5"/> Editor</Link>
                <button onClick={() => setDeleteModal({ id: prog._id, type, title: prog.title })} className="flex items-center justify-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/5 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300"><Trash2 className="h-3.5 w-3.5"/> Del</button>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="border-b border-white/10 bg-black/40 text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-5 py-3 font-medium">Program Name</th>
              <th className="px-5 py-3 font-medium">Storage Usage</th>
              <th className="px-5 py-3 font-medium">Last Modified</th>
              <th className="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {programs.map((prog) => (
              <tr key={prog._id} className="transition hover:bg-white/5">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    {type === "web" ? <Globe className="h-4 w-4 text-cyan-400" /> : <Code className="h-4 w-4 text-amber-400" />}
                    <span className="font-medium text-white">{prog.title}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-xs">
                    <HardDrive className="h-3.5 w-3.5 text-slate-400" /> {formatBytes(prog.sizeBytes || 0)}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-slate-400">{new Date(prog.updatedAt).toLocaleDateString()}</td>
                <td className="px-5 py-3.5">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setViewModal({ program: prog, type })} className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white" title="View"><Eye className="h-4 w-4"/></button>
                    <button onClick={() => openEditModal(prog, type)} className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white" title="Quick Edit"><Pencil className="h-4 w-4"/></button>
                    <Link href={`/dashboard/${type === "web" ? "code" : "python"}?adminProgramId=${prog._id}`} target="_blank" className="rounded-lg p-2 text-cyan-400 transition hover:bg-cyan-500/20" title="Open Full Editor"><ExternalLink className="h-4 w-4"/></Link>
                    <button onClick={() => setDeleteModal({ id: prog._id, type, title: prog.title })} className="rounded-lg p-2 text-red-400/80 transition hover:bg-red-500/10 hover:text-red-400" title="Delete"><Trash2 className="h-4 w-4"/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(8,47,73,0.95),rgba(15,23,42,0.98)_55%,rgba(30,41,59,0.98))] p-6 shadow-[0_24px_80px_rgba(8,47,73,0.35)] sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-200">
              <Code className="h-3.5 w-3.5" /> Administration
            </div>
            <h1 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">Program Manager</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
              Browse, view, edit, and manage all code programs saved by students. Monitor storage usage and perform bulk actions.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col items-center justify-center rounded-2xl border border-cyan-300/20 bg-black/20 px-5 py-4 min-w-[100px]">
              <p className="text-3xl font-semibold text-white">{stats.totalUsers}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-cyan-200">Users</p>
            </div>
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-black/20 px-5 py-4 min-w-[100px]">
              <p className="text-3xl font-semibold text-white">{stats.totalWebPrograms}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-300">Web</p>
            </div>
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-black/20 px-5 py-4 min-w-[100px]">
              <p className="text-3xl font-semibold text-white">{stats.totalPythonPrograms}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-300">Python</p>
            </div>
          </div>
        </div>
      </section>

      {/* Controls */}
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search programs by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/20 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-400 transition focus:border-cyan-400/50 focus:bg-black/40 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-1.5 hidden md:flex">
            <span className="text-xs text-slate-400">Sort by:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs font-medium text-white outline-none [&>option]:bg-slate-900"
            >
              <option value="highest_usage">Highest Usage</option>
              <option value="lowest_usage">Lowest Usage</option>
              <option value="most_programs">Most Programs</option>
            </select>
          </div>

          <div className="h-8 w-px bg-white/10 hidden md:block"></div>

          <div className="flex rounded-xl border border-white/10 bg-black/20 p-1">
            {(["all", "web", "python"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`rounded-lg px-4 py-1.5 text-xs font-medium capitalize transition-all ${
                  typeFilter === type
                    ? "bg-cyan-400/15 text-cyan-200 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="h-8 w-px bg-white/10 hidden sm:block"></div>

          <div className="flex rounded-xl border border-white/10 bg-black/20 p-1 hidden sm:flex">
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded-lg p-1.5 transition-all ${viewMode === "grid" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`rounded-lg p-1.5 transition-all ${viewMode === "list" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}
              title="List View"
            >
              <ListIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Folder List */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.02]">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        </div>
      ) : folders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[32px] border border-white/10 bg-white/[0.02] p-16 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-800/50 border border-white/5">
            <FolderOpen className="h-10 w-10 text-slate-500" />
          </div>
          <h3 className="mt-6 text-xl font-medium text-white">No programs found</h3>
          <p className="mt-2 text-slate-400">Try adjusting your search query or filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {folders.map((folder) => (
            <div key={folder.user.clerkId} className="rounded-3xl border border-white/10 bg-white/[0.02] overflow-hidden transition-all hover:border-white/20">
              {/* Folder Header */}
              <div 
                className="flex cursor-pointer items-center justify-between bg-black/20 px-6 py-5 transition hover:bg-white/5"
                onClick={() => toggleFolder(folder.user.clerkId)}
              >
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${expandedFolders.has(folder.user.clerkId) ? "border-cyan-400/30 bg-cyan-400/10" : "border-white/10 bg-black/40"}`}>
                    <FolderOpen className={`h-5 w-5 ${expandedFolders.has(folder.user.clerkId) ? "text-cyan-400" : "text-slate-400"}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white flex items-center gap-2">
                      {folder.user.fullName || "Unknown User"}
                      {expandedFolders.has(folder.user.clerkId) ? <ChevronDown className="h-4 w-4 text-cyan-400" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
                    </h3>
                    <p className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                      <span>{folder.user.email}</span>
                      {folder.user.studentClass && (
                        <>
                          <span className="h-1 w-1 rounded-full bg-slate-600"></span>
                          <span>{folder.user.studentClass}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="hidden items-center gap-4 md:flex mr-4">
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Total Storage</p>
                      <p className="font-medium text-slate-200 flex items-center justify-end gap-1.5"><HardDrive className="h-3.5 w-3.5 text-slate-500"/> {formatBytes(folder.totalSizeBytes || 0)}</p>
                    </div>
                    <div className="h-8 w-px bg-white/10"></div>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300">
                    {folder.totalPrograms} {folder.totalPrograms === 1 ? 'Program' : 'Programs'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteModal({
                        deleteAll: true,
                        userId: folder.user.clerkId,
                        title: folder.user.fullName,
                        type: "all"
                      });
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/20 text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                    title="Delete All Programs for User"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedFolders.has(folder.user.clerkId) && (
                <div className="border-t border-white/5 bg-black/10 p-6 space-y-8">
                  {/* Web Programs */}
                  {folder.webPrograms.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-cyan-400">
                          <Globe className="h-4 w-4" />
                          Web Programs ({folder.webPrograms.length})
                        </h4>
                      </div>
                      {renderProgramList(folder.webPrograms, "web")}
                    </div>
                  )}

                  {/* Divider if both exist */}
                  {folder.webPrograms.length > 0 && folder.pythonPrograms.length > 0 && (
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                  )}

                  {/* Python Programs */}
                  {folder.pythonPrograms.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-amber-400">
                          <Code className="h-4 w-4" />
                          Python Programs ({folder.pythonPrograms.length})
                        </h4>
                      </div>
                      {renderProgramList(folder.pythonPrograms, "python")}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md transition-all">
          <div className="w-full max-w-md rounded-[24px] border border-red-500/20 bg-slate-900 p-8 shadow-2xl">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-center text-xl font-semibold text-white">
              {deleteModal.deleteAll ? `Delete all data for ${deleteModal.title}?` : "Delete Program"}
            </h2>
            <p className="mt-3 text-center text-sm leading-relaxed text-slate-300">
              {deleteModal.deleteAll
                ? "This will permanently delete ALL web and python programs for this user and free up their storage space. This action cannot be undone."
                : `Are you sure you want to delete "${deleteModal.title}"? This action cannot be undone.`}
            </p>

            {deleteModal.deleteAll && (
              <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                <label className="text-xs font-medium uppercase tracking-wider text-red-400">Type DELETE to confirm</label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white placeholder-slate-600 outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50"
                  placeholder="DELETE"
                />
              </div>
            )}

            <div className="mt-8 grid grid-cols-2 gap-3">
              <button
                onClick={() => { setDeleteModal(null); setDeleteConfirmText(""); }}
                className="rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting || (deleteModal.deleteAll && deleteConfirmText !== "DELETE")}
                className="flex items-center justify-center gap-2 rounded-xl bg-red-500 py-3 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[24px] border border-white/10 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 bg-black/20 p-5">
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 ${viewModal.type === "web" ? "bg-cyan-400/10" : "bg-amber-400/10"}`}>
                  {viewModal.type === "web" ? <Globe className="h-6 w-6 text-cyan-400" /> : <Code className="h-6 w-6 text-amber-400" />}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">{viewModal.program.title}</h2>
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                    <span className="capitalize">{viewModal.type} Program</span>
                    <span className="h-1 w-1 rounded-full bg-slate-600"></span>
                    <span className="flex items-center gap-1"><HardDrive className="h-3 w-3"/> {formatBytes(viewModal.program.sizeBytes || 0)}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEditModal(viewModal.program, viewModal.type)} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">
                  <Pencil className="h-4 w-4" /> Edit Code
                </button>
                <button onClick={() => setViewModal(null)} className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:bg-white/10 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-[#0d1117] p-6 space-y-6">
              {viewModal.type === "python" ? (
                <div>
                  <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-2">
                    <div className="h-2 w-2 rounded-full bg-amber-400"></div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">Python Source</p>
                  </div>
                  <pre className="rounded-xl bg-transparent p-2 text-sm font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {viewModal.program.pythonCode || "# No code"}
                  </pre>
                </div>
              ) : (
                <>
                  <div>
                    <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-2">
                      <div className="h-2 w-2 rounded-full bg-orange-400"></div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-orange-400">HTML</p>
                    </div>
                    <pre className="rounded-xl bg-transparent p-2 text-sm font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                      {viewModal.program.htmlCode || "<!-- No code -->"}
                    </pre>
                  </div>
                  <div>
                    <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-2">
                      <div className="h-2 w-2 rounded-full bg-blue-400"></div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">CSS</p>
                    </div>
                    <pre className="rounded-xl bg-transparent p-2 text-sm font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                      {viewModal.program.cssCode || "/* No code */"}
                    </pre>
                  </div>
                  <div>
                    <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-2">
                      <div className="h-2 w-2 rounded-full bg-yellow-400"></div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-yellow-400">JavaScript</p>
                    </div>
                    <pre className="rounded-xl bg-transparent p-2 text-sm font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                      {viewModal.program.jsCode || "// No code"}
                    </pre>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <div className="flex h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-[24px] border border-cyan-500/30 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 bg-[linear-gradient(135deg,rgba(8,47,73,0.95),rgba(15,23,42,0.98))] p-5">
              <div>
                <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400/20">
                    <Pencil className="h-4 w-4 text-cyan-400"/>
                  </div>
                  Edit {editModal.type === "web" ? "Web" : "Python"} Program
                </h2>
              </div>
              <button onClick={() => setEditModal(null)} className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:bg-white/10 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto bg-slate-950 p-6 space-y-6">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Program Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 p-3.5 text-base text-white shadow-inner outline-none transition focus:border-cyan-400/50 focus:bg-black/60 focus:ring-1 focus:ring-cyan-400/50"
                />
              </div>

              {editModal.type === "python" ? (
                <div className="flex-1 flex flex-col min-h-[400px] rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                  <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
                    <Code className="h-4 w-4" /> Python Code
                  </label>
                  <textarea
                    value={editPython}
                    onChange={(e) => setEditPython(e.target.value)}
                    className="mt-3 flex-1 w-full rounded-xl border border-white/10 bg-[#0d1117] p-5 text-sm font-mono text-slate-300 shadow-inner outline-none transition focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50"
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                    <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-orange-400">
                      <Globe className="h-4 w-4" /> HTML Code
                    </label>
                    <textarea
                      value={editHtml}
                      onChange={(e) => setEditHtml(e.target.value)}
                      className="mt-3 w-full rounded-xl border border-white/10 bg-[#0d1117] p-4 text-sm font-mono text-slate-300 shadow-inner outline-none transition focus:border-orange-400/50 focus:ring-1 focus:ring-orange-400/50 min-h-[200px]"
                    />
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                    <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
                      <Globe className="h-4 w-4" /> CSS Code
                    </label>
                    <textarea
                      value={editCss}
                      onChange={(e) => setEditCss(e.target.value)}
                      className="mt-3 w-full rounded-xl border border-white/10 bg-[#0d1117] p-4 text-sm font-mono text-slate-300 shadow-inner outline-none transition focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/50 min-h-[200px]"
                    />
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                    <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-yellow-400">
                      <Globe className="h-4 w-4" /> JavaScript Code
                    </label>
                    <textarea
                      value={editJs}
                      onChange={(e) => setEditJs(e.target.value)}
                      className="mt-3 w-full rounded-xl border border-white/10 bg-[#0d1117] p-4 text-sm font-mono text-slate-300 shadow-inner outline-none transition focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/50 min-h-[200px]"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-white/10 bg-black/40 p-5 flex justify-end gap-3">
              <button
                onClick={() => setEditModal(null)}
                className="rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Discard Changes
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 rounded-xl bg-cyan-500 px-8 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save Program
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
