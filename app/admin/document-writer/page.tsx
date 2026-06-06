"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  FileText, Upload, BookOpen, ClipboardList, GraduationCap,
  Plus, Trash2, Loader2, ChevronDown, FilePlus, Eye, ExternalLink
} from "lucide-react";

const DocumentEditor = dynamic(() => import("@/src/components/admin/DocumentEditor"), { ssr: false });

type Template = { _id: string; name: string; type: string; content: string; createdAt: string; sourceFileUrl?: string };
type DocInstance = {
  _id: string; title: string; type: string; subject: string; className: string;
  status: string; updatedAt: string; content: string;
  template?: { _id: string; name: string; type: string; sourceFileUrl?: string };
};
type TeacherSubject = { subject: string; classes: string[] };

const DOC_TYPES = [
  { value: "syllabus", label: "Syllabus", icon: BookOpen, color: "text-cyan-300 border-cyan-400/30 bg-cyan-400/10" },
  { value: "holiday-homework", label: "Holiday Homework", icon: ClipboardList, color: "text-amber-300 border-amber-400/30 bg-amber-400/10" },
  { value: "question-paper", label: "Question Paper", icon: GraduationCap, color: "text-fuchsia-300 border-fuchsia-400/30 bg-fuchsia-400/10" },
] as const;

export default function DocumentWriterPage() {
  const [view, setView] = useState<"hub" | "editor">("hub");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [documents, setDocuments] = useState<DocInstance[]>([]);
  const [teacherSubjects, setTeacherSubjects] = useState<TeacherSubject[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeDocId, setActiveDocId] = useState("");
  const [activeDocContent, setActiveDocContent] = useState("");
  const [activeDocTitle, setActiveDocTitle] = useState("");
  const [activeDocSourceUrl, setActiveDocSourceUrl] = useState("");

  // Create-new state
  const [selectedType, setSelectedType] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [creating, setCreating] = useState(false);

  // Upload template state
  const [showUpload, setShowUpload] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadType, setUploadType] = useState("syllabus");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDragActive, setUploadDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tplRes, docsRes, subRes] = await Promise.all([
        fetch("/api/admin/document-templates"),
        fetch("/api/documents"),
        fetch("/api/documents/teacher-subjects"),
      ]);
      if (tplRes.ok) { const d = await tplRes.json(); setTemplates(d.templates || []); }
      if (docsRes.ok) { const d = await docsRes.json(); setDocuments(d.documents || []); }
      if (subRes.ok) { const d = await subRes.json(); setTeacherSubjects(d.subjects || []); setIsAdmin(!!d.isAdmin); }
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function createDocument() {
    if (!selectedTemplate) return;
    setCreating(true);
    try {
      const body: Record<string, string> = { templateId: selectedTemplate };
      if (selectedType === "question-paper") {
        body.subject = selectedSubject;
        body.className = selectedClass;
      }
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.document) {
        setActiveDocId(data.document._id);
        setActiveDocContent(data.document.content);
        setActiveDocTitle(data.document.title);
        const tpl = templates.find((t) => t._id === selectedTemplate);
        setActiveDocSourceUrl(tpl?.sourceFileUrl || "");
        setView("editor");
        fetchData();
      }
    } catch { /* silent */ }
    setCreating(false);
  }

  async function openDocument(doc: DocInstance) {
    try {
      const res = await fetch(`/api/documents/${doc._id}`);
      if (res.ok) {
        const data = await res.json();
        setActiveDocId(data.document._id);
        setActiveDocContent(data.document.content);
        setActiveDocTitle(data.document.title || doc.title);
        setActiveDocSourceUrl(data.document.template?.sourceFileUrl || "");
        setView("editor");
      }
    } catch { /* silent */ }
  }

  async function deleteDocument(id: string) {
    if (!confirm("Delete this document permanently?")) return;
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    fetchData();
  }

  function handleUploadDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setUploadDragActive(true);
    else if (e.type === "dragleave") setUploadDragActive(false);
  }

  function handleUploadDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setUploadDragActive(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      setUploadFile(file);
      setUploadError("");
      if (!uploadName.trim()) setUploadName(file.name.replace(/\.[^.]+$/, ""));
    }
  }

  function handleUploadFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0];
    if (file) {
      setUploadFile(file);
      setUploadError("");
      if (!uploadName.trim()) setUploadName(file.name.replace(/\.[^.]+$/, ""));
    }
  }

  async function uploadTemplate() {
    if (!uploadName.trim()) { setUploadError("Template name is required"); return; }
    setUploading(true);
    setUploadError("");
    try {
      let sourceFileUrl = "";

      // If file selected, upload to Cloudinary first
      if (uploadFile) {
        const formData = new FormData();
        formData.append("file", uploadFile);
        formData.append("kind", uploadFile.type === "application/pdf" ? "pdf" : "image");
        formData.append("folder", "document-templates");

        const uploadRes = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          // Fallback: try media upload route
          const mediaForm = new FormData();
          mediaForm.append("file", uploadFile);

          const mediaRes = await fetch("/api/media/upload", {
            method: "POST",
            body: mediaForm,
          });

          if (mediaRes.ok) {
            const mediaData = await mediaRes.json();
            sourceFileUrl = mediaData.media?.fileUrl || "";
          }
        } else {
          const uploadData = await uploadRes.json();
          sourceFileUrl = uploadData.upload?.secure_url || uploadData.url || "";
        }
      }

      const defaultContent = `<h1 style="text-align:center">DOON SCHOLARS</h1><h2 style="text-align:center">${uploadName}</h2><p style="text-align:center">Session: 2026-27</p>${sourceFileUrl ? `<p style="text-align:center"><em>Source file: <a href="${sourceFileUrl}" target="_blank">${uploadFile?.name || "Download"}</a></em></p>` : ""}<hr><p><br></p>`;

      const res = await fetch("/api/admin/document-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: uploadName.trim(),
          type: uploadType,
          content: defaultContent,
          sourceFileUrl,
        }),
      });

      if (res.ok) {
        setShowUpload(false);
        setUploadName("");
        setUploadFile(null);
        setUploadError("");
        fetchData();
      } else {
        const errData = await res.json();
        setUploadError(errData.message || "Failed to create template");
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    }
    setUploading(false);
  }

  async function deleteTemplate(id: string) {
    if (!confirm("Delete this template?")) return;
    await fetch(`/api/admin/document-templates?id=${id}`, { method: "DELETE" });
    fetchData();
  }

  const filteredTemplates = selectedType ? templates.filter((t) => t.type === selectedType) : [];
  const filteredSubjectClasses = selectedSubject
    ? teacherSubjects.find((s) => s.subject === selectedSubject)?.classes || []
    : [];

  if (view === "editor") {
    return (
      <div className="fixed inset-0 z-[60] bg-slate-950">
        <DocumentEditor
          documentId={activeDocId}
          initialContent={activeDocContent}
          title={activeDocTitle}
          sourceFileUrl={activeDocSourceUrl}
          onBack={() => { setView("hub"); fetchData(); }}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-200/90">Document Writer</p>
          <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Create & Edit School Documents</h1>
          <p className="mt-2 text-sm text-slate-400">Select a format, edit like Google Docs. Each teacher gets their own copy.</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowUpload(!showUpload)}
            className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/20">
            <Upload className="h-4 w-4" /> Upload Format
          </button>
        )}
      </div>

      {/* Upload Template Panel (Admin) */}
      {showUpload && isAdmin && (
        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Upload New Format Template</h3>

          {/* File drop zone */}
          <div
            onDragEnter={handleUploadDrag}
            onDragLeave={handleUploadDrag}
            onDragOver={handleUploadDrag}
            onDrop={handleUploadDrop}
            className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition cursor-pointer ${
              uploadDragActive
                ? "border-cyan-400 bg-cyan-500/10"
                : uploadFile
                  ? "border-emerald-400/40 bg-emerald-500/5"
                  : "border-white/15 bg-black/20 hover:border-white/30"
            }`}
          >
            <input
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp"
              onChange={handleUploadFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {uploadFile ? (
              <div>
                <div className="text-3xl mb-2">✅</div>
                <p className="text-sm font-medium text-emerald-300">{uploadFile.name}</p>
                <p className="text-xs text-slate-400 mt-1">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB • Click or drop to replace</p>
              </div>
            ) : (
              <div>
                <div className="text-3xl mb-2">📄</div>
                <p className="text-sm font-medium text-white">Drag & drop your format file here</p>
                <p className="text-xs text-slate-400 mt-1">PDF, Word, Excel, PowerPoint, or Images • Click to browse</p>
              </div>
            )}
          </div>

          {/* Name + Type + Submit */}
          <div className="grid gap-4 sm:grid-cols-3">
            <input value={uploadName} onChange={(e) => setUploadName(e.target.value)} placeholder="Template Name (e.g. Session 2026 Syllabus)"
              className="rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/50 focus:outline-none" />
            <select value={uploadType} onChange={(e) => setUploadType(e.target.value)}
              className="rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white focus:border-cyan-400/50 focus:outline-none">
              {DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <button onClick={uploadTemplate} disabled={uploading || !uploadName.trim()}
              className="rounded-xl bg-cyan-500/20 border border-cyan-400/30 px-4 py-2.5 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/30 transition disabled:opacity-50">
              {uploading ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</span> : "Create Template"}
            </button>
          </div>

          {uploadError && (
            <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-200">
              {uploadError}
            </div>
          )}
        </div>
      )}

      {/* Create New Document */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white mb-4">
          <FilePlus className="h-4 w-4 text-cyan-300" /> New Document
        </h3>
        {/* Step 1: Type */}
        <div className="grid gap-3 sm:grid-cols-3 mb-4">
          {DOC_TYPES.map((dt) => {
            const Icon = dt.icon;
            const active = selectedType === dt.value;
            return (
              <button key={dt.value} onClick={() => { setSelectedType(dt.value); setSelectedTemplate(""); setSelectedSubject(""); setSelectedClass(""); }}
                className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${active ? dt.color + " shadow-lg" : "border-white/10 bg-black/20 text-slate-400 hover:border-white/20 hover:text-white"}`}>
                <Icon className="h-5 w-5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">{dt.label}</p>
                  <p className="text-[11px] opacity-70">{dt.value === "question-paper" ? "Subject-mapped" : "All teachers"}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Step 2: Template + Subject (if QP) */}
        {selectedType && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Format Template</label>
              <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white focus:border-cyan-400/50 focus:outline-none">
                <option value="">Select format...</option>
                {filteredTemplates.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>
            {selectedType === "question-paper" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Subject</label>
                  <select value={selectedSubject} onChange={(e) => { setSelectedSubject(e.target.value); setSelectedClass(""); }}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white focus:border-cyan-400/50 focus:outline-none">
                    <option value="">Select subject...</option>
                    {teacherSubjects.map((s) => <option key={s.subject} value={s.subject}>{s.subject}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Class</label>
                  <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white focus:border-cyan-400/50 focus:outline-none">
                    <option value="">Select class...</option>
                    {filteredSubjectClasses.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </>
            )}
            <div className="flex items-end">
              <button onClick={createDocument} disabled={creating || !selectedTemplate || (selectedType === "question-paper" && !selectedSubject)}
                className="w-full rounded-xl bg-emerald-500/20 border border-emerald-400/30 px-4 py-2.5 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/30 transition disabled:opacity-50">
                {creating ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : <span className="flex items-center justify-center gap-2"><Plus className="h-4 w-4" /> Create</span>}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* My Documents */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white mb-4">
          <FileText className="h-4 w-4 text-emerald-300" /> My Documents
          <span className="ml-auto text-xs text-slate-500">{documents.length} document{documents.length !== 1 ? "s" : ""}</span>
        </h3>
        {documents.length === 0 ? (
          <p className="text-sm text-slate-500 py-8 text-center">No documents yet. Select a format above to get started.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => {
              const typeInfo = DOC_TYPES.find((d) => d.value === doc.type);
              const Icon = typeInfo?.icon || FileText;
              return (
                <div key={doc._id}
                  className="group rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-white/20">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border ${typeInfo?.color || "border-white/10 bg-white/5 text-slate-400"}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      {doc.template?.sourceFileUrl && (
                        <a
                          href={doc.template.sourceFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-7 w-7 inline-flex items-center justify-center rounded-lg bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                          title="View Uploaded Format File"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <button onClick={() => openDocument(doc)} className="h-7 w-7 inline-flex items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20" title="Open">
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => deleteDocument(doc._id)} className="h-7 w-7 inline-flex items-center justify-center rounded-lg bg-rose-500/10 text-rose-300 hover:bg-rose-500/20" title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <button onClick={() => openDocument(doc)} className="text-left w-full">
                    <p className="text-sm font-medium text-white truncate">{doc.title || "Untitled"}</p>
                    {doc.subject && <p className="text-[11px] text-slate-400 mt-1">{doc.subject} • {doc.className}</p>}
                    <p className="text-[11px] text-slate-500 mt-1">
                      {typeInfo?.label} • {doc.status} • {new Date(doc.updatedAt).toLocaleDateString()}
                    </p>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Template Management (Admin) */}
      {isAdmin && templates.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white mb-4">
            <Upload className="h-4 w-4 text-amber-300" /> Format Templates
          </h3>
          <div className="grid gap-2">
            {templates.map((t) => (
              <div key={t._id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                <div>
                  <p className="text-sm text-white">{t.name}</p>
                  <p className="text-[11px] text-slate-500">{t.type} • {new Date(t.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  {t.sourceFileUrl && (
                    <a
                      href={t.sourceFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-400/20"
                      title="View original uploaded format file"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> View Format
                    </a>
                  )}
                  <button onClick={() => deleteTemplate(t._id)} className="text-rose-400 hover:text-rose-300 transition" title="Delete Template">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
