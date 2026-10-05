import { ClassroomGame } from "@/components/classroom-game";
export default async function Play({
  searchParams,
}: {
  searchParams: Promise<{ pin?: string }>;
}) {
  const p = await searchParams;
  return <ClassroomGame initialPin={p.pin ?? ""} />;
}
