import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getRequestUserContext } from "@/lib/rbac";
import Program from "@/models/Program";
import PythonProgram from "@/src/models/PythonProgram";
import User from "@/models/User";

const ALLOWED_ROLES = ["super_admin", "admin"];

async function verifyAdmin() {
  const ctx = await getRequestUserContext();
  if (!ctx.userId || !ALLOWED_ROLES.includes(ctx.role)) {
    return null;
  }
  return ctx;
}

// GET — fetch ALL programs across ALL users, grouped by user
export async function GET(req: NextRequest) {
  try {
    const ctx = await verifyAdmin();
    if (!ctx) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const filterUserId = searchParams.get("userId");
    const filterType = searchParams.get("type"); // "web" | "python" | null (both)
    const searchQuery = searchParams.get("q");
    const sortBy = searchParams.get("sort") || "highest_usage"; // "highest_usage" | "lowest_usage" | "most_programs"

    // Build query filters
    const webQuery: Record<string, unknown> = {};
    const pythonQuery: Record<string, unknown> = {};

    if (filterUserId) {
      webQuery.userId = filterUserId;
      pythonQuery.userId = filterUserId;
    }

    if (searchQuery) {
      const regex = { $regex: searchQuery, $options: "i" };
      webQuery.title = regex;
      pythonQuery.title = regex;
    }

    // Fetch programs based on type filter
    let webPrograms: Array<Record<string, unknown>> = [];
    let pythonPrograms: Array<Record<string, unknown>> = [];

    if (!filterType || filterType === "web") {
      webPrograms = await Program.find(webQuery)
        .sort({ updatedAt: -1 })
        .lean();
    }

    if (!filterType || filterType === "python") {
      pythonPrograms = await PythonProgram.find(pythonQuery)
        .sort({ updatedAt: -1 })
        .lean();
    }

    // Collect unique userIds
    const userIds = new Set<string>();
    webPrograms.forEach((p) => userIds.add(p.userId as string));
    pythonPrograms.forEach((p) => userIds.add(p.userId as string));

    // Fetch user details
    const users = await User.find({
      clerkId: { $in: Array.from(userIds) },
    })
      .select("clerkId fullName email studentClass role image")
      .lean();

    const userMap = new Map<string, Record<string, unknown>>();
    users.forEach((u) => {
      userMap.set(u.clerkId, u);
    });

    // Group programs by user
    const userFolders: Record<
      string,
      {
        user: Record<string, unknown> | { clerkId: string; fullName: string; email: string };
        webPrograms: Array<Record<string, unknown>>;
        pythonPrograms: Array<Record<string, unknown>>;
        totalPrograms: number;
        totalSizeBytes: number;
      }
    > = {};

    const addToFolder = (
      program: Record<string, unknown>,
      type: "web" | "python"
    ) => {
      const uid = program.userId as string;
      
      // Calculate size
      let size = 0;
      if (type === "web") {
        size += (program.htmlCode as string || "").length;
        size += (program.cssCode as string || "").length;
        size += (program.jsCode as string || "").length;
      } else {
        size += (program.pythonCode as string || "").length;
      }
      program.sizeBytes = size;

      if (!userFolders[uid]) {
        userFolders[uid] = {
          user: userMap.get(uid) || {
            clerkId: uid,
            fullName: "Unknown User",
            email: "",
          },
          webPrograms: [],
          pythonPrograms: [],
          totalPrograms: 0,
          totalSizeBytes: 0,
        };
      }
      if (type === "web") {
        userFolders[uid].webPrograms.push(program);
      } else {
        userFolders[uid].pythonPrograms.push(program);
      }
      userFolders[uid].totalPrograms++;
      userFolders[uid].totalSizeBytes += size;
    };

    webPrograms.forEach((p) => addToFolder(p, "web"));
    pythonPrograms.forEach((p) => addToFolder(p, "python"));

    // Sort folders based on requested sort parameter
    const sortedFolders = Object.values(userFolders).sort((a, b) => {
      if (sortBy === "lowest_usage") {
        return a.totalSizeBytes - b.totalSizeBytes;
      } else if (sortBy === "most_programs") {
        return b.totalPrograms - a.totalPrograms;
      } else {
        // default: highest_usage
        return b.totalSizeBytes - a.totalSizeBytes;
      }
    });

    return NextResponse.json(
      {
        folders: sortedFolders,
        stats: {
          totalUsers: sortedFolders.length,
          totalWebPrograms: webPrograms.length,
          totalPythonPrograms: pythonPrograms.length,
          totalPrograms: webPrograms.length + pythonPrograms.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin programs fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch programs" },
      { status: 500 }
    );
  }
}

// DELETE — delete any program by ID
export async function DELETE(req: NextRequest) {
  try {
    const ctx = await verifyAdmin();
    if (!ctx) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const { id, type, deleteAll, userId } = await req.json();

    // Bulk delete — remove ALL programs of a specific user
    if (deleteAll && userId) {
      const [webResult, pythonResult] = await Promise.all([
        Program.deleteMany({ userId }),
        PythonProgram.deleteMany({ userId }),
      ]);
      return NextResponse.json(
        {
          message: "All programs deleted for user",
          deletedWeb: webResult.deletedCount,
          deletedPython: pythonResult.deletedCount,
        },
        { status: 200 }
      );
    }

    // Single delete
    if (!id || !type) {
      return NextResponse.json(
        { error: "Program ID and type are required" },
        { status: 400 }
      );
    }

    const Model = type === "python" ? PythonProgram : Program;
    const deleted = await Model.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Program not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Program deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin program delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete program" },
      { status: 500 }
    );
  }
}

// PUT — edit any program (title, code)
export async function PUT(req: NextRequest) {
  try {
    const ctx = await verifyAdmin();
    if (!ctx) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const { id, type, title, htmlCode, cssCode, jsCode, pythonCode } =
      await req.json();

    if (!id || !type) {
      return NextResponse.json(
        { error: "Program ID and type are required" },
        { status: 400 }
      );
    }

    if (type === "python") {
      const updated = await PythonProgram.findByIdAndUpdate(
        id,
        { ...(title && { title }), ...(pythonCode !== undefined && { pythonCode }) },
        { new: true }
      );
      if (!updated) {
        return NextResponse.json(
          { error: "Program not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ program: updated }, { status: 200 });
    }

    // Web program
    const updateData: Record<string, unknown> = {};
    if (title) updateData.title = title;
    if (htmlCode !== undefined) updateData.htmlCode = htmlCode;
    if (cssCode !== undefined) updateData.cssCode = cssCode;
    if (jsCode !== undefined) updateData.jsCode = jsCode;

    const updated = await Program.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Program not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ program: updated }, { status: 200 });
  } catch (error) {
    console.error("Admin program update error:", error);
    return NextResponse.json(
      { error: "Failed to update program" },
      { status: 500 }
    );
  }
}
