import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Particulas from "../components/Particulas";
import AmbienteFase from "../components/AmbienteFase";
import { audio } from "../game/audio";
import { useGame } from "../store/useGame";
import { Lock, Sunrise } from "lucide-react";
import { phases } from "./data";
import { configAtual } from "../game/dificuldade";
import Cabecalho from "../components/Cabecalho";

const cores = [
  { nome: "Coral", cor: "#E07A5F", freq: 330 },
  { nome: "Lanterna", cor: "#FFBF00", freq: 440 },
  { nome: "Alga", cor: "#3D8B7A", freq: 523 },
  { nome: "Espuma", cor: "#F2E6D6", freq: 660 },
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
  renascer: {
    botao: "Chamar a cidade de volta",
    texto: "Os seis fragmentos acendem ao mesmo tempo. A lanterna não se apaga nem sobe: é o mar que recua. Torres, jardins e sinos emergem devagar, e Maré Alta acorda inteira, com cada janela acesa e cada sino respondendo ao seu.",
  },
} as const;
type FinalId = keyof typeof finais;

export default function Coracao() {
  const { inventory, estrelas, giveItem, complete } = useGame();
  const perfeito = phases.filter((p) => p.id !== "coracao").every((p) => estrelas[p.id] === 3);
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
  const perdidas = useRef(0);
  const inicio = useRef(0);

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
    perdidas.current = 0;
    inicio.current = performance.now();
    setVidas(cfg.vidas);
    setMsg("O Guardião canta uma sequência de luzes. Repita.");
    iniciarRodada(0);
  };

  const clicar = (c: number) => {
    if (mostrando) return;
    setBrilho(c);
    audio.nota(cores[c].freq);
    agendar(() => setBrilho(null), 250);
    const reverso = rodada === TAMANHOS.length - 1;
    const esperado = reverso ? seq[seq.length - 1 - entrada.length] : seq[entrada.length];
    if (c !== esperado) {
      audio.sfx.erro();
      perdidas.current++;
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
      <AmbienteFase tipo="coracao" />
      {etapa !== "final" ? <div className="flex justify-center"><Cabecalho id="coracao" /></div> : <h2 className="font-narrativa text-3xl text-lanterna">Coração da Lanterna</h2>}

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
                style={{ background: c.cor, boxShadow: brilho === i ? `0 0 46px 10px ${c.cor}aa` : "0 0 0 0 transparent" }}
              >
                {c.nome}
              </motion.button>
            ))}
          </div>
          </div>
          <p className="font-narrativa text-espuma/90" role="status">
            {mostrando ? "Ouça e observe..." : msg || (rodada === TAMANHOS.length - 1 ? "O último canto volta pelo caminho: repita de trás para frente." : "Sua vez.")}
          </p>
        </>
      )}

      {etapa === "escolha" && (
        <>
          <p className="font-narrativa text-lg">O Guardião se cala. A lanterna agora responde a você. O que fazer com ela?</p>
          <ul className="flex flex-col gap-3">
            {(Object.keys(finais) as FinalId[]).filter((id) => id !== "renascer").map((id) => (
              <li key={id}>
                <button onClick={() => escolher(id)} className="w-full rounded-lg border border-mare bg-mare/40 p-4 text-left font-narrativa text-lg hover:border-lanterna">
                  {finais[id].botao}
                </button>
              </li>
            ))}
            <li>
              {perfeito ? (
                <button onClick={() => escolher("renascer")} className="flex w-full items-center gap-3 rounded-lg border border-lanterna bg-lanterna/10 p-4 text-left font-narrativa text-lg text-lanterna shadow-[0_0_30px_rgba(255,191,0,0.25)]">
                  <Sunrise size={22} aria-hidden /> {finais.renascer.botao}
                </button>
              ) : (
                <div className="flex items-start gap-3 rounded-lg border border-dashed border-mare p-4 text-espuma/50">
                  <Lock size={18} className="mt-1 shrink-0" aria-hidden />
                  <span className="font-narrativa">Existe um quarto caminho. Só ele se abre para quem conquistou 3 estrelas em todas as fases anteriores.</span>
                </div>
              )}
            </li>
          </ul>
        </>
      )}

      {etapa === "final" && final && (
        <>
          <Particulas quantidade={20} cor="#FFBF00" />
          <p className="font-narrativa text-xl">{finais[final].texto}</p>
          {inventory.includes("registro-da-luz") && (
            <p className="font-narrativa italic text-espuma/80">
              No bolso, o registro da luz confirma o que você leu: a lanterna nunca foi só um farol.
            </p>
          )}
          <button onClick={() => complete("coracao", {
            estrelas: perdidas.current === 0 ? 3 : perdidas.current <= 2 ? 2 : 1,
            tempo: Math.round((performance.now() - inicio.current) / 1000),
            detalhes: [perdidas.current === 0 ? "Nenhuma luz perdida" : `Luzes perdidas: ${perdidas.current}`],
          })} className="self-start rounded-lg border border-lanterna px-5 py-3 text-lanterna">
            Concluir
          </button>
        </>
      )}
    </main>
  );
}
