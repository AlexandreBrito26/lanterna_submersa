import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// e: 0 = espelho "/", 1 = espelho "\". A luz sai da esquerda, na linha `row`, indo para a direita.
type Pt = { x: number; y: number };
type Nivel = { W: number; H: number; row: number; target: Pt; walls: Pt[]; mirrors: (Pt & { e: number })[] };

// Fases geradas e conferidas por busca exaustiva: todas têm solução (2 por fase) e o mínimo de toques abaixo
const NIVEIS: Nivel[] = [
  {
    W: 5, H: 5, row: 3, target: { x: 4, y: 4 },
    walls: [{ x: 1, y: 2 }, { x: 0, y: 0 }],
    mirrors: [{ x: 3, y: 2, e: 0 }, { x: 2, y: 0, e: 0 }, { x: 2, y: 2, e: 1 }, { x: 2, y: 4, e: 1 }, { x: 3, y: 3, e: 0 }],
  },
  {
    W: 6, H: 6, row: 2, target: { x: 2, y: 4 },
    walls: [{ x: 2, y: 2 }, { x: 0, y: 5 }, { x: 3, y: 5 }, { x: 5, y: 2 }],
    mirrors: [{ x: 4, y: 0, e: 0 }, { x: 5, y: 5, e: 1 }, { x: 4, y: 4, e: 0 }, { x: 0, y: 2, e: 1 }, { x: 0, y: 1, e: 1 }, { x: 3, y: 1, e: 0 }, { x: 3, y: 0, e: 1 }],
  },
  {
    W: 7, H: 6, row: 3, target: { x: 1, y: 1 },
    walls: [{ x: 6, y: 5 }, { x: 3, y: 2 }, { x: 3, y: 0 }, { x: 6, y: 3 }, { x: 3, y: 5 }],
    mirrors: [{ x: 2, y: 3, e: 1 }, { x: 2, y: 5, e: 1 }, { x: 4, y: 4, e: 1 }, { x: 0, y: 5, e: 0 }, { x: 5, y: 5, e: 0 }, { x: 0, y: 3, e: 1 }, { x: 3, y: 4, e: 1 }, { x: 4, y: 1, e: 0 }, { x: 3, y: 3, e: 0 }],
  },
];

const INTROS = [
  "Toque num espelho para virá-lo entre as duas inclinações. A luz sai da lâmpada, à esquerda, e precisa chegar à lente.",
  "A galeria é maior, e as pedras bloqueiam o feixe. Nem todo espelho serve ao caminho certo.",
  "A última galeria tem espelhos demais. Siga o feixe e mude só o que for preciso.",
];

type Traco = { pts: [number, number][]; reflexos: number; fim: "lente" | "pedra" | "borda" };

// Segue o feixe célula a célula. "/" troca (dx,dy) por (-dy,-dx); "\" troca por (dy,dx).
function tracar(n: Nivel, est: number[]): Traco {
  const espelho = new Map(n.mirrors.map((m, i) => [m.y * n.W + m.x, i]));
  const pedras = new Set(n.walls.map((w) => w.y * n.W + w.x));
  let x = -1, y = n.row, dx = 1, dy = 0, reflexos = 0;
  const pts: [number, number][] = [[0, n.row + 0.5]];
  for (let passo = 0; passo < 200; passo++) {
    const nx = x + dx, ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= n.W || ny >= n.H) { pts.push([x + 0.5 + dx * 0.5, y + 0.5 + dy * 0.5]); return { pts, reflexos, fim: "borda" }; }
    if (pedras.has(ny * n.W + nx)) { pts.push([x + 0.5 + dx * 0.5, y + 0.5 + dy * 0.5]); return { pts, reflexos, fim: "pedra" }; }
    x = nx; y = ny;
    pts.push([x + 0.5, y + 0.5]);
    if (x === n.target.x && y === n.target.y) return { pts, reflexos, fim: "lente" };
    const i = espelho.get(y * n.W + x);
    if (i !== undefined) {
      reflexos++;
      [dx, dy] = est[i] === 0 ? [-dy, -dx] : [dy, dx];
    }
  }
  return { pts, reflexos, fim: "borda" };
}

// Menor número de espelhos a virar: testa todas as combinações e fica com a mais próxima da posição inicial
function minimo(n: Nivel): number {
  const k = n.mirrors.length;
  const ini = n.mirrors.map((m) => m.e);
  let melhor = Infinity;
  for (let m = 0; m < 1 << k; m++) {
    const est = ini.map((_, i) => (m >> i) & 1);
    if (tracar(n, est).fim !== "lente") continue;
    melhor = Math.min(melhor, est.reduce((a, v, i) => a + (v !== ini[i] ? 1 : 0), 0));
  }
  return melhor;
}
const MINIMOS = NIVEIS.map(minimo);
const SOMA_MINIMOS = MINIMOS.reduce((a, b) => a + b, 0);
const iniciais = (n: Nivel) => n.mirrors.map((m) => m.e);

export default function Espelhos() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const extras = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [est, setEst] = useState<number[]>(() => iniciais(NIVEIS[0]));
  const [toques, setToques] = useState(0);
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);

  const n = NIVEIS[rodada];
  const feixe = tracar(n, est);
  const acesa = feixe.fim === "lente";
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const virar = (i: number) => {
    if (fim.current || travado) return;
    const novo = est.map((v, k) => (k === i ? 1 - v : v));
    const t = tracar(n, novo);
    const total = toques + 1;
    setEst(novo);
    setToques(total);
    audio.sfx.espelho(t.reflexos);
    if (t.fim !== "lente") {
      setMsg(`O feixe passa por ${t.reflexos} ${t.reflexos === 1 ? "espelho" : "espelhos"} e ${t.fim === "pedra" ? "bate numa pedra" : "escapa pela borda"}.`);
      return;
    }
    setTravado(true);
    extras.current += Math.max(0, total - MINIMOS[rodada]);
    agendar(() => audio.sfx.lenteAcesa(), 250);
    const nota = total === MINIMOS[rodada] ? "o mínimo possível" : `o mínimo era ${MINIMOS[rodada]}`;
    if (rodada < NIVEIS.length - 1) {
      setMsg(`A lente acende. Foram ${total} toques (${nota}). A luz sobe para a galeria seguinte.`);
      agendar(() => {
        const prox = rodada + 1;
        setRodada(prox);
        setEst(iniciais(NIVEIS[prox]));
        setToques(0);
        setTravado(false);
        setMsg(INTROS[prox]);
      }, 2200);
      return;
    }
    fim.current = true;
    agendar(() => { audio.sfx.porta(); audio.sfx.vitoria(); }, 700);
    giveItem("prata-da-torre");
    setMsg(`A lente acende e a luz sobe pela torre inteira, de espelho em espelho (${nota}).`);
    const extra = extras.current;
    agendar(() => complete("espelhos", {
      estrelas: extra <= 2 ? 3 : extra <= 6 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [
        `Toques acima do mínimo: ${extra} (mínimo total: ${SOMA_MINIMOS})`,
        reinicios.current ? `Galerias reiniciadas: ${reinicios.current}` : "Nenhum reinício",
      ],
    }), 2600);
  };

  const reiniciar = () => {
    if (fim.current || travado) return;
    reinicios.current++;
    setEst(iniciais(n));
    audio.sfx.interagir();
    setMsg("Os espelhos voltam à posição de antes. Os toques já feitos continuam contando.");
  };

  const pontos = feixe.pts.map(([x, y]) => `${x},${y}`).join(" ");

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-3 overflow-y-auto px-4 py-3 fase-compacta">
      <AmbienteFase tipo="biblioteca" />
      <div className="flex justify-center"><Cabecalho id="espelhos" /></div>

      <p className="font-narrativa italic text-espuma/80">Galeria {rodada + 1} de {NIVEIS.length}: {n.mirrors.length} espelhos, uma lente.</p>

      <div className="pl-8">
        <div className="relative mx-auto w-full" style={{ maxWidth: n.W * 60, aspectRatio: `${n.W} / ${n.H}` }}>
          {/* lâmpada de onde sai o feixe */}
          <span
            aria-label="Lâmpada: de onde sai a luz"
            role="img"
            className="absolute -left-7 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-lanterna text-[10px] text-abismo shadow-[0_0_14px_4px_rgba(255,191,0,0.5)]"
            style={{ top: `${((n.row + 0.5) / n.H) * 100}%` }}
          >▶</span>

          <div className="absolute inset-0 grid rounded-lg border border-latao/60 bg-abismo/50 backdrop-blur-sm" style={{ gridTemplateColumns: `repeat(${n.W}, 1fr)`, gridTemplateRows: `repeat(${n.H}, 1fr)` }}>
            {Array.from({ length: n.W * n.H }, (_, c) => {
              const x = c % n.W, y = Math.floor(c / n.W);
              const base = "border border-espuma/10";
              if (n.walls.some((w) => w.x === x && w.y === y)) {
                return <div key={c} aria-label="Pedra" role="img" className={`${base} bg-[#2a3d44] shadow-inner`} />;
              }
              if (x === n.target.x && y === n.target.y) {
                return (
                  <div key={c} role="img" aria-label={acesa ? "Lente acesa" : "Lente apagada"} className={`${base} flex items-center justify-center`}>
                    <span className={`h-3/5 w-3/5 rounded-full border-2 transition-all duration-300 ${acesa ? "border-lanterna bg-lanterna shadow-[0_0_24px_8px_rgba(255,191,0,0.6)]" : "border-lanterna/60 bg-mare/50"}`} />
                  </div>
                );
              }
              const i = n.mirrors.findIndex((m) => m.x === x && m.y === y);
              if (i >= 0) {
                return (
                  <button
                    key={c}
                    onClick={() => virar(i)}
                    aria-label={`Espelho na linha ${y + 1}, coluna ${x + 1}, inclinado como ${est[i] === 0 ? "barra" : "barra invertida"}. Toque para virar.`}
                    className={`${base} flex items-center justify-center bg-mare/30 transition-colors hover:bg-mare/60 active:scale-95`}
                  >
                    <svg viewBox="0 0 10 10" className="h-4/5 w-4/5" aria-hidden>
                      <line x1="1.5" y1={est[i] === 0 ? 8.5 : 1.5} x2="8.5" y2={est[i] === 0 ? 1.5 : 8.5} stroke="#DCE8EE" strokeWidth="1.6" strokeLinecap="round" style={{ transition: "all .25s" }} />
                    </svg>
                  </button>
                );
              }
              return <div key={c} className={base} aria-hidden />;
            })}
          </div>

          {/* o feixe, por cima de tudo mas sem pegar os toques */}
          <svg viewBox={`0 0 ${n.W} ${n.H}`} preserveAspectRatio="none" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" style={{ filter: "drop-shadow(0 0 4px rgba(255,191,0,0.8))" }}>
            <polyline points={pontos} fill="none" stroke="#FFBF00" strokeWidth="0.09" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Toques: {toques} · Reflexos: {feixe.reflexos}</span>
        <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 underline disabled:opacity-40">
          <RotateCcw size={14} aria-hidden /> Reiniciar
        </button>
      </p>

      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
