import { redirect } from "next/navigation";

import { getPool } from "@/adapters/db/client";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function LegacyLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/legacy");
  const isStaff = user.role === "teacher" || user.role === "admin";
  if (!isStaff) {
    const result = await getPool().query("SELECT enabled FROM legacy_student_visibility WHERE singleton=true");
    if (result.rows[0]?.enabled !== true) redirect("/dashboard");
  }
  return children;
}
