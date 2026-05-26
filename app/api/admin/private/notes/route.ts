import { NextResponse } from "next/server";
import { requireSuperAdminApi } from "@/lib/admin-api";
import { connectDB } from "@/lib/mongodb";
import PrivateNote from "@/src/models/PrivateNote";

export async function GET() {
  const access = await requireSuperAdminApi();

  if (!access.ok) {
    return access.response;
  }

  try {
    await connectDB();

    const notes = await PrivateNote.find({ ownerId: access.userId }).sort({
      updatedAt: -1,
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Error fetching private notes:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const access = await requireSuperAdminApi();

  if (!access.ok) {
    return access.response;
  }

  try {
    await connectDB();

    const { title, content } = await request.json();
    const normalizedTitle = typeof title === "string" ? title.trim() : "";

    if (!normalizedTitle) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const newNote = await PrivateNote.create({
      ownerId: access.userId,
      title: normalizedTitle,
      content: typeof content === "string" ? content : "",
    });

    return NextResponse.json(newNote, { status: 201 });
  } catch (error) {
    console.error("Error creating private note:", error);

    const message = error instanceof Error ? error.message : "Internal Server Error";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}