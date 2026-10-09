import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// Tanques da chuva. Jarros de capacidades fixas, todos vazios. Encha, esvazie ou passe água de um jarro para outro.
// Consiga que algum jarro tenha exatamente o volume pedido. OTIMOS é o mínimo de ações (busca em largura).
const TRECHOS = [
  { caps: [5, 3], alvo: 4 },
  { caps: [7, 4, 3], alvo: 5 },
];
function minimo(caps: number[], alvo: number): number {
  const n = caps.length; const ini = caps.map(() => 0);
  const fila: [number[], number][] = [[ini, 0]]; const vist = new Set([ini.join(",")]);
  for (let i = 0; i < fila.length; i++) {
    const [v, d] = fila[i];
    if (v.includes(alvo)) return d;
    const add = (w: number[]) => { const k = w.join(","); if (!vist.has(k)) { vist.add(k); fila.push([w, d + 1]); } };
    for (let a = 0; a < n; a++) {
      const enc = [...v]; enc[a] = caps[a]; add(enc);
      const esv = [...v]; esv[a] = 0; add(esv);
      for (let b = 0; b < n; b++) if (a !== b) { const w = [...v]; const t = Math.min(v[a], caps[b] - v[b]); w[a] -= t; w[b] += t; add(w); }
    }
  }
  return Infinity;
}
const OTIMOS = TRECHOS.map((t) => minimo(t.caps, t.alvo));
const SOMA_OTIMOS = OTIMOS.reduce((a, b) => a + b, 0);
const INTROS = [
  "Dois jarros, um de 5 e outro de 3 litros. Consiga exatamente 4 litros em algum deles.",
  "Três jarros agora. Passe água de um para outro, e veja o que sobra em cada um.",
];

export default function TanquesFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const acoesTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [vol, setVol] = useState<number[]>(TRECHOS[0].caps.map(() => 0));
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);
  const t = TRECHOS[rodada];
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const acao = (novo: number[]) => {
    if (fim.current || travado) return;
    acoesTotal.current++;
    setVol(novo); audio.sfx.tanques.agua();
    if (novo.includes(t.alvo)) { concluir(acoesTotal.current); return; }
    setMsg("A água se move de um jarro para o outro.");
  };
  const encher = (i: number) => { const v = [...vol]; v[i] = t.caps[i]; acao(v); };
  const esvaziar = (i: number) => { const v = [...vol]; v[i] = 0; acao(v); };
  const passar = (a: number, b: number) => { const v = [...vol]; const x = Math.min(v[a], t.caps[b] - v[b]); v[a] -= x; v[b] += x; acao(v); };

  const concluir = (n: number) => {
    setTravado(true);
    audio.sfx.tanques.completo();
    const nota = n === OTIMOS[rodada] ? "o mínimo de ações" : `o mínimo era ${OTIMOS[rodada]}`;
    if (rodada < TRECHOS.length - 1) {
      setMsg(`Um dos jarros marca exatamente ${t.alvo} com ${n} ações (${nota}).`);
      agendar(() => { setRodada(rodada + 1); setVol(TRECHOS[rodada + 1].caps.map(() => 0)); setTravado(false); setMsg(INTROS[rodada + 1]); }, 2300);
      return;
    }
    fim.current = true;
    giveItem("tanques-da-chuva");
    const total = acoesTotal.current;
    setMsg(`A água da chuva se divide na medida certa (${nota}).`);
    agendar(() => complete("tanques", {
      estrelas: total <= SOMA_OTIMOS ? 3 : total <= SOMA_OTIMOS + 2 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Ações: ${total} (o mínimo seria ${SOMA_OTIMOS})`, reinicios.current ? `Tanques refeitos: ${reinicios.current}` : "Nenhum tanque refeito"],
    }), 2800);
  };
  const reiniciar = () => { if (fim.current || travado) return; reinicios.current++; setVol(t.caps.map(() => 0)); audio.sfx.interagir(); setMsg("Os jarros são esvaziados. As ações já feitas continuam contando."); };

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-3 overflow-y-auto px-4 py-3 fase-compacta">
      <AmbienteFase tipo="catedral" />
      <div className="flex justify-center"><Cabecalho id="tanques" /></div>
      <p className="font-narrativa italic text-espuma/80">Jarros {rodada + 1} de {TRECHOS.length}: consiga exatamente {t.alvo} em algum jarro.</p>
      <div className="mx-auto flex w-full flex-wrap items-end justify-center gap-4">
        {t.caps.map((c, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="relative w-16 overflow-hidden rounded-b-2xl border-2 border-latao/70" style={{ height: c * 22 }}>
              <div className="absolute bottom-0 left-0 right-0 bg-mare/70 transition-all duration-500" style={{ height: `${(vol[i] / c) * 100}%` }} />
            </div>
            <span className="font-narrativa text-sm">{vol[i]} / {c}</span>
            <div className="flex gap-1">
              <button onClick={() => encher(i)} disabled={travado} className="rounded-md border border-mare px-2 py-1 text-xs disabled:opacity-40">encher</button>
              <button onClick={() => esvaziar(i)} disabled={travado} className="rounded-md border border-mare px-2 py-1 text-xs disabled:opacity-40">esvaziar</button>
            </div>
          </div>
        ))}
      </div>
      <div className="mx-auto flex flex-wrap justify-center gap-2" role="group" aria-label="Passar água">
        {t.caps.flatMap((_, a) => t.caps.map((_, b) => (a === b ? null : (
          <button key={`${a}-${b}`} onClick={() => passar(a, b)} disabled={travado} className="rounded-md border border-latao/60 px-2 py-1 text-xs disabled:opacity-40">{a + 1} → {b + 1}</button>
        )))).filter(Boolean)}
      </div>
      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Ações: {acoesTotal.current}</span>
        <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 underline disabled:opacity-40"><RotateCcw size={14} aria-hidden /> Esvaziar tudo</button>
      </p>
      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
