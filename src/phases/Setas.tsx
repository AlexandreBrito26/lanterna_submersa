import { useEffect, useRef, useState } from "react";
import { ArrowRight, Ship, Lightbulb, RotateCcw } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// Cada casa tem uma seta da correnteza: 0 →, 1 ↓, 2 ←, 3 ↑. Tocar gira a seta 90° no sentido horário.
// O barco começa na casa S e segue as setas. Vence quando chega ao farol G.
// Sair da grade ou girar em círculo é falha. OTIMOS é o mínimo de toques de cada trecho, por busca exaustiva.
const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];
const ANGULO = [0, 90, 180, 270];

type Trecho = { W: number; H: number; ini: number[]; S: number; G: number };
const TRECHOS: Trecho[] = [
  { W: 3, H: 2, ini: [1, 0, 0, 2, 0, 0], S: 0, G: 2 },
  { W: 3, H: 3, ini: [0, 1, 0, 2, 3, 0, 0, 0, 0], S: 0, G: 8 },
  { W: 3, H: 3, ini: [0, 0, 1, 1, 3, 2, 0, 1, 0], S: 0, G: 8 },
];
const OTIMOS = [3, 2, 3];
const SOMA_OTIMOS = OTIMOS.reduce((a, b) => a + b, 0);

const INTROS = [
  "A correnteza empurra o barco na direção de cada seta. Gire as setas para que o barco siga até o farol.",
  "Há um redemoinho escondido: uma seta que aponta para uma casa já visitada faz o barco girar em círculo.",
  "A última correnteza do porto. Antes de girar, siga o barco com o dedo e veja onde ele para.",
];

// O barco chega ao farol seguindo as setas?
function chega(t: Trecho, cfg: number[]): boolean {
  let p = t.S;
  const vistos = new Set<number>();
  for (let i = 0; i < 200; i++) {
    if (p === t.G) return true;
    if (vistos.has(p)) return false;
    vistos.add(p);
    const x = (p % t.W) + DX[cfg[p]], y = Math.floor(p / t.W) + DY[cfg[p]];
    if (x < 0 || y < 0 || x >= t.W || y >= t.H) return false;
    p = y * t.W + x;
  }
  return false;
}

export default function SetasFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const togglesTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [cfg, setCfg] = useState<number[]>(TRECHOS[0].ini);
  const [toques, setToques] = useState(0);
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);

  const t = TRECHOS[rodada];
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const concluir = (n: number) => {
    setTravado(true);
    audio.sfx.setas.chegou();
    const nota = n === OTIMOS[rodada] ? "o mínimo possível" : `o mínimo era ${OTIMOS[rodada]}`;
    if (rodada < TRECHOS.length - 1) {
      setMsg(`O barco chega ao farol com ${n} toques (${nota}). A correnteza muda e leva ao próximo trecho.`);
      agendar(() => {
        const prox = rodada + 1;
        setRodada(prox);
        setCfg(TRECHOS[prox].ini);
        setToques(0); setTravado(false);
        setMsg(INTROS[prox]);
      }, 2300);
      return;
    }
    fim.current = true;
    giveItem("correnteza-certa");
    const total = togglesTotal.current;
    setMsg(`O farol acende e o barco volta ao porto seguindo a correnteza (${nota}).`);
    agendar(() => complete("setas", {
      estrelas: total <= SOMA_OTIMOS + 1 ? 3 : total <= SOMA_OTIMOS + 4 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Toques: ${total} (o mínimo seria ${SOMA_OTIMOS})`, reinicios.current ? `Correntezas refeitas: ${reinicios.current}` : "Nenhuma correnteza refeita"],
    }), 2800);
  };

  const girar = (p: number) => {
    if (fim.current || travado) return;
    const novo = [...cfg];
    novo[p] = (novo[p] + 1) % 4;
    const n = toques + 1;
    togglesTotal.current++;
    setCfg(novo);
    setToques(n);
    audio.sfx.setas.girar();
    if (chega(t, novo)) { concluir(n); return; }
    setMsg("A seta gira. Siga a correnteza com o dedo e veja para onde o barco vai.");
  };

  const reiniciar = () => {
    if (fim.current || travado) return;
    reinicios.current++;
    setCfg(t.ini);
    audio.sfx.interagir();
    setMsg("As setas voltam à posição inicial. Os toques já feitos continuam contando.");
  };

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-5 overflow-y-auto px-6 py-10">
      <AmbienteFase tipo="setas" />
      <div className="flex justify-center"><Cabecalho id="setas" /></div>

      <p className="font-narrativa italic text-espuma/80">Correnteza {rodada + 1} de {TRECHOS.length}: leve o barco ao farol.</p>

      <div
        role="grid"
        aria-label={`Correnteza com ${t.W} por ${t.H} casas. Toque numa seta para girar.`}
        className="mx-auto grid w-full gap-1.5 rounded-lg border border-latao/60 bg-abismo/60 p-2 backdrop-blur-sm"
        style={{ maxWidth: t.W * 92, gridTemplateColumns: `repeat(${t.W}, 1fr)` }}
      >
        {cfg.map((dir, p) => {
          const x = p % t.W, y = Math.floor(p / t.W);
          const eBarco = p === t.S, eFarol = p === t.G;
          return (
            <button
              key={p}
              onClick={() => girar(p)}
              disabled={travado}
              aria-label={`Linha ${y + 1}, coluna ${x + 1}, seta ${["para a direita", "para baixo", "para a esquerda", "para cima"][dir]}${eBarco ? ", barco" : ""}${eFarol ? ", farol" : ""}`}
              className="relative flex aspect-square items-center justify-center rounded-md border border-mare bg-mare/25 transition-colors hover:bg-mare/45 active:scale-95 disabled:cursor-default"
            >
              {eFarol ? (
                <Lightbulb size={26} className="text-lanterna drop-shadow-[0_0_10px_rgba(255,191,0,0.7)]" aria-hidden />
              ) : (
                <span className="flex items-center justify-center transition-transform duration-300" style={{ transform: `rotate(${ANGULO[dir]}deg)` }}>
                  <ArrowRight size={26} className={eBarco ? "text-alga" : "text-espuma/80"} aria-hidden />
                </span>
              )}
              {eBarco && <Ship size={14} className="absolute bottom-1 left-1 text-alga" aria-hidden />}
            </button>
          );
        })}
      </div>

      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Toques: {toques}</span>
        <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 underline disabled:opacity-40">
          <RotateCcw size={14} aria-hidden /> Voltar às setas
        </button>
      </p>

      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
