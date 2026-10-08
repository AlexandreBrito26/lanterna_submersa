import { Fragment, useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// Fósforo curto. A lenha está espalhada (casas com w). Cada fósforo acende uma linha ou uma coluna inteira.
// Acenda toda a lenha com o menor número de fósforos. OTIMOS é o mínimo de cada trecho, por busca exaustiva.
const MAPAS = [
  ["w.w.", "ww..", "..w.", "w..w"],
  ["ww..w", ".w.w.", "w...w", "..ww."],
];
type Trecho = { W: number; H: number; lenha: [number, number][] };
function ler(m: string[]): Trecho {
  const lenha: [number, number][] = [];
  m.forEach((l, y) => [...l].forEach((c, x) => { if (c === "w") lenha.push([x, y]); }));
  return { W: m[0].length, H: m.length, lenha };
}
const TRECHOS = MAPAS.map(ler);
type Linha = { tipo: "L" | "C"; i: number };
function cobertura(t: Trecho, usadas: Linha[]): Set<number> {
  const cov = new Set<number>();
  t.lenha.forEach(([x, y], k) => { if (usadas.some((ln) => (ln.tipo === "L" ? y === ln.i : x === ln.i))) cov.add(k); });
  return cov;
}
function minimo(t: Trecho): number {
  const linhas: Linha[] = [
    ...Array.from({ length: t.H }, (_, i) => ({ tipo: "L" as const, i })),
    ...Array.from({ length: t.W }, (_, i) => ({ tipo: "C" as const, i })),
  ];
  let best = Infinity;
  for (let mask = 0; mask < 1 << linhas.length; mask++) {
    const usadas = linhas.filter((_, j) => (mask >> j) & 1);
    if (cobertura(t, usadas).size === t.lenha.length) best = Math.min(best, usadas.length);
  }
  return best;
}
const OTIMOS = TRECHOS.map(minimo);
const SOMA_OTIMOS = OTIMOS.reduce((a, b) => a + b, 0);
const INTROS = [
  "Cada fósforo acende uma linha ou uma coluna inteira. Procure as linhas que cobrem mais lenha de uma vez.",
  "Mais lenha espalhada, e algumas casas ficam sozinhas. Uma coluna pode salvar várias linhas de uma vez.",
];

export default function FosforoFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const fosforosTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [usadas, setUsadas] = useState<Linha[]>([]);
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);
  const t = TRECHOS[rodada];
  const cov = cobertura(t, usadas);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const riscar = (ln: Linha) => {
    if (fim.current || travado) return;
    if (usadas.some((u) => u.tipo === ln.tipo && u.i === ln.i)) { setMsg("Essa linha já foi acesa."); return; }
    const nu = [...usadas, ln];
    fosforosTotal.current++;
    setUsadas(nu);
    audio.sfx.fosforoFase.riscar();
    if (cobertura(t, nu).size === t.lenha.length) { concluir(nu.length); return; }
    setMsg(`${cobertura(t, nu).size} de ${t.lenha.length} casas de lenha acesas.`);
  };

  const concluir = (n: number) => {
    setTravado(true);
    audio.sfx.fosforoFase.completo();
    const nota = n === OTIMOS[rodada] ? "o mínimo de fósforos" : `o mínimo era ${OTIMOS[rodada]}`;
    if (rodada < TRECHOS.length - 1) {
      setMsg(`Toda a lenha queima com ${n} fósforos (${nota}).`);
      agendar(() => { setRodada(rodada + 1); setUsadas([]); setTravado(false); setMsg(INTROS[rodada + 1]); }, 2300);
      return;
    }
    fim.current = true;
    giveItem("fosforo-curto");
    setMsg(`A última linha de lenha queima, e a praça fica iluminada (${nota}).`);
    agendar(() => complete("fosforo", {
      estrelas: fosforosTotal.current <= SOMA_OTIMOS ? 3 : fosforosTotal.current <= SOMA_OTIMOS + 1 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Fósforos: ${fosforosTotal.current} (o mínimo seria ${SOMA_OTIMOS})`, reinicios.current ? `Praças refeitas: ${reinicios.current}` : "Nenhuma praça refeita"],
    }), 2800);
  };

  const reiniciar = () => { if (fim.current || travado) return; reinicios.current++; setUsadas([]); audio.sfx.interagir(); setMsg("A lenha é recolhida. Os fósforos já riscados continuam contando."); };

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-5 overflow-y-auto px-6 py-10">
      <AmbienteFase tipo="chama" />
      <div className="flex justify-center"><Cabecalho id="fosforo" /></div>
      <p className="font-narrativa italic text-espuma/80">Praça {rodada + 1} de {TRECHOS.length}: acenda toda a lenha com os fósforos.</p>
      <div className="mx-auto w-full" style={{ maxWidth: (t.W + 1) * 52 }}>
        <div className="grid gap-1" style={{ gridTemplateColumns: `auto repeat(${t.W}, 1fr)` }}>
          <div />
          {Array.from({ length: t.W }, (_, x) => (
            <button key={`c${x}`} onClick={() => riscar({ tipo: "C", i: x })} disabled={travado} aria-label={`Riscar coluna ${x + 1}`}
              className="rounded-md border border-latao/50 py-1 text-xs text-latao active:scale-95 disabled:opacity-40">↓</button>
          ))}
          {Array.from({ length: t.H }, (_, y) => (
            <Fragment key={`linha-${y}`}>
              <button onClick={() => riscar({ tipo: "L", i: y })} disabled={travado} aria-label={`Riscar linha ${y + 1}`}
                className="rounded-md border border-latao/50 px-2 text-xs text-latao active:scale-95 disabled:opacity-40">→</button>
              {Array.from({ length: t.W }, (_, x) => {
                const k = t.lenha.findIndex(([lx, ly]) => lx === x && ly === y);
                const lenha = k >= 0, acesa = lenha && cov.has(k);
                return (
                  <div key={`${x}-${y}`} role="img" aria-label={lenha ? (acesa ? "Lenha acesa" : "Lenha apagada") : "Chão"}
                    className={`aspect-square rounded-md border ${lenha ? (acesa ? "border-lanterna bg-lanterna/70 shadow-[0_0_10px_2px_rgba(255,191,0,0.4)]" : "border-latao/60 bg-[#6e4f33]") : "border-mare/30 bg-mare/15"}`} />
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Fósforos: {usadas.length} · Lenha acesa: {cov.size}/{t.lenha.length}</span>
        <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 underline disabled:opacity-40"><RotateCcw size={14} aria-hidden /> Recolher a lenha</button>
      </p>
      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
