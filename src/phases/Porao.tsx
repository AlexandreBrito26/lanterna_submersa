import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw, Undo2 } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// # parede · espaço chão · . marca · $ caixa · * caixa na marca · @ jogador · + jogador na marca
// Cada porão foi resolvido por busca em largura: todos têm solução, e OTIMOS é o mínimo de movimentos.
const MAPAS = [
  ["######", "#    #", "#@$  #", "# $# #", "#. #.#", "######"],
  ["#######", "# $ .##", "#. .$ #", "##  $@#", "#  #  #", "#######"],
  ["#######", "#   ###", "#.    #", "#   $##", "# $ $ #", "#@# ..#", "#######"],
];
const OTIMOS = [23, 34, 40];
const SOMA_OTIMOS = OTIMOS.reduce((a, b) => a + b, 0);

const INTROS = [
  "Empurre as caixas até as marcas douradas. Você só empurra, nunca puxa, e só uma caixa de cada vez.",
  "O porão se estreita. Pense antes de encostar uma caixa na parede: ela não sai mais de lá.",
  "O último porão, o do fundo. Quando as três caixas encaixarem, a escada fica livre.",
];

type Estado = { j: number; caixas: number[] };
type Porao = { W: number; H: number; paredes: Set<number>; alvos: Set<number>; ini: Estado };

function ler(mapa: string[]): Porao {
  const H = mapa.length, W = mapa[0].length;
  const paredes = new Set<number>(), alvos = new Set<number>(), caixas: number[] = [];
  let j = 0;
  mapa.forEach((linha, y) => [...linha].forEach((c, x) => {
    const p = y * W + x;
    if (c === "#") paredes.add(p);
    if (c === "." || c === "*" || c === "+") alvos.add(p);
    if (c === "$" || c === "*") caixas.push(p);
    if (c === "@" || c === "+") j = p;
  }));
  return { W, H, paredes, alvos, ini: { j, caixas } };
}
const PORAOS = MAPAS.map(ler);

// Um passo na direção (dx, dy). Devolve null se estiver bloqueado.
function andar(f: Porao, e: Estado, dx: number, dy: number): { e: Estado; empurrou: boolean; noLugar: boolean } | null {
  const x = (e.j % f.W) + dx, y = Math.floor(e.j / f.W) + dy;
  if (x < 0 || y < 0 || x >= f.W || y >= f.H) return null;
  const p = y * f.W + x;
  if (f.paredes.has(p)) return null;
  const bi = e.caixas.indexOf(p);
  if (bi < 0) return { e: { j: p, caixas: e.caixas }, empurrou: false, noLugar: false };
  const bx = x + dx, by = y + dy;
  if (bx < 0 || by < 0 || bx >= f.W || by >= f.H) return null;
  const q = by * f.W + bx;
  if (f.paredes.has(q) || e.caixas.includes(q)) return null;
  const caixas = [...e.caixas];
  caixas[bi] = q;
  return { e: { j: p, caixas }, empurrou: true, noLugar: f.alvos.has(q) && !f.alvos.has(p) };
}

export default function PoraoFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const movsTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [estado, setEstado] = useState<Estado>(PORAOS[0].ini);
  const [historico, setHistorico] = useState<Estado[]>([]);
  const [movs, setMovs] = useState(0);
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);

  const f = PORAOS[rodada];
  const noLugar = estado.caixas.filter((c) => f.alvos.has(c)).length;
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const concluir = (m: number) => {
    setTravado(true);
    const nota = m === OTIMOS[rodada] ? "o caminho mais curto" : `o mais curto tinha ${OTIMOS[rodada]}`;
    if (rodada < PORAOS.length - 1) {
      setMsg(`Todas as caixas nas marcas, em ${m} passos (${nota}). Uma porta de madeira cede, e o porão seguinte aparece.`);
      agendar(() => {
        const prox = rodada + 1;
        setRodada(prox);
        setEstado(PORAOS[prox].ini);
        setHistorico([]); setMovs(0); setTravado(false);
        setMsg(INTROS[prox]);
      }, 2300);
      return;
    }
    fim.current = true;
    audio.sfx.estivaOk();
    agendar(() => { audio.sfx.porta(); audio.sfx.vitoria(); }, 900);
    giveItem("lista-de-bordo");
    setMsg(`O porão está livre (${nota}). Pela escada, uma fila de gente começa a descer, com malas e crianças. Ninguém conta. Ninguém fica de fora.`);
    const total = movsTotal.current;
    agendar(() => complete("porao", {
      estrelas: total <= SOMA_OTIMOS * 1.5 ? 3 : total <= SOMA_OTIMOS * 2.5 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Passos: ${total} (o mínimo seria ${SOMA_OTIMOS})`, reinicios.current ? `Porões reiniciados: ${reinicios.current}` : "Nenhum reinício"],
    }), 3000);
  };

  const mover = (dx: number, dy: number) => {
    if (fim.current || travado) return;
    const r = andar(f, estado, dx, dy);
    if (!r) return;
    const m = movs + 1;
    movsTotal.current++;
    setHistorico((h) => [...h, estado]);
    setEstado(r.e);
    setMovs(m);
    if (r.empurrou) audio.sfx.empurrar(); else audio.sfx.passo();
    if (r.noLugar) audio.sfx.caixaNoLugar();
    if (r.e.caixas.every((c) => f.alvos.has(c))) { concluir(m); return; }
    if (r.noLugar) setMsg("Uma caixa encaixa na marca.");
  };

  const desfazer = () => {
    const ant = historico[historico.length - 1];
    if (!ant || fim.current || travado) return;
    setEstado(ant);
    setHistorico(historico.slice(0, -1));
    audio.sfx.passo();
    setMsg("Você volta um passo. Os passos já dados continuam contando.");
  };

  const reiniciar = () => {
    if (fim.current || travado) return;
    reinicios.current++;
    setEstado(f.ini); setHistorico([]);
    audio.sfx.interagir();
    setMsg("O porão volta ao começo. Os passos já dados continuam contando.");
  };

  // Teclado: setas ou WASD para andar, Z para desfazer
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
      <AmbienteFase tipo="catedral" />
      <div className="flex justify-center"><Cabecalho id="porao" /></div>

      <p className="font-narrativa italic text-espuma/80">Porão {rodada + 1} de {PORAOS.length}: {f.alvos.size} caixas, {f.alvos.size} marcas.</p>

      <div
        role="img"
        aria-label={`Porão com ${f.alvos.size} caixas. ${noLugar} nas marcas. Use as setas para andar.`}
        className="mx-auto grid w-full gap-px rounded-lg border border-latao/60 bg-abismo/60 p-1 backdrop-blur-sm"
        style={{ maxWidth: f.W * 54, gridTemplateColumns: `repeat(${f.W}, 1fr)` }}
      >
        {Array.from({ length: f.W * f.H }, (_, p) => {
          if (f.paredes.has(p)) return <div key={p} className="aspect-square rounded-sm bg-[#2a3d44] shadow-inner" />;
          const alvo = f.alvos.has(p), caixa = estado.caixas.includes(p), eu = estado.j === p;
          return (
            <div key={p} className="relative aspect-square rounded-sm bg-mare/25">
              {alvo && <span className="absolute inset-[30%] rounded-full border-2 border-lanterna/70" />}
              {caixa && (
                <span className={`absolute inset-[8%] rounded-md border-2 transition-colors ${alvo ? "border-lanterna bg-lanterna/80 shadow-[0_0_14px_3px_rgba(255,191,0,0.5)]" : "border-latao bg-[#6e4f33]"}`}>
                  <span className="absolute inset-[22%] rounded-sm border border-abismo/40" />
                </span>
              )}
              {eu && <span className="absolute inset-[18%] rounded-full bg-espuma shadow-[0_0_12px_2px_rgba(242,230,214,0.5)]"><span className="absolute inset-[34%] rounded-full bg-lanterna" /></span>}
            </div>
          );
        })}
      </div>

      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Passos: {movs} · Nas marcas: {noLugar}/{f.alvos.size}</span>
        <span className="flex items-center gap-4">
          <button onClick={desfazer} disabled={!historico.length || travado} className="flex items-center gap-1 underline disabled:opacity-40">
            <Undo2 size={14} aria-hidden /> Desfazer (Z)
          </button>
          <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 underline disabled:opacity-40">
            <RotateCcw size={14} aria-hidden /> Reiniciar
          </button>
        </span>
      </p>

      <div className="mx-auto grid grid-cols-3 gap-2" role="group" aria-label="Mover">
        <span />{seta("Subir", ArrowUp, 0, -1)}<span />
        {seta("Ir para a esquerda", ArrowLeft, -1, 0)}{seta("Descer", ArrowDown, 0, 1)}{seta("Ir para a direita", ArrowRight, 1, 0)}
      </div>

      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
