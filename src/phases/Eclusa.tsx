import { useEffect, useRef, useState } from "react";
import { Droplets, RotateCcw, Undo2 } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

type Estado = [number, number, number];
type Meta = { tipo: "uma" | "dividir"; valor: number };
type Rodada = { caps: Estado; meta: Meta };

const NOMES = ["Pequena", "Média", "Grande"];

// A água total é a capacidade da câmara grande, que começa cheia. Nada entra nem sai: só muda de câmara.
const RODADAS: Rodada[] = [
  { caps: [3, 5, 8], meta: { tipo: "uma", valor: 4 } },
  { caps: [3, 7, 10], meta: { tipo: "uma", valor: 5 } },
  { caps: [5, 7, 12], meta: { tipo: "dividir", valor: 6 } },
];

const inicial = (r: Rodada): Estado => [0, 0, r.caps[2]];
const atingiu = (e: Estado, m: Meta) => (m.tipo === "uma" ? e.includes(m.valor) : e.filter((v) => v === m.valor).length >= 2);

function verter(e: Estado, de: number, para: number, caps: Estado): Estado {
  const q = Math.min(e[de], caps[para] - e[para]);
  const n: Estado = [...e];
  n[de] -= q; n[para] += q;
  return n;
}

// Menor número de despejos possível (busca em largura). Serve de régua para as estrelas.
function minimo(r: Rodada): number {
  const ini = inicial(r);
  const visto = new Set([ini.join(",")]);
  let fila: Estado[] = [ini];
  for (let passos = 0; fila.length; passos++) {
    const prox: Estado[] = [];
    for (const e of fila) {
      if (atingiu(e, r.meta)) return passos;
      for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
        if (a === b || e[a] === 0 || e[b] === r.caps[b]) continue;
        const n = verter(e, a, b, r.caps);
        const k = n.join(",");
        if (!visto.has(k)) { visto.add(k); prox.push(n); }
      }
    }
    fila = prox;
  }
  return Infinity;
}
const MINIMOS = RODADAS.map(minimo);
const SOMA_MINIMOS = MINIMOS.reduce((a, b) => a + b, 0);

const textoMeta = (r: Rodada) =>
  r.meta.tipo === "uma"
    ? `Deixe exatamente ${r.meta.valor} medidas em uma câmara.`
    : `Divida as ${r.caps[2]} medidas ao meio: duas câmaras com ${r.meta.valor} cada.`;

export default function Eclusa() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const extras = useRef(0);        // movimentos acima do mínimo, somados das rodadas já feitas
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [estado, setEstado] = useState<Estado>(() => inicial(RODADAS[0]));
  const [historico, setHistorico] = useState<Estado[]>([]);
  const [escolhida, setEscolhida] = useState<number | null>(null);
  const [movs, setMovs] = useState(0);      // movimentos desta rodada (desfazer e reiniciar não devolvem)
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState("Toque numa câmara com água e depois na câmara que vai recebê-la. Ela despeja até esvaziar ou até a outra encher.");

  const r = RODADAS[rodada];
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const concluir = (total: number) => {
    setTravado(true);
    audio.sfx.comporta();
    extras.current += Math.max(0, total - MINIMOS[rodada]);
    const nota = total === MINIMOS[rodada] ? "o mínimo possível" : `o mínimo era ${MINIMOS[rodada]}`;
    if (rodada < RODADAS.length - 1) {
      setMsg(`A comporta cede. Medida certa em ${total} movimentos (${nota}). Mais uma câmara se abre.`);
      agendar(() => {
        const prox = rodada + 1;
        setRodada(prox);
        setEstado(inicial(RODADAS[prox]));
        setHistorico([]); setEscolhida(null); setMovs(0); setTravado(false);
        setMsg("As câmaras mudaram de tamanho. A água volta toda para a câmara grande.");
      }, 2000);
      return;
    }
    fim.current = true;
    audio.sfx.porta();
    audio.sfx.vitoria();
    giveItem("medida-da-eclusa");
    setMsg(`A última comporta se abre e a água segue seu caminho (${nota}). Nada se perdeu: só mudou de câmara.`);
    const extra = extras.current;
    agendar(() => complete("eclusa", {
      estrelas: extra <= 3 ? 3 : extra <= 10 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [
        `Movimentos acima do mínimo: ${extra} (mínimo total: ${SOMA_MINIMOS})`,
        reinicios.current ? `Rodadas reiniciadas: ${reinicios.current}` : "Nenhum reinício",
      ],
    }), 2000);
  };

  const tocar = (i: number) => {
    if (fim.current || travado) return;
    if (escolhida === null) {
      if (estado[i] === 0) { setMsg("Essa câmara está vazia. Escolha uma que tenha água."); return; }
      audio.sfx.escolher();
      setEscolhida(i);
      setMsg(`Câmara ${NOMES[i].toLowerCase()} escolhida. Agora toque na que vai receber.`);
      return;
    }
    if (escolhida === i) { setEscolhida(null); setMsg("Escolha desfeita."); return; }
    const q = Math.min(estado[escolhida], r.caps[i] - estado[i]);
    if (q === 0) {
      setEscolhida(null);
      setMsg(`A câmara ${NOMES[i].toLowerCase()} já está cheia, então nada passa.`);
      return;
    }
    const novo = verter(estado, escolhida, i, r.caps);
    const total = movs + 1;
    setHistorico((h) => [...h, estado]);
    setEstado(novo);
    setMovs(total);
    setEscolhida(null);
    audio.sfx.verter(q);
    if (atingiu(novo, r.meta)) { concluir(total); return; }
    setMsg(`${q} ${q === 1 ? "medida passa" : "medidas passam"} da ${NOMES[escolhida].toLowerCase()} para a ${NOMES[i].toLowerCase()}.`);
  };

  const desfazer = () => {
    const ant = historico[historico.length - 1];
    if (!ant || fim.current || travado) return;
    setEstado(ant);
    setHistorico(historico.slice(0, -1));
    setMovs(movs + 1); // desfazer também gasta um movimento
    setEscolhida(null);
    audio.sfx.escolher();
    setMsg("A água volta ao que era, mas o movimento já foi gasto.");
  };

  const reiniciar = () => {
    if (fim.current || travado) return;
    reinicios.current++;
    setEstado(inicial(r)); setHistorico([]); setEscolhida(null);
    audio.sfx.escolher();
    setMsg("A água volta toda para a câmara grande. Os movimentos já feitos continuam contando.");
  };

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-5 overflow-y-auto px-6 py-10">
      <AmbienteFase tipo="catedral" />
      <div className="flex justify-center"><Cabecalho id="eclusa" /></div>

      <p className="font-narrativa italic text-espuma/80">
        Rodada {rodada + 1} de {RODADAS.length}. {textoMeta(r)}
      </p>

      <section aria-label="Câmaras" className="grid grid-cols-3 items-end gap-3">
        {r.caps.map((cap, i) => {
          const v = estado[i];
          return (
            <button
              key={i}
              onClick={() => tocar(i)}
              aria-pressed={escolhida === i}
              aria-label={`Câmara ${NOMES[i].toLowerCase()}, capacidade ${cap}, com ${v} ${v === 1 ? "medida" : "medidas"}${escolhida === i ? ", escolhida" : ""}. Toque para ${escolhida === null ? "escolher" : "despejar aqui"}.`}
              className="flex flex-col items-center gap-2 active:scale-[0.98]"
            >
              <div
                className={`relative w-full overflow-hidden rounded-b-2xl border-x-2 border-b-2 bg-mare/30 backdrop-blur-sm transition-colors ${escolhida === i ? "border-lanterna shadow-[0_0_22px_rgba(255,191,0,0.35)]" : "border-latao"}`}
                style={{ height: cap * 16 + 8 }}
              >
                <div
                  className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-alga/90 to-[#3a9bb0]/70 transition-[height] duration-500 ease-out"
                  style={{ height: `${(v / cap) * 100}%` }}
                />
                {Array.from({ length: cap - 1 }, (_, k) => (
                  <span key={k} aria-hidden className="absolute inset-x-0 border-t border-espuma/15" style={{ bottom: `${((k + 1) / cap) * 100}%` }} />
                ))}
                <span className="absolute inset-0 flex items-center justify-center font-narrativa text-3xl text-espuma drop-shadow">{v}</span>
              </div>
              <span className="text-center text-xs uppercase tracking-[0.15em] text-espuma/60">
                {NOMES[i]}<span className="block normal-case tracking-normal text-espuma/50">cabe {cap}</span>
              </span>
            </button>
          );
        })}
      </section>

      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span className="flex items-center gap-2"><Droplets size={16} className="text-lanterna" aria-hidden /> Movimentos: {movs}</span>
        <span className="flex items-center gap-4">
          <button onClick={desfazer} disabled={!historico.length || travado} className="flex items-center gap-1 underline disabled:opacity-40">
            <Undo2 size={14} aria-hidden /> Desfazer (gasta movimento)
          </button>
          <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 underline disabled:opacity-40">
            <RotateCcw size={14} aria-hidden /> Reiniciar
          </button>
        </span>
      </p>

      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
