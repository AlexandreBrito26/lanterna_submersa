import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// Simetria do cofre. A grade precisa ficar simétrica no eixo vertical: cada casa tem o mesmo valor da casa espelhada.
// Algumas casas já estão travadas (cinza). Toque nas livres para pintá-las (1) ou apagá-las (0). OTIMOS é o mínimo de pinturas.
const TRECHOS = [
  { W: 4, H: 3, fixas: [null, 1, null, null, null, null, 0, null, null, null, null, 1] as (number | null)[] },
  { W: 4, H: 2, fixas: [0, null, null, null, null, 1, null, 0] as (number | null)[] },
];
function minimo(W: number, H: number, fixas: (number | null)[]): number {
  const livres: number[] = []; fixas.forEach((v, i) => { if (v === null) livres.push(i); });
  let best = Infinity;
  for (let mask = 0; mask < 1 << livres.length; mask++) {
    const g = fixas.map((v) => (v === null ? 0 : v));
    livres.forEach((p, k) => { g[p] = (mask >> k) & 1; });
    let ok = true;
    for (let y = 0; y < H && ok; y++) for (let x = 0; x < W; x++) if (g[y * W + x] !== g[y * W + (W - 1 - x)]) { ok = false; break; }
    if (ok) best = Math.min(best, livres.reduce((s, _, k) => s + ((mask >> k) & 1), 0));
  }
  return best;
}
const OTIMOS = TRECHOS.map((t) => minimo(t.W, t.H, t.fixas));
const SOMA_OTIMOS = OTIMOS.reduce((a, b) => a + b, 0);
const INTROS = [
  "Pense no espelho: o que está de um lado da grade precisa estar do outro. Algumas casas já estão travadas.",
  "Uma grade mais baixa, com poucas casas livres. Confira cada par espelhado antes de pintar.",
];

export default function SimetriaFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const pinturasTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [grade, setGrade] = useState<number[]>(() => TRECHOS[0].fixas.map((v) => (v === null ? 0 : v)));
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);
  const t = TRECHOS[rodada];
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };
  const simetrica = (g: number[]) => { for (let y = 0; y < t.H; y++) for (let x = 0; x < t.W; x++) if (g[y * t.W + x] !== g[y * t.W + (t.W - 1 - x)]) return false; return true; };

  const alternar = (p: number) => {
    if (fim.current || travado || t.fixas[p] !== null) return;
    const g = [...grade]; g[p] = 1 - g[p];
    pinturasTotal.current++;
    setGrade(g); audio.sfx.simetria.pintar();
    if (simetrica(g)) { concluir(pinturasTotal.current); return; }
    setMsg("A casa muda. Veja se o espelho dela acompanha.");
  };

  const concluir = (n: number) => {
    setTravado(true);
    audio.sfx.simetria.completo();
    const nota = n === OTIMOS[rodada] ? "o mínimo de pinturas" : `o mínimo era ${OTIMOS[rodada]}`;
    if (rodada < TRECHOS.length - 1) {
      setMsg(`A grade ficou simétrica com ${n} pinturas (${nota}).`);
      agendar(() => { setRodada(rodada + 1); setGrade(TRECHOS[rodada + 1].fixas.map((v) => (v === null ? 0 : v))); setTravado(false); setMsg(INTROS[rodada + 1]); }, 2300);
      return;
    }
    fim.current = true;
    giveItem("simetria-do-cofre");
    const total = pinturasTotal.current;
    setMsg(`O cofre se fecha em equilíbrio perfeito (${nota}).`);
    agendar(() => complete("simetria", {
      estrelas: total <= SOMA_OTIMOS ? 3 : total <= SOMA_OTIMOS + 2 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Pinturas: ${total} (o mínimo seria ${SOMA_OTIMOS})`, reinicios.current ? `Cofres refeitos: ${reinicios.current}` : "Nenhum cofre refeito"],
    }), 2800);
  };
  const reiniciar = () => { if (fim.current || travado) return; reinicios.current++; setGrade(t.fixas.map((v) => (v === null ? 0 : v))); audio.sfx.interagir(); setMsg("A grade volta ao começo. As pinturas já feitas continuam contando."); };

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-5 overflow-y-auto px-6 py-10">
      <AmbienteFase tipo="coral" />
      <div className="flex justify-center"><Cabecalho id="simetria" /></div>
      <p className="font-narrativa italic text-espuma/80">Cofre {rodada + 1} de {TRECHOS.length}: deixe a grade simétrica pelo eixo vertical.</p>
      <div role="grid" aria-label={`Grade ${t.W} por ${t.H}`} className="mx-auto grid w-full gap-2 rounded-lg border border-latao/60 bg-abismo/60 p-3"
        style={{ maxWidth: t.W * 72, gridTemplateColumns: `repeat(${t.W}, 1fr)` }}>
        {grade.map((v, p) => {
          const travada = t.fixas[p] !== null;
          return (
            <button key={p} onClick={() => alternar(p)} disabled={travado || travada}
              aria-label={`Casa ${v ? "pintada" : "apagada"}${travada ? ", travada" : ""}`}
              className={`aspect-square rounded-md border transition-colors duration-300 ${v ? "border-lanterna bg-lanterna/60" : "border-latao/50 bg-mare/25"} ${travada ? "opacity-70 ring-1 ring-espuma/40" : "hover:border-lanterna/60"} disabled:cursor-default`} />
          );
        })}
      </div>
      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Pinturas: {pinturasTotal.current}</span>
        <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 underline disabled:opacity-40"><RotateCcw size={14} aria-hidden /> Limpar a grade</button>
      </p>
      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
