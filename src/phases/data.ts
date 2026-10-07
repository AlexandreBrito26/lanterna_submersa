import type { PhaseId } from "../store/schema";

export type PhaseInfo = { id: PhaseId; titulo: string; resumo: string; pronta: boolean };

export const phases: PhaseInfo[] = [
  { id: "cais", titulo: "Cais Afundado", resumo: "Aprenda a andar na maré e a acender a lanterna.", pronta: true },
  { id: "biblioteca", titulo: "Biblioteca Alagada", resumo: "Reúna pistas e monte a história da cidade.", pronta: true },
  { id: "jardins", titulo: "Jardins de Coral", resumo: "Atravesse sem ser visto, com luz limitada.", pronta: true },
  { id: "catedral", titulo: "Catedral das Marés", resumo: "Use o ciclo da maré para abrir caminhos.", pronta: true },
  { id: "coracao", titulo: "Coração da Lanterna", resumo: "Enfrente o guardião e escolha o final.", pronta: true },
];
