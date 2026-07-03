import { requireRolePage } from "@/lib/rbac";
import PrivateNotesClient from "@/src/components/admin/PrivateNotesClient";

export default async function PrivateNotesFullscreenPage() {
  await requireRolePage(["super_admin"]);

  return <PrivateNotesClient standalone />;
}
