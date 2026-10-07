import { create } from "zustand";
import { SaveSchema, SaveV1Schema, type PhaseId, type Save } from "./schema";
import { conquistas as catalogo } from "../game/conquistas";
import { useDificuldade } from "../game/dificuldade";

const KEY = "lanterna-submersa:save";
const vazio: Save = {
  version: 2, current: null, completed: [], inventory: [], estrelas: {}, melhorTempo: {}, conquistas: [], recordeInfinito: 0,
};

function load(): Save {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return vazio;
    const json = JSON.parse(raw);
    const v2 = SaveSchema.safeParse(json);
    if (v2.success) return v2.data;
    const v1 = SaveV1Schema.safeParse(json);
    if (v1.success) {
      // quem já concluiu uma fase ganha 1 estrela retroativa
      const estrelas = Object.fromEntries(v1.data.completed.map((p) => [p, 1]));
      return { ...vazio, ...v1.data, version: 2, estrelas };
    }
    return vazio;
  } catch {
    return vazio;
  }
}

function persist(s: Save) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* sem armazenamento */ }
}

export type Resultado = { fase: PhaseId; estrelas: number; tempo?: number; recorde: boolean; detalhes?: string[] };

type State = Save & {
  resultado: Resultado | null;
  infinito: boolean;
  pausado: boolean;
  pausar: (v: boolean) => void;
  rodada: number; // muda a cada início de fase, para reiniciar a cena mesmo na mesma fase
  novas: string[]; // medalhas recém-ganhas, aguardando aviso na tela
  infinitoFim: { tempo: number; recorde: boolean } | null;
  start: (p: PhaseId) => void;
  startInfinito: () => void;
  fimInfinito: (tempo: number) => void;
  leave: () => void;
  giveItem: (item: string) => void;
  /** Conclui a fase e mostra a tela de resultado. `tempo` em segundos. */
  complete: (p: PhaseId, opts?: { estrelas?: number; tempo?: number; detalhes?: string[] }) => void;
  fecharResultado: () => void;
  consumirNova: () => void;
  reset: () => void;
};

export const useGame = create<State>((set, get) => {
  const save = () => {
    const { version, current, completed, inventory, estrelas, melhorTempo, conquistas, recordeInfinito } = get();
    persist({ version, current, completed, inventory, estrelas, melhorTempo, conquistas, recordeInfinito });
  };
  // Confere o catálogo de medalhas e enfileira as novas para o aviso
  const avaliar = () => {
    const s = get();
    const novas = catalogo.filter((c) => !s.conquistas.includes(c.id) && c.check(s)).map((c) => c.id);
    if (!novas.length) return;
    set({ conquistas: [...s.conquistas, ...novas], novas: [...s.novas, ...novas] });
    save();
  };
  return {
    ...load(),
    resultado: null,
    infinito: false,
    rodada: 0,
    pausado: false,
    pausar: (v) => set({ pausado: v }),
    novas: [],
    infinitoFim: null,
    start: (p) => { set({ current: p, resultado: null, infinito: false, infinitoFim: null, pausado: false, rodada: get().rodada + 1 }); save(); },
    startInfinito: () => { set({ current: "abismo", resultado: null, infinito: true, infinitoFim: null, pausado: false, rodada: get().rodada + 1 }); save(); },
    fimInfinito: (tempo) => {
      const recorde = tempo > get().recordeInfinito;
      set({ infinitoFim: { tempo, recorde }, recordeInfinito: recorde ? tempo : get().recordeInfinito });
      save();
      avaliar();
    },
    leave: () => { set({ current: null, infinito: false, pausado: false }); save(); },
    giveItem: (item) => {
      if (!get().inventory.includes(item)) set({ inventory: [...get().inventory, item] });
      save();
      avaliar();
    },
    complete: (p, opts = {}) => {
      const s = get();
      if (s.resultado) return; // já concluída, evita resultado duplicado
      const novas = Math.max(1, Math.min(3, opts.estrelas ?? 1));
      const completed = s.completed.includes(p) ? s.completed : [...s.completed, p];
      const estrelas = { ...s.estrelas, [p]: Math.max(s.estrelas[p] ?? 0, novas) };
      const melhorTempo = { ...s.melhorTempo };
      let recorde = false;
      if (opts.tempo !== undefined && (melhorTempo[p] === undefined || opts.tempo < melhorTempo[p])) {
        melhorTempo[p] = opts.tempo;
        recorde = true;
      }
      const marca = `dificil:${p}`;
      const inventory = useDificuldade.getState().nivel === "dificil" && !s.inventory.includes(marca)
        ? [...s.inventory, marca] : s.inventory;
      set({
        completed, estrelas, melhorTempo, inventory,
        resultado: { fase: p, estrelas: novas, tempo: opts.tempo, recorde, detalhes: opts.detalhes },
      });
      save();
      avaliar();
    },
    fecharResultado: () => { set({ resultado: null, infinitoFim: null, current: null, infinito: false, pausado: false }); save(); },
    consumirNova: () => set({ novas: get().novas.slice(1) }),
    reset: () => { set({ ...vazio, resultado: null, infinito: false, infinitoFim: null, novas: [] }); persist(vazio); },
  };
});
