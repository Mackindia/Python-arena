import { NextResponse } from "next/server";
import { requireSuperAdminApi } from "@/lib/admin-api";
import { connectDB } from "@/lib/mongodb";
import PrivateNote from "@/src/models/PrivateNote";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getOwnedNote(id: string, ownerId: string) {
  const note = await PrivateNote.findById(id);

  if (!note) {
    return { kind: "missing" as const };
  }

  if (note.ownerId !== ownerId) {
    return { kind: "forbidden" as const };
  }

  return { kind: "ok" as const, note };
}

export async function GET(
  request: Request,
  context: RouteContext
) {
  const access = await requireSuperAdminApi();

  if (!access.ok) {
    return access.response;
  }

  try {
    await connectDB();

    const { id } = await context.params;
    const result = await getOwnedNote(id, access.userId);

    if (result.kind === "missing") {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    if (result.kind === "forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(result.note);
  } catch (error) {
    console.error("Error fetching private note:", error);

    const message = error instanceof Error ? error.message : "Internal Server Error";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  const access = await requireSuperAdminApi();

  if (!access.ok) {
    return access.response;
  }

  try {
    await connectDB();

    const { id } = await context.params;
    const { title, content } = await request.json();
    const result = await getOwnedNote(id, access.userId);

    if (result.kind === "missing") {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    if (result.kind === "forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const note = result.note;

    if (title !== undefined) {
      const normalizedTitle = typeof title === "string" ? title.trim() : "";

      if (!normalizedTitle) {
        return NextResponse.json({ error: "Title is required" }, { status: 400 });
      }

      note.title = normalizedTitle;
    }

    if (content !== undefined) {
      note.content = typeof content === "string" ? content : "";
    }

    await note.save();

    return NextResponse.json(note);
  } catch (error) {
    console.error("Error updating private note:", error);

    const message = error instanceof Error ? error.message : "Internal Server Error";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  const access = await requireSuperAdminApi();

  if (!access.ok) {
    return access.response;
  }

  try {
    await connectDB();

    const { id } = await context.params;
    const result = await getOwnedNote(id, access.userId);

    if (result.kind === "missing") {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    if (result.kind === "forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await result.note.deleteOne();

    return NextResponse.json({ message: "Note deleted" });
  } catch (error) {
    console.error("Error deleting private note:", error);

    const message = error instanceof Error ? error.message : "Internal Server Error";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
