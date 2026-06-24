import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";

import { connectDB } from "../../lib/mongodb";

import User from "../../models/User";
import Period from "../../models/Period";
import Timetable from "../../models/Timetable";
import ActiveSession from "../../models/ActiveSession";

import StudentDashboard from "./StudentDashboard";
import TeacherDashboard from "./TeacherDashboard";
import AdminDashboard from "./AdminDashboard";

import Settings from "../../models/Settings";

const ONLINE_PERIODS = [1, 2, 3, 4, 5, 6];
const DEFAULT_ONLINE_PERIODS = [
  { period_no: 1, start_time: "08:15", end_time: "09:00" },
  { period_no: 2, start_time: "09:15", end_time: "10:00" },
  { period_no: 3, start_time: "10:15", end_time: "11:00" },
  { period_no: 4, start_time: "11:15", end_time: "12:00" },
  { period_no: 5, start_time: "12:15", end_time: "13:00" },
  { period_no: 6, start_time: "13:15", end_time: "14:00" },
];

function matchesCanonical(periods: any[]) {
  if (!Array.isArray(periods) || periods.length < DEFAULT_ONLINE_PERIODS.length) return false;

  for (const expected of DEFAULT_ONLINE_PERIODS) {
    const found = periods.find((p: any) => Number(p.period_no) === expected.period_no);
    if (!found) return false;
    if (String(found.start_time || "") !== expected.start_time) return false;
    if (String(found.end_time || "") !== expected.end_time) return false;
  }

  return true;
}

function parseTimeToMinutes(raw: string): number | null {
  if (!raw) return null;
  const value = raw.trim().toLowerCase();
  const m = value.match(/^(\d{1,2}):(\d{2})(?:\s*(am|pm))?$/i);
  if (!m) return null;

  let hours = Number(m[1]);
  const mins = Number(m[2]);
  const meridiem = m[3];

  if (Number.isNaN(hours) || Number.isNaN(mins)) return null;

  if (meridiem) {
    if (meridiem === "pm" && hours < 12) hours += 12;
    if (meridiem === "am" && hours === 12) hours = 0;
  }

  return hours * 60 + mins;
}

function getActivePeriodNo(periods: any[]): number | null {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  for (const period of periods) {
    const start = parseTimeToMinutes(period.start_time);
    const end = parseTimeToMinutes(period.end_time);
    if (start === null || end === null) continue;

    if (nowMinutes >= start && nowMinutes <= end) {
      return Number(period.period_no);
    }
  }

  return null;
}

export default async function OnlineClassPage() {
  await connectDB();

  let user = null;
  const { userId } = await auth();

  if (userId) {
    user = await User.findOne({ clerkId: userId });
  } else {
    const cookieStore = await cookies();
    const localUserId = cookieStore.get("local_user_id")?.value;
    if (localUserId) {
      user = await User.findById(localUserId);
    }
  }

  if (!user) {
    redirect("/sign-in");
  }

  const role = user.role || "student";

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayName = days[new Date().getDay()];

  // Check Global Online Class Window Settings
  const settingsDoc = await Settings.findOne({ key: "online_class_window" }).lean();
  const onlineSettings = settingsDoc ? settingsDoc.value : { isActive: true, startDate: "", endDate: "" };

  const todayDate = new Date().toISOString().split("T")[0];
  let isWindowActive = onlineSettings.isActive;
  
  if (isWindowActive && onlineSettings.startDate && todayDate < onlineSettings.startDate) {
    isWindowActive = false;
  }
  if (isWindowActive && onlineSettings.endDate && todayDate > onlineSettings.endDate) {
    isWindowActive = false;
  }

  // Fetch periods
  const periodsDoc = await Period.find({ period_no: { $in: ONLINE_PERIODS } }).sort({ period_no: 1 }).lean();
  const normalizedPeriods = periodsDoc.length > 0 && matchesCanonical(periodsDoc)
    ? periodsDoc
    : DEFAULT_ONLINE_PERIODS;
  const periods = JSON.parse(JSON.stringify(normalizedPeriods));
  const activePeriodNo = getActivePeriodNo(periods);

  // =========================
  // ADMIN
  // =========================
  if (role === "admin") {
    const liveSessionsDoc = await ActiveSession.find({ is_active: true }).lean();
    const liveSessions = JSON.parse(JSON.stringify(liveSessionsDoc));

    return <AdminDashboard liveSessions={liveSessions} settings={onlineSettings} />;
  }

  // =========================
  // TEACHER
  // =========================
  if (role === "teacher") {
    // Use the shortcode teacher_id (e.g., 'AR', 'NM') if available. Fallback to username.
    const teacherId = user.teacher_id || user.username || user.clerkId || user._id.toString();

    let timetableDoc: any[] = [];
    let activeSessionsDoc: any[] = [];

    if (isWindowActive) {
      timetableDoc = await Timetable.find({
        teacher_id: teacherId,
      })
        .sort({ day: 1, period_no: 1, class: 1, section: 1, subject: 1 })
        .lean();

      activeSessionsDoc = await ActiveSession.find({
        teacher_id: teacherId,
        is_active: true,
      }).lean();
    }

    const timetable = JSON.parse(JSON.stringify(timetableDoc));
    const activeSessions = JSON.parse(JSON.stringify(activeSessionsDoc));

    const teacher = {
      teacher_id: teacherId,
      teacher_name: user.fullName || user.username,
      meet_link: user.meet_link || "https://meet.google.com/test",
    };

    return (
      <TeacherDashboard
        timetable={timetable}
        activeSessions={activeSessions}
        periods={periods}
        teacher={teacher}
        todayName={todayName}
      />
    );
  }

  // =========================
  // STUDENT
  // =========================
  const rawClass = user.class || user.studentClass || "6";
  // Convert "Class 10" to "10" to ensure it matches the timetable format perfectly
  const normalizedClass = rawClass.replace(/class\s+/i, "").trim();
  const rawSection = user.section || "A";
  
  const classRegex = new RegExp(`^${normalizedClass}$`, "i");
  const sectionRegex = new RegExp(`^${rawSection}$`, "i");
  
  let timetableDoc: any[] = [];
  let activeSessionsDoc: any[] = [];

  if (isWindowActive) {
    timetableDoc = await Timetable.find({
      class: classRegex,
      section: sectionRegex,
      day: todayName,
    })
      .sort({ period_no: 1, subject: 1 })
      .lean();

    activeSessionsDoc = await ActiveSession.find({
      class: classRegex,
      section: sectionRegex,
      is_active: true,
    }).lean();
  }

  const timetable = JSON.parse(JSON.stringify(timetableDoc));
  const activeSessions = JSON.parse(JSON.stringify(activeSessionsDoc));

  return (
    <StudentDashboard
      timetable={timetable}
      activeSessions={activeSessions}
      periods={periods}
      userClass={normalizedClass}
      userSection={rawSection}
      userGroup={user.group || "MAIN"}
    />
  );
}