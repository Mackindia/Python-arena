import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export type AppRole = "admin" | "teacher" | "student";

export const ADMIN_PANEL_ROLES: AppRole[] = ["admin", "teacher"];

function normalizeRole(value: unknown): AppRole {
  if (value === "admin" || value === "teacher") {
    return value;
  }
  return "student";
}

export function hasAllowedRole(role: AppRole, allowedRoles: AppRole[]) {
  return allowedRoles.includes(role);
}

export async function getRequestUserContext() {
  const { userId } = await auth();

  if (!userId) {
    return { userId: null, role: "student" as AppRole, email: "", dbUser: null };
  }

  const clerkUser = await currentUser();

  let dbUser: Awaited<ReturnType<typeof User.findOne>> | null = null;

  try {
    await connectDB();
    dbUser = await User.findOne({ clerkId: userId }).lean();
  } catch (error) {
    console.error("RBAC DB fallback enabled:", error);
  }

  const metadataRole = normalizeRole(clerkUser?.publicMetadata?.role);
  const dbRole = normalizeRole(dbUser?.role);

  const role = dbUser ? dbRole : metadataRole;
  const email = clerkUser?.primaryEmailAddress?.emailAddress ?? dbUser?.email ?? "";

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
