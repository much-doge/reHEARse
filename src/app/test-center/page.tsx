import { AssignedResources } from "@/components/test-center/resources";
import { assignedResources } from "@protefl/adapters/postgres-resources";
import { requireUser } from "@/lib/session";
import "@/components/test-center/resources.css";

export const dynamic = "force-dynamic";

export default async function TestCenterHome() {
  const user = await requireUser("/test-center");
  const resources = await assignedResources(user.id);
  return <AssignedResources resources={resources} canManage={user.role === "teacher" || user.role === "admin"} />;
}
