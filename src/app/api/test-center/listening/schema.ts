import { z } from "zod";

const common = {
  key: z.uuid(),
  attemptId: z.uuid(),
  revision: z.number().int().nonnegative(),
  itemId: z.uuid(),
};

export const listeningActionSchema = z.union([
  z.object({ kind: z.literal("start"), key: z.uuid(), mode: z.literal("full") }).strict(),
  z
    .object({
      kind: z.literal("start"),
      key: z.uuid(),
      mode: z.literal("remedial"),
      parentAttemptId: z.uuid(),
    })
    .strict(),
  z.object({ kind: z.literal("listen_start"), ...common }).strict(),
  z.object({ kind: z.literal("choose"), ...common, choice: z.enum(["A", "B", "C", "D"]) }).strict(),
  z.object({ kind: z.literal("timeout"), ...common }).strict(),
]);
