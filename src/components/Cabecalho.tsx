import type { ReactNode } from "react";
import { ArrowLeft, Pause } from "lucide-react";
import { phases, tiposVitoria } from "../phases/data";
import type { PhaseId } from "../store/schema";
import { useGame } from "../store/useGame";
import { iconeTipo } from "./tipos";

// Cabeçalho padrão das fases: título, tipo de vitória, objetivo e HUD opcional
export default function Cabecalho({ id, children }: { id: PhaseId; children?: ReactNode }) {
  const leave = useGame((s) => s.leave);
  const pausar = useGame((s) => s.pausar);
  const temPausa = ["cais", "jardins", "recife", "abismo"].includes(id);
  const info = phases.find((p) => p.id === id)!;
  const tipo = tiposVitoria[info.tipo];
  const Icone = iconeTipo[info.tipo];
  return (
    <header className="flex w-full max-w-sm flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="font-narrativa text-2xl text-lanterna"><span className="block text-[10px] font-ui uppercase tracking-[0.2em] text-latao">Local</span>{info.titulo}</h2>
        <div className="flex items-center gap-3">
          {temPausa && (
            <button onClick={() => pausar(true)} aria-label="Pausar" className="flex items-center gap-1 text-sm text-espuma/70 hover:text-espuma">
              <Pause size={16} aria-hidden /> Pausar
            </button>
          )}
          <button onClick={leave} className="flex items-center gap-1 text-sm text-espuma/70 hover:text-espuma">
            <ArrowLeft size={16} aria-hidden /> Menu
          </button>
        </div>
      </div>
      <p className="moldura flex items-center gap-2 px-3 py-1.5 text-sm text-espuma/80">
        <Icone size={16} className="shrink-0 text-lanterna" aria-hidden />
        <span><strong className="text-lanterna">{tipo.nome}:</strong> {tipo.objetivo}</span>
      </p>
      {children}
    </header>
  );
}
