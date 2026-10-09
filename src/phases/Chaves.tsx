import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw, Undo2 } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// Chaves do breu. r e b são chaves vermelha e azul (pegas ao pisar, e não se gastam).
// R e B são portas: só abrem com a chave da mesma cor. # é parede. Chegue à saída (E).
// OTIMOS é o menor número de passos de cada trecho, por busca em largura sobre (posição, chaves).
const MAPAS = [
  ["S.r#.", ".#R.E", "...#.", "....."],
  ["S..r#.", "..#R.b", ".B#.#.", "....#E", "r...#."],
];
const BIT: Record<string, number> = { r: 1, b: 2 };
const PORTA: Record<string, number> = { R: 1, B: 2 };

type Trecho = { W: number; H: number; celulas: string[]; ini: number; saida: number };
function ler(m: string[]): Trecho {
  const celulas = m.flatMap((l) => [...l]);
  return { W: m[0].length, H: m.length, celulas, ini: celulas.indexOf("S"), saida: celulas.indexOf("E") };
}
const TRECHOS = MAPAS.map(ler);

function minimoDe(t: Trecho): number {
  const fila: [number, number, number][] = [[t.ini, 0, 0]];
  const vist = new Set([`${t.ini}:0`]);
  for (let i = 0; i < fila.length; i++) {
    const [p, k, d] = fila[i];
    if (p === t.saida) return d;
    const x = p % t.W, y = Math.floor(p / t.W);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= t.W || ny >= t.H) continue;
      const q = ny * t.W + nx, c = t.celulas[q];
      if (c === "#") continue;
      if (PORTA[c] && !(k & PORTA[c])) continue;
      const k2 = k | (BIT[c] ?? 0), key = `${q}:${k2}`;
      if (vist.has(key)) continue;
      vist.add(key); fila.push([q, k2, d + 1]);
    }
  }
  return Infinity;
}
const OTIMOS = TRECHOS.map(minimoDe);
const SOMA_OTIMOS = OTIMOS.reduce((a, b) => a + b, 0);

const INTROS = [
  "Pegue a chave vermelha antes de tentar a porta vermelha. As chaves não se gastam: uma chave serve para todas as portas da sua cor.",
  "Agora há uma chave azul escondida. Ela pode estar do lado de cá de uma porta, então explore antes de decidir o caminho.",
];

export default function ChavesFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const passosTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [pos, setPos] = useState(TRECHOS[0].ini);
  const [chaves, setChaves] = useState(0);
  const [historico, setHistorico] = useState<{ pos: number; chaves: number }[]>([]);
  const [passos, setPassos] = useState(0);
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);

  const t = TRECHOS[rodada];
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const concluir = (n: number) => {
    setTravado(true);
    audio.sfx.chaves.abrir();
    const nota = n === OTIMOS[rodada] ? "o mínimo de passos" : `o mínimo era ${OTIMOS[rodada]}`;
    if (rodada < TRECHOS.length - 1) {
      setMsg(`A porta da saída se abre em ${n} passos (${nota}). O breu seguinte se revela.`);
      agendar(() => { setRodada(rodada + 1); setPos(TRECHOS[rodada + 1].ini); setChaves(0); setHistorico([]); setPassos(0); setTravado(false); setMsg(INTROS[rodada + 1]); }, 2300);
      return;
    }
    fim.current = true;
    giveItem("chaves-do-breu");
    const total = passosTotal.current;
    setMsg(`A última porta cede, e a luz volta para o porto (${nota}).`);
    agendar(() => complete("chaves", {
      estrelas: total <= SOMA_OTIMOS ? 3 : total <= SOMA_OTIMOS + 3 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Passos: ${total} (o mínimo seria ${SOMA_OTIMOS})`, reinicios.current ? `Breus refeitos: ${reinicios.current}` : "Nenhum breu refeito"],
    }), 2800);
  };

  const mover = (dx: number, dy: number) => {
    if (fim.current || travado) return;
    const x = (pos % t.W) + dx, y = Math.floor(pos / t.W) + dy;
    if (x < 0 || y < 0 || x >= t.W || y >= t.H) return;
    const q = y * t.W + x, c = t.celulas[q];
    if (c === "#") { audio.sfx.chaves.bate(); setMsg("Parede. Esse caminho está fechado."); return; }
    if (PORTA[c] && !(chaves & PORTA[c])) {
      audio.sfx.chaves.bate();
      setMsg(`Porta ${c === "R" ? "vermelha" : "azul"} trancada. Procure a chave ${c === "R" ? "vermelha" : "azul"}.`);
      return;
    }
    const k2 = chaves | (BIT[c] ?? 0);
    setHistorico([...historico, { pos, chaves }]);
    setPos(q); setChaves(k2); setPassos(passos + 1);
    passosTotal.current++;
    if (q === t.saida) { concluir(passos + 1); return; }
    if (BIT[c] && !(chaves & BIT[c])) { audio.sfx.chaves.pegar(); setMsg(`Você pega a chave ${c === "r" ? "vermelha" : "azul"}.`); return; }
    audio.sfx.chaves.passo();
    setMsg("Você avança pelo breu.");
  };

  const desfazer = () => {
    if (fim.current || travado || historico.length === 0) return;
    const ant = historico[historico.length - 1];
    setPos(ant.pos); setChaves(ant.chaves); setHistorico(historico.slice(0, -1));
    audio.sfx.chaves.passo();
    setMsg("Você volta um passo. As chaves que pegou continuam com você.");
  };

  const reiniciar = () => {
    if (fim.current || travado) return;
    reinicios.current++;
    setPos(t.ini); setChaves(0); setHistorico([]);
    audio.sfx.interagir();
    setMsg("Você volta ao começo do breu. Os passos já dados continuam contando.");
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
    <button onClick={() => mover(dx, dy)} aria-label={rotulo}
      className="flex h-14 w-14 items-center justify-center rounded-xl border border-lanterna/60 bg-mare/40 text-lanterna active:scale-95">
      <Icone size={22} aria-hidden />
    </button>
  );

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-3 overflow-y-auto px-4 py-3 fase-compacta">
      <AmbienteFase tipo="silencio" />
      <div className="flex justify-center"><Cabecalho id="chaves" /></div>

      <p className="font-narrativa italic text-espuma/80">Breu {rodada + 1} de {TRECHOS.length}: pegue as chaves certas e chegue à saída.</p>

      <div role="img" aria-label={`Breu com ${t.W} por ${t.H} casas. Chaves: ${chaves & 1 ? "vermelha " : ""}${chaves & 2 ? "azul" : ""}`}
        className="mx-auto grid w-full gap-1 rounded-lg border border-latao/60 bg-abismo/60 p-2 backdrop-blur-sm"
        style={{ maxWidth: t.W * 58, gridTemplateColumns: `repeat(${t.W}, 1fr)` }}>
        {t.celulas.map((c, p) => {
          if (c === "#") return <div key={p} className="aspect-square rounded-sm bg-[#2a3d44] shadow-inner" />;
          const eu = pos === p;
          const porta = PORTA[c];
          const aberta = porta ? !!(chaves & porta) : false;
          return (
            <div key={p} className={`relative aspect-square rounded-sm ${porta ? (aberta ? "bg-mare/20" : c === "R" ? "bg-coral/40" : "bg-mare/60") : "bg-mare/25"}`}>
              {(c === "r" || c === "b") && <span className={`absolute inset-[30%] rounded-full ${c === "r" ? "bg-coral" : "bg-mare"} shadow-[0_0_10px_2px_rgba(242,230,214,0.35)]`} />}
              {porta && !aberta && <span className="absolute inset-[18%] rounded-sm border-2 border-espuma/50" />}
              {c === "E" && <span className="absolute inset-[24%] rounded-full bg-lanterna shadow-[0_0_14px_4px_rgba(255,191,0,0.5)]" />}
              {eu && <span className="absolute inset-[22%] rounded-full bg-espuma shadow-[0_0_10px_2px_rgba(242,230,214,0.5)]" />}
            </div>
          );
        })}
      </div>

      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Passos: {passos} · Chaves: {chaves & 1 ? "vermelha " : ""}{chaves & 2 ? "azul" : ""}{!chaves ? "nenhuma" : ""}</span>
        <span className="flex items-center gap-4">
          <button onClick={desfazer} disabled={!historico.length || travado} className="flex items-center gap-1 underline disabled:opacity-40"><Undo2 size={14} aria-hidden /> Desfazer (Z)</button>
          <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 underline disabled:opacity-40"><RotateCcw size={14} aria-hidden /> Reiniciar</button>
        </span>
      </p>

      <div className="mx-auto grid grid-cols-3 gap-2" role="group" aria-label="Andar">
        <span />{seta("Subir", ArrowUp, 0, -1)}<span />
        {seta("Ir para a esquerda", ArrowLeft, -1, 0)}{seta("Descer", ArrowDown, 0, 1)}{seta("Ir para a direita", ArrowRight, 1, 0)}
      </div>

      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
