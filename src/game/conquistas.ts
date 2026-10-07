import type { Save } from "../store/schema";

export type Conquista = { id: string; nome: string; desc: string; check: (s: Save) => boolean };

const tres = (...ids: string[]) => (s: Save) => ids.every((i) => s.estrelas[i] === 3);
const seis = ["cais", "biblioteca", "jardins", "recife", "catedral", "abismo"];
const todasFases = [...seis, "coracao"];

export const conquistas: Conquista[] = [
  { id: "primeira-luz", nome: "Primeira luz", desc: "Conclua o Cais Afundado.", check: (s) => s.completed.includes("cais") },
  { id: "conchas", nome: "Colecionador de conchas", desc: "Encontre as 3 conchas do cais.", check: (s) => s.inventory.includes("conchas-todas") },
  { id: "relampago", nome: "Relâmpago", desc: "Conclua o cais em 45 segundos ou menos.", check: (s) => (s.melhorTempo.cais ?? Infinity) <= 45 },
  { id: "leitor", nome: "Leitor atento", desc: "3 estrelas na Biblioteca Alagada.", check: tres("biblioteca") },
  { id: "sombra", nome: "Sombra do coral", desc: "3 estrelas nos Jardins de Coral.", check: tres("jardins") },
  { id: "folego", nome: "Fôlego de baleia", desc: "3 estrelas no Recife dos Naufrágios.", check: tres("recife") },
  { id: "mare", nome: "Senhor da maré", desc: "3 estrelas na Catedral das Marés.", check: tres("catedral") },
  { id: "casco", nome: "Casco de ferro", desc: "3 estrelas nas Correntes do Abismo.", check: tres("abismo") },
  { id: "estrelado", nome: "Céu estrelado", desc: "3 estrelas em todas as fases antes do Coração.", check: tres(...seis) },
  { id: "guardiao", nome: "Palavra do guardião", desc: "Conclua o Coração da Lanterna.", check: (s) => s.completed.includes("coracao") },
  { id: "finais", nome: "Todos os finais", desc: "Descubra os 4 finais.", check: (s) => ["apagar", "acender", "guardar", "renascer"].every((f) => s.inventory.includes(`final:${f}`)) },
  { id: "lenda", nome: "Lenda das profundezas", desc: "Conclua todas as fases na dificuldade Difícil.", check: (s) => todasFases.every((f) => s.inventory.includes(`dificil:${f}`)) },
  { id: "mare-60", nome: "Fôlego da maré", desc: "Aguente 60 segundos na Maré Infinita.", check: (s) => s.recordeInfinito >= 60 },
  { id: "mare-120", nome: "Imortal das correntes", desc: "Aguente 120 segundos na Maré Infinita.", check: (s) => s.recordeInfinito >= 120 },
];
