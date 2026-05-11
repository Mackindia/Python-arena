import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { db } = await connectToDatabase();

    // Check if user is admin
    const user = await db.collection("users").findOne({ clerkId: userId });
    
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const { title, description, subject, class: classLevel, pdfUrl, thumbnailUrl, slug } = await request.json();

    // Validate required fields
    if (!title || !description || !subject || !classLevel || !pdfUrl || !thumbnailUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find or create subject
    let subjectDoc = await db.collection("subjects").findOne({ name: subject });
    
    if (!subjectDoc) {
      const insertResult = await db.collection("subjects").insertOne({
        name: subject,
        slug: subject.toLowerCase().replace(/\s+/g, "-"),
        description: "",
        createdAt: new Date(),
      });
      subjectDoc = { _id: insertResult.insertedId, slug: subject.toLowerCase().replace(/\s+/g, "-") };
    }

    // Find or create class
    let classDoc = await db.collection("classes").findOne({ 
      name: classLevel,
      subject: subjectDoc._id,
    });

    if (!classDoc) {
      const insertResult = await db.collection("classes").insertOne({
        name: classLevel,
        subject: subjectDoc._id,
        slug: classLevel.toLowerCase().replace(/\s+/g, "-"),
        order: parseInt(classLevel.split(" ")[1]) || 0,
        createdAt: new Date(),
      });
      classDoc = { _id: insertResult.insertedId, slug: classLevel.toLowerCase().replace(/\s+/g, "-") };
    }

    // Create lesson
    const lesson = {
      title,
      description,
      subject: subjectDoc._id,
      class: classDoc._id,
      pdfUrl,
      thumbnailUrl,
      slug: slug || title.toLowerCase().replace(/\s+/g, "-"),
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      views: 0,
      likes: 0,
    };

    const result = await db.collection("lessons").insertOne(lesson);

    return NextResponse.json({
      _id: result.insertedId,
      slug: lesson.slug,
      ...lesson,
    });
  } catch (error) {
    console.error("Lesson creation error:", error);
    return NextResponse.json(
      { error: "Failed to create lesson", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
