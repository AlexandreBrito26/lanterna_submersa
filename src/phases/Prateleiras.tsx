import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// Prateleiras iguais. Divida as cargas entre as prateleiras para que todas somem o mesmo peso.
// Toque numa carga e depois numa prateleira. Cada carga conta como uma ação. OTIMOS é o número de cargas (uma ação por carga).
const TRECHOS = [
  { pesos: [3, 3, 2, 2, 2], prateleiras: 2 },
  { pesos: [4, 3, 3, 2, 2, 2, 2], prateleiras: 3 },
];
const OTIMOS = TRECHOS.map((t) => t.pesos.length);
const SOMA_OTIMOS = OTIMOS.reduce((a, b) => a + b, 0);
const INTROS = [
  "Duas prateleiras e cinco cargas. Cada prateleira precisa somar o mesmo peso no final.",
  "Três prateleiras e sete cargas. Comece pelas cargas mais pesadas: elas definem o tamanho de cada prateleira.",
];

export default function PrateleirasFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const acoesTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [onde, setOnde] = useState<(number | null)[]>(() => TRECHOS[0].pesos.map(() => null));
  const [sel, setSel] = useState<number | null>(null);
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);
  const t = TRECHOS[rodada];
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };
  const soma = (k: number): number => onde.reduce<number>((s, p, i) => s + (p === k ? t.pesos[i] : 0), 0);
  const alvoPeso = t.pesos.reduce((a, b) => a + b, 0) / t.prateleiras;

  const colocar = (k: number) => {
    if (fim.current || travado || sel === null) return;
    const novo = [...onde]; novo[sel] = k;
    acoesTotal.current++;
    setOnde(novo); setSel(null); audio.sfx.prateleiras.colocar();
    if (novo.every((p) => p !== null) && t.prateleiras && Array.from({ length: t.prateleiras }, (_, j) => soma(j)).every((v) => v === alvoPeso)) { concluir(acoesTotal.current); return; }
    setMsg("A carga está na prateleira. Confira o peso de cada uma.");
  };

  const concluir = (n: number) => {
    setTravado(true);
    audio.sfx.prateleiras.completo();
    const nota = n === OTIMOS[rodada] ? "o mínimo de ações" : `o mínimo era ${OTIMOS[rodada]}`;
    if (rodada < TRECHOS.length - 1) {
      setMsg(`Todas as prateleiras pesam ${alvoPeso} (${nota}).`);
      agendar(() => { setRodada(rodada + 1); setOnde(TRECHOS[rodada + 1].pesos.map(() => null)); setSel(null); setTravado(false); setMsg(INTROS[rodada + 1]); }, 2300);
      return;
    }
    fim.current = true;
    giveItem("prateleiras-iguais");
    const total = acoesTotal.current;
    setMsg(`O armazém organiza as cargas com peso igual em cada prateleira (${nota}).`);
    agendar(() => complete("prateleiras", {
      estrelas: total <= SOMA_OTIMOS ? 3 : total <= SOMA_OTIMOS + 2 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Ações: ${total} (o mínimo seria ${SOMA_OTIMOS})`, reinicios.current ? `Armazéns refeitos: ${reinicios.current}` : "Nenhum armazém refeito"],
    }), 2800);
  };
  const reiniciar = () => { if (fim.current || travado) return; reinicios.current++; setOnde(t.pesos.map(() => null)); setSel(null); audio.sfx.interagir(); setMsg("As cargas voltam ao chão. As ações já feitas continuam contando."); };

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-5 overflow-y-auto px-6 py-10">
      <AmbienteFase tipo="catedral" />
      <div className="flex justify-center"><Cabecalho id="prateleiras" /></div>
      <p className="font-narrativa italic text-espuma/80">Estante {rodada + 1} de {TRECHOS.length}: peso igual em cada prateleira ({alvoPeso}).</p>
      <div className="mx-auto flex w-full flex-wrap justify-center gap-2" role="group" aria-label="Cargas">
        {t.pesos.map((p, i) => (
          <button key={i} onClick={() => setSel(i)} disabled={travado || onde[i] !== null}
            className={`rounded-xl border px-4 py-2 font-narrativa ${sel === i ? "border-lanterna bg-lanterna/20 text-lanterna" : onde[i] !== null ? "border-alga/40 opacity-40" : "border-latao/60"}`}>
            carga {p}
          </button>
        ))}
      </div>
      <div className="mx-auto grid w-full gap-3" style={{ gridTemplateColumns: `repeat(${t.prateleiras}, 1fr)` }}>
        {Array.from({ length: t.prateleiras }, (_, k) => (
          <button key={k} onClick={() => colocar(k)} disabled={travado || sel === null}
            className="flex min-h-[7rem] flex-col items-center gap-2 rounded-xl border border-latao/60 bg-mare/25 p-3 disabled:opacity-60">
            <span className="text-xs uppercase tracking-widest text-latao">prateleira {k + 1}</span>
            <span className="font-narrativa text-lg">{soma(k)} / {alvoPeso}</span>
            <span className="text-xs text-espuma/60">{t.pesos.map((p, i) => (onde[i] === k ? p : null)).filter((v) => v !== null).join(" + ") || "vazia"}</span>
          </button>
        ))}
      </div>
      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Ações: {acoesTotal.current}</span>
        <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 underline disabled:opacity-40"><RotateCcw size={14} aria-hidden /> Esvaziar as prateleiras</button>
      </p>
      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
