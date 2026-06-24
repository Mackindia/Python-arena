import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import Program from "@/models/Program";

// Fetch all programs for the logged-in user
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const programs = await Program.find({ userId }).sort({ updatedAt: -1 });

    return NextResponse.json({ programs }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch programs" }, { status: 500 });
  }
}

// Create a new program
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, htmlCode, cssCode, jsCode } = await req.json();

    await connectDB();
    const newProgram = await Program.create({
      userId,
      title: title || "Untitled Program",
      htmlCode,
      cssCode,
      jsCode,
    });

    return NextResponse.json({ program: newProgram }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create program" }, { status: 500 });
  }
}

// Update an existing program
export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, title, htmlCode, cssCode, jsCode } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Program ID is required" }, { status: 400 });
    }

    await connectDB();
    const updatedProgram = await Program.findOneAndUpdate(
      { _id: id, userId }, // Ensure the user owns this program!
      { title, htmlCode, cssCode, jsCode },
      { new: true }
    );

    if (!updatedProgram) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    return NextResponse.json({ program: updatedProgram }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update program" }, { status: 500 });
  }
}
