import { z } from "zod";

export const PhaseId = z.enum(["cais", "biblioteca", "jardins", "armazem", "recife", "oficina", "catedral", "sinos", "observatorio", "abismo", "coracao"]);
export type PhaseId = z.infer<typeof PhaseId>;

export const SaveSchema = z.object({
  version: z.literal(2),
  current: PhaseId.nullable(),
  completed: z.array(PhaseId),
  inventory: z.array(z.string()),
  estrelas: z.record(z.number().int().min(0).max(3)),
  melhorTempo: z.record(z.number().nonnegative()),
  conquistas: z.array(z.string()).default([]),
  recordeInfinito: z.number().nonnegative().default(0),
});
export type Save = z.infer<typeof SaveSchema>;

// Save antigo (v1) é migrado sem perder progresso
export const SaveV1Schema = z.object({
  version: z.literal(1),
  current: PhaseId.nullable(),
  completed: z.array(PhaseId),
  inventory: z.array(z.string()),
});
