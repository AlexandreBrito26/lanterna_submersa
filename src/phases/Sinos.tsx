import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Bell, Ear, Undo2 } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

type Sino = { id: string; nome: string; freq: number };

// Do mais grave ao mais agudo: a posição na lista é a altura do sino
const sinos: Sino[] = [
  { id: "proa", nome: "Sino de proa", freq: 196 },
  { id: "cais", nome: "Sino do cais", freq: 247 },
  { id: "torre", nome: "Sino da torre", freq: 311 },
  { id: "ponte", nome: "Sino da ponte", freq: 392 },
  { id: "farol", nome: "Sino do farol", freq: 494 },
];
const ordemCerta = sinos.map((s) => s.id);
const RODADAS = 3;

// O quinto sino é afinado num controle contínuo, em escala logarítmica (como o ouvido)
const F_MIN = 150, F_MAX = 560, TOLERANCIA = 0.03;
const freqDe = (v: number) => F_MIN * (F_MAX / F_MIN) ** (v / 1000);

function embaralhar<T>(lista: T[]): T[] {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Os sinos nunca aparecem já em ordem de altura
function ordemDeTela(): Sino[] {
  let o = embaralhar(sinos);
  while (o.every((s, i) => s.id === ordemCerta[i])) o = embaralhar(sinos);
  return o;
}

// Ponto de partida do controle: sempre longe do alvo
function partida(alvo: number): number {
  for (let k = 0; k < 40; k++) {
    const v = Math.round(Math.random() * 1000);
    if (Math.abs(Math.log(freqDe(v) / alvo)) > 0.22) return v;
  }
  return alvo > 300 ? 60 : 940;
}

export default function Sinos() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const erros = useRef(0);
  const [errosN, setErrosN] = useState(0);
  const [etapa, setEtapa] = useState<"ordenar" | "afinar">("ordenar");
  const [tela] = useState<Sino[]>(ordemDeTela);
  const [alvos] = useState<Sino[]>(() => embaralhar(sinos).slice(0, RODADAS));
  const [rodada, setRodada] = useState(0);
  const [sel, setSel] = useState<string | null>(null);
  const [posto, setPosto] = useState<string[]>([]);
  const [valor, setValor] = useState(500);
  const [tocando, setTocando] = useState(false);
  const [msg, setMsg] = useState("Toque em cada sino para ouvir. Depois ponha todos em fila, do som mais grave ao mais agudo.");
  const afinador = useRef<ReturnType<typeof audio.afinador> | null>(null);
  const silencio = useRef<number | undefined>(undefined);

  // Quem joga sem som (ou errou) ganha marcas visuais e dicas de direção
  const dica = errosN > 0 || audio.estaMudo();
  const alvo = alvos[rodada];

  useEffect(() => () => {
    afinador.current?.parar();
    window.clearTimeout(silencio.current);
  }, []);

  const errar = (texto: string) => {
    erros.current++;
    setErrosN(erros.current);
    setMsg(texto);
  };

  const ouvir = (s: Sino) => {
    if (fim.current) return;
    setSel(s.id);
    audio.sino(s.freq);
  };

  const comecarAfinacao = (r: number) => {
    setValor(partida(alvos[r].freq));
    window.setTimeout(() => audio.puro(alvos[r].freq), 700);
  };

  const fixar = () => {
    if (fim.current || !sel || posto.includes(sel)) return;
    audio.sfx.interagir();
    const nova = [...posto, sel];
    setSel(null);
    if (nova.length < sinos.length) { setPosto(nova); return; }
    if (nova.every((id, i) => id === ordemCerta[i])) {
      audio.sfx.afinado();
      setPosto(nova);
      setEtapa("afinar");
      afinador.current = audio.afinador();
      setMsg("A fila soa certa. Agora o quinto sino: gire o controle até ele igualar o tom que você ouvir.");
      comecarAfinacao(0);
    } else {
      setPosto([]);
      audio.sfx.desafina();
      errar("A fila desafina. Ouça de novo e compare dois sinos de cada vez.");
    }
  };

  const mover = (v: number) => {
    setValor(v);
    setTocando(true);
    afinador.current?.definir(freqDe(v));
    window.clearTimeout(silencio.current);
    silencio.current = window.setTimeout(() => { afinador.current?.silenciar(); setTocando(false); }, 700);
  };

  const conferir = () => {
    if (fim.current) return;
    afinador.current?.silenciar();
    setTocando(false);
    const f = freqDe(valor);
    const desvio = Math.log(f / alvo.freq);
    if (Math.abs(desvio) > TOLERANCIA) {
      audio.sfx.desafina();
      errar(dica
        ? `Ainda desafina: o quinto sino está ${desvio > 0 ? "agudo" : "grave"} demais.`
        : "Ainda desafina. Os dois tons batem um no outro. Chegue mais perto.");
      return;
    }
    audio.sfx.afinado();
    audio.sino(alvo.freq);
    if (rodada < RODADAS - 1) {
      const prox = rodada + 1;
      setRodada(prox);
      setMsg(`O quinto sino respondeu. Mais um tom: ${prox + 1} de ${RODADAS}.`);
      comecarAfinacao(prox);
      return;
    }
    fim.current = true;
    afinador.current?.parar();
    audio.sfx.porta();
    audio.sfx.vitoria();
    giveItem("quinto-sino");
    setMsg("Os cinco sinos respondem juntos, e o som sobe pela escada até a catedral. O quinto balança sozinho.");
    const e = erros.current;
    window.setTimeout(() => complete("sinos", {
      estrelas: e === 0 ? 3 : e <= 2 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [e === 0 ? "Fila e afinação de primeira" : `Enganos: ${e}`],
    }), 1700);
  };

  const rank = (id: string) => sinos.findIndex((s) => s.id === id);

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-3 overflow-y-auto px-4 py-3 fase-compacta">
      <AmbienteFase tipo="catedral" />
      <div className="flex justify-center"><Cabecalho id="sinos" /></div>

      <p className="font-narrativa italic text-espuma/80">
        {etapa === "ordenar"
          ? "As correntes rangem. Cada sino tem uma voz só dele."
          : `Tom ${rodada + 1} de ${RODADAS}: faça o quinto sino soar igual.`}
      </p>

      {etapa === "ordenar" ? (
        <>
          <ul className="flex flex-wrap justify-center gap-3" aria-label="Sinos">
            {tela.map((s, k) => {
              const pos = posto.indexOf(s.id);
              const ativo = sel === s.id;
              return (
                <motion.li key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: k * 0.08 }}>
                  <button
                    onClick={() => ouvir(s)}
                    disabled={pos >= 0}
                    aria-pressed={ativo}
                    className={`relative flex w-24 flex-col items-center gap-1 rounded-xl border px-2 py-3 backdrop-blur-sm transition-all enabled:hover:-translate-y-0.5 ${
                      ativo ? "border-lanterna bg-lanterna/15 shadow-[0_0_24px_rgba(255,191,0,0.3)]" : pos >= 0 ? "border-alga bg-alga/10" : "border-mare bg-mare/40 enabled:hover:border-lanterna/70"
                    }`}
                  >
                    {pos >= 0 && (
                      <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-lanterna text-sm font-bold text-abismo">{pos + 1}</span>
                    )}
                    <motion.span animate={ativo ? { rotate: [0, -14, 12, -8, 0] } : { rotate: 0 }} transition={{ duration: 0.7 }}>
                      <Bell size={30} className={ativo ? "text-lanterna" : "text-espuma/80"} aria-hidden />
                    </motion.span>
                    <span className="text-center text-xs leading-tight text-espuma/80">{s.nome}</span>
                    {dica && (
                      <span className="text-[10px] tracking-widest text-latao" aria-label={`altura ${rank(s.id) + 1} de ${sinos.length}`}>
                        {"▮".repeat(rank(s.id) + 1)}
                      </span>
                    )}
                  </button>
                </motion.li>
              );
            })}
          </ul>

          <div className="flex flex-col gap-3">
            <p className="flex items-center gap-2 text-sm text-espuma/70">
              <Ear size={16} className="text-lanterna" aria-hidden />
              Fila: {posto.length}/{sinos.length}
              {dica && <span className="text-espuma/50">· cada marca ▮ é um degrau de altura</span>}
            </p>
            <div className="flex gap-2">
              <button
                onClick={fixar}
                disabled={!sel || posto.includes(sel)}
                className="flex-1 rounded-xl bg-gradient-to-b from-lanterna to-[#e3b36a] px-5 py-3 font-narrativa text-lg text-abismo transition-opacity disabled:opacity-40"
              >
                Pôr na fila (posição {Math.min(posto.length + 1, sinos.length)})
              </button>
              <button
                onClick={() => { audio.sfx.interagir(); setPosto(posto.slice(0, -1)); }}
                disabled={!posto.length}
                aria-label="Desfazer o último sino da fila"
                className="flex items-center justify-center rounded-xl border border-mare px-4 text-espuma/80 transition-opacity disabled:opacity-30"
              >
                <Undo2 size={18} aria-hidden />
              </button>
            </div>
          </div>
        </>
      ) : (
        <section className="flex flex-col gap-4" aria-label="Afinação do quinto sino">
          <div className="flex flex-col items-center gap-2 rounded-xl border border-lanterna/40 bg-mare/30 py-6 backdrop-blur-sm">
            <motion.span animate={tocando ? { rotate: [0, -10, 9, -6, 0] } : { rotate: 0 }} transition={{ duration: 0.8, repeat: tocando ? Infinity : 0 }}>
              <Bell size={56} className={tocando ? "text-lanterna" : "text-espuma/70"} aria-hidden />
            </motion.span>
            <span className="text-sm text-espuma/70">Quinto sino</span>
          </div>

          <div className="flex flex-col gap-1">
            <input
              type="range" min={0} max={1000} step={1} value={valor}
              onChange={(e) => mover(Number(e.target.value))}
              aria-label="Afinação do quinto sino, do grave ao agudo"
              className="h-10 w-full accent-[#FFBF00]"
            />
            <div className="flex justify-between text-xs text-espuma/50"><span>grave</span><span>agudo</span></div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => audio.puro(alvo.freq)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-lanterna/70 px-4 py-3 text-lanterna"
            >
              <Ear size={18} aria-hidden /> Ouvir o tom
            </button>
            <button
              onClick={conferir}
              className="flex-1 rounded-xl bg-gradient-to-b from-lanterna to-[#e3b36a] px-5 py-3 font-narrativa text-lg text-abismo"
            >
              Fixar a afinação
            </button>
          </div>
        </section>
      )}

      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
