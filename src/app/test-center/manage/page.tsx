import { redirect } from "next/navigation";

import { listManagedResources } from "@protefl/adapters/postgres-resources";
import { ResourceManager } from "@/components/test-center/resources";
import { requireUser } from "@/lib/session";
import "@/components/test-center/resources.css";

export const dynamic = "force-dynamic";

export default async function ManageTestCenterPage() {
  const user = await requireUser("/test-center/manage");
  if (user.role !== "teacher" && user.role !== "admin") redirect("/test-center");
  const resources = await listManagedResources();
  return <ResourceManager resources={resources} />;
}
