import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Undo2 } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// # rocha · f peixe · o marca.
// Cada movimento leva TODO o cardume uma casa na mesma direção. Peixe que bateria numa rocha, na borda
// ou em outro peixe fica onde está. Vence quando os peixes ocupam exatamente as marcas.
// OTIMOS é o mínimo de movimentos de cada mapa, achado por busca em largura sobre o conjunto de posições.
const MAPAS = [
  [".#...", ".f.o.", "#..o.", ".....", ".f.#."],
  [".of..", ".#.o#", "#....", "..f#.", "..#.."],
  ["#....", ".fo..", "f#f..", "oo...", "..#.."],
];
const OTIMOS = [4, 5, 6];
const SOMA_OTIMOS = OTIMOS.reduce((a, b) => a + b, 0);

const INTROS = [
  "O cardume segue quem se move com firmeza. Cada direção vale para todos os peixes ao mesmo tempo.",
  "Agora há mais peixes que marcas, e as rochas prendem quem encosta nelas. Um peixe parado pode fazer o cardume inteiro parar.",
  "O último cardume do porto. Antes de cada movimento, veja onde cada peixe vai bater.",
];

type Campo = { W: number; H: number; rochas: Set<number>; marcas: number[]; peixes: number[] };

function ler(mapa: string[]): Campo {
  const H = mapa.length, W = mapa[0].length;
  const rochas = new Set<number>(), marcas: number[] = [], peixes: number[] = [];
  mapa.forEach((l, y) => [...l].forEach((c, x) => {
    const p = y * W + x;
    if (c === "#") rochas.add(p);
    if (c === "o") marcas.push(p);
    if (c === "f") peixes.push(p);
  }));
  return { W, H, rochas, marcas, peixes };
}
const CAMPOS = MAPAS.map(ler);

// Move todos os peixes uma casa. Quem não pode andar fica; quem chegaria à mesma casa que outro também fica.
function passo(f: Campo, ps: number[], dx: number, dy: number): number[] {
  const novo = ps.map((p) => {
    const x = (p % f.W) + dx, y = Math.floor(p / f.W) + dy;
    if (x < 0 || y < 0 || x >= f.W || y >= f.H) return p;
    const q = y * f.W + x;
    return f.rochas.has(q) ? p : q;
  });
  const cont = new Map<number, number>();
  novo.forEach((q) => cont.set(q, (cont.get(q) ?? 0) + 1));
  return novo.map((q, i) => ((cont.get(q) ?? 0) > 1 ? ps[i] : q));
}

export default function CardumeFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const movsTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [peixes, setPeixes] = useState<number[]>(CAMPOS[0].peixes);
  const [historico, setHistorico] = useState<number[][]>([]);
  const [movs, setMovs] = useState(0);
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);

  const f = CAMPOS[rodada];
  const noLugar = peixes.filter((p) => f.marcas.includes(p)).length;
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const concluir = (m: number) => {
    setTravado(true);
    audio.sfx.cardume.chegou();
    const nota = m === OTIMOS[rodada] ? "o caminho mais curto" : `o mais curto tinha ${OTIMOS[rodada]}`;
    if (rodada < CAMPOS.length - 1) {
      setMsg(`O cardume chega às marcas em ${m} movimentos (${nota}). A corrente abre o trecho seguinte.`);
      agendar(() => {
        const prox = rodada + 1;
        setRodada(prox);
        setPeixes(CAMPOS[prox].peixes);
        setHistorico([]); setMovs(0); setTravado(false);
        setMsg(INTROS[prox]);
      }, 2300);
      return;
    }
    fim.current = true;
    giveItem("cardume-guiado");
    const total = movsTotal.current;
    setMsg(`Os peixes voltam ao porto em fila, e a cidade sente a corrente mudar (${nota}).`);
    agendar(() => complete("cardume", {
      estrelas: total <= SOMA_OTIMOS + 2 ? 3 : total <= SOMA_OTIMOS + 6 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Movimentos: ${total} (o mínimo seria ${SOMA_OTIMOS})`, reinicios.current ? `Trechos reiniciados: ${reinicios.current}` : "Nenhum reinício"],
    }), 2800);
  };

  const mover = (dx: number, dy: number) => {
    if (fim.current || travado) return;
    const novo = passo(f, peixes, dx, dy);
    if (novo.every((p, i) => p === peixes[i])) { audio.sfx.cardume.parado(); setMsg("Nenhum peixe consegue andar nessa direção."); return; }
    const m = movs + 1;
    movsTotal.current++;
    setHistorico((h) => [...h, peixes]);
    setPeixes(novo);
    setMovs(m);
    audio.sfx.cardume.nada();
    const ok = [...novo].sort((a, b) => a - b).join(",") === [...f.marcas].sort((a, b) => a - b).join(",");
    if (ok) { concluir(m); return; }
    setMsg("O cardume se move. Alguns peixes pararam junto às rochas.");
  };

  const desfazer = () => {
    const ant = historico[historico.length - 1];
    if (!ant || fim.current || travado) return;
    setPeixes(ant);
    setHistorico(historico.slice(0, -1));
    audio.sfx.cardume.parado();
    setMsg("O cardume volta um passo. Os movimentos já feitos continuam contando.");
  };

  const reiniciar = () => {
    if (fim.current || travado) return;
    reinicios.current++;
    setPeixes(f.peixes); setHistorico([]);
    audio.sfx.interagir();
    setMsg("O cardume volta ao começo do trecho. Os movimentos já feitos continuam contando.");
  };

  const acoes = useRef({ mover, desfazer });
  acoes.current = { mover, desfazer };
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const d: Record<string, [number, number]> = {
        ArrowUp: [0, -1], w: [0, -1], W: [0, -1], ArrowDown: [0, 1], s: [0, 1], S: [0, 1],
        ArrowLeft: [-1, 0], a: [-1, 0], A: [-1, 0], ArrowRight: [1, 0], d: [1, 0], D: [1, 0],
      };
      if (d[e.key]) { e.preventDefault(); acoes.current.mover(...d[e.key]); }
      else if (e.key === "z" || e.key === "Z") acoes.current.desfazer();
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, []);

  const seta = (rotulo: string, Icone: typeof ArrowUp, dx: number, dy: number) => (
    <button
      onClick={() => mover(dx, dy)}
      aria-label={rotulo}
      className="flex h-14 w-14 items-center justify-center rounded-xl border border-lanterna/60 bg-mare/40 text-lanterna active:scale-95"
    ><Icone size={22} aria-hidden /></button>
  );

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-3 overflow-y-auto px-4 py-3 fase-compacta">
      <AmbienteFase tipo="cardume" />
      <div className="flex justify-center"><Cabecalho id="cardume" /></div>

      <p className="font-narrativa italic text-espuma/80">Trecho {rodada + 1} de {CAMPOS.length}: leve o cardume inteiro às marcas.</p>

      <div
        role="img"
        aria-label={`Cardume com ${peixes.length} peixes. ${noLugar} nas marcas. Use as setas para mover todos juntos.`}
        className="mx-auto grid w-full gap-px rounded-lg border border-latao/60 bg-abismo/60 p-1 backdrop-blur-sm"
        style={{ maxWidth: f.W * 54, gridTemplateColumns: `repeat(${f.W}, 1fr)` }}
      >
        {Array.from({ length: f.W * f.H }, (_, p) => {
          if (f.rochas.has(p)) return <div key={p} className="aspect-square rounded-sm bg-[#2a3d44] shadow-inner" />;
          const marca = f.marcas.includes(p), peixe = peixes.includes(p);
          return (
            <div key={p} className="relative aspect-square rounded-sm bg-mare/25">
              {marca && <span className="absolute inset-[30%] rounded-full border-2 border-lanterna/70" />}
              {peixe && (
                <span className={`absolute inset-[22%] rounded-full transition-colors duration-300 ${marca ? "bg-alga shadow-[0_0_14px_3px_rgba(127,224,208,0.5)]" : "bg-coral shadow-[0_0_10px_2px_rgba(224,122,95,0.4)]"}`} />
              )}
            </div>
          );
        })}
      </div>

      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Movimentos: {movs} · Nas marcas: {noLugar}/{f.marcas.length}</span>
        <button onClick={desfazer} disabled={!historico.length || travado} className="flex items-center gap-1 underline disabled:opacity-40">
          <Undo2 size={14} aria-hidden /> Desfazer (Z)
        </button>
      </p>

      <div className="mx-auto grid grid-cols-3 gap-2" role="group" aria-label="Mover o cardume">
        <span />{seta("Mover para cima", ArrowUp, 0, -1)}<span />
        {seta("Mover para a esquerda", ArrowLeft, -1, 0)}{seta("Mover para baixo", ArrowDown, 0, 1)}{seta("Mover para a direita", ArrowRight, 1, 0)}
      </div>

      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
      <button onClick={reiniciar} disabled={travado} className="self-center text-sm text-espuma/60 underline disabled:opacity-40">Reiniciar trecho</button>
    </main>
  );
}
