"use client";

import { useMemo, useState } from "react";
import AppModal from "@/components/ui/AppModal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

type UserRole = "admin" | "teacher" | "student";

type AdminUser = {
  _id: string;
  fullName: string;
  email: string;
  role: UserRole;
  studentClass: string;
  progress: number;
};

type AdminUsersClientProps = {
  users: AdminUser[];
  canEdit: boolean;
};

type SortField = "fullName" | "email" | "role" | "studentClass" | "progress";
type SortDirection = "asc" | "desc";

type EditFormState = {
  _id: string;
  email: string;
  role: UserRole;
  studentClass: string;
};

async function readErrorMessage(res: Response, fallback: string) {
  try {
    const data = await res.json();

    if (data && typeof data.error === "string" && data.error.trim()) {
      return data.error;
    }
  } catch {
    // Ignore JSON parse errors and fall back below.
  }

  return fallback;
}

export default function AdminUsersClient({ users: initialUsers, canEdit }: AdminUsersClientProps) {
  const [users, setUsers] = useState(initialUsers);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<EditFormState | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [classFilter, setClassFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("fullName");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const editingUser = users.find((user) => user._id === editingUserId) ?? null;
  const availableClasses = useMemo(() => {
    return Array.from(
      new Set(users.map((user) => user.studentClass).filter(Boolean)),
    ).sort((left, right) => left.localeCompare(right));
  }, [users]);

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch = !query ||
        user.fullName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query);
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesClass = classFilter === "all" || user.studentClass === classFilter;

      return matchesSearch && matchesRole && matchesClass;
    });
  }, [users, searchTerm, roleFilter, classFilter]);

  const sortedUsers = useMemo(() => {
    const collator = new Intl.Collator(undefined, { sensitivity: "base", numeric: true });
    const direction = sortDirection === "asc" ? 1 : -1;

    return [...filteredUsers].sort((left, right) => {
      if (sortField === "progress") {
        return ((left.progress ?? 0) - (right.progress ?? 0)) * direction;
      }

      return collator.compare(left[sortField] ?? "", right[sortField] ?? "") * direction;
    });
  }, [filteredUsers, sortDirection, sortField]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection((current) => current === "asc" ? "desc" : "asc");
      return;
    }

    setSortField(field);
    setSortDirection(field === "progress" ? "desc" : "asc");
  }

  function getSortLabel(field: SortField) {
    if (sortField !== field) {
      return "";
    }

    return sortDirection === "asc" ? " ▲" : " ▼";
  }

  function openEdit(user: AdminUser) {
    setEditingUserId(user._id);
    setForm({
      _id: user._id,
      email: user.email,
      role: user.role,
      studentClass: user.studentClass,
    });
  }

  function closeEdit() {
    if (isSaving) {
      return;
    }

    setEditingUserId(null);
    setForm(null);
  }

  async function handleSave() {
    if (!form) {
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch(`/api/admin/users/${form._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email,
          role: form.role,
          studentClass: form.studentClass,
        }),
      });

      if (!res.ok) {
        const message = await readErrorMessage(res, "Failed to update user");
        throw new Error(message);
      }

      const data = (await res.json()) as { user: AdminUser };

      setUsers((current) =>
        current.map((user) => (user._id === data.user._id ? data.user : user)),
      );
      setEditingUserId(null);
      setForm(null);
      toast.success("User updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update user.");
      console.error("Update user error:", error);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Student Management</h1>
      <p className="mt-2 text-sm text-slate-300">Search, monitor progress, and review activity.</p>

      <div className="mt-5 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Search users
          </label>
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by name or email"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Role
          </label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-white"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value as "all" | UserRole)}
          >
            <option value="all">All roles</option>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Class
          </label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-white"
            value={classFilter}
            onChange={(event) => setClassFilter(event.target.value)}
          >
            <option value="all">All classes</option>
            {availableClasses.map((studentClass) => (
              <option key={studentClass} value={studentClass}>
                {studentClass}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm text-slate-400">
        <p>
          Showing {sortedUsers.length} of {users.length} users
        </p>
        {(searchTerm || roleFilter !== "all" || classFilter !== "all") ? (
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setRoleFilter("all");
              setClassFilter("all");
            }}
            className="rounded-md px-2 py-1 text-cyan-200 hover:bg-white/5"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/5 text-slate-300">
            <tr>
              <th className="px-4 py-3">
                <button type="button" className="font-medium hover:text-white" onClick={() => handleSort("fullName")}>
                  Name{getSortLabel("fullName")}
                </button>
              </th>
              <th className="px-4 py-3">
                <button type="button" className="font-medium hover:text-white" onClick={() => handleSort("email")}>
                  Email{getSortLabel("email")}
                </button>
              </th>
              <th className="px-4 py-3">
                <button type="button" className="font-medium hover:text-white" onClick={() => handleSort("role")}>
                  Role{getSortLabel("role")}
                </button>
              </th>
              <th className="px-4 py-3">
                <button type="button" className="font-medium hover:text-white" onClick={() => handleSort("studentClass")}>
                  Class{getSortLabel("studentClass")}
                </button>
              </th>
              <th className="px-4 py-3">
                <button type="button" className="font-medium hover:text-white" onClick={() => handleSort("progress")}>
                  Progress{getSortLabel("progress")}
                </button>
              </th>
              {canEdit ? <th className="px-4 py-3 text-right">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {sortedUsers.map((user) => (
              <tr key={user._id} className="border-t border-white/10">
                <td className="px-4 py-3">{user.fullName}</td>
                <td className="px-4 py-3 text-slate-300">{user.email}</td>
                <td className="px-4 py-3 capitalize">{user.role}</td>
                <td className="px-4 py-3">{user.studentClass}</td>
                <td className="px-4 py-3">{user.progress ?? 0}%</td>
                {canEdit ? (
                  <td className="px-4 py-3 text-right">
                    <Button variant="outline" size="sm" onClick={() => openEdit(user)}>
                      Edit
                    </Button>
                  </td>
                ) : null}
              </tr>
            ))}
            {sortedUsers.length === 0 ? (
              <tr className="border-t border-white/10">
                <td className="px-4 py-6 text-center text-slate-400" colSpan={canEdit ? 6 : 5}>
                  No users match the current search and filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <AppModal
        open={Boolean(canEdit && form && editingUser)}
        title={editingUser ? `Edit ${editingUser.fullName}` : "Edit user"}
        onClose={closeEdit}
      >
        {form ? (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-200">Email address</label>
              <Input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => current ? { ...current, email: event.target.value } : current)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-200">Role</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-white"
                value={form.role}
                onChange={(event) => setForm((current) => current ? { ...current, role: event.target.value as UserRole } : current)}
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-200">Class</label>
              <Input
                value={form.studentClass}
                onChange={(event) => setForm((current) => current ? { ...current, studentClass: event.target.value } : current)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={closeEdit} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </div>
        ) : null}
      </AppModal>
    </div>
  );
}