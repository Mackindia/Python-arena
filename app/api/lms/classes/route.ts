import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Subject from "@/models/lms/Subject";
import ClassModel from "@/models/lms/Class";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const subjectSlug = (request.nextUrl.searchParams.get("subject") ?? "").trim();

    let subjectId: string | null = null;

    if (subjectSlug) {
      const subject = await Subject.findOne({ slug: subjectSlug }).select("_id").lean();
      if (!subject?._id) {
        return NextResponse.json({ classes: [] });
      }
      subjectId = String(subject._id);
    }

    const classes = await ClassModel.find(subjectId ? { subject: subjectId } : {})
      .select("_id slug name subject")
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({
      classes: classes.map((item) => {
        const classItem = item as {
          _id?: unknown;
          slug?: string;
          name?: string;
          subject?: unknown;
        };

        return {
          _id: String(classItem._id),
          slug: classItem.slug || "",
          name: classItem.name || "",
          subject: String(classItem.subject || ""),
        };
      }),
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to fetch classes",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
