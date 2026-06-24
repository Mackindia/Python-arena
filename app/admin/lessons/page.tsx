"use client";

import { useRouter } from "next/navigation";
import LmsLessonManager from "@/src/components/admin/LmsLessonManager";
import EnginePageLayout from "@/src/components/admin/EnginePageLayout";
import { Plus } from "lucide-react";

export default function AdminLessonsPage() {
  const router = useRouter();

  return (
    <EnginePageLayout
      title="Manage Lessons"
      category="Academic Tools"
      description="Draft, edit, publish, and delete interactive lesson notes, quizzes, and attachments for LMS classrooms."
      quickActions={[
        {
          label: "Upload New Lesson",
          onClick: () => router.push("/admin/upload"),
          icon: Plus
        }
      ]}
    >
      <LmsLessonManager />
    </EnginePageLayout>
  );
}
