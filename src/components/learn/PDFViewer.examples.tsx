/* eslint-disable */
// @ts-nocheck
/**
 * PDF Viewer Component - Usage Examples
 * 
 * This file demonstrates practical implementations of the PDFViewer component
 * in various LMS lesson contexts.
 */

// ============================================================================
// Example 1: Basic Standalone Usage (Simplest)
// ============================================================================
// app/lms/lessons/[id]/page.tsx

import PDFViewer from "@/src/components/learn/PDFViewer";

export default async function SimpleLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lesson = await fetchLesson(id);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">{lesson.title}</h1>
      
      {/* Minimal configuration - uses all defaults */}
      <PDFViewer 
        pdfUrl={lesson.pdfUrl}
        title={lesson.title}
      />
      
      <section className="mt-8">
        <p className="text-slate-300">{lesson.description}</p>
      </section>
    </main>
  );
}


// ============================================================================
// Example 2: With Multiple Reading Modes (Already Integrated)
// ============================================================================
// src/components/learn/LessonReadingPanel.tsx (excerpt)

import PDFViewer from "@/src/components/learn/PDFViewer";

type ReadingMode = "pdf" | "text" | "split";

export default function LessonReadingPanel({ title, pdfUrl, content }: Props) {
  const [mode, setMode] = useState<ReadingMode>("pdf");

  return (
    <section>
      {/* Mode Selector */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setMode("pdf")}>PDF View</button>
        <button onClick={() => setMode("text")}>Text View</button>
        <button onClick={() => setMode("split")}>Split View</button>
      </div>

      {/* PDF Mode - Full features */}
      {mode === "pdf" && (
        <PDFViewer
          pdfUrl={pdfUrl}
          title={title}
          showDownloadButton
          showFullscreenButton
          height="65vh"
          minHeight="420px"
        />
      )}

      {/* Text Mode - Just content */}
      {mode === "text" && (
        <LessonContentRenderer content={content} />
      )}

      {/* Split Mode - PDF on left, text on right */}
      {mode === "split" && (
        <div className="grid grid-cols-2 gap-4">
          {/* No fullscreen in split to avoid UI collision */}
          <PDFViewer
            pdfUrl={pdfUrl}
            title={title}
            showDownloadButton
            showFullscreenButton={false}
            height="65vh"
            minHeight="420px"
          />
          
          <div className="min-h-[420px]">
            <LessonContentRenderer content={content} />
          </div>
        </div>
      )}
    </section>
  );
}


// ============================================================================
// Example 3: In a Modal/Dialog
// ============================================================================
// components/LessonPreviewModal.tsx

"use client";

import { useState } from "react";
import PDFViewer from "@/src/components/learn/PDFViewer";

export function LessonPreviewModal({ lesson, isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
      <div className="relative h-[90vh] w-[90vw] rounded-2xl bg-slate-950 p-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 rounded-lg p-2 text-slate-400 hover:text-white"
        >
          ✕
        </button>

        {/* Header */}
        <h2 className="mb-4 text-2xl font-bold text-white">{lesson.title}</h2>

        {/* PDF Viewer - Takes most of the space */}
        <div className="h-[calc(90vh-120px)]">
          <PDFViewer
            pdfUrl={lesson.pdfUrl}
            title={lesson.title}
            showDownloadButton
            showFullscreenButton
            height="100%"
            minHeight="400px"
          />
        </div>
      </div>
    </div>
  );
}


// ============================================================================
// Example 4: With Progress Tracking
// ============================================================================
// app/lms/[subject]/[class]/[lesson]/page.tsx (excerpt)

import PDFViewer from "@/src/components/learn/PDFViewer";
import { MarkLessonCompleteButton } from "@/src/components/learn/MarkLessonCompleteButton";

export default async function LessonViewerPage({ lesson, completionState }: Props) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Lesson Header */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{lesson.title}</h1>
        <p className="text-slate-400 mb-4">{lesson.description}</p>
        
        {/* Mark Complete Button */}
        <MarkLessonCompleteButton
          subject={lesson.subject}
          class={lesson.class}
          lesson={lesson.slug}
          initialCompleted={completionState.completed}
        />
      </header>

      {/* Main Content */}
      <article className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* PDF Viewer - 2 columns on desktop */}
        <div className="lg:col-span-2">
          <PDFViewer
            pdfUrl={lesson.pdfUrl}
            title={lesson.title}
            showDownloadButton
            showFullscreenButton
            height="65vh"
            minHeight="420px"
          />
        </div>

        {/* Sidebar - 1 column on desktop */}
        <aside className="sticky top-6 h-fit">
          <LessonSidebar lesson={lesson} />
        </aside>
      </article>

      {/* Navigation */}
      <nav className="mt-12 grid grid-cols-2 gap-4">
        {lesson.previous && <PreviousLessonLink lesson={lesson.previous} />}
        {lesson.next && <NextLessonLink lesson={lesson.next} />}
      </nav>
    </div>
  );
}


// ============================================================================
// Example 5: Responsive Mobile-First
// ============================================================================
// components/ResponsiveLessonViewer.tsx

"use client";

import { useEffect, useState } from "react";
import PDFViewer from "@/src/components/learn/PDFViewer";

export default function ResponsiveLessonViewer({ lesson }: Props) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Adaptive Height and Features Based on Device */}
      <PDFViewer
        pdfUrl={lesson.pdfUrl}
        title={lesson.title}
        showDownloadButton
        showFullscreenButton={!isMobile} // Fullscreen less useful on mobile
        height={isMobile ? "50vh" : "65vh"} // Smaller on mobile
        minHeight={isMobile ? "300px" : "420px"}
      />

      {/* Mobile-Optimized Controls */}
      <div className={`mt-4 grid ${isMobile ? "grid-cols-1" : "grid-cols-2"} gap-4`}>
        <a href={lesson.nextUrl} className="btn">
          Next Lesson
        </a>
      </div>
    </div>
  );
}


// ============================================================================
// Example 6: With Cloudinary URL
// ============================================================================
// app/lessons/[id]/page.tsx

import PDFViewer from "@/src/components/learn/PDFViewer";
import { CldImage } from "next-cloudinary";

export default async function CloudinaryLessonPage({ params }: Props) {
  const lesson = await fetchLesson(params.id);
  
  // Cloudinary PDF URL
  const pdfUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/v${lesson.pdfVersion}/lms/pdfs/${lesson.pdfPublicId}.pdf`;

  return (
    <main>
      <h1>{lesson.title}</h1>
      
      {/* Thumbnail from Cloudinary */}
      {lesson.thumbnailPublicId && (
        <CldImage
          src={lesson.thumbnailPublicId}
          alt={lesson.title}
          width={800}
          height={400}
          className="mb-6 rounded-lg"
        />
      )}

      {/* PDF from Cloudinary */}
      <PDFViewer
        pdfUrl={pdfUrl}
        title={lesson.title}
        showDownloadButton
        showFullscreenButton
        height="70vh"
        minHeight="500px"
      />
    </main>
  );
}


// ============================================================================
// Example 7: With Error Boundary
// ============================================================================
// components/PDFViewerWithFallback.tsx

"use client";

import { ReactNode } from "react";
import PDFViewer from "@/src/components/learn/PDFViewer";

type PDFViewerWithFallbackProps = {
  pdfUrl: string;
  title: string;
  fallback?: ReactNode;
};

export default function PDFViewerWithFallback({
  pdfUrl,
  title,
  fallback,
}: PDFViewerWithFallbackProps) {
  // Validate URL before rendering
  if (!pdfUrl || !isValidUrl(pdfUrl)) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-950 p-8 text-center">
        <p className="text-slate-400">
          PDF URL is invalid or unavailable.
        </p>
        {fallback || null}
      </div>
    );
  }

  return (
    <PDFViewer
      pdfUrl={pdfUrl}
      title={title}
      showDownloadButton
      showFullscreenButton
    />
  );
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return url.toLowerCase().endsWith(".pdf") || url.includes("pdf");
  } catch {
    return false;
  }
}


// ============================================================================
// Example 8: Lazy Loading for Performance
// ============================================================================
// app/lessons/[id]/page.tsx

"use client";

import { Suspense, lazy } from "react";

const PDFViewer = lazy(() => import("@/src/components/learn/PDFViewer"));

function PDFViewerSkeleton() {
  return (
    <div className="h-[65vh] min-h-[420px] animate-pulse rounded-2xl bg-slate-900" />
  );
}

export default function LessonPage({ lesson }: Props) {
  return (
    <div>
      <h1>{lesson.title}</h1>
      
      {/* Only load PDFViewer when needed */}
      <Suspense fallback={<PDFViewerSkeleton />}>
        <PDFViewer
          pdfUrl={lesson.pdfUrl}
          title={lesson.title}
        />
      </Suspense>
    </div>
  );
}


// ============================================================================
// Type Definitions
// ============================================================================

interface Lesson {
  id: string;
  title: string;
  description?: string;
  pdfUrl: string;
  content?: string;
  slug?: string;
  subject?: string;
  class?: string;
  previous?: { id: string; title: string; url: string };
  next?: { id: string; title: string; url: string };
  thumbnailPublicId?: string;
  pdfVersion?: string;
  pdfPublicId?: string;
}

interface Props {
  params?: any;
  lesson?: Lesson;
  completionState?: { completed: boolean; completedAt: string | null };
  isOpen?: boolean;
  onClose?: () => void;
  fallback?: ReactNode;
}
