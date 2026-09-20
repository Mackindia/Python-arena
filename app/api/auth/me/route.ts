import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "../../../../lib/mongodb";
import User from "../../../../models/User";
import { auth } from "@clerk/nextjs/server";
import { sanitizeError } from "@/lib/security";
import crypto from "crypto";

const SESSION_SECRET = process.env.SESSION_SECRET || "doon-scholars-default-secret-change-in-production";

async function verifySignedCookie(signedToken: string): Promise<string | null> {
  try {
    const lastDot = signedToken.lastIndexOf(".");
    if (lastDot === -1) return null;
    const token = signedToken.substring(0, lastDot);
    const signature = signedToken.substring(lastDot + 1);
    const expectedSignature = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(token)
      .digest("hex");
    if (signature !== expectedSignature) return null;
    const payload = JSON.parse(Buffer.from(token, "base64").toString());
    if (Date.now() - payload.ts > 7 * 24 * 60 * 60 * 1000) return null;
    return payload.uid;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const signedToken = cookieStore.get("local_user_id")?.value;

    let user = null;
    await connectDB();

    if (signedToken) {
      const localUserId = await verifySignedCookie(signedToken);
      if (localUserId) {
        user = await User.findById(localUserId).lean();
      }
    }

    if (!user) {
      const { userId } = await auth();
      if (userId) {
        user = await User.findOne({ clerkId: userId }).lean();

        if (!user) {
          const { currentUser } = await import("@clerk/nextjs/server");
          const clerkUser = await currentUser();

          if (clerkUser) {
            const email = clerkUser.emailAddresses?.[0]?.emailAddress?.toLowerCase();

            if (email) {
              user = await User.findOne({ email }).lean();

              if (user) {
                await User.updateOne({ _id: user._id }, { $set: { clerkId: userId } });
                user.clerkId = userId;
              } else if (process.env.SUPER_ADMIN_EMAIL && email === process.env.SUPER_ADMIN_EMAIL.toLowerCase()) {
                const newAdmin = await User.create({
                  clerkId: userId,
                  email: email,
                  fullName: "Super Admin",
                  username: "superadmin",
                  role: "admin",
                  is_active: true,
                });
                user = newAdmin.toObject();
              }
            }
          }
        }
      }
    }

    if (!user) {
      return NextResponse.json({ user: null });
    }

    let assignedRole = user.role;
    if (process.env.SUPER_ADMIN_EMAIL && user.email?.toLowerCase() === process.env.SUPER_ADMIN_EMAIL.toLowerCase()) {
      assignedRole = "super_admin";
    }

    return NextResponse.json({
      user: {
        id: user._id,
        fullName: user.fullName || user.username,
        username: user.username,
        role: assignedRole,
        class: user.class || user.studentClass,
        section: user.section,
        meet_link: user.meet_link,
        isClerk: !!user.clerkId,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json({ user: null, error: "Failed to load user" });
  }
}
