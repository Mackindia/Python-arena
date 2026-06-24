"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import EnginePageLayout from "@/src/components/admin/EnginePageLayout";
import { Plus, Save } from "lucide-react";

interface PrivateNote {
  _id: string;
  title: string;
  content: string;
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

export default function PrivateNotesClient() {
  const [notes, setNotes] = useState<PrivateNote[]>([]);
  const [selectedNote, setSelectedNote] = useState<PrivateNote | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    let isCancelled = false;

    async function loadNotes() {
      try {
        const res = await fetch("/api/admin/private/notes");

        if (!res.ok) {
          throw new Error("Failed to fetch notes");
        }

        const data: PrivateNote[] = await res.json();

        if (isCancelled) {
          return;
        }

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
      } catch (error) {
        if (!isCancelled) {
          toast.error("Failed to load notes.");
          console.error("Fetch notes error:", error);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    void loadNotes();

    return () => {
      isCancelled = true;
    };
  }, []);

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
    return <div className="p-4 text-slate-300">Loading private notes...</div>;
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
      <div className="flex h-full min-h-[500px] rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="w-1/4 border-r border-white/10 p-4 bg-black/20">
          {notes.length === 0 ? (
            <p className="text-center text-xs text-slate-400">Your private folder is empty.</p>
          ) : (
            <ul className="space-y-1.5">
              {notes.map((note) => (
                <li
                  key={note._id}
                  className={`cursor-pointer p-2 rounded-xl text-xs transition-all ${
                    selectedNote?._id === note._id
                      ? "bg-cyan-500/10 border border-cyan-400/20 text-white font-medium"
                      : "text-slate-300 hover:bg-white/5 hover:text-white border border-transparent"
                  }`}
                  onClick={() => setSelectedNote(note)}
                >
                  {note.title}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex-1 p-5 bg-black/10">
          {selectedNote ? (
            <div className="space-y-4">
              <input
                type="text"
                value={selectedNote.title}
                onChange={handleTitleChange}
                onBlur={() => handleNoteUpdate(selectedNote)}
                className="w-full bg-transparent text-xl font-semibold text-white outline-none border-b border-white/10 pb-2 focus:border-cyan-400/55 transition-all"
                placeholder="Note Title"
              />
              <textarea
                value={selectedNote.content}
                onChange={handleContentChange}
                onBlur={() => handleNoteUpdate(selectedNote)}
                className="w-full min-h-[360px] bg-transparent text-sm text-slate-300 font-mono outline-none border border-white/5 rounded-xl p-3 bg-black/20 focus:border-cyan-400/20 transition-all"
                placeholder="Write note contents here..."
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => handleNoteDelete(selectedNote._id)}
                  className="rounded-xl border-white/10 hover:bg-rose-500/10 hover:text-rose-300 hover:border-rose-500/20 transition-all text-xs"
                >
                  Delete
                </Button>
                <Button
                  onClick={() => handleNoteUpdate(selectedNote)}
                  disabled={isSaving}
                  className="rounded-xl bg-cyan-500 text-black hover:bg-cyan-400 transition-all text-xs font-semibold"
                >
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm">
              Select a note or create a new one.
            </div>
          )}
        </div>
      </div>
    </EnginePageLayout>
  );
}