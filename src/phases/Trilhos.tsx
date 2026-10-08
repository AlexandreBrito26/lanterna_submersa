import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// Trilhos da mina. A vagoneta parte do início e segue as chaves. Cada chave tem uma saída esquerda (L) e direita (R).
// Ajuste as chaves (cada toque troca a posição de uma) até a vagoneta parar na estação pedida. OTIMOS é o mínimo de trocas.
type No = { chave?: number; L?: string; R?: string; fim?: boolean };
const TRECHOS: { grafo: Record<string, No>; ini: string; estacao: string; chaves: number[] }[] = [
  { grafo: { A: { chave: 0, L: "B", R: "C" }, B: { chave: 1, L: "D", R: "E" }, C: { fim: true }, D: { fim: true }, E: { fim: true } }, ini: "A", estacao: "E", chaves: [0, 0] },
  { grafo: { A: { chave: 0, L: "B", R: "C" }, B: { chave: 1, L: "D", R: "E" }, C: { chave: 2, L: "F", R: "G" }, D: { fim: true }, E: { fim: true }, F: { fim: true }, G: { fim: true } }, ini: "A", estacao: "G", chaves: [0, 0, 0] },
];
function percorre(g: Record<string, No>, ini: string, cfg: number[]): string[] {
  const caminho = [ini]; let no = ini;
  for (let i = 0; i < 20; i++) {
    const nd = g[no]; if (!nd || nd.fim || nd.chave === undefined) break;
    no = cfg[nd.chave] ? (nd.R as string) : (nd.L as string); caminho.push(no);
  }
  return caminho;
}
function minimo(t: typeof TRECHOS[number]): number {
  const n = t.chaves.length; let best = Infinity;
  for (let mask = 0; mask < 1 << n; mask++) {
    const cfg = t.chaves.map((_, k) => (mask >> k) & 1);
    const c = percorre(t.grafo, t.ini, cfg);
    if (c[c.length - 1] === t.estacao) {
      const d = cfg.reduce((s, v, k) => s + (v !== t.chaves[k] ? 1 : 0), 0);
      best = Math.min(best, d);
    }
  }
  return best;
}
const OTIMOS = TRECHOS.map(minimo);
const SOMA_OTIMOS = OTIMOS.reduce((a, b) => a + b, 0);
const INTROS = [
  "A vagoneta segue a chave à sua frente. Mude a chave certa para levá-la à estação E.",
  "Três chaves e mais estações. Procure o caminho que passa pela estação G e mude só o necessário.",
];

export default function TrilhosFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const trocasTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [cfg, setCfg] = useState<number[]>(TRECHOS[0].chaves);
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);
  const t = TRECHOS[rodada];
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };
  const caminho = percorre(t.grafo, t.ini, cfg);
  const chegou = caminho[caminho.length - 1] === t.estacao;

  const trocar = (k: number) => {
    if (fim.current || travado) return;
    const novo = cfg.map((v, i) => (i === k ? 1 - v : v));
    trocasTotal.current++;
    setCfg(novo); audio.sfx.trilhos.chave();
    const c = percorre(t.grafo, t.ini, novo);
    if (c[c.length - 1] === t.estacao) { concluir(trocasTotal.current); return; }
    setMsg("A chave estala. Veja para onde a vagoneta vai agora.");
  };

  const concluir = (n: number) => {
    setTravado(true);
    audio.sfx.trilhos.completo();
    const nota = n === OTIMOS[rodada] ? "o mínimo de trocas" : `o mínimo era ${OTIMOS[rodada]}`;
    if (rodada < TRECHOS.length - 1) {
      setMsg(`A vagoneta para na estação ${t.estacao} (${nota}).`);
      agendar(() => { setRodada(rodada + 1); setCfg(TRECHOS[rodada + 1].chaves); setTravado(false); setMsg(INTROS[rodada + 1]); }, 2300);
      return;
    }
    fim.current = true;
    giveItem("trilhos-da-mina");
    const total = trocasTotal.current;
    setMsg(`A última vagoneta chega ao depósito sem descarrilar (${nota}).`);
    agendar(() => complete("trilhos", {
      estrelas: total <= SOMA_OTIMOS ? 3 : total <= SOMA_OTIMOS + 1 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Trocas: ${total} (o mínimo seria ${SOMA_OTIMOS})`, reinicios.current ? `Trilhos refeitos: ${reinicios.current}` : "Nenhum trilho refeito"],
    }), 2800);
  };
  const reiniciar = () => { if (fim.current || travado) return; reinicios.current++; setCfg(t.chaves); audio.sfx.interagir(); setMsg("As chaves voltam à posição inicial. As trocas já feitas continuam contando."); };

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-5 overflow-y-auto px-6 py-10">
      <AmbienteFase tipo="coral" />
      <div className="flex justify-center"><Cabecalho id="trilhos" /></div>
      <p className="font-narrativa italic text-espuma/80">Mina {rodada + 1} de {TRECHOS.length}: leve a vagoneta até a estação {t.estacao}.</p>
      <div className="mx-auto flex flex-wrap items-center justify-center gap-2 font-narrativa text-lg" aria-label={`Caminho: ${caminho.join(" → ")}`}>
        {caminho.map((no, i) => (
          <span key={i} className={`rounded-full border px-3 py-1 ${no === t.estacao ? "border-lanterna bg-lanterna/25 text-lanterna" : "border-latao/60"}`}>{no}{i < caminho.length - 1 ? " →" : ""}</span>
        ))}
      </div>
      <div className="mx-auto flex flex-wrap justify-center gap-3" role="group" aria-label="Chaves">
        {t.chaves.map((_, k) => (
          <button key={k} onClick={() => trocar(k)} disabled={travado}
            className={`rounded-xl border-2 px-4 py-3 font-narrativa ${cfg[k] ? "border-alga bg-alga/15" : "border-latao/60 bg-mare/25"} disabled:opacity-40`}>
            chave {k + 1}: {cfg[k] ? "direita" : "esquerda"}
          </button>
        ))}
      </div>
      <p className={`text-center text-sm ${chegou ? "text-lanterna" : "text-espuma/60"}`}>{chegou ? `A vagoneta está em ${t.estacao}.` : `A vagoneta está em ${caminho[caminho.length - 1]}.`}</p>
      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Trocas: {trocasTotal.current}</span>
        <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 underline disabled:opacity-40"><RotateCcw size={14} aria-hidden /> Voltar as chaves</button>
      </p>
      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
