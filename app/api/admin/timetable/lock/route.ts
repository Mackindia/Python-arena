import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdminApi } from "@/lib/admin-api";
import { TimetableLock } from "@/src/models/Timetable";

export const runtime = "nodejs";

/**
 * GET /api/admin/timetable/lock
 * Returns current lock/freeze status
 */
export async function GET() {
  try {
    const access = await requireAdminApi();
    if (!access.ok) {
      return access.response;
    }

    await connectDB();

    let lock = await TimetableLock.findOne({ key: "global" }).lean();
    if (!lock) {
      // Create default FROZEN lock (safe default)
      lock = await TimetableLock.create({ 
        key: "global", 
        isLocked: true,
        status: "frozen",
        frozenAt: new Date(),
        frozenBy: "system-default"
      });
    }

    const lockDoc = lock as { 
      isLocked?: boolean; 
      status?: string;
      frozenAt?: Date;
      frozenBy?: string;
      version?: number;
    };

    return NextResponse.json({ 
      isLocked: lockDoc.isLocked ?? true,
      status: lockDoc.status ?? "frozen",
      frozenAt: lockDoc.frozenAt,
      frozenBy: lockDoc.frozenBy,
      version: lockDoc.version ?? 1,
    });
  } catch (error) {
    console.error("Error fetching timetable lock:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/timetable/lock
 * Freeze or unfreeze the timetable
 * 
 * Body: { action: "freeze" | "unfreeze", password?: string }
 */
export async function POST(request: Request) {
  try {
    const access = await requireAdminApi();
    if (!access.ok) {
      return access.response;
    }

    const body = await request.json();
    const { action, password } = body;

    await connectDB();

    // Get current lock state
    let lock = await TimetableLock.findOne({ key: "global" });
    if (!lock) {
      lock = await TimetableLock.create({ 
        key: "global", 
        isLocked: true,
        status: "frozen",
        frozenAt: new Date(),
        frozenBy: "system"
      });
    }

    // FREEZE: Always allowed
    if (action === "freeze") {
      lock.status = "frozen";
      lock.isLocked = true;
      lock.frozenAt = new Date();
      lock.frozenBy = access.userId || "admin";
      lock.unfrozenAt = null;
      lock.unfrozenBy = null;
      lock.version = (lock.version || 0) + 1;
      lock.lastModified = new Date();
      await lock.save();

      return NextResponse.json({ 
        success: true,
        status: "frozen",
        isLocked: true,
        message: "Timetable is now FROZEN. No changes allowed.",
        frozenAt: lock.frozenAt,
        version: lock.version,
      });
    }

    // UNFREEZE: Requires password
    if (action === "unfreeze") {
      // Check password (set TIMETABLE_UNFREEZE_PASSWORD in .env)
      const unfreezePassword = process.env.TIMETABLE_UNFREEZE_PASSWORD;
      
      if (!unfreezePassword) {
        return NextResponse.json(
          { error: "Unfreeze password not configured. Set TIMETABLE_UNFREEZE_PASSWORD in .env" },
          { status: 500 }
        );
      }

      if (!password || password !== unfreezePassword) {
        return NextResponse.json(
          { error: "Invalid password. Cannot unfreeze timetable." },
          { status: 403 }
        );
      }

      lock.status = "draft";
      lock.isLocked = false;
      lock.unfrozenAt = new Date();
      lock.unfrozenBy = access.userId || "admin";
      lock.version = (lock.version || 0) + 1;
      lock.lastModified = new Date();
      await lock.save();

      return NextResponse.json({ 
        success: true,
        status: "draft",
        isLocked: false,
        message: "Timetable is now in DRAFT mode. You can make changes.",
        unfrozenAt: lock.unfrozenAt,
        version: lock.version,
      });
    }

    // Legacy: Direct isLocked toggle (for backward compatibility)
    if (body.isLocked !== undefined) {
      const isLocked = Boolean(body.isLocked);
      lock.isLocked = isLocked;
      lock.status = isLocked ? "frozen" : "draft";
      if (isLocked) {
        lock.frozenAt = new Date();
        lock.frozenBy = access.userId || "admin";
      } else {
        lock.unfrozenAt = new Date();
        lock.unfrozenBy = access.userId || "admin";
      }
      lock.version = (lock.version || 0) + 1;
      lock.lastModified = new Date();
      await lock.save();

      return NextResponse.json({ 
        success: true,
        status: lock.status,
        isLocked: lock.isLocked,
        version: lock.version,
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'freeze' or 'unfreeze'." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating timetable lock:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
