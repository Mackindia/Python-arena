import { Metadata } from "next";
import AdminSidebar from "@/components/admin/AdminSidebar";
import "./admin-layout.css";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Admin panel for managing lessons and courses",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}
