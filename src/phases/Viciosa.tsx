import { useEffect, useRef, useState } from "react";
import { Flame, RotateCcw } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// Brasa viciosa. Cada casa tem um limiar: ela só acende quando tem pelo menos esse número de vizinhas acesas.
// Você acende algumas casas manualmente; o fogo faz o resto. Acenda a costa inteira com o menor número de toques.
const TRECHOS = [
  [[2, 2, 2], [2, 1, 2], [2, 2, 2]],
  [[2, 2, 1], [1, 2, 2], [2, 1, 2]],
];
function cascata(lim: number[][], manual: Set<number>): boolean[] {
  const H = lim.length, W = lim[0].length; const on = Array(W * H).fill(false);
  manual.forEach((i) => { on[i] = true; });
  let mudou = true;
  while (mudou) { mudou = false;
    for (let i = 0; i < W * H; i++) { if (on[i]) continue; const x = i % W, y = Math.floor(i / W); let n = 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < W && ny < H && on[ny * W + nx]) n++; }
      if (n >= lim[y][x]) { on[i] = true; mudou = true; } } }
  return on;
}
function minimo(lim: number[][]): number {
  const N = lim.length * lim[0].length; let best = Infinity;
  for (let mask = 1; mask < 1 << N; mask++) {
    const manual = new Set<number>(); for (let i = 0; i < N; i++) if ((mask >> i) & 1) manual.add(i);
    if (cascata(lim, manual).every(Boolean)) best = Math.min(best, manual.size);
  }
  return best;
}
const OTIMOS = TRECHOS.map(minimo);
const SOMA_OTIMOS = OTIMOS.reduce((a, b) => a + b, 0);
const INTROS = [
  "Algumas casas só acendem quando as vizinhas já estão queimando. Escolha por onde começar o fogo.",
  "Agora as casas exigem mais vizinhas. Comece pelas que o fogo não alcança sozinho.",
];

export default function ViciosaFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const togglesTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [manual, setManual] = useState<Set<number>>(new Set());
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);
  const lim = TRECHOS[rodada];
  const W = lim[0].length, H = lim.length;
  const on = cascata(lim, manual);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const acender = (i: number) => {
    if (fim.current || travado || on[i]) return;
    const nm = new Set(manual); nm.add(i);
    togglesTotal.current++;
    setManual(nm);
    audio.sfx.viciosaFase.acender();
    const novo = cascata(lim, nm);
    if (novo.every(Boolean)) concluir(nm.size);
    else setMsg(`${novo.filter(Boolean).length} de ${W * H} casas queimando.`);
  };

  const concluir = (n: number) => {
    setTravado(true);
    audio.sfx.viciosaFase.completo();
    const nota = n === OTIMOS[rodada] ? "o mínimo de toques" : `o mínimo era ${OTIMOS[rodada]}`;
    if (rodada < TRECHOS.length - 1) {
      setMsg(`A costa queima toda com ${n} ${n === 1 ? "toque" : "toques"} (${nota}).`);
      agendar(() => { setRodada(rodada + 1); setManual(new Set()); setTravado(false); setMsg(INTROS[rodada + 1]); }, 2300);
      return;
    }
    fim.current = true;
    giveItem("brasa-viciosa");
    const total = togglesTotal.current;
    setMsg(`O fogo se espalha sozinho pela costa inteira (${nota}).`);
    agendar(() => complete("viciosa", {
      estrelas: total <= SOMA_OTIMOS ? 3 : total <= SOMA_OTIMOS + 2 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Toques: ${total} (o mínimo seria ${SOMA_OTIMOS})`, reinicios.current ? `Costas refeitas: ${reinicios.current}` : "Nenhuma costa refeita"],
    }), 2800);
  };

  const reiniciar = () => {
    if (fim.current || travado) return;
    reinicios.current++;
    setManual(new Set());
    audio.sfx.interagir();
    setMsg("A costa esfria por completo. Os toques já dados continuam contando.");
  };

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-3 overflow-y-auto px-4 py-3 fase-compacta">
      <AmbienteFase tipo="chama" />
      <div className="flex justify-center"><Cabecalho id="viciosa" /></div>
      <p className="font-narrativa italic text-espuma/80">Costa {rodada + 1} de {TRECHOS.length}: faça o fogo correr por toda a costa.</p>
      <div role="grid" aria-label={`Costa ${W} por ${H}`} className="mx-auto grid w-full gap-2 rounded-lg border border-latao/60 bg-abismo/60 p-3"
        style={{ maxWidth: W * 78, gridTemplateColumns: `repeat(${W}, 1fr)` }}>
        {on.map((v, i) => (
          <button key={i} onClick={() => acender(i)} disabled={travado || v} aria-label={`Casa exige ${lim[Math.floor(i / W)][i % W]} vizinhas, ${v ? "queimando" : "apagada"}`}
            className={`relative flex aspect-square items-center justify-center rounded-md border transition-all duration-500 ${v ? "border-lanterna bg-lanterna/50" : "border-latao/60 bg-mare/25 hover:border-lanterna/60"} disabled:cursor-default`}>
            <span className="font-narrativa text-sm text-espuma/70">{lim[Math.floor(i / W)][i % W]}</span>
            {v && <Flame size={16} className="absolute text-abismo" aria-hidden />}
          </button>
        ))}
      </div>
      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Toques: {togglesTotal.current} · O número em cada casa é a vizinhas necessárias</span>
        <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 underline disabled:opacity-40"><RotateCcw size={14} aria-hidden /> Esfriar</button>
      </p>
      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
