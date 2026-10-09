import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// Queda de sementes. Escolha uma coluna: a semente cai até a casa mais baixa livre dela (pedras param a queda).
// Encha exatamente as casas marcadas (●), sem sobrar semente fora delas. Cada queda conta como uma ação.
// OTIMOS é o número de casas marcadas: cada uma precisa de exatamente uma queda.
const TRECHOS = [
  { W: 3, H: 3, pedras: [] as number[], alvo: [6, 7, 8, 4] },
  { W: 3, H: 4, pedras: [3] as number[], alvo: [9, 10, 11, 7] },
];
const OTIMOS = TRECHOS.map((t) => t.alvo.length);
const SOMA_OTIMOS = OTIMOS.reduce((a, b) => a + b, 0);
const INTROS = [
  "A semente cai até encontrar o chão ou outra semente. Encha as casas marcadas, sem deixar nenhuma semente fora delas.",
  "Uma pedra segura a queda a meio caminho. Solte as sementes pelas colunas certas para que cada uma pouse no lugar.",
];

export default function QuedaFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const quedasTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [cheias, setCheias] = useState<Set<number>>(new Set());
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);
  const t = TRECHOS[rodada];
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const soltar = (c: number) => {
    if (fim.current || travado) return;
    let r = t.H - 1;
    while (r >= 0 && (cheias.has(r * t.W + c) || t.pedras.includes(r * t.W + c))) r--;
    if (r < 0) { audio.sfx.queda.falha(); setMsg("A coluna está cheia até o topo."); return; }
    const p = r * t.W + c;
    const novo = new Set(cheias); novo.add(p);
    quedasTotal.current++;
    setCheias(novo); audio.sfx.queda.cair();
    const foraAlvo = [...novo].some((q) => !t.alvo.includes(q));
    if (foraAlvo) { setMsg("Uma semente caiu fora das marcas. Recomece a horta."); return; }
    if (t.alvo.every((q) => novo.has(q))) { concluir(quedasTotal.current); return; }
    setMsg("A semente pousa no chão da coluna.");
  };

  const concluir = (n: number) => {
    setTravado(true);
    audio.sfx.queda.completo();
    const nota = n === OTIMOS[rodada] ? "o mínimo de quedas" : `o mínimo era ${OTIMOS[rodada]}`;
    if (rodada < TRECHOS.length - 1) {
      setMsg(`A horta está plantada, com ${n} quedas (${nota}).`);
      agendar(() => { setRodada(rodada + 1); setCheias(new Set()); setTravado(false); setMsg(INTROS[rodada + 1]); }, 2300);
      return;
    }
    fim.current = true;
    giveItem("queda-de-sementes");
    const total = quedasTotal.current;
    setMsg(`Cada semente pousou no seu lugar, e a horta brota (${nota}).`);
    agendar(() => complete("queda", {
      estrelas: total <= SOMA_OTIMOS ? 3 : total <= SOMA_OTIMOS + 2 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Quedas: ${total} (o mínimo seria ${SOMA_OTIMOS})`, reinicios.current ? `Hortas refeitas: ${reinicios.current}` : "Nenhuma horta refeita"],
    }), 2800);
  };

  const reiniciar = () => { if (fim.current || travado) return; reinicios.current++; setCheias(new Set()); audio.sfx.interagir(); setMsg("A horta é revolvida. As quedas já feitas continuam contando."); };

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-3 overflow-y-auto px-4 py-3 fase-compacta">
      <AmbienteFase tipo="coral" />
      <div className="flex justify-center"><Cabecalho id="queda" /></div>
      <p className="font-narrativa italic text-espuma/80">Horta {rodada + 1} de {TRECHOS.length}: encha exatamente as marcas.</p>
      <div className="mx-auto grid w-full gap-2 rounded-lg border border-latao/60 bg-abismo/60 p-3" style={{ maxWidth: t.W * 72, gridTemplateColumns: `repeat(${t.W}, 1fr)` }}>
        {Array.from({ length: t.W * t.H }, (_, p) => {
          const pedra = t.pedras.includes(p), semente = cheias.has(p), marca = t.alvo.includes(p);
          return (
            <div key={p} className={`aspect-square rounded-md border ${pedra ? "border-espuma/40 bg-[#2a3d44]" : semente ? "border-alga/70 bg-alga/50" : marca ? "border-lanterna/60 border-dashed" : "border-latao/40 bg-mare/25"}`}>
              {marca && !semente && <span className="block h-full w-full text-center text-xs leading-[3rem] text-lanterna">●</span>}
            </div>
          );
        })}
      </div>
      <div className="mx-auto grid gap-2" style={{ maxWidth: t.W * 72, gridTemplateColumns: `repeat(${t.W}, 1fr)` }} role="group" aria-label="Soltar semente">
        {Array.from({ length: t.W }, (_, c) => (
          <button key={c} onClick={() => soltar(c)} disabled={travado} className="rounded-xl border border-lanterna/60 bg-mare/40 py-3 font-narrativa text-lanterna disabled:opacity-40">↓ {c + 1}</button>
        ))}
      </div>
      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Quedas: {quedasTotal.current}</span>
        <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 underline disabled:opacity-40"><RotateCcw size={14} aria-hidden /> Revolver a horta</button>
      </p>
      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
