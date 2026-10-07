import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Particulas from "../components/Particulas";
import { audio } from "../game/audio";
import { useGame } from "../store/useGame";
import { configAtual } from "../game/dificuldade";

const cores = [
  { nome: "Coral", cor: "#E07A5F", freq: 330 },
  { nome: "Lanterna", cor: "#F2CC8F", freq: 440 },
  { nome: "Alga", cor: "#3D8B7A", freq: 523 },
  { nome: "Espuma", cor: "#EAF4F4", freq: 660 },
];

const finais = {
  apagar: {
    botao: "Apagar a lanterna",
    texto: "Você apaga a lanterna. A cidade descansa no escuro, o mar guarda silêncio e os sinos finalmente param.",
  },
  acender: {
    botao: "Erguer a luz até a superfície",
    texto: "Você ergue a lanterna ao máximo. A luz sobe pela água e rompe a superfície. Pela primeira vez em séculos, alguém vê o farol de longe.",
  },
  guardar: {
    botao: "Assumir o posto de guardião",
    texto: "Você toma o lugar do guardião. A lanterna fica acesa só para quem se perder, e a cidade ganha de novo um vigia.",
  },
} as const;
type FinalId = keyof typeof finais;

export default function Coracao() {
  const { inventory, giveItem, complete, leave } = useGame();
  const cfg = configAtual();
  const reduz = useReducedMotion();
  const TAMANHOS = cfg.tamanhos;
  const [etapa, setEtapa] = useState<"intro" | "duelo" | "escolha" | "final">("intro");
  const [rodada, setRodada] = useState(0);
  const [vidas, setVidas] = useState(cfg.vidas);
  const [seq, setSeq] = useState<number[]>([]);
  const [entrada, setEntrada] = useState<number[]>([]);
  const [mostrando, setMostrando] = useState(false);
  const [brilho, setBrilho] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const [final, setFinal] = useState<FinalId | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const mostrar = (s: number[]) => {
    setMostrando(true);
    setEntrada([]);
    s.forEach((c, i) => {
      agendar(() => { setBrilho(c); audio.nota(cores[c].freq); }, 700 + i * cfg.passo);
      agendar(() => setBrilho(null), 700 + i * cfg.passo + 450);
    });
    agendar(() => setMostrando(false), 700 + s.length * cfg.passo);
  };

  const iniciarRodada = (r: number) => {
    const nova = Array.from({ length: TAMANHOS[r] }, () => Math.floor(Math.random() * 4));
    setRodada(r);
    setSeq(nova);
    mostrar(nova);
  };

  const comecar = () => {
    setEtapa("duelo");
    setVidas(cfg.vidas);
    setMsg("O Guardião canta uma sequência de luzes. Repita.");
    iniciarRodada(0);
  };

  const clicar = (c: number) => {
    if (mostrando) return;
    setBrilho(c);
    audio.nota(cores[c].freq);
    agendar(() => setBrilho(null), 250);
    if (c !== seq[entrada.length]) {
      audio.sfx.erro();
      if (vidas <= 1) {
        setVidas(cfg.vidas);
        setMsg("Suas luzes se apagaram. O Guardião recomeça o canto.");
        agendar(() => iniciarRodada(0), 600);
      } else {
        setVidas(vidas - 1);
        setMsg("Errou. Ouça de novo.");
        agendar(() => mostrar(seq), 600);
      }
      return;
    }
    const nova = [...entrada, c];
    setEntrada(nova);
    if (nova.length < seq.length) return;
    if (rodada === TAMANHOS.length - 1) {
      audio.sfx.vitoria();
      setMsg("");
      agendar(() => setEtapa("escolha"), 700);
    } else {
      audio.sfx.porta();
      setMsg("Certo. O canto fica mais longo.");
      agendar(() => iniciarRodada(rodada + 1), 900);
    }
  };

  const escolher = (id: FinalId) => {
    giveItem(`final:${id}`);
    setFinal(id);
    setEtapa("final");
  };

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-5 overflow-y-auto px-6 py-10">
      <header className="flex items-center justify-between">
        <h2 className="font-narrativa text-3xl text-lanterna">Coração da Lanterna</h2>
        {etapa !== "final" && <button onClick={leave} className="text-sm text-espuma/70 underline">Voltar</button>}
      </header>

      {etapa === "intro" && (
        <>
          <p className="font-narrativa text-lg">
            No centro da cidade, uma luz imensa te espera. O Guardião não luta com força: ele testa se você ouviu a cidade até aqui.
          </p>
          <button onClick={comecar} className="rounded-lg border border-lanterna px-5 py-3 text-lanterna">Encarar o Guardião</button>
        </>
      )}

      {etapa === "duelo" && (
        <>
          <p className="text-sm text-espuma/70">
            Rodada {rodada + 1} de {TAMANHOS.length} · Luzes restantes: {vidas}
          </p>
          <div className="relative">
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full bg-lanterna/10 blur-3xl"
              animate={reduz ? undefined : { scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
          <div className="relative grid grid-cols-2 gap-3">
            {cores.map((c, i) => (
              <motion.button
                key={c.nome}
                onClick={() => clicar(i)}
                disabled={mostrando}
                animate={{ opacity: brilho === i ? 1 : 0.4, scale: brilho === i ? 1.05 : 1 }}
                transition={{ duration: 0.12 }}
                className="h-28 rounded-lg font-narrativa text-xl text-abismo"
                style={{ background: c.cor }}
              >
                {c.nome}
              </motion.button>
            ))}
          </div>
          </div>
          <p className="font-narrativa text-espuma/90" role="status">
            {mostrando ? "Ouça e observe..." : msg || "Sua vez."}
          </p>
        </>
      )}

      {etapa === "escolha" && (
        <>
          <p className="font-narrativa text-lg">O Guardião se cala. A lanterna agora responde a você. O que fazer com ela?</p>
          <ul className="flex flex-col gap-3">
            {(Object.keys(finais) as FinalId[]).map((id) => (
              <li key={id}>
                <button onClick={() => escolher(id)} className="w-full rounded-lg border border-mare bg-mare/40 p-4 text-left font-narrativa text-lg hover:border-lanterna">
                  {finais[id].botao}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {etapa === "final" && final && (
        <>
          <Particulas quantidade={20} cor="#F2CC8F" />
          <p className="font-narrativa text-xl">{finais[final].texto}</p>
          {inventory.includes("registro-da-luz") && (
            <p className="font-narrativa italic text-espuma/80">
              No bolso, o registro da luz confirma o que você leu: a lanterna nunca foi só um farol.
            </p>
          )}
          <button onClick={() => complete("coracao")} className="self-start rounded-lg border border-lanterna px-5 py-3 text-lanterna">
            Voltar ao menu
          </button>
        </>
      )}
    </main>
  );
}
