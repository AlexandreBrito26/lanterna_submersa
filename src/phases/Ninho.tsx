import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// Ninho de pássaros. Coloque pássaros em casas livres. Toda casa livre precisa ter um pássaro nela
// ou ao lado (na horizontal ou vertical). Cercas (#) não recebem pássaros. OTIMOS é o mínimo de pássaros, por enumeração.
const TRECHOS = [
  [".....", ".#.#.", "....."],
  ["...", ".#.", "..."],
];
type Trecho = { W: number; H: number; celulas: string[]; livres: number[] };
function ler(m: string[]): Trecho {
  const celulas = m.flatMap((l) => [...l]);
  return { W: m[0].length, H: m.length, celulas, livres: celulas.map((c, i) => (c === "." ? i : -1)).filter((i) => i >= 0) };
}
const TRE = TRECHOS.map(ler);
function vizinhas(t: Trecho, i: number): number[] {
  const x = i % t.W, y = Math.floor(i / t.W);
  return [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [x + dx, y + dy]).filter(([a, b]) => a >= 0 && b >= 0 && a < t.W && b < t.H).map(([a, b]) => b * t.W + a);
}
function coberto(t: Trecho, p: Set<number>): boolean {
  return t.livres.every((i) => p.has(i) || vizinhas(t, i).some((q) => p.has(q)));
}
function minimo(t: Trecho): number {
  let best = Infinity;
  for (let mask = 1; mask < 1 << t.livres.length; mask++) {
    const p = new Set(t.livres.filter((_, k) => (mask >> k) & 1));
    if (coberto(t, p)) best = Math.min(best, p.size);
  }
  return best;
}
const OTIMOS = TRE.map(minimo);
const SOMA_OTIMOS = OTIMOS.reduce((a, b) => a + b, 0);
const INTROS = [
  "Os pássaros precisam ficar perto de todas as casas livres: ou em cima delas, ou ao lado. Use o mínimo de pássaros.",
  "Uma grade menor, com uma cerca no meio. Confira cada casa antes de pousar o próximo pássaro.",
];

export default function NinhoFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const pousosTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [aves, setAves] = useState<Set<number>>(new Set());
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);
  const t = TRE[rodada];
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const alternar = (i: number) => {
    if (fim.current || travado || t.celulas[i] !== ".") return;
    const na = new Set(aves);
    if (na.has(i)) { na.delete(i); audio.sfx.ninho.sair(); }
    else { na.add(i); pousosTotal.current++; audio.sfx.ninho.pousar(); }
    setAves(na);
    if (coberto(t, na) && na.size > 0) { concluir(na.size); return; }
    setMsg(`${t.livres.filter((i) => na.has(i) || vizinhas(t, i).some((q) => na.has(q))).length} de ${t.livres.length} casas protegidas.`);
  };

  const concluir = (n: number) => {
    setTravado(true);
    audio.sfx.ninho.completo();
    const nota = n === OTIMOS[rodada] ? "o mínimo de pássaros" : `o mínimo era ${OTIMOS[rodada]}`;
    if (rodada < TRE.length - 1) {
      setMsg(`Todas as casas têm um pássaro por perto, com ${n} aves (${nota}).`);
      agendar(() => { setRodada(rodada + 1); setAves(new Set()); setTravado(false); setMsg(INTROS[rodada + 1]); }, 2300);
      return;
    }
    fim.current = true;
    giveItem("ninho-de-passaros");
    const total = pousosTotal.current;
    setMsg(`Os pássaros cantam sobre o jardim inteiro (${nota}).`);
    agendar(() => complete("ninho", {
      estrelas: total <= SOMA_OTIMOS ? 3 : total <= SOMA_OTIMOS + 2 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Pousos: ${total} (o mínimo seria ${SOMA_OTIMOS})`, reinicios.current ? `Ninhos refeitos: ${reinicios.current}` : "Nenhum ninho refeito"],
    }), 2800);
  };

  const reiniciar = () => { if (fim.current || travado) return; reinicios.current++; setAves(new Set()); audio.sfx.interagir(); setMsg("Os pássaros voam para longe. Os pousos já feitos continuam contando."); };

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-3 overflow-y-auto px-4 py-3 fase-compacta">
      <AmbienteFase tipo="coral" />
      <div className="flex justify-center"><Cabecalho id="ninho" /></div>
      <p className="font-narrativa italic text-espuma/80">Jardim {rodada + 1} de {TRE.length}: proteja cada casa com um pássaro por perto.</p>
      <div role="grid" aria-label={`Jardim ${t.W} por ${t.H}`} className="mx-auto grid w-full gap-2 rounded-lg border border-latao/60 bg-abismo/60 p-3"
        style={{ maxWidth: t.W * 72, gridTemplateColumns: `repeat(${t.W}, 1fr)` }}>
        {t.celulas.map((c, i) => {
          if (c === "#") return <div key={i} className="aspect-square rounded-md bg-[#2a3d44]" />;
          const ave = aves.has(i), protegida = ave || vizinhas(t, i).some((q) => aves.has(q));
          return (
            <button key={i} onClick={() => alternar(i)} disabled={travado} aria-label={ave ? "Pássaro pousado" : protegida ? "Casa protegida" : "Casa sem proteção"}
              className={`flex aspect-square items-center justify-center rounded-md border transition-colors duration-300 ${ave ? "border-lanterna bg-lanterna/40" : protegida ? "border-alga/60 bg-alga/20" : "border-latao/50 bg-mare/25"} disabled:cursor-default`}>
              {ave && <span className="font-narrativa text-lg" aria-hidden>🐦</span>}
            </button>
          );
        })}
      </div>
      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Pássaros: {aves.size}</span>
        <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 underline disabled:opacity-40"><RotateCcw size={14} aria-hidden /> Espantar os pássaros</button>
      </p>
      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
