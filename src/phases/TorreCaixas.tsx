import { useEffect, useRef, useState } from "react";
import { Undo2 } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// Torre de caixas. Empilhe caixas de altura 1, 2 ou 3 até a altura exata pedida. Cada caixa é uma ação.
// Não passe da altura. OTIMOS é o menor número de caixas que chega à altura exata (programação dinâmica).
const TRECHOS = [7, 10];
function minCaixas(H: number): number {
  const dp = Array(H + 1).fill(Infinity); dp[0] = 0;
  for (let h = 1; h <= H; h++) for (const s of [1, 2, 3]) if (h >= s) dp[h] = Math.min(dp[h], dp[h - s] + 1);
  return dp[H];
}
const OTIMOS = TRECHOS.map(minCaixas);
const SOMA_OTIMOS = OTIMOS.reduce((a, b) => a + b, 0);
const INTROS = [
  "Caixas de altura 1, 2 e 3. Chegue exatamente na altura 7, com o menor número de caixas.",
  "Agora a altura é 10. Às vezes uma caixa grande economiza duas pequenas.",
];

export default function TorreCaixasFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const caixasTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [pilha, setPilha] = useState<number[]>([]);
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);
  const alvo = TRECHOS[rodada];
  const altura = pilha.reduce((a, b) => a + b, 0);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const empilhar = (s: number) => {
    if (fim.current || travado) return;
    if (altura + s > alvo) { audio.sfx.torre.falha(); setMsg("Essa caixa passa da altura pedida. Escolha uma menor."); return; }
    const np = [...pilha, s];
    caixasTotal.current++;
    setPilha(np); audio.sfx.torre.caixa();
    if (np.reduce((a, b) => a + b, 0) === alvo) { concluir(np.length); return; }
    setMsg(`Altura ${np.reduce((a, b) => a + b, 0)} de ${alvo}.`);
  };
  const desfazer = () => { if (fim.current || travado || !pilha.length) return; setPilha(pilha.slice(0, -1)); audio.sfx.interagir(); setMsg("Você tira a última caixa. As caixas já colocadas continuam contando."); };

  const concluir = (n: number) => {
    setTravado(true);
    audio.sfx.torre.completo();
    const nota = n === OTIMOS[rodada] ? "o mínimo de caixas" : `o mínimo era ${OTIMOS[rodada]}`;
    if (rodada < TRECHOS.length - 1) {
      setMsg(`A torre chega a ${alvo} com ${n} caixas (${nota}).`);
      agendar(() => { setRodada(rodada + 1); setPilha([]); setTravado(false); setMsg(INTROS[rodada + 1]); }, 2300);
      return;
    }
    fim.current = true;
    giveItem("torre-de-caixas");
    const total = caixasTotal.current;
    setMsg(`A torre do cais fica firme e alta, do tamanho certo (${nota}).`);
    agendar(() => complete("torre", {
      estrelas: total <= SOMA_OTIMOS ? 3 : total <= SOMA_OTIMOS + 1 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Caixas colocadas: ${total} (o mínimo seria ${SOMA_OTIMOS})`, reinicios.current ? `Torres refeitas: ${reinicios.current}` : "Nenhuma torre refeita"],
    }), 2800);
  };
  const reiniciar = () => { if (fim.current || travado) return; reinicios.current++; setPilha([]); audio.sfx.interagir(); setMsg("A torre desmorona e as caixas voltam ao chão. As caixas já colocadas continuam contando."); };

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-5 overflow-y-auto px-6 py-10">
      <AmbienteFase tipo="coral" />
      <div className="flex justify-center"><Cabecalho id="torrecaixas" /></div>
      <p className="font-narrativa italic text-espuma/80">Torre {rodada + 1} de {TRECHOS.length}: chegue à altura {alvo} exatamente.</p>
      <div className="mx-auto flex w-full max-w-xs flex-col-reverse gap-1" aria-label={`Altura ${altura} de ${alvo}`}>
        {pilha.map((s, i) => (
          <div key={i} style={{ height: s * 22 }} className="rounded-md border border-latao/60 bg-latao/40 text-center text-xs leading-none">{s}</div>
        ))}
        <div className="h-1 w-full rounded bg-lanterna/60" />
      </div>
      <div className="mx-auto flex flex-wrap justify-center gap-3" role="group" aria-label="Caixas">
        {[1, 2, 3].map((s) => (
          <button key={s} onClick={() => empilhar(s)} disabled={travado || altura + s > alvo}
            className="rounded-xl border border-lanterna/60 bg-mare/40 px-5 py-3 font-narrativa text-lanterna disabled:opacity-40">+ caixa {s}</button>
        ))}
      </div>
      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Altura: {altura} / {alvo} · Caixas: {pilha.length}</span>
        <span className="flex items-center gap-4">
          <button onClick={desfazer} disabled={!pilha.length || travado} className="flex items-center gap-1 underline disabled:opacity-40"><Undo2 size={14} aria-hidden /> Tirar a última</button>
          <button onClick={reiniciar} disabled={travado} className="underline disabled:opacity-40">Derrubar</button>
        </span>
      </p>
      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
