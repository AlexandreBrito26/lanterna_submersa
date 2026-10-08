import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// # rocha · p portão de ferro (fechado até uma alavanca abri-lo) · @ você · * saída.
// Cada alavanca inverte um conjunto fixo de portões: aberto vira fechado e fechado vira aberto.
// Você não sabe o que cada alavanca faz até apertá-la. OTIMOS é o mínimo de alavancas de cada trecho.
type Trecho = { mapa: string[]; alavancas: Record<string, number[]> };
const TRECHOS: Trecho[] = [
  { mapa: ["#*#.@", ".p...", "#....", "#....", "p#..."], alavancas: { A: [0, 1], B: [1] } },
  { mapa: ["@.pp*", "#####"], alavancas: { A: [0], B: [1] } },
  { mapa: ["@.ppp*", "######"], alavancas: { A: [0], B: [1], C: [2] } },
];
const OTIMOS = [1, 2, 3];
const SOMA_OTIMOS = OTIMOS.reduce((a, b) => a + b, 0);

const INTROS = [
  "As portas de ferro da cidade estão travadas. Cada alavanca mexe em algumas delas, mas só se apertá-la você descobre quais.",
  "Agora o corredor tem duas portas em sequência. Não basta abrir uma: as duas precisam estar abertas ao mesmo tempo.",
  "A última passagem da cidade baixa tem três portões. Confira qual alavanca abre cada um antes de apertar de novo.",
];

function ler(mapa: string[]) {
  const H = mapa.length, W = mapa[0].length;
  const portoes: number[] = [];
  let ini = 0, alvo = 0;
  mapa.forEach((l, y) => [...l].forEach((c, x) => {
    const p = y * W + x;
    if (c === "p") portoes.push(p);
    if (c === "@") ini = p;
    if (c === "*") alvo = p;
  }));
  return { W, H, portoes, ini, alvo };
}

// O caminho existe com os portões atuais? (busca em largura)
function caminhoAberto(mapa: string[], portoes: number[], abertos: boolean[], ini: number, alvo: number): boolean {
  const H = mapa.length, W = mapa[0].length;
  const passavel = (p: number) => {
    const c = mapa[Math.floor(p / W)][p % W];
    if (c === "#") return false;
    if (c === "p") return abertos[portoes.indexOf(p)];
    return true;
  };
  const fila = [ini], vistos = new Set([ini]);
  for (let i = 0; i < fila.length; i++) {
    const p = fila[i];
    if (p === alvo) return true;
    const x = p % W, y = Math.floor(p / W);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const q = ny * W + nx;
      if (vistos.has(q) || !passavel(q)) continue;
      vistos.add(q); fila.push(q);
    }
  }
  return false;
}

const CAMPOS = TRECHOS.map((t) => ({ ...t, ...ler(t.mapa) }));

export default function AlavancasFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const apertosTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [abertos, setAbertos] = useState<boolean[]>(() => CAMPOS[0].portoes.map(() => false));
  const [apertos, setApertos] = useState(0);
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);

  const f = CAMPOS[rodada];
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const concluir = (n: number) => {
    setTravado(true);
    audio.sfx.alavancas.portao();
    const nota = n === OTIMOS[rodada] ? "o mínimo possível" : `o mínimo era ${OTIMOS[rodada]}`;
    if (rodada < CAMPOS.length - 1) {
      setMsg(`O caminho se abre com ${n} ${n === 1 ? "alavanca" : "alavancas"} (${nota}). Mais adiante, outra porta espera.`);
      agendar(() => {
        const prox = rodada + 1;
        setRodada(prox);
        setAbertos(CAMPOS[prox].portoes.map(() => false));
        setApertos(0); setTravado(false);
        setMsg(INTROS[prox]);
      }, 2300);
      return;
    }
    fim.current = true;
    giveItem("portas-de-ferro");
    const total = apertosTotal.current;
    setMsg(`A última porta cede com um estrondo, e a cidade baixa volta a respirar (${nota}).`);
    agendar(() => complete("alavancas", {
      estrelas: total <= SOMA_OTIMOS + 1 ? 3 : total <= SOMA_OTIMOS + 3 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Alavancas acionadas: ${total} (o mínimo seria ${SOMA_OTIMOS})`, reinicios.current ? `Trechos refeitos: ${reinicios.current}` : "Nenhum trecho refeito"],
    }), 2800);
  };

  const apertar = (letra: string) => {
    if (fim.current || travado) return;
    const alvoIdx = f.alavancas[letra];
    const novo = [...abertos];
    alvoIdx.forEach((i) => { novo[i] = !novo[i]; });
    const n = apertos + 1;
    apertosTotal.current++;
    setAbertos(novo);
    setApertos(n);
    audio.sfx.alavancas.puxar();
    const mudaram = alvoIdx.map((i) => `portão ${i + 1} ${novo[i] ? "abriu" : "fechou"}`).join(", ");
    if (caminhoAberto(f.mapa, f.portoes, novo, f.ini, f.alvo)) { concluir(n); return; }
    setMsg(`A alavanca ${letra} move o ${mudaram}.`);
  };

  const reiniciar = () => {
    if (fim.current || travado) return;
    reinicios.current++;
    setAbertos(f.portoes.map(() => false));
    audio.sfx.interagir();
    setMsg("Os portões voltam a fechar. As alavancas já apertadas continuam contando.");
  };

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-5 overflow-y-auto px-6 py-10">
      <AmbienteFase tipo="alavancas" />
      <div className="flex justify-center"><Cabecalho id="alavancas" /></div>

      <p className="font-narrativa italic text-espuma/80">Passagem {rodada + 1} de {CAMPOS.length}: abra o caminho até a saída.</p>

      <div
        role="img"
        aria-label={`Corredor com ${f.portoes.length} portões de ferro. ${abertos.filter(Boolean).length} abertos.`}
        className="mx-auto grid w-full gap-px rounded-lg border border-latao/60 bg-abismo/60 p-1 backdrop-blur-sm"
        style={{ maxWidth: f.W * 60, gridTemplateColumns: `repeat(${f.W}, 1fr)` }}
      >
        {Array.from({ length: f.W * f.H }, (_, p) => {
          const c = f.mapa[Math.floor(p / f.W)][p % f.W];
          if (c === "#") return <div key={p} className="aspect-square rounded-sm bg-[#2a3d44] shadow-inner" />;
          if (c === "p") {
            const aberto = abertos[f.portoes.indexOf(p)];
            return (
              <div key={p} className={`aspect-square rounded-sm border-2 transition-colors duration-500 ${aberto ? "border-alga/70 bg-alga/25" : "border-latao bg-[#4a3424] shadow-inner"}`} />
            );
          }
          const eu = c === "@", saida = c === "*";
          return (
            <div key={p} className="relative aspect-square rounded-sm bg-mare/25">
              {saida && <span className="absolute inset-[24%] rounded-full bg-lanterna shadow-[0_0_16px_4px_rgba(255,191,0,0.55)]" />}
              {eu && <span className="absolute inset-[20%] rounded-full bg-espuma shadow-[0_0_12px_2px_rgba(242,230,214,0.5)]" />}
            </div>
          );
        })}
      </div>

      <div className="mx-auto flex flex-wrap justify-center gap-3" role="group" aria-label="Alavancas">
        {Object.keys(f.alavancas).map((letra) => (
          <button
            key={letra}
            onClick={() => apertar(letra)}
            disabled={travado}
            className="rounded-xl border border-lanterna/60 bg-mare/40 px-5 py-3 font-narrativa text-lanterna active:scale-95 disabled:opacity-40"
          >
            Alavanca {letra}
          </button>
        ))}
      </div>

      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Alavancas apertadas: {apertos}</span>
        <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 underline disabled:opacity-40">
          <RotateCcw size={14} aria-hidden /> Fechar os portões
        </button>
      </p>

      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
