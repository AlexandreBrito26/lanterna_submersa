import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Award } from "lucide-react";
import { conquistas } from "../game/conquistas";
import { audio } from "../game/audio";
import { useGame } from "../store/useGame";
import { iconeConquista } from "./tipos";

// Aviso de medalha que desliza do topo e some sozinho
export default function ToastConquista() {
  const id = useGame((s) => s.novas[0]);
  const consumir = useGame((s) => s.consumirNova);
  const c = conquistas.find((x) => x.id === id);
  const Icone = (id && iconeConquista[id]) || Award;

  useEffect(() => {
    if (!id) return;
    audio.sfx.conquista();
    const t = setTimeout(consumir, 3800);
    return () => clearTimeout(t);
  }, [id, consumir]);

  return (
    <div className="pointer-events-none fixed inset-x-0 z-30 flex justify-center px-4" style={{ top: "calc(env(safe-area-inset-top, 0px) + 3.5rem)" }}>
      <AnimatePresence mode="wait">
        {c && (
          <motion.div
            key={c.id}
            role="status"
            initial={{ y: -70, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -70, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="flex w-full max-w-sm items-center gap-3 moldura rounded-2xl p-3 shadow-[0_0_40px_rgba(255,191,0,0.35)] backdrop-blur-md"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-lanterna text-abismo">
              <Icone size={22} aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-xs uppercase tracking-widest text-lanterna">Medalha desbloqueada</span>
              <span className="block truncate font-narrativa text-lg">{c.nome}</span>
              <span className="block text-sm text-espuma/70">{c.desc}</span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
