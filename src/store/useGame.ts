import { create } from "zustand";
import { SaveSchema, type PhaseId, type Save } from "./schema";

const KEY = "lanterna-submersa:save";
const empty: Save = { version: 1, current: null, completed: [], inventory: [] };

function load(): Save {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    const parsed = SaveSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : empty;
  } catch {
    return empty;
  }
}

function persist(s: Save) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* sem armazenamento */ }
}

type State = Save & {
  start: (p: PhaseId) => void;
  leave: () => void;
  giveItem: (item: string) => void;
  complete: (p: PhaseId) => void;
  reset: () => void;
};

export const useGame = create<State>((set, get) => {
  const save = () => {
    const { version, current, completed, inventory } = get();
    persist({ version, current, completed, inventory });
  };
  return {
    ...load(),
    start: (p) => { set({ current: p }); save(); },
    leave: () => { set({ current: null }); save(); },
    giveItem: (item) => {
      if (!get().inventory.includes(item)) set({ inventory: [...get().inventory, item] });
      save();
    },
    complete: (p) => {
      const completed = get().completed.includes(p) ? get().completed : [...get().completed, p];
      set({ completed, current: null });
      save();
    },
    reset: () => { set({ ...empty }); persist(empty); },
  };
});
