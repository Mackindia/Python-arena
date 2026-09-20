import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ResetRequest } from "../../../../src/models/ResetRequest";
import User from "../../../../src/models/User";
import { clerkClient } from "@clerk/nextjs/server";
import { requireAdminApi } from "@/lib/admin-api";
import { sanitizeError, escapeRegex } from "@/lib/security";
import crypto from "crypto";

function generateTempPassword(): string {
  return crypto.randomBytes(12).toString("base64url").substring(0, 16);
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdminApi();
    if (!auth.ok) return auth.response;

    const { requestId, username } = await req.json();

    if (!requestId || !username) {
      return NextResponse.json(
        { error: "Request ID and Username are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const request = await ResetRequest.findById(requestId);
    if (!request || request.status !== "pending") {
      return NextResponse.json(
        { error: "Invalid or already processed request" },
        { status: 400 }
      );
    }

    const tempPassword = generateTempPassword();

    const normalizedUsername = username.trim().toLowerCase().replace(/^s/, "").replace(/@doon$/, "");
    const escapedUsername = escapeRegex(normalizedUsername);

    const client = await clerkClient();
    const mongoUser = await User.findOne({ username: { $regex: new RegExp(`^s?${escapedUsername}$`, 'i') } });

    let clerkUserId: string | null = null;

    const userList = await client.users.getUserList({
      username: [username],
    });

    if (userList && userList.data.length > 0) {
      clerkUserId = userList.data[0].id;
    } else if (mongoUser?.email) {
      const emailList = await client.users.getUserList({
        emailAddress: [mongoUser.email],
      });
      if (emailList && emailList.data.length > 0) {
        clerkUserId = emailList.data[0].id;
      }
    }

    if (!clerkUserId) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    await client.users.updateUser(clerkUserId, {
      password: tempPassword,
    });

    await User.findOneAndUpdate(
      { username: { $regex: new RegExp(`^s?${escapedUsername}$`, 'i') } },
      { password: tempPassword }
    );

    request.status = "approved";
    await request.save();

    return NextResponse.json(
      {
        message: "Password reset successful.",
        tempPassword: tempPassword,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: sanitizeError(error) },
      { status: 500 }
    );
  }
}
