import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export type AppRole = "super_admin" | "admin" | "teacher" | "student";

export const ADMIN_PANEL_ROLES: AppRole[] = ["super_admin", "admin", "teacher"];

function normalizeRole(value: unknown): AppRole {
  if (value === "super_admin" || value === "admin" || value === "teacher") {
    return value as AppRole;
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

  let role = dbUser ? dbRole : metadataRole;
  
  // Extract email properly depending on Clerk API version
  let email = "";
  if (clerkUser) {
    const primaryId = clerkUser.primaryEmailAddressId;
    const primaryEmailObj = clerkUser.emailAddresses?.find(e => e.id === primaryId);
    email = primaryEmailObj?.emailAddress || clerkUser.emailAddresses?.[0]?.emailAddress || "";
  }
  if (!email && dbUser) {
    email = dbUser.email || "";
  }

  // Assign super_admin explicitly to the owner
  if (email.toLowerCase() === "abhishekr474@gmail.com") {
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

