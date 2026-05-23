"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

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
    return <div className="p-4">Loading private notes...</div>;
  }

  return (
    <div className="flex h-full">
      <div className="w-1/4 border-r p-4">
        <Button onClick={handleNewNote} className="w-full mb-4">
          New Note
        </Button>
        {notes.length === 0 ? (
          <p className="text-center text-gray-500">Your private folder is empty.</p>
        ) : (
          <ul className="space-y-2">
            {notes.map((note) => (
              <li
                key={note._id}
                className={`cursor-pointer p-2 rounded ${selectedNote?._id === note._id ? "bg-gray-200" : "hover:bg-gray-100"}`}
                onClick={() => setSelectedNote(note)}
              >
                {note.title}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex-1 p-4">
        {selectedNote ? (
          <div>
            <Input
              type="text"
              value={selectedNote.title}
              onChange={handleTitleChange}
              onBlur={() => handleNoteUpdate(selectedNote)}
              className="text-2xl font-bold mb-4"
            />
            <Textarea
              value={selectedNote.content}
              onChange={handleContentChange}
              onBlur={() => handleNoteUpdate(selectedNote)}
              className="min-h-[400px] font-mono"
            />
            <div className="mt-4 flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => handleNoteDelete(selectedNote._id)}
              >
                Delete
              </Button>
              <Button onClick={() => handleNoteUpdate(selectedNote)} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a note or create a new one.
          </div>
        )}
      </div>
    </div>
  );
}