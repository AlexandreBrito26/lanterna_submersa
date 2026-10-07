import { BellRing, BookOpen, Compass, EyeOff, Gem, Hammer, Scale, Sparkles, Telescope, Waves, Wind } from "lucide-react";
import type { TipoVitoria } from "../phases/data";

export const iconeTipo: Record<TipoVitoria, typeof Compass> = {
  exploracao: Compass,
  deducao: BookOpen,
  furtividade: EyeOff,
  coleta: Gem,
  sincronia: Waves,
  sobrevivencia: Wind,
  duelo: Sparkles,
  criacao: Hammer,
  escuta: BellRing,
  equilibrio: Scale,
  navegacao: Telescope,
};

import { Anchor, Award, BookMarked, BookOpenCheck, Ear, Clock, Crown, Flame, Infinity as InfinityIcon, Shell, ShieldCheck, Star, Sunrise, Timer, Waves as Ondas, Wind as Vento, type LucideIcon } from "lucide-react";

export const iconeConquista: Record<string, LucideIcon> = {
  "primeira-luz": Sunrise,
  conchas: Shell,
  relampago: Clock,
  leitor: BookMarked,
  sombra: Flame,
  folego: Vento,
  mare: Ondas,
  casco: ShieldCheck,
  estrelado: Star,
  guardiao: Crown,
  finais: Award,
  lenda: Anchor,
  oficineiro: Hammer,
  pesador: Scale,
  navegante: Telescope,
  ouvido: Ear,
  diario: BookOpenCheck,
  "mare-60": Timer,
  "mare-120": InfinityIcon,
};
