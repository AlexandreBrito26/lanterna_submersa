import type { PhaseId } from "../store/schema";

export type TipoVitoria = "exploracao" | "deducao" | "furtividade" | "coleta" | "sincronia" | "sobrevivencia" | "duelo";

export const tiposVitoria: Record<TipoVitoria, { nome: string; objetivo: string }> = {
  exploracao:    { nome: "Exploração",    objetivo: "Encontre a chave e abra a porta" },
  deducao:       { nome: "Dedução",       objetivo: "Ordene a história da cidade" },
  furtividade:   { nome: "Furtividade",   objetivo: "Chegue à saída sem ser visto" },
  coleta:        { nome: "Coleta",        objetivo: "Recolha todos os fragmentos antes do ar acabar" },
  sincronia:     { nome: "Sincronia",     objetivo: "Acione os mecanismos na maré certa" },
  sobrevivencia: { nome: "Sobrevivência", objetivo: "Resista até a corrente acalmar" },
  duelo:         { nome: "Duelo",         objetivo: "Repita o canto e escolha o final" },
};

export type PhaseInfo = { id: PhaseId; titulo: string; resumo: string; tipo: TipoVitoria; pronta: boolean };

export const phases: PhaseInfo[] = [
  { id: "cais", titulo: "Cais Afundado", resumo: "Aprenda a andar na maré e a acender a lanterna.", tipo: "exploracao", pronta: true },
  { id: "biblioteca", titulo: "Biblioteca Alagada", resumo: "Reúna pistas e monte a história da cidade.", tipo: "deducao", pronta: true },
  { id: "jardins", titulo: "Jardins de Coral", resumo: "Atravesse sem ser visto, com luz limitada.", tipo: "furtividade", pronta: true },
  { id: "recife", titulo: "Recife dos Naufrágios", resumo: "Recolha os fragmentos de luz antes que o ar acabe.", tipo: "coleta", pronta: true },
  { id: "catedral", titulo: "Catedral das Marés", resumo: "Use o ciclo da maré para abrir caminhos.", tipo: "sincronia", pronta: true },
  { id: "abismo", titulo: "Correntes do Abismo", resumo: "Desvie dos destroços e aguente até a maré virar.", tipo: "sobrevivencia", pronta: true },
  { id: "coracao", titulo: "Coração da Lanterna", resumo: "Enfrente o guardião e escolha o final.", tipo: "duelo", pronta: true },
];
