import { useEffect, useRef, useState } from "react";
import { RotateCcw, Undo2 } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// Ganchos da corrente. A corrente tem ganchos numerados. Você só pode trocar dois ganchos vizinhos:
// toque num gancho e depois no vizinho da direita ou da esquerda. Vence quando os números estiverem em ordem crescente.
// O mínimo de trocas é o número de pares fora de ordem (cada troca de vizinhos corrige no máximo um par).
const TRECHOS = [
  [3, 1, 2],
  [4, 2, 3, 1],
  [2, 5, 1, 4, 3],
];

function paresForaDeOrdem(a: number[]): number {
  let n = 0;
  for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) if (a[i] > a[j]) n++;
  return n;
}
const OTIMOS = TRECHOS.map(paresForaDeOrdem);
const SOMA_OTIMOS = OTIMOS.reduce((a, b) => a + b, 0);

const INTROS = [
  "Os ganchos estão fora de ordem. Só dá para trocar dois ganchos vizinhos. Ordene a corrente do menor número ao maior.",
  "Quatro ganchos, e um deles está preso no fim da fila. Cada troca tem que valer: não basta mover, é preciso aproximar do certo.",
  "A última corrente do porto. Cinco ganchos, todos fora do lugar. Antes de trocar, pense em qual número precisa atravessar a fila.",
];

export default function GanchosFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const trocasTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [ganchos, setGanchos] = useState<number[]>(TRECHOS[0]);
  const [historico, setHistorico] = useState<number[][]>([]);
  const [trocas, setTrocas] = useState(0);
  const [selecionado, setSelecionado] = useState<number | null>(null);
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const ordenada = (g: number[]) => g.every((v, i) => i === 0 || g[i - 1] < v);

  const concluir = (n: number) => {
    setTravado(true);
    audio.sfx.ganchos.completo();
    const nota = n === OTIMOS[rodada] ? "o mínimo de trocas" : `o mínimo era ${OTIMOS[rodada]}`;
    if (rodada < TRECHOS.length - 1) {
      setMsg(`A corrente fecha em ordem com ${n} ${n === 1 ? "troca" : "trocas"} (${nota}). A corrente seguinte é puxada para o cais.`);
      agendar(() => {
        const prox = rodada + 1;
        setRodada(prox);
        setGanchos(TRECHOS[prox]);
        setHistorico([]); setTrocas(0); setSelecionado(null); setTravado(false);
        setMsg(INTROS[prox]);
      }, 2300);
      return;
    }
    fim.current = true;
    giveItem("corrente-em-ordem");
    const total = trocasTotal.current;
    setMsg(`A última corrente sobe ordenada, e o farol recebe a luz sem nó (${nota}).`);
    agendar(() => complete("ganchos", {
      estrelas: total <= SOMA_OTIMOS ? 3 : total <= SOMA_OTIMOS + 2 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Trocas: ${total} (o mínimo seria ${SOMA_OTIMOS})`, reinicios.current ? `Correntes refeitas: ${reinicios.current}` : "Nenhuma corrente refeita"],
    }), 2800);
  };

  const trocar = (i: number, j: number) => {
    const novo = [...ganchos];
    [novo[i], novo[j]] = [novo[j], novo[i]];
    setHistorico([...historico, ganchos]);
    setGanchos(novo);
    const n = trocas + 1;
    setTrocas(n);
    trocasTotal.current++;
    audio.sfx.ganchos.trocar();
    if (ordenada(novo)) { concluir(n); return; }
    setMsg("Os ganchos trocam de lugar. Veja se o número certo se aproxima do início.");
  };

  const tocar = (i: number) => {
    if (fim.current || travado) return;
    if (selecionado === null) { setSelecionado(i); setMsg("Gancho marcado. Toque no vizinho para trocar."); return; }
    if (selecionado === i) { setSelecionado(null); setMsg("Marcação desfeita."); return; }
    if (Math.abs(selecionado - i) !== 1) { audio.sfx.ganchos.falha(); setMsg("Só dá para trocar ganchos vizinhos. Escolha outro gancho."); setSelecionado(i); return; }
    const a = selecionado;
    setSelecionado(null);
    trocar(a, i);
  };

  const desfazer = () => {
    if (fim.current || travado || historico.length === 0) return;
    setGanchos(historico[historico.length - 1]);
    setHistorico(historico.slice(0, -1));
    setSelecionado(null);
    audio.sfx.ganchos.trocar();
    setMsg("Você desfaz a última troca. As trocas já feitas continuam contando.");
  };

  const reiniciar = () => {
    if (fim.current || travado) return;
    reinicios.current++;
    setGanchos(TRECHOS[rodada]);
    setHistorico([]); setSelecionado(null);
    audio.sfx.interagir();
    setMsg("A corrente volta a ficar fora de ordem. As trocas já feitas continuam contando.");
  };

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-5 overflow-y-auto px-6 py-10">
      <AmbienteFase tipo="coral" />
      <div className="flex justify-center"><Cabecalho id="ganchos" /></div>

      <p className="font-narrativa italic text-espuma/80">Corrente {rodada + 1} de {TRECHOS.length}: ordene os ganchos com trocas de vizinhos.</p>

      <div className="mx-auto flex w-full flex-wrap items-center justify-center gap-2" role="group" aria-label="Ganchos da corrente">
        {ganchos.map((g, i) => {
          const sel = selecionado === i, certo = g === [...ganchos].sort((a, b) => a - b)[i];
          return (
            <button
              key={i}
              onClick={() => tocar(i)}
              disabled={travado}
              aria-label={`Gancho ${g}${sel ? ", selecionado" : ""}${certo ? ", no lugar" : ""}`}
              className={`flex h-16 w-14 items-center justify-center rounded-xl border-2 font-narrativa text-2xl transition-all duration-300 ${
                sel ? "border-lanterna bg-lanterna/25 text-lanterna scale-105"
                : certo ? "border-alga/60 bg-alga/15 text-alga"
                : "border-latao/70 bg-[#4a3424]/60 text-espuma hover:border-lanterna/60"
              } disabled:cursor-default`}
            >
              {g}
            </button>
          );
        })}
      </div>

      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Trocas: {trocas} · Ordem crescente da esquerda para a direita</span>
        <button onClick={desfazer} disabled={travado || historico.length === 0} className="flex items-center gap-1 underline disabled:opacity-40">
          <Undo2 size={14} aria-hidden /> Desfazer
        </button>
      </p>

      <div className="flex justify-center">
        <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 text-sm text-espuma/70 underline disabled:opacity-40">
          <RotateCcw size={14} aria-hidden /> Soltar a corrente e recomeçar
        </button>
      </div>

      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
