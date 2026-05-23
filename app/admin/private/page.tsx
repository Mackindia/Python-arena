import { requireRolePage } from "@/lib/rbac";
import PrivateNotesClient from "@/src/components/admin/PrivateNotesClient";

export default async function PrivateNotesPage() {
  await requireRolePage(["admin"]);

  return <PrivateNotesClient />;
}