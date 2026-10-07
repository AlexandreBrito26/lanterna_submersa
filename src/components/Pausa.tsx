import { useEffect } from "react";
import { motion } from "framer-motion";
import { Play, RotateCcw } from "lucide-react";
import { useGame } from "../store/useGame";

const PAUSAVEIS = ["cais", "jardins", "recife", "abismo"];

// Pausa automática ao sair do app, tecla Esc/P e painel para continuar
export default function Pausa() {
  const { current, pausado, resultado, infinitoFim, pausar, leave, start, startInfinito, infinito } = useGame();
  const ativa = !!current && PAUSAVEIS.includes(current);

  useEffect(() => {
    if (!ativa) return;
    const oculta = () => { if (document.hidden) pausar(true); };
    const tecla = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "escape" || k === "p") pausar(!useGame.getState().pausado);
    };
    document.addEventListener("visibilitychange", oculta);
    window.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("visibilitychange", oculta);
      window.removeEventListener("keydown", tecla);
    };
  }, [ativa, pausar]);

  if (!ativa || !pausado || resultado || infinitoFim) return null;
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-abismo/80 p-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Jogo pausado">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
        className="flex w-full max-w-xs flex-col items-center gap-3 moldura rounded-2xl p-6 text-center"
      >
        <h2 className="font-narrativa text-3xl text-lanterna">Pausado</h2>
        <button onClick={() => pausar(false)} className="flex w-full items-center justify-center gap-2 rounded-lg bg-lanterna px-5 py-3 font-narrativa text-lg text-abismo">
          <Play size={18} aria-hidden /> Continuar
        </button>
        <button onClick={() => (infinito ? startInfinito() : start(current!))} className="flex w-full items-center justify-center gap-2 rounded-lg border border-mare px-5 py-2 text-espuma/80">
          <RotateCcw size={16} aria-hidden /> Reiniciar fase
        </button>
        <button onClick={leave} className="text-sm text-espuma/60 underline">Voltar ao menu</button>
      </motion.div>
    </div>
  );
}
