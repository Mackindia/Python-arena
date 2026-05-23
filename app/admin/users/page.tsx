"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GlassCard from "../../../components/ui/GlassCard";
import { Trash2, Edit, Plus, UserCheck, Shield, BookOpen, Video, LogOut } from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminChecked, setAdminChecked] = useState(false);
  const router = useRouter();

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [studentClass, setStudentClass] = useState("6");
  const [section, setSection] = useState("A");
  const [group, setGroup] = useState("MAIN");
  const [meetLink, setMeetLink] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Check admin status
  useEffect(() => {
    async function checkAdmin() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (!data.user || data.user.role !== "admin") {
          router.push("/online-class");
        } else {
          setAdminChecked(true);
          fetchUsers();
        }
      } catch (err) {
        router.push("/online-class");
      }
    }
    checkAdmin();
  }, [router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFullName("");
    setUsername("");
    setPassword("");
    setRole("student");
    setStudentClass("6");
    setSection("A");
    setGroup("MAIN");
    setMeetLink("");
    setTeacherId("");
    setIsActive(true);
    setErrorMessage("");
    setShowModal(true);
  };

  const handleOpenEdit = (user: any) => {
    setEditingUser(user);
    setFullName(user.fullName || "");
    setUsername(user.username || "");
    setPassword(user.password || "");
    setRole(user.role || "student");
    setStudentClass(user.class || user.studentClass || "6");
    setSection(user.section || "A");
    setGroup(user.group || "MAIN");
    setMeetLink(user.meet_link || "");
    setTeacherId(user.teacher_id || "");
    setIsActive(user.is_active !== false);
    setErrorMessage("");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const payload = {
      fullName,
      username,
      password,
      role,
      class: role === "student" ? studentClass : "",
      section: role === "student" ? section : "",
      group: role === "student" ? group : "MAIN",
      meet_link: role === "teacher" ? meetLink : "",
      teacher_id: role === "teacher" ? teacherId : "",
      is_active: isActive,
    };

    try {
      const url = editingUser 
        ? `/api/admin/users/${editingUser._id}` 
        : "/api/admin/users";
      const method = editingUser ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.error) {
        setErrorMessage(data.error);
      } else {
        setShowModal(false);
        fetchUsers();
      }
    } catch (err) {
      setErrorMessage("Request failed. Please try again.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchUsers();
      } else {
        alert("Delete failed");
      }
    } catch (err) {
      alert("Error deleting user");
    }
  };

  if (!adminChecked || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="animate-pulse text-lg font-semibold">Checking authorization...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white md:p-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              User Management
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Manage student, teacher, and administrator credentials and system access.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
          >
            <Plus className="h-4 w-4" />
            ADD USER
          </button>
        </div>

        <GlassCard className="overflow-hidden border border-slate-800 bg-slate-900/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Name / Username</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Details</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                      No users found. Create one by clicking the "Add User" button.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{u.fullName}</div>
                        <div className="text-xs text-slate-500">@{u.username || "clerk-sync"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          u.role === "admin" 
                            ? "bg-indigo-900/40 text-indigo-300 border border-indigo-800/50" 
                            : u.role === "teacher"
                            ? "bg-teal-900/40 text-teal-300 border border-teal-800/50"
                            : "bg-cyan-900/40 text-cyan-300 border border-cyan-800/50"
                        }`}>
                          {u.role === "admin" && <Shield className="h-3 w-3" />}
                          {u.role === "teacher" && <Video className="h-3 w-3" />}
                          {u.role === "student" && <BookOpen className="h-3 w-3" />}
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {u.role === "student" && (
                          <span>Class {u.class || u.studentClass} - {u.section || "N/A"} ({u.group || "MAIN"})</span>
                        )}
                        {u.role === "teacher" && (
                          <span className="truncate max-w-[200px] block" title={u.meet_link}>
                            {u.meet_link || "No Meet Link Assigned"}
                          </span>
                        )}
                        {u.role === "admin" && <span>Full System Access</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                          u.is_active !== false 
                            ? "bg-emerald-950 text-emerald-400" 
                            : "bg-rose-950 text-rose-400"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            u.is_active !== false ? "bg-emerald-400" : "bg-rose-400"
                          }`} />
                          {u.is_active !== false ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                            title="Edit User"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(u._id)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-500 transition"
                            title="Delete User"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h2 className="mb-4 text-xl font-bold text-white">
              {editingUser ? "Edit User Account" : "Create New User"}
            </h2>

            {errorMessage && (
              <div className="mb-4 rounded-lg bg-rose-950/50 border border-rose-800/50 p-3 text-xs text-rose-400">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-400">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Abhishek Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-400">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. abhishek6342"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-400">Password</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1234"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-400">System Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="student">student</option>
                  <option value="teacher">teacher</option>
                  <option value="admin">admin</option>
                </select>
              </div>

              {/* Conditional Fields based on Role */}
              {role === "student" && (
                <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-400">Class</label>
                    <input
                      type="text"
                      required
                      placeholder="6"
                      value={studentClass}
                      onChange={(e) => setStudentClass(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-400">Section</label>
                    <input
                      type="text"
                      required
                      placeholder="A"
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2 mt-2">
                    <label className="mb-1 block text-xs font-semibold text-slate-400">Group / Elective</label>
                    <select
                      value={group}
                      onChange={(e) => setGroup(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="MAIN">MAIN</option>
                      <option value="AI">AI</option>
                      <option value="FP">FP</option>
                      <option value="FL">FL</option>
                    </select>
                  </div>
                </div>
              )}

              {role === "teacher" && (
                <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                  <div className="col-span-2">
                    <label className="mb-1 block text-xs font-semibold text-slate-400">Google Meet URL</label>
                    <input
                      type="url"
                      required
                      placeholder="https://meet.google.com/abc-defg-hij"
                      value={meetLink}
                      onChange={(e) => setMeetLink(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="mb-1 block text-xs font-semibold text-slate-400">Timetable Teacher ID (Shortcode)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. AR, NM, SZ"
                      value={teacherId}
                      onChange={(e) => setTeacherId(e.target.value.toUpperCase())}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none uppercase"
                    />
                    <p className="mt-1 text-[10px] text-slate-500">This must EXACTLY match the Teacher Initials in the Timetable GUI.</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-cyan-600 focus:ring-cyan-500"
                />
                <label htmlFor="isActive" className="text-sm font-semibold text-slate-300">
                  Account is Active
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-800 px-4 py-2 text-sm font-bold text-slate-400 transition hover:bg-slate-850 hover:text-white"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                >
                  {editingUser ? "SAVE CHANGES" : "CREATE USER"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
