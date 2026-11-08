import { redirect } from "next/navigation";

import { listManagedResources } from "@protefl/adapters/postgres-resources";
import { ResourceManager } from "@/components/test-center/resources";
import { requireUser } from "@/lib/session";
import "@/components/test-center/resources.css";

export const dynamic = "force-dynamic";

export default async function TeachingWorkspacePage() {
  const user = await requireUser("/test-center/teaching");
  if (user.role !== "teacher" && user.role !== "admin") redirect("/test-center");
  return <ResourceManager resources={await listManagedResources()} />;
}
