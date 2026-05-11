"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface UploadedAsset {
  url: string;
  publicId: string;
  name: string;
}

export default function AdminLessonUploadForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [lessonPdfFile, setLessonPdfFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  
  const [pdfUploaded, setPdfUploaded] = useState(false);
  const [thumbnailUploaded, setThumbnailUploaded] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const pdfDragRef = useRef<HTMLDivElement>(null);
  const thumbnailDragRef = useRef<HTMLDivElement>(null);

  const subjects = ["Python", "Computer Science", "AI", "Web Development", "Data Science"];
  const classes = ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"];

  const handlePdfDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    pdfDragRef.current?.classList.add("border-blue-500", "bg-blue-50");
  };

  const handlePdfDragLeave = () => {
    pdfDragRef.current?.classList.remove("border-blue-500", "bg-blue-50");
  };

  const handlePdfDrop = (e: React.DragEvent) => {
    e.preventDefault();
    pdfDragRef.current?.classList.remove("border-blue-500", "bg-blue-50");
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === "application/pdf") {
        setLessonPdfFile(file);
        uploadPdfFile(file);
      } else {
        setError("Please upload a PDF file");
      }
    }
  };

  const uploadPdfFile = async (file: File) => {
    setLoading(true);
    setError("");
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "lms/pdfs");

    try {
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload PDF");
      }

      const data: UploadedAsset = await response.json();
      setPdfUrl(data.url);
      setPdfUploaded(true);
      setSuccess("PDF uploaded successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setLessonPdfFile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleThumbnailDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    thumbnailDragRef.current?.classList.add("border-green-500", "bg-green-50");
  };

  const handleThumbnailDragLeave = () => {
    thumbnailDragRef.current?.classList.remove("border-green-500", "bg-green-50");
  };

  const handleThumbnailDrop = (e: React.DragEvent) => {
    e.preventDefault();
    thumbnailDragRef.current?.classList.remove("border-green-500", "bg-green-50");
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        setThumbnailFile(file);
        uploadThumbnailFile(file);
      } else {
        setError("Please upload an image file");
      }
    }
  };

  const uploadThumbnailFile = async (file: File) => {
    setLoading(true);
    setError("");
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "lms/thumbnails");

    try {
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload thumbnail");
      }

      const data: UploadedAsset = await response.json();
      setThumbnailUrl(data.url);
      setThumbnailUploaded(true);
      setSuccess("Thumbnail uploaded successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setThumbnailFile(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!title.trim()) {
      setError("Please enter a lesson title");
      return;
    }

    if (!description.trim()) {
      setError("Please enter a lesson description");
      return;
    }

    if (!subject) {
      setError("Please select a subject");
      return;
    }

    if (!classLevel) {
      setError("Please select a class level");
      return;
    }

    if (!pdfUploaded || !pdfUrl) {
      setError("Please upload the lesson PDF");
      return;
    }

    if (!thumbnailUploaded || !thumbnailUrl) {
      setError("Please upload a thumbnail");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/lms-lessons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          subject: subject,
          class: classLevel,
          pdfUrl,
          thumbnailUrl,
          slug: title.toLowerCase().replace(/\s+/g, "-"),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create lesson");
      }

      const lesson = await response.json();
      setSuccess("Lesson published successfully!");
      
      // Reset form
      setTimeout(() => {
        router.push(`/lms/${subject.toLowerCase()}/${classLevel.replace(/\s+/g, "-")}/${lesson.slug}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish lesson");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handlePublish} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <span className="text-2xl">❌</span>
          <div className="flex-1">
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <span className="text-2xl">✅</span>
          <div className="flex-1">
            <p className="text-green-800 font-medium">Success</p>
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Lesson Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., Variables in Python"
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Brief description of the lesson"
          rows={4}
          disabled={loading}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject <span className="text-red-500">*</span>
          </label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          >
            <option value="">Select a subject</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Class <span className="text-red-500">*</span>
          </label>
          <select
            value={classLevel}
            onChange={(e) => setClassLevel(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          >
            <option value="">Select a class</option>
            {classes.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        ref={pdfDragRef}
        onDragOver={handlePdfDragOver}
        onDragLeave={handlePdfDragLeave}
        onDrop={handlePdfDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
          pdfUploaded
            ? "border-green-300 bg-green-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
      >
        {pdfUploaded ? (
          <div className="space-y-2">
            <p className="text-2xl">✓</p>
            <p className="text-green-700 font-medium">{lessonPdfFile?.name}</p>
            <p className="text-green-600 text-sm">PDF uploaded successfully</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-3xl">📤</p>
            <p className="text-gray-700 font-medium">Drag and drop your lesson PDF</p>
            <p className="text-gray-500 text-sm">Maximum size: 30MB</p>
          </div>
        )}
      </div>

      <div
        ref={thumbnailDragRef}
        onDragOver={handleThumbnailDragOver}
        onDragLeave={handleThumbnailDragLeave}
        onDrop={handleThumbnailDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
          thumbnailUploaded
            ? "border-green-300 bg-green-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
      >
        {thumbnailUploaded ? (
          <div className="space-y-2">
            <p className="text-2xl">✓</p>
            <p className="text-green-700 font-medium">{thumbnailFile?.name}</p>
            <p className="text-green-600 text-sm">Thumbnail uploaded successfully</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-3xl">🖼️</p>
            <p className="text-gray-700 font-medium">Drag and drop thumbnail image</p>
            <p className="text-gray-500 text-sm">Maximum size: 10MB</p>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || !pdfUploaded || !thumbnailUploaded}
        className={`w-full py-3 rounded-lg font-medium transition-all ${
          loading || !pdfUploaded || !thumbnailUploaded
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        {loading ? "Publishing..." : "Publish Lesson"}
      </button>
    </form>
  );
}
