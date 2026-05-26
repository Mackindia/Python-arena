import { NextResponse } from "next/server";
import { ADMIN_PANEL_ROLES, getRequestUserContext, hasAllowedRole } from "@/lib/rbac";

export async function requireAdminApi() {
  const ctx = await getRequestUserContext();

  if (!ctx.userId) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!hasAllowedRole(ctx.role, ADMIN_PANEL_ROLES)) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: "Forbidden" }, { status: 403 }),
    };
  }

  return {
    ok: true as const,
    userId: ctx.userId,
    role: ctx.role,
    ctx,
  };
}

export async function requireSuperAdminApi() {
  const ctx = await getRequestUserContext();

  if (!ctx.userId) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }

  if (ctx.role !== "super_admin") {
    return {
      ok: false as const,
      response: NextResponse.json({ message: "Forbidden: Super Admin access required" }, { status: 403 }),
    };
  }

  return {
    ok: true as const,
    userId: ctx.userId,
    role: ctx.role,
    ctx,
  };
}
