import { useEffect, useRef, useState } from "react";
import { Shield, RotateCcw } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// Pedra aquecida. O fogo sai de F e se espalha por casas livres. Coloque pedras (casas com escudo) para
// bloquear o fogo: nenhum alvo (T) pode queimar. OTIMOS é o menor número de pedras de cada trecho (busca exaustiva).
const MAPAS = [
  ["F..T", "....", "..T."],
  ["F....", ".#...", "...T.", ".T..."],
];
type Trecho = { W: number; H: number; celulas: string[]; F: number; alvos: number[]; livres: number[] };
function ler(m: string[]): Trecho {
  const c = m.flatMap((l) => [...l]);
  return { W: m[0].length, H: m.length, celulas: c, F: c.indexOf("F"), alvos: c.map((v, i) => (v === "T" ? i : -1)).filter((i) => i >= 0), livres: c.map((v, i) => (v === "." ? i : -1)).filter((i) => i >= 0) };
}
const TRECHOS = MAPAS.map(ler);
function alcance(t: Trecho, pedras: Set<number>): Set<number> {
  const seen = new Set([t.F]); const fila = [t.F];
  for (let i = 0; i < fila.length; i++) { const p = fila[i], x = p % t.W, y = Math.floor(p / t.W);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= t.W || ny >= t.H) continue; const q = ny * t.W + nx;
      if (t.celulas[q] === "#" || pedras.has(q) || seen.has(q)) continue; seen.add(q); fila.push(q); } }
  return seen;
}
function minimo(t: Trecho): number {
  let best = Infinity;
  for (let mask = 0; mask < 1 << t.livres.length; mask++) {
    const p = new Set(t.livres.filter((_, i) => (mask >> i) & 1));
    const a = alcance(t, p);
    if (t.alvos.every((x) => !a.has(x))) best = Math.min(best, p.size);
  }
  return best;
}
const OTIMOS = TRECHOS.map(minimo);
const SOMA_OTIMOS = OTIMOS.reduce((a, b) => a + b, 0);
const INTROS = [
  "O fogo sai da casa F e corre por todas as casas livres. Ponha pedras para proteger os alvos T.",
  "Há uma pedra no meio do caminho do fogo. Quantas pedras você precisa para deixar o fogo longe de todos os alvos?",
];

export default function AquecidaFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const pedrasTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [pedras, setPedras] = useState<Set<number>>(new Set());
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);
  const t = TRECHOS[rodada];
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };
  const fogo = alcance(t, pedras);
  const queimando = t.alvos.filter((x) => fogo.has(x)).length;

  const alternar = (p: number) => {
    if (fim.current || travado || t.celulas[p] !== ".") return;
    const np = new Set(pedras);
    if (np.has(p)) { np.delete(p); audio.sfx.aquecidaFase.tirar(); }
    else { np.add(p); pedrasTotal.current++; audio.sfx.aquecidaFase.pedra(); }
    setPedras(np);
    const f = alcance(t, np);
    if (t.alvos.every((x) => !f.has(x))) { concluir(np.size); return; }
    setMsg(`${t.alvos.filter((x) => f.has(x)).length} alvo(s) ainda em chamas.`);
  };

  const concluir = (n: number) => {
    setTravado(true);
    audio.sfx.aquecidaFase.completo();
    const nota = n === OTIMOS[rodada] ? "o mínimo de pedras" : `o mínimo era ${OTIMOS[rodada]}`;
    if (rodada < TRECHOS.length - 1) {
      setMsg(`O fogo para diante das pedras, com ${n} ${n === 1 ? "pedra" : "pedras"} (${nota}).`);
      agendar(() => { setRodada(rodada + 1); setPedras(new Set()); setTravado(false); setMsg(INTROS[rodada + 1]); }, 2300);
      return;
    }
    fim.current = true;
    giveItem("pedra-aquecida");
    setMsg(`O calor fica preso do lado de fora e os alvos seguem seguros (${nota}).`);
    agendar(() => complete("aquecida", {
      estrelas: pedrasTotal.current <= SOMA_OTIMOS ? 3 : pedrasTotal.current <= SOMA_OTIMOS + 1 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Pedras postas: ${pedrasTotal.current} (o mínimo seria ${SOMA_OTIMOS})`, reinicios.current ? `Campos refeitos: ${reinicios.current}` : "Nenhum campo refeito"],
    }), 2800);
  };

  const reiniciar = () => { if (fim.current || travado) return; reinicios.current++; setPedras(new Set()); audio.sfx.interagir(); setMsg("As pedras são recolhidas. As que já foram postas continuam contando."); };

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-5 overflow-y-auto px-6 py-10">
      <AmbienteFase tipo="chama" />
      <div className="flex justify-center"><Cabecalho id="aquecida" /></div>
      <p className="font-narrativa italic text-espuma/80">Campo {rodada + 1} de {TRECHOS.length}: proteja todos os alvos do fogo.</p>
      <div role="grid" aria-label={`Campo ${t.W} por ${t.H}, ${queimando} alvos em chamas`} className="mx-auto grid w-full gap-2 rounded-lg border border-latao/60 bg-abismo/60 p-3"
        style={{ maxWidth: t.W * 70, gridTemplateColumns: `repeat(${t.W}, 1fr)` }}>
        {t.celulas.map((c, p) => {
          if (c === "#") return <div key={p} className="aspect-square rounded-md bg-[#2a3d44]" />;
          const pedra = pedras.has(p), chama = fogo.has(p) && !pedra;
          return (
            <button key={p} onClick={() => alternar(p)} disabled={travado || c !== "." && !pedra}
              aria-label={c === "F" ? "Origem do fogo" : c === "T" ? `Alvo ${fogo.has(p) ? "em chamas" : "seguro"}` : pedra ? "Pedra" : "Casa livre"}
              className={`relative flex aspect-square items-center justify-center rounded-md border transition-colors duration-300 ${c === "F" ? "border-coral bg-coral/50" : c === "T" ? (fogo.has(p) ? "border-coral bg-coral/35" : "border-alga bg-alga/25") : pedra ? "border-espuma/60 bg-latao/40" : chama ? "bg-coral/25 border-latao/40" : "border-latao/40 bg-mare/25"} disabled:cursor-default`}>
              {c === "F" && <span className="font-narrativa text-sm">F</span>}
              {c === "T" && <span className="font-narrativa text-sm">T</span>}
              {pedra && <Shield size={16} aria-hidden />}
            </button>
          );
        })}
      </div>
      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Pedras: {pedras.size}</span>
        <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 underline disabled:opacity-40"><RotateCcw size={14} aria-hidden /> Recolher pedras</button>
      </p>
      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
