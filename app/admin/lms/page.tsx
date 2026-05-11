"use client";

import { useState, useEffect } from "react";
import LmsLessonUploadForm from "@/src/components/admin/LmsLessonUploadForm";

interface Subject {
  _id: string;
  name: string;
  slug: string;
}

interface Class {
  _id: string;
  name: string;
  slug: string;
  subject: string;
}

export default function AdminLmsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function fetchWithTimeout(url: string, timeoutMs = 15000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(url, {
        cache: "no-store",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const [subjectsRes, classesRes] = await Promise.all([
        fetchWithTimeout("/api/lms/subjects"),
        fetchWithTimeout("/api/lms/classes"),
      ]);

      if (!subjectsRes.ok || !classesRes.ok) {
        setError("Failed to load subjects and classes");
        return;
      }

      const subjectsData = await subjectsRes.json();
      const classesData = await classesRes.json();

      setSubjects(subjectsData.subjects || []);
      setClasses(classesData.classes || []);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setError("Loading timed out. Please refresh the page.");
        return;
      }

      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-6">
        <div className="text-center text-cyan-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">LMS Lesson Manager</h1>
        <p className="text-slate-400 mb-8">Upload PDF, thumbnail, and publish lessons to your LMS</p>

        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
            {error}
          </div>
        )}

        <LmsLessonUploadForm subjects={subjects} classes={classes} />
      </div>
    </div>
  );
}
