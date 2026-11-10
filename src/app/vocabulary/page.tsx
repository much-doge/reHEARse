import { redirect } from "next/navigation";

import { VocabularyHome } from "@/components/vocabulary/vocabulary";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function VocabularyPage() {
  const user = await requireUser("/vocabulary");
  if (user.role !== "learner") redirect("/vocabulary/teaching");
  return <VocabularyHome />;
}
