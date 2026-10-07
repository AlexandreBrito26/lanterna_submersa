import { lazy, Suspense, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Menu from "./components/Menu";
import Cutscene from "./components/Cutscene";
import BotaoSom from "./components/BotaoSom";
import Resultado from "./components/Resultado";
import ToastConquista from "./components/ToastConquista";
import Pausa from "./components/Pausa";
import { musica } from "./game/musica";
import { audio } from "./game/audio";
import { cutscenes, type CenaId } from "./game/cutscenes";
import { useGame } from "./store/useGame";

// Cada fase vira um pacote separado, carregado só quando o jogador entra nela
const fases = {
  cais: lazy(() => import("./phases/Cais")),
  biblioteca: lazy(() => import("./phases/Biblioteca")),
  jardins: lazy(() => import("./phases/Jardins")),
  recife: lazy(() => import("./phases/Recife")),
  catedral: lazy(() => import("./phases/Catedral")),
  abismo: lazy(() => import("./phases/Abismo")),
  coracao: lazy(() => import("./phases/Coracao")),
};

export default function App() {
  const current = useGame((s) => s.current);
  const inventory = useGame((s) => s.inventory);
  const giveItem = useGame((s) => s.giveItem);
  const infinito = useGame((s) => s.infinito);
  const rodada = useGame((s) => s.rodada);
  const [rever, setRever] = useState<CenaId | null>(null);
  const Fase = current ? fases[current] : null;

  // A cutscene toca sozinha na primeira vez que a fase é aberta
  const pendente = current && current in cutscenes && !inventory.includes(`cutscene:${current}`)
    ? (current as CenaId) : null;
  const cenaId = rever ?? pendente;
  const fimDaCena = () => {
    if (cenaId) giveItem(`cutscene:${cenaId}`);
    setRever(null);
  };

  // Cada fase tem a sua trilha; o menu e a Maré Infinita também
  useEffect(() => {
    musica.tocar(current ? (infinito && current === "abismo" ? "infinito" : current) : "menu");
  }, [current, infinito]);

  useEffect(() => {
    const ligar = () => audio.iniciar();
    window.addEventListener("pointerdown", ligar, { once: true });
    window.addEventListener("keydown", ligar, { once: true });
    return () => {
      window.removeEventListener("pointerdown", ligar);
      window.removeEventListener("keydown", ligar);
    };
  }, []);

  return (
    <>
      <BotaoSom />
      <Resultado />
      <ToastConquista />
      <Pausa />
      {cenaId && <Cutscene key={cenaId} info={cutscenes[cenaId]} aoFinal={fimDaCena} />}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${current ?? "menu"}:${rodada}`}
          className="h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Suspense fallback={<p className="p-6 font-narrativa text-espuma/70" role="status">Carregando...</p>}>
            {Fase ? <Fase /> : <Menu aoRever={setRever} />}
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
