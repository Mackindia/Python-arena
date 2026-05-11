import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Subject from "@/models/lms/Subject";

export const runtime = "nodejs";

export async function GET() {
  try {
    await connectDB();

    const subjects = await Subject.find({})
      .select("_id slug name")
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({
      subjects: subjects.map((subject) => ({
        _id: String(subject._id),
        slug: subject.slug,
        name: subject.name,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to fetch subjects",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
