"use client";

import { useEffect, useState } from "react";
import { deleteBook, getBooks } from "@/src/services/educationalAI";

export default function EducationalAILibraryPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [books, setBooks] = useState<any[]>([]);

  async function loadBooks() {
    setLoading(true);
    setError("");
    try {
      const payload = await getBooks();
      setBooks(payload.books || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load books");
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(bookId: string) {
    if (!confirm(`Delete ${bookId} from registry?`)) return;
    setLoading(true);
    setError("");
    try {
      await deleteBook(bookId);
      await loadBooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete book");
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBooks();
  }, []);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold">Book Library</h2>
        <button disabled={loading} onClick={loadBooks} className="rounded-lg border border-white/10 px-3 py-2 text-sm">Refresh Registry</button>
      </div>

      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}

      {books.length ? (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="px-3 py-2">Book</th>
                <th className="px-3 py-2">Class</th>
                <th className="px-3 py-2">Subject</th>
                <th className="px-3 py-2">Chunks</th>
                <th className="px-3 py-2">Upload Date</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr key={book.book_id} className="border-t border-white/10 text-slate-200">
                  <td className="px-3 py-3">
                    <p className="font-medium">{book.book_name}</p>
                    <p className="text-xs text-slate-500">{book.book_id}</p>
                  </td>
                  <td className="px-3 py-3">{book.class_level}</td>
                  <td className="px-3 py-3">{book.subject}</td>
                  <td className="px-3 py-3">{book.chunk_count}</td>
                  <td className="px-3 py-3">{book.indexed_at ? new Date(book.indexed_at).toLocaleString() : "-"}</td>
                  <td className="px-3 py-3"><span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-1 text-xs text-emerald-200">Indexed</span></td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => alert(JSON.stringify(book, null, 2))} className="rounded-md border border-white/10 px-2 py-1 text-xs">View Metadata</button>
                      <button onClick={() => onDelete(book.book_id)} className="rounded-md border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-xs text-rose-200">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !loading ? <p className="mt-4 text-sm text-slate-400">No books indexed yet.</p> : null}
    </section>
  );
}
