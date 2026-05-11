"use client";

import type { ReactNode } from "react";

type AppModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export default function AppModal({ open, title, onClose, children }: AppModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-slate-950 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-md px-2 py-1 text-sm text-slate-300 hover:bg-white/10">
            Close
          </button>
        </div>
        <div className="mt-4 text-slate-200">{children}</div>
      </div>
    </div>
  );
}
