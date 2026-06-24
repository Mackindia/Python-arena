"use client";

import { useEffect, useState } from "react";
import { listEducationalBooks, type EducationalBookRecord } from "@/lib/educational-ai";

interface BookSelectorProps {
  selectedBookId: string;
  onSelectBook: (book: EducationalBookRecord) => void;
}

export default function BookSelector({ selectedBookId, onSelectBook }: BookSelectorProps) {
  const [books, setBooks] = useState<EducationalBookRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listEducationalBooks()
      .then(setBooks)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-xs text-slate-500">Loading books...</p>;
  if (!books.length) return <p className="text-xs text-slate-500">No books uploaded yet. Upload a book first.</p>;

  return (
    <label className="space-y-2 text-sm sm:col-span-2">
      <span className="text-slate-300">Select Book (auto-fills class & subject)</span>
      <select
        value={selectedBookId}
        onChange={(e) => {
          const book = books.find((b) => b.book_id === e.target.value);
          if (book) onSelectBook(book);
        }}
        className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none"
      >
        <option value="">-- Choose a book --</option>
        {books.map((book) => (
          <option key={book.book_id} value={book.book_id}>
            {book.book_name} (Class {book.class_level} — {book.subject})
          </option>
        ))}
      </select>
    </label>
  );
}
