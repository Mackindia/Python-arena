"use client";

import Link from "next/link";
import NavBar from "@/components/NavBar";
import { foundationPrograms as defaultPrograms, foundationTerms as defaultTerms } from "@/lib/foundationContent";
import { useState, useRef } from "react";
import { motion } from "framer-motion";

function normalizeLine(line) {
  return line.replace(/\s+/g, " ").trim();
}

function buildPdfLines(items) {
  const rows = [];

  for (const item of items) {
    const text = normalizeLine(item.str || "");
    if (!text) continue;

    const x = item.transform?.[4] ?? 0;
    const y = item.transform?.[5] ?? 0;
    let row = rows.find((entry) => Math.abs(entry.y - y) < 4);

    if (!row) {
      row = { y, parts: [] };
      rows.push(row);
    }

    row.parts.push({ x, text });
  }

  return rows
    .sort((left, right) => right.y - left.y)
    .map((row) =>
      normalizeLine(
        row.parts
          .sort((left, right) => left.x - right.x)
          .map((part) => part.text)
          .join(" ")
      )
    )
    .filter(Boolean);
}

function findTitleIndex(lines, title, startIndex = 0) {
  const target = normalizeLine(title).toLowerCase();

  for (let index = startIndex; index < lines.length; index += 1) {
    if (normalizeLine(lines[index]).toLowerCase().includes(target)) {
      return index;
    }
  }

  return -1;
}

function buildDetectedTerms(lines) {
  return defaultTerms.map((fallback, index) => {
    const start = findTitleIndex(lines, fallback.title);

    if (start === -1) {
      return fallback;
    }

    const nextTermStarts = defaultTerms
      .slice(index + 1)
      .map((term) => findTitleIndex(lines, term.title, start + 1))
      .filter((value) => value !== -1);
    const nextProgramStarts = defaultPrograms
      .map((program) => findTitleIndex(lines, program.title, start + 1))
      .filter((value) => value !== -1);
    const end = [...nextTermStarts, ...nextProgramStarts].sort((left, right) => left - right)[0] ?? lines.length;
    const block = lines.slice(start + 1, end).map(normalizeLine).filter(Boolean);

    return {
      ...fallback,
      meaning: block[0] || fallback.meaning,
      example: block.slice(1).join(" ") || fallback.example,
    };
  });
}

function buildDetectedPrograms(lines) {
  const codePattern = /(=|print\(|input\(|if\b|else\b|for\b|while\b|def\b|return\b|range\(|int\(|float\()/;

  return defaultPrograms.map((fallback, index) => {
    const start = findTitleIndex(lines, fallback.title);

    if (start === -1) {
      return fallback;
    }

    const nextStarts = defaultPrograms
      .slice(index + 1)
      .map((program) => findTitleIndex(lines, program.title, start + 1))
      .filter((value) => value !== -1);
    const end = nextStarts.sort((left, right) => left - right)[0] ?? lines.length;
    const block = lines.slice(start + 1, end).map(normalizeLine).filter(Boolean);
    const codeLines = block.filter((line) => codePattern.test(line));
    const descriptionLines = block.filter((line) => !codePattern.test(line));

    return {
      ...fallback,
      description: descriptionLines[0] || fallback.description,
      code: codeLines.length ? codeLines.join("\n") : fallback.code,
    };
  });
}

async function extractPdfContent(file) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

  const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const allLines = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    allLines.push(...buildPdfLines(content.items));
  }

  const text = allLines.join("\n");

  return {
    text,
    detectedContent: {
      terms: buildDetectedTerms(allLines),
      programs: buildDetectedPrograms(allLines),
    },
  };
}

export default function FoundationPage() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [activeTab, setActiveTab] = useState("terms");
  const [detectedContent, setDetectedContent] = useState(null);
  const fileInputRef = useRef(null);

  const foundationTerms = detectedContent?.terms || defaultTerms;
  const pythonPrograms = detectedContent?.programs || defaultPrograms;

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile({
      name: file.name,
      size: (file.size / 1024).toFixed(2),
      type: file.type,
    });

    if (file.type === "application/pdf") {
      setFilePreview({
        type: "pdf",
        status: "loading",
        data: "",
      });

      try {
        const extracted = await extractPdfContent(file);
        setDetectedContent(extracted.detectedContent);
        setFilePreview({
          type: "pdf",
          status: "ready",
          data: extracted.text,
          termsCount: extracted.detectedContent.terms.length,
          programsCount: extracted.detectedContent.programs.length,
        });
      } catch (error) {
        setDetectedContent(null);
        setFilePreview({
          type: "pdf",
          status: "error",
          data: "",
          message:
            error instanceof Error
              ? `${error.message} Check your internet connection and try again.`
              : "Unable to extract PDF content. Check your internet connection and try again.",
        });
      }
    } else if (file.type.startsWith("image/")) {
      setDetectedContent(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        setFilePreview({
          type: "image",
          data: event.target?.result,
        });
      };
      reader.readAsDataURL(file);
    } else if (file.type === "text/plain") {
      setDetectedContent(null);
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
    setDetectedContent(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      <NavBar />
      <main className="overflow-x-clip min-h-screen bg-ink-950">
        {/* Header with back button */}
        <section className="px-6 py-16 sm:px-10 lg:px-16 border-b border-[rgba(255,255,255,0.08)]">
          <div className="mx-auto w-full max-w-6xl">
            <Link
              href="/#foundation"
              className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-neon hover:gap-3 transition-all mb-6"
            >
              <span>←</span> Back to Home
            </Link>
            <h1 className="font-heading text-4xl sm:text-5xl font-bold text-ink-50 mt-4">
              Python Foundation
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-300">
              Master the fundamental concepts of Python programming. Explore 16 foundation terms, practical programs, and upload your learning materials.
            </p>
          </div>
        </section>

        {/* Tab Navigation */}
        <section className="px-6 py-8 sm:px-10 lg:px-16 border-b border-[rgba(255,255,255,0.08)]">
          <div className="mx-auto w-full max-w-6xl">
            <div className="flex gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab("terms")}
                className={`font-mono text-xs uppercase tracking-widest px-4 py-2 transition-colors whitespace-nowrap border-b-2 ${
                  activeTab === "terms"
                    ? "text-neon border-neon"
                    : "text-ink-400 border-transparent hover:text-ink-300"
                }`}
              >
                16 Foundation Terms
              </button>
              <button
                onClick={() => setActiveTab("programs")}
                className={`font-mono text-xs uppercase tracking-widest px-4 py-2 transition-colors whitespace-nowrap border-b-2 ${
                  activeTab === "programs"
                    ? "text-neon border-neon"
                    : "text-ink-400 border-transparent hover:text-ink-300"
                }`}
              >
                Python Programs
              </button>
              <button
                onClick={() => setActiveTab("upload")}
                className={`font-mono text-xs uppercase tracking-widest px-4 py-2 transition-colors whitespace-nowrap border-b-2 ${
                  activeTab === "upload"
                    ? "text-neon border-neon"
                    : "text-ink-400 border-transparent hover:text-ink-300"
                }`}
              >
                Upload Materials
              </button>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="px-6 py-16 sm:px-10 lg:px-16">
          <div className="mx-auto w-full max-w-6xl">
            {/* Foundation Terms Tab */}
            {activeTab === "terms" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                <h2 className="font-heading text-2xl font-bold text-ink-50 mb-8">
                  16 Terms to Understand Python Foundation
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {foundationTerms.map((term, idx) => (
                    <motion.div
                      key={term.title}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      className="rounded border border-[rgba(255,255,255,0.08)] bg-ink-900 p-6 hover:bg-ink-800 transition-colors"
                    >
                      <p className="font-mono text-sm font-bold text-neon mb-2">
                        {term.num} — {term.title}
                      </p>
                      <p className="text-sm text-ink-300 mb-4">{term.meaning}</p>
                      <div className="pt-4 border-t border-[rgba(255,255,255,0.08)]">
                        <p className="font-mono text-xs text-sky-300 whitespace-pre-wrap">
                          {term.example}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Python Programs Tab */}
            {activeTab === "programs" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                <h2 className="font-heading text-2xl font-bold text-ink-50 mb-8">
                  Essential Python Programs
                </h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {pythonPrograms.map((prog, idx) => (
                    <motion.div
                      key={prog.title}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      className="rounded border border-[rgba(255,255,255,0.08)] bg-ink-900 p-6 hover:bg-ink-800 transition-colors"
                    >
                      <h3 className="font-heading text-base font-bold text-neon mb-4">
                        {prog.title}
                      </h3>
                      <pre className="font-mono text-xs text-sky-300 bg-ink-800 p-4 rounded overflow-x-auto whitespace-pre-wrap break-words leading-relaxed">
                        {prog.code}
                      </pre>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Upload Materials Tab */}
            {activeTab === "upload" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                <h2 className="font-heading text-2xl font-bold text-ink-50 mb-8">
                  Upload Your Foundation Materials
                </h2>
                <div className="max-w-2xl mx-auto">
                  <div className="rounded border border-[rgba(255,255,255,0.08)] bg-ink-900 p-8">
                    {!uploadedFile ? (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-[rgba(255,255,255,0.15)] p-12 cursor-pointer transition-colors hover:border-neon hover:bg-[rgba(255,255,255,0.02)]"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-12 w-12 text-neon"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        <div className="text-center">
                          <p className="font-mono text-sm uppercase tracking-widest text-neon font-semibold">
                            Click to Upload
                          </p>
                          <p className="mt-2 text-sm text-ink-400">
                            Drag and drop your PDF, images, or text files
                          </p>
                          <p className="mt-2 text-xs text-ink-500">
                            PDF extraction uses an internet-loaded parser worker.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="rounded bg-ink-800 p-4">
                          <p className="font-mono text-xs uppercase tracking-widest text-neon font-semibold">
                            File Uploaded Successfully
                          </p>
                          <p className="mt-3 text-base font-semibold text-ink-50">
                            {uploadedFile.name}
                          </p>
                          <p className="mt-1 text-xs text-ink-400">{uploadedFile.size} KB</p>
                        </div>

                        {filePreview && (
                          <div className="rounded bg-ink-800 p-4 max-h-64 overflow-hidden flex items-center justify-center">
                            {filePreview.type === "pdf" && (
                              <div className="w-full space-y-3 text-left">
                                <div>
                                  <p className="text-sm text-ink-400">PDF extraction</p>
                                  {filePreview.status === "loading" && (
                                    <p className="text-xs text-ink-500 mt-1">Extracting text and detecting foundation content...</p>
                                  )}
                                  {filePreview.status === "error" && (
                                    <p className="text-xs text-rose-300 mt-1">{filePreview.message}</p>
                                  )}
                                  {filePreview.status === "ready" && (
                                    <p className="text-xs text-ink-500 mt-1">
                                      Detected {filePreview.termsCount} terms and {filePreview.programsCount} programs from the uploaded PDF.
                                    </p>
                                  )}
                                </div>
                                {filePreview.status === "ready" && (
                                  <pre className="text-xs text-ink-300 overflow-y-auto max-h-56 w-full whitespace-pre-wrap break-words">
                                    {filePreview.data?.substring(0, 1200)}
                                    {filePreview.data && filePreview.data.length > 1200 && "\n..."}
                                  </pre>
                                )}
                              </div>
                            )}
                            {filePreview.type === "image" && (
                              <img
                                src={filePreview.data}
                                alt="Preview"
                                className="max-h-60 max-w-full object-contain"
                              />
                            )}
                            {filePreview.type === "text" && (
                              <pre className="text-xs text-ink-300 overflow-y-auto max-h-60 w-full p-3 whitespace-pre-wrap break-words">
                                {filePreview.data?.substring(0, 800)}
                                {filePreview.data && filePreview.data.length > 800 && "\n..."}
                              </pre>
                            )}
                          </div>
                        )}

                        <button
                          onClick={handleClear}
                          className="w-full rounded border border-[rgba(255,255,255,0.08)] bg-ink-700 px-4 py-2 font-mono text-xs uppercase tracking-widest text-ink-200 transition-colors hover:bg-ink-600 hover:text-neon"
                        >
                          Clear & Upload New File
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
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
