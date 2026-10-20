import { WorkshopLearner } from "@/components/workshop/workshop";

export default async function WorkshopJoinPage({ searchParams }: { searchParams: Promise<{ pin?: string }> }) {
  const query = await searchParams;
  return <WorkshopLearner initialPin={query.pin ?? ""} />;
}

