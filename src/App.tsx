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
import { atoDe } from "./phases/data";

// Cada fase vira um pacote separado, carregado só quando o jogador entra nela
const fases = {
  cais: lazy(() => import("./phases/Cais")),
  biblioteca: lazy(() => import("./phases/Biblioteca")),
  jardins: lazy(() => import("./phases/Jardins")),
  armazem: lazy(() => import("./phases/Armazem")),
  porao: lazy(() => import("./phases/Porao")),
  recife: lazy(() => import("./phases/Recife")),
  oficina: lazy(() => import("./phases/Oficina")),
  espelhos: lazy(() => import("./phases/Espelhos")),
  catedral: lazy(() => import("./phases/Catedral")),
  sinos: lazy(() => import("./phases/Sinos")),
  observatorio: lazy(() => import("./phases/Observatorio")),
  eclusa: lazy(() => import("./phases/Eclusa")),
  torre: lazy(() => import("./phases/Torre")),
  mangue: lazy(() => import("./phases/Mangue")),
  teatro: lazy(() => import("./phases/Teatro")),
  bombas: lazy(() => import("./phases/Bombas")),
  rede: lazy(() => import("./phases/Rede")),
  mare: lazy(() => import("./phases/Mare")),
  vento: lazy(() => import("./phases/Vento")),
  abismo: lazy(() => import("./phases/Abismo")),
  coracao: lazy(() => import("./phases/Coracao")),
  eco: lazy(() => import("./phases/Eco")),
  cardume: lazy(() => import("./phases/Cardume")),
  coral: lazy(() => import("./phases/Coral")),
  neblina: lazy(() => import("./phases/Neblina")),
  alavancas: lazy(() => import("./phases/Alavancas")),
  memoria: lazy(() => import("./phases/Memoria")),
  perolas: lazy(() => import("./phases/Perolas")),
  setas: lazy(() => import("./phases/Setas")),
  dominos: lazy(() => import("./phases/Dominos")),
  palavras: lazy(() => import("./phases/Palavras")),
  final2: lazy(() => import("./phases/Final")),
  silencio: lazy(() => import("./phases/Silencio")),
  contagem: lazy(() => import("./phases/Contagem")),
  fio: lazy(() => import("./phases/Fio")),
  pedra: lazy(() => import("./phases/Pedra")),
  breu: lazy(() => import("./phases/Breu")),
  chama: lazy(() => import("./phases/Chama")),
  vela: lazy(() => import("./phases/Vela")),
  forja: lazy(() => import("./phases/Forja")),
  molhada: lazy(() => import("./phases/Molhada")),
  brasa: lazy(() => import("./phases/Brasa")),
  arca: lazy(() => import("./phases/Arca")),
  muralha: lazy(() => import("./phases/Muralha")),
  ganchos: lazy(() => import("./phases/Ganchos")),
  fechadura: lazy(() => import("./phases/Fechadura")),
  selos: lazy(() => import("./phases/Selos")),
  escalada: lazy(() => import("./phases/Escalada")),
  encaixe: lazy(() => import("./phases/Encaixe")),
  sementes: lazy(() => import("./phases/Sementes")),
  alternado: lazy(() => import("./phases/Alternado")),
  pontes: lazy(() => import("./phases/Pontes")),
  trilha: lazy(() => import("./phases/Trilha")),
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
      {cenaId && <Cutscene key={cenaId} info={cutscenes[cenaId]} aoFinal={fimDaCena} ato={atoDe(cenaId as Parameters<typeof atoDe>[0])} />}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${current ?? "menu"}:${rodada}`}
          className={`h-full ${current && atoDe(current) === 2 ? "ato-2" : current && atoDe(current) === 3 ? "ato-3" : ""}`}
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
