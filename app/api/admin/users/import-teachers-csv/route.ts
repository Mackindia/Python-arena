import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { connectDB } from "../../../../../lib/mongodb";
import User from "../../../../../models/User";
import Timetable from "../../../../../models/Timetable";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let curr = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        curr += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === "," && !inQuotes) {
      out.push(curr.trim());
      curr = "";
      continue;
    }

    curr += ch;
  }

  out.push(curr.trim());
  return out;
}

function normalizeTeacherId(raw: string): string {
  return raw.trim().toUpperCase();
}

function buildBaseTeacherId(fullName: string): string {
  const words = fullName
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.toUpperCase());

  if (words.length >= 2) {
    return `${words[0][0] || ""}${words[1][0] || ""}`.slice(0, 6);
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).padEnd(2, "X");
  }

  return "TX";
}

function makeUniqueTeacherId(base: string, used: Set<string>) {
  const cleanBase = normalizeTeacherId(base).replace(/[^A-Z0-9]/g, "").slice(0, 6) || "TX";
  if (!used.has(cleanBase)) {
    used.add(cleanBase);
    return cleanBase;
  }

  for (let i = 2; i <= 999; i += 1) {
    const suffix = String(i);
    const candidate = `${cleanBase}${suffix}`.slice(0, 6);
    if (!used.has(candidate)) {
      used.add(candidate);
      return candidate;
    }
  }

  // Last fallback
  let fallback = cleanBase;
  while (used.has(fallback)) {
    fallback = `T${Math.random().toString(36).slice(2, 6).toUpperCase()}`.slice(0, 6);
  }
  used.add(fallback);
  return fallback;
}

async function isAdmin() {
  await connectDB();

  const { userId } = await auth();
  if (userId) {
    const user = await User.findOne({ clerkId: userId });
    return user?.role === "admin" || user?.role === "super_admin";
  }

  const cookieStore = await cookies();
  const localUserId = cookieStore.get("local_user_id")?.value;
  if (localUserId) {
    const user = await User.findById(localUserId);
    return user?.role === "admin" || user?.role === "super_admin";
  }

  return false;
}

export async function POST(req: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json().catch(() => ({}));
    const fileName = typeof body.fileName === "string" && body.fileName.trim()
      ? body.fileName.trim()
      : "teachers id and passwords.csv";

    const csvPath = path.join(process.cwd(), fileName);
    if (!fs.existsSync(csvPath)) {
      return NextResponse.json({ error: `CSV file not found: ${fileName}` }, { status: 404 });
    }

    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const lines = csvContent
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      return NextResponse.json({ error: "CSV is empty or missing data rows." }, { status: 400 });
    }

    const header = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
    const nameIdx = header.findIndex((h) => h === "name");
    const usernameIdx = header.findIndex((h) => h === "username" || h === "user" || h === "userid");
    const passwordIdx = header.findIndex((h) => h === "password" || h === "pass");

    if (nameIdx < 0 || usernameIdx < 0 || passwordIdx < 0) {
      return NextResponse.json(
        { error: "CSV must include Name, Username, Password columns." },
        { status: 400 }
      );
    }

    const existingUsers = await User.find({}, { username: 1, teacher_id: 1 }).lean();
    const usedTeacherIds = new Set(
      existingUsers
        .map((u: any) => String(u.teacher_id || "").trim().toUpperCase())
        .filter(Boolean)
    );

    const existingUsernames = new Set(
      existingUsers
        .map((u: any) => String(u.username || "").trim().toLowerCase())
        .filter(Boolean)
    );

    const created: any[] = [];
    const skipped: any[] = [];
    const failed: any[] = [];

    for (let i = 1; i < lines.length; i += 1) {
      const cols = splitCsvLine(lines[i]);
      const fullName = String(cols[nameIdx] || "").trim();
      const username = String(cols[usernameIdx] || "").trim();
      const password = String(cols[passwordIdx] || "").trim();
      const rowNo = i + 1;

      if (!fullName || !username || !password) {
        skipped.push({ row: rowNo, reason: "Missing name/username/password" });
        continue;
      }

      if (existingUsernames.has(username.toLowerCase())) {
        skipped.push({ row: rowNo, username, reason: "Username already exists" });
        continue;
      }

      const teacherId = makeUniqueTeacherId(buildBaseTeacherId(fullName), usedTeacherIds);

      let clerkId = "";
      let clerkSyncError = "";

      try {
        const { clerkClient } = await import("@clerk/nextjs/server");
        const client = typeof clerkClient === "function" ? await clerkClient() : clerkClient;

        const parts = fullName.split(/\s+/).filter(Boolean);
        const firstName = parts[0] || "Teacher";
        const lastName = parts.length > 1 ? parts.slice(1).join(" ") : undefined;

        const newClerkUser = await client.users.createUser({
          firstName,
          lastName,
          username,
          emailAddress: [`${username.replace(/[^a-zA-Z0-9._-]/g, "") || username}@doonscholars.com`],
          password,
          publicMetadata: { role: "teacher" },
          skipPasswordChecks: true,
        });

        clerkId = newClerkUser.id;
      } catch (err: any) {
        clerkSyncError = err?.errors?.[0]?.message || err?.message || "Clerk create failed";
      }

      try {
        const newUser = await User.create({
          clerkId,
          fullName,
          username,
          password,
          role: "teacher",
          group: "MAIN",
          teacher_id: teacherId,
          is_active: true,
        });

        await Timetable.updateMany(
          { teacher_id: new RegExp(`^${teacherId}$`, "i") },
          { $set: { teacher_name: fullName } }
        );

        created.push({
          row: rowNo,
          id: String(newUser._id),
          username,
          fullName,
          teacher_id: teacherId,
          clerkSynced: Boolean(clerkId),
          clerkError: clerkSyncError || undefined,
        });

        existingUsernames.add(username.toLowerCase());
      } catch (dbErr: any) {
        failed.push({ row: rowNo, username, reason: dbErr?.message || "Failed to create user" });
      }
    }

    return NextResponse.json({
      success: true,
      fileName,
      totalRows: lines.length - 1,
      createdCount: created.length,
      skippedCount: skipped.length,
      failedCount: failed.length,
      created,
      skipped,
      failed,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
