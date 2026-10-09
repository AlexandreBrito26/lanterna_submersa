import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// Mosaico de luz. Preencha a grade 4x4 com casas acesas (1) ou apagadas (0). Regras:
// cada linha e cada coluna tem exatamente metade de casas acesas, e não pode haver três casas seguidas
// do mesmo estado. Algumas casas já estão travadas. Cada casa pintada conta como uma ação.
// OTIMOS é o mínimo de casas que precisam ser acesas para fechar um mosaico válido (enumeração exaustiva).
type Celula = number | null;
const TRECHOS: Celula[][] = [
  [0, null, null, null, null, 1, null, null, null, null, 1, null, null, null, null, 0],
  [1, null, null, 1, null, 1, null, null, null, null, null, null, null, 0, null, 1],
];
const N = 4;
function valido(g: number[]): boolean {
  for (let r = 0; r < N; r++) {
    const linha = g.slice(r * N, r * N + N);
    const coluna = Array.from({ length: N }, (_, c) => g[c * N + r]);
    for (const seq of [linha, coluna]) {
      if (seq.reduce((a, b) => a + b, 0) !== N / 2) return false;
      for (let i = 0; i + 2 < N; i++) if (seq[i] === seq[i + 1] && seq[i + 1] === seq[i + 2]) return false;
    }
  }
  return true;
}
function minimo(t: Celula[]): number {
  const livres: number[] = []; t.forEach((v, i) => { if (v === null) livres.push(i); });
  let best = Infinity;
  for (let mask = 0; mask < 1 << livres.length; mask++) {
    const g = t.map((v) => (v === null ? 0 : v));
    livres.forEach((p, k) => { g[p] = (mask >> k) & 1; });
    if (valido(g)) best = Math.min(best, livres.reduce((s, _, k) => s + ((mask >> k) & 1), 0));
  }
  return best;
}
const OTIMOS = TRECHOS.map(minimo);
const SOMA_OTIMOS = OTIMOS.reduce((a, b) => a + b, 0);
const INTROS = [
  "Metade das casas de cada linha e de cada coluna brilha. E nenhuma sequência de três casas iguais pode aparecer.",
  "Mais casas travadas, e o mosaico tem mais de uma saída. Escolha as casas com cuidado, e confira a regra de três seguidas.",
];

export default function MosaicoFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const acoesTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [grade, setGrade] = useState<number[]>(() => TRECHOS[0].map((v) => (v === null ? 0 : v)));
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);
  const t = TRECHOS[rodada];
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const alternar = (p: number) => {
    if (fim.current || travado || t[p] !== null) return;
    const g = [...grade]; g[p] = 1 - g[p];
    acoesTotal.current++;
    setGrade(g); audio.sfx.mosaico.acender();
    if (valido(g)) { concluir(acoesTotal.current); return; }
    setMsg("A casa muda. Confira a metade de cada linha e de cada coluna.");
  };

  const concluir = (n: number) => {
    setTravado(true);
    audio.sfx.mosaico.completo();
    const nota = n === OTIMOS[rodada] ? "o mínimo de casas" : `o mínimo era ${OTIMOS[rodada]}`;
    if (rodada < TRECHOS.length - 1) {
      setMsg(`O mosaico fecha em equilíbrio, com ${n} ações (${nota}).`);
      agendar(() => { setRodada(rodada + 1); setGrade(TRECHOS[rodada + 1].map((v) => (v === null ? 0 : v))); setTravado(false); setMsg(INTROS[rodada + 1]); }, 2300);
      return;
    }
    fim.current = true;
    giveItem("mosaico-de-luz");
    const total = acoesTotal.current;
    setMsg(`O mosaico brilha inteiro, e a luz volta a ser equilibrada (${nota}).`);
    agendar(() => complete("mosaico", {
      estrelas: total <= SOMA_OTIMOS ? 3 : total <= SOMA_OTIMOS + 2 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Ações: ${total} (o mínimo seria ${SOMA_OTIMOS})`, reinicios.current ? `Mosaicos refeitos: ${reinicios.current}` : "Nenhum mosaico refeito"],
    }), 2800);
  };

  const reiniciar = () => { if (fim.current || travado) return; reinicios.current++; setGrade(t.map((v) => (v === null ? 0 : v))); audio.sfx.interagir(); setMsg("As casas se apagam. As ações já feitas continuam contando."); };

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-3 overflow-y-auto px-4 py-3 fase-compacta">
      <AmbienteFase tipo="silencio" />
      <div className="flex justify-center"><Cabecalho id="mosaico" /></div>
      <p className="font-narrativa italic text-espuma/80">Mosaico {rodada + 1} de {TRECHOS.length}: metade acesa em cada linha e coluna, sem três iguais seguidas.</p>
      <div role="grid" aria-label="Mosaico 4 por 4" className="mx-auto grid w-full max-w-xs gap-2 rounded-lg border border-latao/60 bg-abismo/60 p-3" style={{ gridTemplateColumns: `repeat(${N}, 1fr)` }}>
        {grade.map((v, p) => {
          const travada = t[p] !== null;
          return (
            <button key={p} onClick={() => alternar(p)} disabled={travado || travada}
              aria-label={`Casa ${v ? "acesa" : "apagada"}${travada ? ", travada" : ""}`}
              className={`aspect-square rounded-md border transition-all duration-300 ${v ? "border-lanterna bg-lanterna/60 shadow-[0_0_12px_3px_rgba(255,191,0,0.35)]" : "border-latao/50 bg-mare/25"} ${travada ? "ring-1 ring-espuma/40" : "hover:border-lanterna/60"} disabled:cursor-default`} />
          );
        })}
      </div>
      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Ações: {acoesTotal.current}</span>
        <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 underline disabled:opacity-40"><RotateCcw size={14} aria-hidden /> Apagar o mosaico</button>
      </p>
      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
