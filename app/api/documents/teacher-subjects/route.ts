import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getRequestUserContext, ADMIN_PANEL_ROLES, hasAllowedRole } from "@/lib/rbac";
import Timetable from "@/models/Timetable";

export const runtime = "nodejs";

/**
 * GET /api/documents/teacher-subjects
 *
 * Returns the distinct subjects mapped to the current teacher via the Timetable.
 * Admins get ALL subjects. Teachers get only their mapped subjects.
 */
export async function GET() {
  try {
    const ctx = await getRequestUserContext();
    if (!ctx.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!hasAllowedRole(ctx.role, ADMIN_PANEL_ROLES)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const isAdmin = hasAllowedRole(ctx.role, ["super_admin", "admin"]);

    if (isAdmin) {
      // Admins see all subjects in the timetable
      const allSubjects = await Timetable.distinct("subject");

      // Also get unique classes
      const rawClasses = await Timetable.find().select("class section subject").lean() as {
        class: string;
        section: string;
        subject: string;
      }[];

      // Deduplicate class+section combos per subject
      const subjectMap = new Map<string, Set<string>>();
      for (const entry of rawClasses) {
        if (!subjectMap.has(entry.subject)) {
          subjectMap.set(entry.subject, new Set());
        }
        subjectMap.get(entry.subject)!.add(`${entry.class}-${entry.section}`);
      }

      const subjects = allSubjects
        .filter((s: string) => s && s.trim())
        .sort()
        .map((s: string) => ({
          subject: s,
          classes: Array.from(subjectMap.get(s) || []).sort(),
        }));

      return NextResponse.json({ subjects, isAdmin: true });
    }

    // Teacher: get their teacher_id and find mapped subjects
    const teacherId = (ctx.dbUser as { teacher_id?: string } | null)?.teacher_id;

    if (!teacherId) {
      return NextResponse.json({
        subjects: [],
        message: "No teacher ID linked to your account",
      });
    }

    const entries = await Timetable.find({ teacher_id: teacherId })
      .select("subject class section")
      .lean() as { subject: string; class: string; section: string }[];

    const subjectMap = new Map<string, Set<string>>();
    for (const entry of entries) {
      if (!entry.subject?.trim()) continue;
      if (!subjectMap.has(entry.subject)) {
        subjectMap.set(entry.subject, new Set());
      }
      subjectMap.get(entry.subject)!.add(`${entry.class}-${entry.section}`);
    }

    const subjects = Array.from(subjectMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([subject, classSet]) => ({
        subject,
        classes: Array.from(classSet).sort(),
      }));

    return NextResponse.json({ subjects, isAdmin: false });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch subjects", error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    );
  }
}
