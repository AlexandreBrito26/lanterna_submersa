import { z } from "zod";

export const PhaseId = z.enum(["cais", "biblioteca", "jardins", "catedral", "coracao"]);
export type PhaseId = z.infer<typeof PhaseId>;

export const SaveSchema = z.object({
  version: z.literal(1),
  current: PhaseId.nullable(),
  completed: z.array(PhaseId),
  inventory: z.array(z.string()),
});
export type Save = z.infer<typeof SaveSchema>;
