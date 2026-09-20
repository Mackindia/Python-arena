import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "../../../../lib/mongodb";
import User from "../../../../models/User";
import { sanitizeError, escapeRegex } from "../../../../lib/security";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    const sanitizedUsername = username.trim().toLowerCase();
    const sanitizedPassword = password.trim();

    const coreId = sanitizedUsername.startsWith('s') ? sanitizedUsername.substring(1) : sanitizedUsername;

    const escapedCoreId = escapeRegex(coreId);
    const allMatchingUsers = await User.find({
      username: { $regex: new RegExp(`^s?${escapedCoreId}$`, 'i') }
    }).select("+password").lean();

    const validUser = allMatchingUsers.find(u => {
      const uName = (u.username || "").toLowerCase();
      return uName === coreId || uName === `s${coreId}`;
    });

    if (!validUser || !validUser.password) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    const bcrypt = await import("bcrypt");
    const passwordMatch = await bcrypt.compare(sanitizedPassword, validUser.password);
    const passwordMatchDoon = await bcrypt.compare(`${sanitizedPassword}@doon`, validUser.password);

    if (!passwordMatch && !passwordMatchDoon) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    if (validUser.is_active === false) {
      return NextResponse.json({ error: "User account is inactive" }, { status: 403 });
    }

    const cookieStore = await cookies();
    const SESSION_SECRET = process.env.SESSION_SECRET || "doon-scholars-default-secret-change-in-production";
    const sessionToken = Buffer.from(JSON.stringify({
      uid: validUser._id.toString(),
      ts: Date.now(),
    })).toString("base64");
    const signature = await import("crypto").then(c =>
      c.createHmac("sha256", SESSION_SECRET).update(sessionToken).digest("hex")
    );
    const signedToken = `${sessionToken}.${signature}`;

    cookieStore.set("local_user_id", signedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return NextResponse.json({
      success: true,
      user: {
        id: validUser._id,
        fullName: validUser.fullName || validUser.username,
        role: validUser.role,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: sanitizeError(error) }, { status: 500 });
  }
}
