import { useEffect, useRef, useState } from "react";
import { Flame, RotateCcw } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// w lenha · # pedra · . chão.
// Toque numa lenha para acender uma tocha. O fogo se espalha pela lenha vizinha, um passo por vez (Soprar).
// Pedra e chão param o fogo. Vence quando toda a lenha estiver queimando.
// OTIMOS é o nº de agrupamentos de lenha: cada um precisa de uma tocha, porque o fogo não atravessa pedra nem chão.
const MAPAS = [
  ["w.w..", "w#w..", ".ww.#", "..w.w", "#.w.w"],
  ["ww#ww", "w.#.w", "#w.ww", "w.#.."],
];

function agrupamentos(m: string[]): number[][] {
  const H = m.length, W = m[0].length; const seen = new Set<number>(); const grupos: number[][] = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const p = y * W + x; if (m[y][x] !== "w" || seen.has(p)) continue;
    const grupo = [p]; seen.add(p);
    for (let i = 0; i < grupo.length; i++) {
      const q = grupo[i], qx = q % W, qy = Math.floor(q / W);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = qx + dx, ny = qy + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || m[ny][nx] !== "w") continue;
        const r = ny * W + nx; if (seen.has(r)) continue; seen.add(r); grupo.push(r);
      }
    }
    grupos.push(grupo);
  }
  return grupos;
}

type Campo = { W: number; H: number; lenha: Set<number>; pedras: Set<number>; grupos: number };

function ler(mapa: string[]): Campo {
  const H = mapa.length, W = mapa[0].length;
  const lenha = new Set<number>(), pedras = new Set<number>();
  mapa.forEach((l, y) => [...l].forEach((c, x) => {
    const p = y * W + x;
    if (c === "w") lenha.add(p);
    if (c === "#") pedras.add(p);
  }));
  return { W, H, lenha, pedras, grupos: agrupamentos(mapa).length };
}
const CAMPOS = MAPAS.map(ler);
const OTIMOS = CAMPOS.map((c) => c.grupos);
const SOMA_OTIMOS = OTIMOS.reduce((a, b) => a + b, 0);

const INTROS = [
  "Cada agrupamento de lenha precisa de uma tocha: o fogo não passa pela pedra nem pelo chão. Acenda com cuidado e sopre o fogo para ele correr.",
  "Mais lenha, e um agrupamento escondido atrás da pedra. Procure as partes que o fogo não alcança sozinho.",
];

export default function ChamaFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const tochasTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [acesas, setAcesas] = useState<Set<number>>(() => new Set());
  const [queimadas, setQueimadas] = useState<Set<number>>(() => new Set());
  const [tochas, setTochas] = useState(0);
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);

  const f = CAMPOS[rodada];
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const concluir = () => {
    setTravado(true);
    audio.sfx.fogo.completo();
    const nota = tochas === OTIMOS[rodada] ? "o mínimo de tochas" : `o mínimo era ${OTIMOS[rodada]}`;
    if (rodada < CAMPOS.length - 1) {
      setMsg(`Toda a lenha queima com ${tochas} ${tochas === 1 ? "tocha" : "tochas"} (${nota}). O fogo acalma e a corrente abre o trecho seguinte.`);
      agendar(() => {
        const prox = rodada + 1;
        setRodada(prox);
        setAcesas(new Set()); setQueimadas(new Set());
        setTochas(0); setTravado(false);
        setMsg(INTROS[prox]);
      }, 2300);
      return;
    }
    fim.current = true;
    giveItem("chama-que-corre");
    setMsg(`A última lenha queima, e a luz sobe pela costa até o farol (${nota}).`);
    agendar(() => complete("chama", {
      estrelas: tochasTotal.current <= SOMA_OTIMOS ? 3 : tochasTotal.current <= SOMA_OTIMOS + 2 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Tochas: ${tochasTotal.current} (o mínimo seria ${SOMA_OTIMOS})`, reinicios.current ? `Trechos refeitos: ${reinicios.current}` : "Nenhum trecho refeito"],
    }), 2800);
  };

  // Uma tocha acende a lenha tocada; o fogo ainda não se espalhou
  const acender = (p: number) => {
    if (fim.current || travado || !f.lenha.has(p) || acesas.has(p) || queimadas.has(p)) return;
    tochasTotal.current++;
    setTochas(tochas + 1);
    setAcesas(new Set([...acesas, p]));
    audio.sfx.fogo.acender();
    setMsg("Uma tocha acende a lenha. Sopre o fogo para ele correr pelas vizinhas.");
  };

  // Um passo de fogo: cada lenha acesa passa a fogo para as vizinhas que ainda não queimam
  const soprar = () => {
    if (fim.current || travado) return;
    if (acesas.size === 0) { setMsg("Nada está queimando ainda. Acenda uma tocha primeiro."); return; }
    const novasQueimadas = new Set(queimadas);
    const proximas = new Set<number>();
    acesas.forEach((p) => {
      novasQueimadas.add(p);
      const x = p % f.W, y = Math.floor(p / f.W);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= f.W || ny >= f.H) continue;
        const q = ny * f.W + nx;
        if (f.lenha.has(q) && !novasQueimadas.has(q)) proximas.add(q);
      }
    });
    audio.sfx.fogo.soprar();
    setQueimadas(novasQueimadas);
    setAcesas(proximas);
    if (novasQueimadas.size === f.lenha.size) { concluir(); return; }
    if (proximas.size === 0) { setMsg("O fogo parou: falta lenha que ele não alcança. Acenda outra tocha."); return; }
    setMsg("O fogo corre para as lenhas vizinhas.");
  };

  const reiniciar = () => {
    if (fim.current || travado) return;
    reinicios.current++;
    setAcesas(new Set()); setQueimadas(new Set());
    audio.sfx.interagir();
    setMsg("O fogo se apaga e a lenha volta ao começo. As tochas já usadas continuam contando.");
  };

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-5 overflow-y-auto px-6 py-10">
      <AmbienteFase tipo="chama" />
      <div className="flex justify-center"><Cabecalho id="chama" /></div>

      <p className="font-narrativa italic text-espuma/80">Trecho {rodada + 1} de {CAMPOS.length}: faça toda a lenha queimar.</p>

      <div
        role="grid"
        aria-label={`Costa com ${f.lenha.size} lenhas. ${queimadas.size} queimando ou queimadas.`}
        className="mx-auto grid w-full gap-1 rounded-lg border border-latao/60 bg-abismo/60 p-2 backdrop-blur-sm"
        style={{ maxWidth: f.W * 62, gridTemplateColumns: `repeat(${f.W}, 1fr)` }}
      >
        {Array.from({ length: f.W * f.H }, (_, p) => {
          const lenha = f.lenha.has(p), pedra = f.pedras.has(p);
          const queimando = acesas.has(p), queimou = queimadas.has(p);
          if (pedra) return <div key={p} role="img" aria-label="Pedra" className="aspect-square rounded-md bg-[#2a3d44] shadow-inner" />;
          if (!lenha) return <div key={p} className="aspect-square rounded-md bg-mare/20" />;
          return (
            <button
              key={p}
              onClick={() => acender(p)}
              disabled={travado || queimando || queimou}
              aria-label={`Lenha, ${queimando ? "queimando" : queimou ? "queimada" : "intacta"}`}
              className={`flex aspect-square items-center justify-center rounded-md border transition-all duration-500 ${
                queimando ? "border-lanterna bg-lanterna/70 shadow-[0_0_18px_6px_rgba(255,191,0,0.55)]"
                : queimou ? "border-latao/40 bg-[#3b2a1e]"
                : "border-latao/70 bg-[#6e4f33] hover:border-lanterna"
              } disabled:cursor-default`}
            >
              {queimando && <Flame size={18} className="text-abismo" aria-hidden />}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button onClick={soprar} disabled={travado || acesas.size === 0} className="rounded-xl border border-lanterna/60 bg-mare/40 px-5 py-3 font-narrativa text-lanterna active:scale-95 disabled:opacity-40">
          Soprar o fogo
        </button>
      </div>

      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Tochas: {tochas} · Lenha queimada: {queimadas.size}/{f.lenha.size}</span>
        <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 underline disabled:opacity-40">
          <RotateCcw size={14} aria-hidden /> Apagar o fogo
        </button>
      </p>

      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
