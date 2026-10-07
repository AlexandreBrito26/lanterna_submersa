import { create } from "zustand";

export type Nivel = "facil" | "normal" | "dificil";

export const niveis: Record<Nivel, {
  nome: string;
  enguiaVel: number;     // multiplicador da velocidade das enguias (fase 3)
  visaoApagada: number;  // alcance da visão das enguias com a lanterna apagada (fase 3)
  periodo: number;       // segundos por ciclo de maré (fase 4)
  comporta: number;      // meia-largura da janela da comporta (fase 4)
  vidas: number;         // luzes no duelo (fase 5)
  passo: number;         // ms entre notas do duelo (fase 5)
  tamanhos: number[];    // notas por rodada (fase 5)
}> = {
  facil:   { nome: "Fácil",   enguiaVel: 0.7, visaoApagada: 20, periodo: 18, comporta: 0.3,  vidas: 5, passo: 1000, tamanhos: [3, 3, 4] },
  normal:  { nome: "Normal",  enguiaVel: 1,   visaoApagada: 26, periodo: 14, comporta: 0.2,  vidas: 3, passo: 800,  tamanhos: [3, 4, 5] },
  dificil: { nome: "Difícil", enguiaVel: 1.3, visaoApagada: 32, periodo: 11, comporta: 0.12, vidas: 2, passo: 600,  tamanhos: [4, 5, 6] },
};

const KEY = "lanterna-submersa:dificuldade";

function ler(): Nivel {
  try {
    const v = localStorage.getItem(KEY);
    return v === "facil" || v === "dificil" ? v : "normal";
  } catch { return "normal"; }
}

export const useDificuldade = create<{ nivel: Nivel; definir: (n: Nivel) => void }>((set) => ({
  nivel: ler(),
  definir: (nivel) => {
    set({ nivel });
    try { localStorage.setItem(KEY, nivel); } catch { /* sem armazenamento */ }
  },
}));

export const configAtual = () => niveis[useDificuldade.getState().nivel];
