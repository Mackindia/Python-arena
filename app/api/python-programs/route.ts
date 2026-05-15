import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import PythonProgram from "../../../src/models/PythonProgram";

// Fetch all Python programs for the logged-in user
// (Triggering rebuild for Next.js to recognize the newly moved model)
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const programs = await PythonProgram.find({ userId }).sort({ updatedAt: -1 });

    return NextResponse.json({ programs }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch python programs" }, { status: 500 });
  }
}

// Create a new python program
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, pythonCode } = await req.json();

    await connectDB();
    const newProgram = await PythonProgram.create({
      userId,
      title: title || "Untitled Python Program",
      pythonCode,
    });

    return NextResponse.json({ program: newProgram }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create python program" }, { status: 500 });
  }
}

// Update an existing python program
export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, title, pythonCode } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Program ID is required" }, { status: 400 });
    }

    await connectDB();
    const updatedProgram = await PythonProgram.findOneAndUpdate(
      { _id: id, userId }, // Ensure the user owns this program!
      { title, pythonCode },
      { new: true }
    );

    if (!updatedProgram) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    return NextResponse.json({ program: updatedProgram }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update python program" }, { status: 500 });
  }
}
