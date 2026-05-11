"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useRef } from "react";
import { foundationPreviewTopics as foundationTopics } from "@/lib/foundationContent";

export default function FoundationSection() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Store file name and create preview
    setUploadedFile({
      name: file.name,
      size: (file.size / 1024).toFixed(2),
      type: file.type,
    });

    // If it's a PDF or image, show preview
    if (file.type === "application/pdf") {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFilePreview({
          type: "pdf",
          data: event.target?.result,
        });
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFilePreview({
          type: "image",
          data: event.target?.result,
        });
      };
      reader.readAsDataURL(file);
    } else if (file.type === "text/plain") {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFilePreview({
          type: "text",
          data: event.target?.result,
        });
      };
      reader.readAsText(file);
    }
  };

  const handleClear = () => {
    setUploadedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <section id="foundation" className="px-6 py-24 sm:px-10 lg:px-16">
      <div className="mx-auto w-full max-w-6xl">
        {/* Section header */}
        <div className="mb-12 flex items-end justify-between border-b border-[rgba(255,255,255,0.08)] pb-6">
          <div>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.28em] text-neon">
              04 / Foundation
            </p>
            <h2 className="font-heading text-3xl font-bold text-ink-50 sm:text-4xl">
              Python Foundation
            </h2>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <p className="max-w-xs text-right text-sm text-ink-300">
              Master the fundamentals of Python programming with structured content.
            </p>
            <Link
              href="/class-11-study-material"
              className="shrink-0 inline-flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-neon transition-all duration-200 hover:gap-3 border border-neon px-4 py-2 rounded"
            >
              Class 11 Study Material <span>→</span>
            </Link>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left: Topics grid */}
          <div
            className="grid sm:grid-cols-2 lg:col-span-2 lg:grid-cols-2"
            style={{ gap: "1px", background: "rgba(255,255,255,0.07)" }}
          >
            {foundationTopics.map((topic, idx) => (
              <motion.article
                key={topic.title}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.06 }}
                className="group relative bg-ink-900 p-6 transition-colors duration-300 hover:bg-ink-800"
              >
                <h3 className="font-heading text-sm font-semibold uppercase tracking-widest text-ink-50">
                  {topic.title}
                </h3>
                <p className="mt-3 text-xs leading-relaxed text-ink-300">{topic.desc}</p>
                <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-neon transition-all duration-500 group-hover:w-full" />
              </motion.article>
            ))}
          </div>

          {/* Right: File Upload Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col bg-ink-900 p-6 lg:col-span-1"
            style={{ borderWidth: "1px", borderColor: "rgba(255,255,255,0.07)" }}
          >
            <h3 className="font-heading text-sm font-semibold uppercase tracking-widest text-ink-50 mb-4">
              Upload Foundation File
            </h3>

            {!uploadedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex flex-col items-center justify-center gap-3 rounded border-2 border-dashed border-[rgba(255,255,255,0.15)] p-8 cursor-pointer transition-colors hover:border-neon hover:bg-[rgba(255,255,255,0.02)]"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-8 w-8 text-neon"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <div className="text-center">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-neon">
                    Click to Upload
                  </p>
                  <p className="mt-1 text-xs text-ink-400">PDF, Images, or Text</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col gap-4">
                {/* File info */}
                <div className="rounded bg-ink-800 p-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-neon">
                    Uploaded
                  </p>
                  <p className="mt-2 truncate text-sm font-semibold text-ink-50">
                    {uploadedFile.name}
                  </p>
                  <p className="mt-1 text-xs text-ink-400">{uploadedFile.size} KB</p>
                </div>

                {/* File preview */}
                {filePreview && (
                  <div className="flex-1 rounded bg-ink-800 overflow-hidden flex items-center justify-center">
                    {filePreview.type === "pdf" && (
                      <div className="text-center p-4">
                        <p className="text-xs text-ink-400">PDF Preview</p>
                        <p className="text-[10px] text-ink-500 mt-1">
                          Open file to view full content
                        </p>
                      </div>
                    )}
                    {filePreview.type === "image" && (
                      <img
                        src={filePreview.data}
                        alt="Preview"
                        className="max-h-48 max-w-full object-contain"
                      />
                    )}
                    {filePreview.type === "text" && (
                      <pre className="text-[10px] text-ink-300 overflow-y-auto max-h-48 w-full p-3 whitespace-pre-wrap break-words">
                        {filePreview.data?.substring(0, 500)}
                        {filePreview.data && filePreview.data.length > 500 && "..."}
                      </pre>
                    )}
                  </div>
                )}

                {/* Clear button */}
                <button
                  onClick={handleClear}
                  className="rounded border border-[rgba(255,255,255,0.08)] bg-ink-800 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-ink-200 transition-colors hover:bg-ink-700 hover:text-neon"
                >
                  Clear & Upload New
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              accept=".pdf,.txt,.png,.jpg,.jpeg,.gif"
              className="hidden"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
