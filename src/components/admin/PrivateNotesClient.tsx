"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import EnginePageLayout from "@/src/components/admin/EnginePageLayout";
import { Expand, Plus, Save } from "lucide-react";

interface PrivateNote {
  _id: string;
  title: string;
  content: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

interface PrivatePdf {
  _id: string;
  title: string;
  fileName: string;
  url: string;
  publicId: string;
  size: number;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

async function readErrorMessage(res: Response, fallback: string) {
  try {
    const data = await res.json();

    if (data && typeof data.error === "string" && data.error.trim()) {
      return data.error;
    }
  } catch {
    // Ignore JSON parse errors and use fallback below.
  }

  return fallback;
}

function deriveCloudinaryPublicIdFromUrl(url: string) {
  try {
    const parsed = new URL(url);
    const marker = "/upload/";
    const markerIndex = parsed.pathname.indexOf(marker);

    if (markerIndex === -1) {
      return "";
    }

    const afterUpload = decodeURIComponent(parsed.pathname.slice(markerIndex + marker.length));
    const withoutVersion = afterUpload.replace(/^v\d+\//, "");
    return withoutVersion.replace(/\.[a-z0-9]+$/i, "");
  } catch {
    return "";
  }
}

function parseUploadFailureMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== "object") {
    return fallback;
  }

  const payload = data as {
    message?: unknown;
    error?: unknown;
    errors?: Record<string, string[] | undefined>;
  };

  const fieldErrors = payload.errors
    ? Object.values(payload.errors)
        .flat()
        .filter((value): value is string => Boolean(value && value.trim()))
    : [];

  if (fieldErrors.length) {
    return fieldErrors.join(" | ");
  }

  const error = typeof payload.error === "string" ? payload.error.trim() : "";
  const message = typeof payload.message === "string" ? payload.message.trim() : "";

  if (error && message) {
    return `${message}: ${error}`;
  }

  return error || message || fallback;
}

type PrivateNotesClientProps = {
  standalone?: boolean;
};

export default function PrivateNotesClient({ standalone = false }: PrivateNotesClientProps) {
  const [notes, setNotes] = useState<PrivateNote[]>([]);
  const [selectedNote, setSelectedNote] = useState<PrivateNote | null>(null);
  const [pdfs, setPdfs] = useState<PrivatePdf[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState<boolean>(false);
  const [pdfUploadProgress, setPdfUploadProgress] = useState<number>(0);
  const [pdfTitle, setPdfTitle] = useState<string>("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfStatusMessage, setPdfStatusMessage] = useState<string>("");
  const [pdfStatusError, setPdfStatusError] = useState<string>("");

  const loadPdfs = useCallback(async () => {
    const res = await fetch("/api/admin/private/pdfs", { cache: "no-store" });

    if (!res.ok) {
      throw new Error("Failed to fetch private PDFs");
    }

    const data: PrivatePdf[] = await res.json();
    setPdfs(data);
  }, []);

  const loadNotes = useCallback(async () => {
    const res = await fetch("/api/admin/private/notes", { cache: "no-store" });

    if (!res.ok) {
      throw new Error("Failed to fetch notes");
    }

    const data: PrivateNote[] = await res.json();

    setNotes(data);
    setSelectedNote((current) => {
      if (!data.length) {
        return null;
      }

      if (!current) {
        return data[0];
      }

      return data.find((note) => note._id === current._id) ?? data[0];
    });
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function loadAll() {
      try {
        await Promise.all([loadNotes(), loadPdfs()]);
      } catch (error) {
        if (!isCancelled) {
          toast.error("Failed to load private vault data.");
          console.error("Private vault load error:", error);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    void loadAll();

    return () => {
      isCancelled = true;
    };
  }, [loadNotes, loadPdfs]);

  const handleNewNote = async () => {
    try {
      const res = await fetch("/api/admin/private/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: "Untitled Note", content: "" }),
      });

      if (!res.ok) {
        const message = await readErrorMessage(res, "Failed to create note");
        throw new Error(message);
      }

      const newNote: PrivateNote = await res.json();
      setNotes((prev) => [newNote, ...prev]);
      setSelectedNote(newNote);
      toast.success("New note created.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create new note.";
      toast.error(message);
      console.error("Create note error:", error);
    }
  };

  const handleNoteUpdate = useCallback(async (note: PrivateNote) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/private/notes/${note._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: note.title, content: note.content }),
      });

      if (!res.ok) {
        const message = await readErrorMessage(res, "Failed to update note");
        throw new Error(message);
      }

      const updatedNote: PrivateNote = await res.json();
      setNotes((prev) => {
        const nextNotes = prev.map((n) => (n._id === updatedNote._id ? updatedNote : n));
        return nextNotes.sort(
          (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
        );
      });
      setSelectedNote(updatedNote);
      toast.success("Note saved.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save note.";
      toast.error(message);
      console.error("Update note error:", error);
    } finally {
      setIsSaving(false);
    }
  }, []);

  const handleNoteDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this note?")) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/private/notes/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to delete note");
      }
      setNotes((prev) => {
        const nextNotes = prev.filter((n) => n._id !== id);
        setSelectedNote(nextNotes[0] ?? null);
        return nextNotes;
      });
      toast.success("Note deleted.");
    } catch (error) {
      toast.error("Failed to delete note.");
      console.error("Delete note error:", error);
    }
  };

  const uploadPrivatePdf = async (file: File) => {
    setPdfUploadProgress(15);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", "pdf");
    formData.append("folder", "private/pdfs");

    const res = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    let data: {
      message?: string;
      error?: string;
      errors?: Record<string, string[] | undefined>;
      upload?: {
        url?: string;
        secure_url?: string;
        publicId?: string;
        public_id?: string;
        size?: number;
        bytes?: number;
        originalName?: string;
      };
    } = {};

    try {
      data = (await res.json()) as typeof data;
    } catch {
      throw new Error("Invalid upload response");
    }

    if (!res.ok) {
      const fallback = `PDF upload failed (HTTP ${res.status})`;
      throw new Error(parseUploadFailureMessage(data, fallback));
    }

    const url = String(data.upload?.url || data.upload?.secure_url || "");
    const publicId = String(data.upload?.publicId || data.upload?.public_id || "");

    if (!url) {
      throw new Error("Upload response missing file URL");
    }

    setPdfUploadProgress(100);

    return {
      url,
      publicId: publicId || deriveCloudinaryPublicIdFromUrl(url),
      size: Number(data.upload?.size || data.upload?.bytes || 0),
      originalName: String(data.upload?.originalName || file.name),
    };
  };

  const handlePdfUpload = async () => {
    if (!pdfFile) {
      toast.error("Please choose a PDF file first.");
      return;
    }

    try {
      setIsUploadingPdf(true);
      setPdfUploadProgress(0);
      setPdfStatusError("");
      setPdfStatusMessage("Uploading PDF...");

      const uploaded = await uploadPrivatePdf(pdfFile);

      setPdfStatusMessage("Saving PDF in vault...");

      const res = await fetch("/api/admin/private/pdfs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: pdfTitle.trim() || pdfFile.name,
          fileName: uploaded.originalName || pdfFile.name,
          url: uploaded.url,
          ...(uploaded.publicId ? { publicId: uploaded.publicId } : {}),
          size: uploaded.size,
        }),
      });

      if (!res.ok) {
        const message = await readErrorMessage(res, "Failed to save PDF");
        throw new Error(message);
      }

      const createdPdf: PrivatePdf = await res.json();

      setPdfs((prev) => [createdPdf, ...prev.filter((item) => item._id !== createdPdf._id)]);
      setPdfTitle("");
      setPdfFile(null);
      setPdfUploadProgress(0);
      setPdfStatusMessage("PDF uploaded to private vault.");
      toast.success("PDF uploaded to private vault.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload PDF.";
      setPdfStatusError(message);
      setPdfStatusMessage("");
      toast.error(message);
      console.error("Private PDF upload error:", error);
    } finally {
      setIsUploadingPdf(false);
    }
  };

  const handlePdfDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this PDF?")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/private/pdfs/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const message = await readErrorMessage(res, "Failed to delete PDF");
        throw new Error(message);
      }

      await loadPdfs();
      toast.success("PDF deleted.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete PDF.";
      toast.error(message);
      console.error("Delete PDF error:", error);
    }
  };

  const openPdfInNewWindow = async (url: string, title: string) => {
    try {
      const validationResponse = await fetch(
        `/api/pdf-view?url=${encodeURIComponent(url)}&validate=1`,
        { cache: "no-store" },
      );

      if (!validationResponse.ok) {
        const message = await readErrorMessage(
          validationResponse,
          "This PDF appears corrupted. Please delete it from the vault and upload the original file again.",
        );
        throw new Error(message);
      }

      const viewerUrl = `/pdf/view?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
      window.open(viewerUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "This PDF appears corrupted. Please delete it from the vault and upload the original file again.";
      toast.error(message);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (selectedNote) {
      const updatedNote = { ...selectedNote, content: e.target.value };
      setSelectedNote(updatedNote);
      setNotes((prev) => prev.map((note) => (note._id === updatedNote._id ? updatedNote : note)));
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedNote) {
      const updatedNote = { ...selectedNote, title: e.target.value };
      setSelectedNote(updatedNote);
      setNotes((prev) => prev.map((note) => (note._id === updatedNote._id ? updatedNote : note)));
    }
  };

  if (loading) {
    return <div className="p-4 text-slate-300">Loading private vault...</div>;
  }

  const vaultBody = (
    <div className="grid h-full min-h-[560px] grid-cols-1 gap-4 xl:grid-cols-[1.7fr_1fr]">
      <section className="flex min-h-[500px] min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/50 shadow-[0_10px_40px_rgba(0,0,0,0.25)] xl:flex-row">
        <div className="w-full border-b border-white/10 bg-slate-950/70 p-4 xl:max-w-[280px] xl:border-b-0 xl:border-r">
          {notes.length === 0 ? (
            <p className="text-center text-xs text-slate-400">Your private folder is empty.</p>
          ) : (
            <ul className="max-h-52 space-y-2 overflow-auto pr-1 xl:max-h-[520px]">
              {notes.map((note) => (
                <li
                  key={note._id}
                  className={`cursor-pointer rounded-xl border p-2.5 text-xs transition-all ${
                    selectedNote?._id === note._id
                      ? "border-cyan-400/35 bg-cyan-400/10 text-white"
                      : "border-transparent bg-white/[0.02] text-slate-300 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                  }`}
                  onClick={() => setSelectedNote(note)}
                >
                  <p className="truncate font-medium">{note.title}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {new Date(note.updatedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex-1 bg-slate-950/30 p-5">
          {selectedNote ? (
            <div className="space-y-4">
              <input
                type="text"
                value={selectedNote.title}
                onChange={handleTitleChange}
                onBlur={() => handleNoteUpdate(selectedNote)}
                className="w-full border-b border-white/10 bg-transparent pb-2 text-xl font-semibold text-white outline-none transition-all focus:border-cyan-400/55"
                placeholder="Note Title"
              />
              <textarea
                value={selectedNote.content}
                onChange={handleContentChange}
                onBlur={() => handleNoteUpdate(selectedNote)}
                className="min-h-[300px] w-full rounded-xl border border-white/10 bg-black/25 p-3 font-mono text-sm text-slate-300 outline-none transition-all focus:border-cyan-400/30 xl:min-h-[360px]"
                placeholder="Write note contents here..."
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => handleNoteDelete(selectedNote._id)}
                  className="rounded-xl border-white/10 text-xs transition-all hover:border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-300"
                >
                  Delete
                </Button>
                <Button
                  onClick={() => handleNoteUpdate(selectedNote)}
                  disabled={isSaving}
                  className="rounded-xl bg-cyan-500 text-xs font-semibold text-black transition-all hover:bg-cyan-400"
                >
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">
              Select a note or create a new one.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-950/55 p-4 shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-200">Private PDFs</h3>
        <p className="mt-1 text-xs text-slate-400">Upload, preview, and manage secure PDFs.</p>

        {pdfStatusMessage && (
          <div className="mt-2 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
            {pdfStatusMessage}
          </div>
        )}
        {pdfStatusError && (
          <div className="mt-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-100">
            {pdfStatusError}
          </div>
        )}

        <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">Upload PDF</p>
          <div className="mt-2 space-y-2">
            <input
              type="text"
              value={pdfTitle}
              onChange={(e) => setPdfTitle(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/40"
              placeholder="PDF title (optional)"
            />
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
              className="w-full rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-xs text-white outline-none file:mr-2 file:rounded-md file:border-0 file:bg-cyan-500/20 file:px-2 file:py-1 file:text-cyan-100"
            />
          </div>

          {pdfFile && (
            <p className="mt-2 truncate text-[11px] text-slate-400">Selected: {pdfFile.name}</p>
          )}

          {(isUploadingPdf || pdfUploadProgress > 0) && (
            <div className="mt-2 rounded-lg border border-cyan-400/25 bg-cyan-500/10 p-2.5">
              <div className="mb-1 flex items-center justify-between text-[11px] text-cyan-100">
                <span>Uploading PDF</span>
                <span>{pdfUploadProgress}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-cyan-400 transition-all duration-300"
                  style={{ width: `${pdfUploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <Button
            onClick={handlePdfUpload}
            disabled={isUploadingPdf || !pdfFile}
            className="mt-3 w-full rounded-lg bg-cyan-500 text-xs font-semibold text-black hover:bg-cyan-400"
          >
            {isUploadingPdf ? "Uploading..." : "Upload PDF"}
          </Button>
        </div>

        <div className="mt-4 max-h-[360px] space-y-2 overflow-auto pr-1">
          {pdfs.length === 0 ? (
            <p className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-xs text-slate-500">
              No private PDFs uploaded yet.
            </p>
          ) : (
            pdfs.map((pdf) => (
              <div key={pdf._id} className="rounded-xl border border-white/10 bg-black/30 p-3">
                <p className="line-clamp-2 text-xs font-medium text-white">{pdf.title || pdf.fileName}</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="truncate text-[11px] text-slate-500">{pdf.fileName}</p>
                  <p className="shrink-0 text-[11px] text-slate-500">{Math.max(0.1, pdf.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  {new Date(pdf.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
                <div className="mt-2 flex gap-2">
                  <Button
                    onClick={() => openPdfInNewWindow(pdf.url, pdf.title || pdf.fileName)}
                    className="h-8 rounded-lg bg-cyan-500/90 px-3 text-[11px] font-semibold text-black hover:bg-cyan-400"
                  >
                    View
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handlePdfDelete(pdf._id)}
                    className="h-8 rounded-lg border-rose-500/30 px-3 text-[11px] text-rose-300 hover:bg-rose-500/10"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );

  if (standalone) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
          <h1 className="text-xl font-semibold text-white">Private Vault Workspace</h1>
          <p className="mt-1 text-sm text-slate-400">Full-screen editing mode for notes and private PDFs.</p>
        </div>
        {vaultBody}
      </div>
    );
  }

  return (
    <EnginePageLayout
      title="Private Vault"
      category="Administration"
      description="Access and manage highly confidential administration assets, templates, and server settings."
      quickActions={[
        {
          label: "New Note",
          onClick: handleNewNote,
          icon: Plus
        },
        {
          label: "Open Full Screen",
          onClick: () => window.open("/admin/private/fullscreen", "_blank", "noopener,noreferrer"),
          icon: Expand
        },
        ...(selectedNote
          ? [
              {
                label: isSaving ? "Saving..." : "Save Note",
                onClick: () => handleNoteUpdate(selectedNote),
                icon: Save,
                disabled: isSaving
              }
            ]
          : [])
      ]}
    >
      {vaultBody}
    </EnginePageLayout>
  );
}
