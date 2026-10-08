import { useEffect } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Clock, Infinity as InfinityIcon, Play, RotateCcw, Trophy } from "lucide-react";
import { atoDe, atos, phases } from "../phases/data";
import { useGame } from "../store/useGame";
import { reduzMovimento } from "../game/acessibilidade";
import Estrelas from "./Estrelas";

// Cor de destaque por ato, igual à das cutscenes
const corDoAto: Record<number, string> = { 1: "#FFBF00", 2: "#7FE0D0", 3: "#E07A5F", 4: "#8FB8A0", 5: "#F6E7B0" };

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export default function Resultado() {
  const { resultado, infinitoFim, fecharResultado, start, startInfinito } = useGame();
  useEffect(() => {
    if (!resultado || reduzMovimento()) return;
    const cores = [corDoAto[atoDe(resultado.fase)] ?? "#FFBF00", "#3D8B7A", "#F2E6D6"];
    confetti({ particleCount: 40 + resultado.estrelas * 30, spread: 75, origin: { y: 0.6 }, colors: cores, disableForReducedMotion: true });
  }, [resultado]);
  useEffect(() => {
    if (!infinitoFim?.recorde || reduzMovimento()) return;
    confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 }, colors: ["#FFBF00", "#E07A5F", "#F2E6D6"], disableForReducedMotion: true });
  }, [infinitoFim]);

  if (infinitoFim) {
    return (
      <div className="fixed inset-0 z-20 flex items-center justify-center bg-abismo/85 p-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Fim da Maré Infinita">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-coral/60 bg-mare/60 p-6 text-center"
        >
          <InfinityIcon size={36} className="text-coral" aria-hidden />
          <h2 className="font-narrativa text-3xl text-lanterna">Você aguentou {infinitoFim.tempo}s</h2>
          {infinitoFim.recorde
            ? <p className="flex items-center gap-1 text-lanterna"><Trophy size={16} aria-hidden /> Novo recorde</p>
            : <p className="text-sm text-espuma/70">A corrente venceu desta vez.</p>}
          <div className="flex w-full flex-col gap-2">
            <button onClick={startInfinito} className="flex items-center justify-center gap-2 rounded-lg bg-lanterna px-5 py-3 font-narrativa text-lg text-abismo">
              <RotateCcw size={18} aria-hidden /> Tentar de novo
            </button>
            <button onClick={fecharResultado} className="text-sm text-espuma/60 underline">Voltar ao menu</button>
          </div>
        </motion.div>
      </div>
    );
  }
  if (!resultado) return null;

  const i = phases.findIndex((p) => p.id === resultado.fase);
  const info = phases[i];
  const proxima = phases[i + 1];
  const frases = ["A luz mal se acendeu.", "A lanterna brilha firme.", "Perfeito. O mar vai lembrar."];
  const ato = atoDe(resultado.fase);
  const cor = corDoAto[ato] ?? "#FFBF00";
  const atoProximo = proxima ? atoDe(proxima.id) : ato;
  const novoAto = proxima !== undefined && atoProximo !== ato;

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-abismo/85 p-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Fase concluída">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="flex w-full max-w-sm flex-col items-center gap-4 moldura flex-col rounded-2xl p-6 text-center"
        style={{ boxShadow: `0 0 60px ${cor}33`, borderColor: `${cor}88` }}
      >
        <p className="text-sm uppercase tracking-widest text-espuma/60">Fase concluída · {atos[ato - 1].titulo}</p>
        <h2 className="font-narrativa text-3xl text-lanterna">{info.titulo}</h2>
        <Estrelas valor={resultado.estrelas} tamanho={36} animado />
        <p className="font-narrativa italic text-espuma/80">{frases[resultado.estrelas - 1]}</p>

        <ul className="flex w-full flex-col gap-1 text-sm text-espuma/80">
          {resultado.tempo !== undefined && (
            <li className="flex items-center justify-center gap-2">
              <Clock size={14} aria-hidden /> Tempo {fmt(resultado.tempo)}
              {resultado.recorde && <span className="flex items-center gap-1 text-lanterna"><Trophy size={14} aria-hidden /> Novo recorde</span>}
            </li>
          )}
          {resultado.detalhes?.map((d) => <li key={d}>{d}</li>)}
        </ul>

        <div className="flex w-full flex-col gap-2">
          {proxima && (
            <button onClick={() => start(proxima.id)} className="flex items-center justify-center gap-2 rounded-lg bg-lanterna px-5 py-3 font-narrativa text-lg text-abismo">
              <Play size={18} aria-hidden /> {novoAto ? `Novo ato: ${atos[atoProximo - 1].titulo}` : `Próxima: ${proxima.titulo}`}
            </button>
          )}
          <button onClick={() => start(resultado.fase)} className="flex items-center justify-center gap-2 rounded-lg border border-mare px-5 py-2 text-espuma/80">
            <RotateCcw size={16} aria-hidden /> Jogar de novo
          </button>
          <button onClick={fecharResultado} className="text-sm text-espuma/60 underline">Voltar ao menu</button>
        </div>
      </motion.div>
    </div>
  );
}
