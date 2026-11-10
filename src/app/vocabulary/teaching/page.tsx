import { redirect } from "next/navigation";

import { VocabularyTeaching } from "@/components/vocabulary/vocabulary";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function VocabularyTeachingPage() {
  const user = await requireUser("/vocabulary/teaching");
  if (user.role !== "teacher" && user.role !== "admin") redirect("/vocabulary");
  return <VocabularyTeaching />;
}
