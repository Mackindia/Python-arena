import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdminApi } from "@/lib/admin-api";
import Subject from "@/models/lms/Subject";
import ClassModel from "@/models/lms/Class";
import navigationMatrix from "@/src/data/learn-navigation.json";

export const runtime = "nodejs";

export async function POST() {
  try {
    const access = await requireAdminApi();
    if (!access.ok) {
      return access.response;
    }

    await connectDB();
    const now = new Date();

    let createdSubjects = 0;
    let createdClasses = 0;

    for (const entry of navigationMatrix) {
      const subject = await Subject.findOneAndUpdate(
        { slug: entry.subject.slug },
        {
          $set: {
            name: entry.subject.name,
            slug: entry.subject.slug,
            description: entry.subject.description,
            updatedAt: now,
          },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true, new: true },
      ).select("_id").lean();

      if (!subject?._id) {
        throw new Error(`Failed to upsert subject ${entry.subject.slug}`);
      }

      createdSubjects += 1;

      for (const cls of entry.classes) {
        await ClassModel.updateOne(
          { subject: subject._id, slug: cls.slug },
          {
            $set: {
              name: cls.name,
              slug: cls.slug,
              subject: subject._id,
              updatedAt: now,
            },
            $setOnInsert: { createdAt: now },
          },
          { upsert: true },
        );
        createdClasses += 1;
      }
    }

    return NextResponse.json({
      message: "Learn navigation reseeded",
      subjects: createdSubjects,
      classes: createdClasses,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to reseed learn navigation", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
