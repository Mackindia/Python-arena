import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ResetRequest } from "../../../../src/models/ResetRequest";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const { requestId, username } = await req.json();

    if (!requestId || !username) {
      return NextResponse.json(
        { error: "Request ID and Username are required" },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Verify request exists
    const request = await ResetRequest.findById(requestId);
    if (!request || request.status !== "pending") {
      return NextResponse.json(
        { error: "Invalid or already processed request" },
        { status: 400 }
      );
    }

    // Default temporary password
    const tempPassword = "password@doon";

    // Initialize Clerk Client
    const client = await clerkClient();

    // 1. Find the user in Clerk by their username
    const userList = await client.users.getUserList({
      username: [username],
    });

    if (!userList || userList.data.length === 0) {
      return NextResponse.json(
        { error: `User with username ${username} not found in Clerk.` },
        { status: 404 }
      );
    }

    const clerkUserId = userList.data[0].id;

    // 2. Update their password in Clerk
    await client.users.updateUser(clerkUserId, {
      password: tempPassword,
    });

    // 3. Mark the request as approved in MongoDB
    request.status = "approved";
    await request.save();

    return NextResponse.json(
      { 
        message: "Password reset successful.",
        tempPassword: tempPassword 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error approving reset request:", error);
    return NextResponse.json(
      { error: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
