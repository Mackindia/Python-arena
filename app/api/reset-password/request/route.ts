import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ResetRequest } from "../../../../src/models/ResetRequest";

export async function POST(req: Request) {
  try {
    const { username } = await req.json();

    if (!username) {
      return NextResponse.json(
        { error: "Username (Admission Number) is required" },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Check if there is already a pending request
    const existingRequest = await ResetRequest.findOne({
      username: username,
      status: "pending",
    });

    if (existingRequest) {
      return NextResponse.json(
        { message: "A reset request is already pending for this username." },
        { status: 200 }
      );
    }

    // Create a new request
    await ResetRequest.create({
      username: username,
    });

    return NextResponse.json(
      { message: "Password reset request submitted successfully." },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating reset request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
