"use client";

import { useId, useRef, useState } from "react";

type UploadDropzoneProps = {
  label: string;
  accept: string;
  file: File | null;
  helperText: string;
  error?: string;
  disabled?: boolean;
  onFileChange: (file: File | null) => void;
};

export default function UploadDropzone({
  label,
  accept,
  file,
  helperText,
  error,
  disabled,
  onFileChange,
}: UploadDropzoneProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  function onDrop(event: React.DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsDragging(false);

    if (disabled) {
      return;
    }

    const dropped = event.dataTransfer.files?.[0] ?? null;
    onFileChange(dropped);
  }

  const borderClass = error
    ? "border-rose-400/50"
    : isDragging
      ? "border-cyan-300/70"
      : "border-white/15";

  return (
    <div className="block rounded-xl border border-white/10 bg-black/20 p-3">
      <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-slate-200">
        {label}
      </label>

      <button
        type="button"
        disabled={disabled}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) {
            setIsDragging(true);
          }
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`w-full rounded-xl border ${borderClass} bg-black/30 p-5 text-left transition hover:border-cyan-300/60 disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <p className="text-sm text-white">Drag and drop or click to browse</p>
        <p className="mt-1 text-xs text-slate-400">{helperText}</p>

        {file ? (
          <p className="mt-3 text-xs text-emerald-300">
            {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
          </p>
        ) : null}
      </button>

      <input
        id={inputId}
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        disabled={disabled}
        onChange={(event) => {
          const nextFile = event.target.files?.[0] ?? null;
          onFileChange(nextFile);
          event.currentTarget.value = "";
        }}
      />

      {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
