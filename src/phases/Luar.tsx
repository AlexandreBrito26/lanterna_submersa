import { Fragment, useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// Luar de linhas. Cada lâmpada está acesa ou apagada. Um toque numa linha (setas à esquerda) ou numa coluna
// (acima) inverte todas as lâmpadas dela. Acenda todas as lâmpadas com o menor número de toques.
// OTIMOS é o mínimo de toques de cada trecho, calculado por enumeração das combinações de linhas e colunas.
const TRECHOS: number[][][] = [
  [[0, 1, 0, 0], [1, 0, 1, 1], [0, 1, 0, 0]],
  [[0, 1, 0, 1], [1, 0, 1, 0], [0, 1, 0, 1], [1, 0, 1, 0]],
  [[0, 1, 0, 0, 1], [1, 0, 1, 1, 0], [0, 1, 0, 0, 1], [0, 1, 0, 0, 1]],
];

function minimoDe(g: number[][]): number {
  const H = g.length, W = g[0].length; let melhor = Infinity;
  for (let mask = 0; mask < 1 << (H + W); mask++) {
    const c = g.map((r) => [...r]); let n = 0;
    for (let y = 0; y < H; y++) if ((mask >> y) & 1) { n++; for (let x = 0; x < W; x++) c[y][x] = 1 - c[y][x]; }
    for (let x = 0; x < W; x++) if ((mask >> (H + x)) & 1) { n++; for (let y = 0; y < H; y++) c[y][x] = 1 - c[y][x]; }
    if (c.every((r) => r.every((v) => v === 1)) && n < melhor) melhor = n;
  }
  return melhor;
}
const OTIMOS = TRECHOS.map(minimoDe);
const SOMA_OTIMOS = OTIMOS.reduce((a, b) => a + b, 0);

const INTROS = [
  "As lâmpadas do porto estão apagadas. Cada toque numa linha ou coluna inverte todas as lâmpadas dela. Descubra a combinação certa.",
  "Mais lâmpadas, e as linhas se cruzam. Uma linha tocada duas vezes volta ao que era: pense antes de repetir.",
  "A última fileira de luzes. Tente fechar primeiro as linhas com mais lâmpadas apagadas.",
];

export default function LuarFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const toquesTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [luz, setLuz] = useState<number[][]>(() => TRECHOS[0].map((r) => [...r]));
  const [toques, setToques] = useState(0);
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };
  const H = luz.length, W = luz[0].length;
  const todasAcesas = luz.every((r) => r.every((v) => v === 1));

  const concluir = (n: number) => {
    setTravado(true);
    audio.sfx.luar.completo();
    const nota = n === OTIMOS[rodada] ? "o mínimo de toques" : `o mínimo era ${OTIMOS[rodada]}`;
    if (rodada < TRECHOS.length - 1) {
      setMsg(`O porto se ilumina com ${n} toques (${nota}). A fileira seguinte se acende.`);
      agendar(() => { setRodada(rodada + 1); setLuz(TRECHOS[rodada + 1].map((r) => [...r])); setToques(0); setTravado(false); setMsg(INTROS[rodada + 1]); }, 2300);
      return;
    }
    fim.current = true;
    giveItem("luar-de-linhas");
    const total = toquesTotal.current;
    setMsg(`Todas as lâmpadas do porto acendem juntas (${nota}).`);
    agendar(() => complete("luar", {
      estrelas: total <= SOMA_OTIMOS ? 3 : total <= SOMA_OTIMOS + 2 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Toques: ${total} (o mínimo seria ${SOMA_OTIMOS})`, reinicios.current ? `Fileiras refeitas: ${reinicios.current}` : "Nenhuma fileira refeita"],
    }), 2800);
  };

  const tocarLinha = (y: number) => {
    if (fim.current || travado) return;
    const novo = luz.map((r) => [...r]);
    for (let x = 0; x < W; x++) novo[y][x] = 1 - novo[y][x];
    applica(novo);
  };
  const tocarColuna = (x: number) => {
    if (fim.current || travado) return;
    const novo = luz.map((r) => [...r]);
    for (let y = 0; y < H; y++) novo[y][x] = 1 - novo[y][x];
    applica(novo);
  };
  const applica = (novo: number[][]) => {
    const n = toques + 1;
    toquesTotal.current++;
    setLuz(novo); setToques(n);
    audio.sfx.luar.toque();
    if (novo.every((r) => r.every((v) => v === 1))) { concluir(n); return; }
    setMsg(`${novo.flat().filter((v) => v === 1).length} de ${H * W} lâmpadas acesas.`);
  };

  const reiniciar = () => {
    if (fim.current || travado) return;
    reinicios.current++;
    setLuz(TRECHOS[rodada].map((r) => [...r]));
    audio.sfx.interagir();
    setMsg("As lâmpadas voltam ao estado inicial. Os toques já dados continuam contando.");
  };

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-4 overflow-y-auto px-6 py-10">
      <AmbienteFase tipo="silencio" />
      <div className="flex justify-center"><Cabecalho id="luar" /></div>

      <p className="font-narrativa italic text-espuma/80">Fileira {rodada + 1} de {TRECHOS.length}: acenda todas as lâmpadas.</p>

      <div className="mx-auto w-full" style={{ maxWidth: (W + 1) * 50 }}>
        <div className="grid gap-1" style={{ gridTemplateColumns: `auto repeat(${W}, 1fr)` }}>
          <div />
          {Array.from({ length: W }, (_, x) => (
            <button key={`c${x}`} onClick={() => tocarColuna(x)} disabled={travado} aria-label={`Inverter coluna ${x + 1}`}
              className="rounded-md border border-latao/50 py-1 text-xs text-latao active:scale-95 disabled:opacity-40">↕</button>
          ))}
          {luz.map((linha, y) => (
            <Fragment key={`linha-${y}`}>
              <button onClick={() => tocarLinha(y)} disabled={travado} aria-label={`Inverter linha ${y + 1}`}
                className="flex items-center justify-center rounded-md border border-latao/50 px-2 text-xs text-latao active:scale-95 disabled:opacity-40">↔</button>
              {linha.map((v, x) => (
                <div key={`${y}-${x}`} role="img" aria-label={`Lâmpada ${v ? "acesa" : "apagada"}`}
                  className={`aspect-square rounded-full border-2 transition-all duration-300 ${v ? "border-lanterna bg-lanterna/70 shadow-[0_0_16px_4px_rgba(255,191,0,0.45)]" : "border-latao/40 bg-[#2a3d44]"}`} />
              ))}
            </Fragment>
          ))}
        </div>
      </div>

      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Toques: {toques} · {todasAcesas ? "todas acesas" : "faltam lâmpadas"}</span>
        <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 underline disabled:opacity-40"><RotateCcw size={14} aria-hidden /> Apagar tudo</button>
      </p>

      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
