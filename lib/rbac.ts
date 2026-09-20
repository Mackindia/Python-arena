import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { cookies } from "next/headers";
import crypto from "crypto";

export type AppRole = "super_admin" | "admin" | "teacher" | "student";

export const ADMIN_PANEL_ROLES: AppRole[] = ["super_admin", "admin", "teacher"];

const SESSION_SECRET = process.env.SESSION_SECRET || "doon-scholars-default-secret-change-in-production";

function normalizeRole(value: unknown): AppRole {
  if (value === "super_admin" || value === "admin" || value === "teacher") {
    return value as AppRole;
  }
  return "student";
}

export function hasAllowedRole(role: AppRole, allowedRoles: AppRole[]) {
  return allowedRoles.includes(role);
}

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

export async function getRequestUserContext() {
  const { userId } = await auth();

  if (!userId) {
    try {
      const cookieStore = await cookies();
      const signedToken = cookieStore.get("local_user_id")?.value;
      if (signedToken) {
        const localUserId = await verifySignedCookie(signedToken);
        if (localUserId) {
          await connectDB();
          const dbUser = await User.findById(localUserId).lean();
          if (dbUser) {
            const dbRole = normalizeRole(dbUser.role);
            let role = dbRole;
            let email = dbUser.email || "";
            if (process.env.SUPER_ADMIN_EMAIL && email.toLowerCase() === process.env.SUPER_ADMIN_EMAIL.toLowerCase()) {
              role = "super_admin";
            }
            return {
              userId: null,
              role,
              email,
              dbUser,
            };
          }
        }
      }
    } catch (cookieErr) {
      console.error("Local session cookie check failed");
    }
    return { userId: null, role: "student" as AppRole, email: "", dbUser: null };
  }

  const clerkUser = await currentUser();

  let dbUser: Awaited<ReturnType<typeof User.findOne>> | null = null;

  try {
    await connectDB();
    dbUser = await User.findOne({ clerkId: userId }).lean();
  } catch (error) {
    console.error("RBAC DB fallback enabled");
  }

  const metadataRole = normalizeRole(clerkUser?.publicMetadata?.role);
  const dbRole = normalizeRole(dbUser?.role);

  let role = dbUser ? dbRole : metadataRole;

  let email = "";
  if (clerkUser) {
    const primaryId = clerkUser.primaryEmailAddressId;
    const primaryEmailObj = clerkUser.emailAddresses?.find(e => e.id === primaryId);
    email = primaryEmailObj?.emailAddress || clerkUser.emailAddresses?.[0]?.emailAddress || "";
  }
  if (!email && dbUser) {
    email = dbUser.email || "";
  }

  if (process.env.SUPER_ADMIN_EMAIL && email.toLowerCase() === process.env.SUPER_ADMIN_EMAIL.toLowerCase()) {
    role = "super_admin";
  }

  return {
    userId,
    role,
    email,
    dbUser,
  };
}

export async function requireRolePage(allowedRoles: AppRole[]) {
  const ctx = await getRequestUserContext();

  if (!ctx.userId) {
    redirect("/sign-in");
  }

  if (!hasAllowedRole(ctx.role, allowedRoles)) {
    redirect("/dashboard");
  }

  return ctx;
}
