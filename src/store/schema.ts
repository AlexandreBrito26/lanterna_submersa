import { z } from "zod";

export const PhaseId = z.enum(["cais", "biblioteca", "jardins", "armazem", "porao", "recife", "oficina", "espelhos", "catedral", "sinos", "observatorio", "eclusa", "torre", "mangue", "teatro", "bombas", "rede", "mare", "vento", "abismo", "coracao", "eco", "cardume", "coral", "neblina", "alavancas", "memoria", "perolas", "setas", "dominos", "palavras", "final2", "silencio", "contagem", "fio", "pedra", "breu", "chama", "vela", "forja", "molhada", "brasa", "arca", "muralha", "ganchos", "fechadura", "selos", "escalada", "encaixe", "sementes", "alternado", "pontes", "trilha", "sombra", "luar", "ar", "chaves", "viciosa", "vapor", "aquecida", "anel", "fosforo", "tanques", "simetria", "prateleiras", "trilhos", "torrecaixas"]);
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
