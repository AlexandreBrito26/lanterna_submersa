import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// Caminho alternado. Casas a (ciano) e b (âmbar). Cada passo precisa ir para uma casa de cor DIFERENTE da atual.
// @ é o início (cor a), * é a saída (aceita qualquer cor). # é parede. OTIMOS é o mínimo de passos de cada trecho (busca em largura).
const MAPAS = [
  ["@a..", "b#a.", "a.b*"],
  ["@b.a.", ".#a#b", "ba.b.", "#a#b*"],
  ["@ba...", "a#b#a.", "b.a.b#", "..b#*"],
];
const OTIMOS = [5, 7, 7];
const SOMA_OTIMOS = OTIMOS.reduce((a, b) => a + b, 0);

const INTROS = [
  "Cada passo precisa trocar de cor: do ciano para o âmbar e do âmbar para o ciano. Chegue à saída respeitando a alternância.",
  "O caminho tem paredes e becos. Quando uma cor se repete, você precisa voltar e buscar a cor certa.",
  "A última trilha da costa. Pense dois passos à frente: uma troca errada encerra o caminho.",
];

type Trecho = { W: number; H: number; celulas: string[]; ini: number; alvo: number };

function ler(mapa: string[]): Trecho {
  const H = mapa.length, W = mapa[0].length;
  const celulas = mapa.flatMap((l) => [...l]);
  return { W, H, celulas, ini: celulas.indexOf("@"), alvo: celulas.indexOf("*") };
}
const TRECHOS = MAPAS.map(ler);

function corDe(t: Trecho, p: number): string {
  const c = t.celulas[p];
  return c === "@" ? "a" : c;
}

export default function AlternadoFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const passosTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [pos, setPos] = useState(TRECHOS[0].ini);
  const [historico, setHistorico] = useState<number[]>([]);
  const [passos, setPassos] = useState(0);
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);

  const t = TRECHOS[rodada];
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const concluir = (n: number) => {
    setTravado(true);
    audio.sfx.alternado.chegou();
    const nota = n === OTIMOS[rodada] ? "o caminho mais curto" : `o mais curto tinha ${OTIMOS[rodada]}`;
    if (rodada < TRECHOS.length - 1) {
      setMsg(`Você chega à saída em ${n} passos (${nota}). A trilha seguinte se acende na areia.`);
      agendar(() => {
        const prox = rodada + 1;
        setRodada(prox);
        setPos(TRECHOS[prox].ini); setHistorico([]); setPassos(0); setTravado(false);
        setMsg(INTROS[prox]);
      }, 2300);
      return;
    }
    fim.current = true;
    giveItem("trilha-alternada");
    const total = passosTotal.current;
    setMsg(`A última trilha leva à luz, e as cores voltam a se alternar em paz (${nota}).`);
    agendar(() => complete("alternado", {
      estrelas: total <= SOMA_OTIMOS ? 3 : total <= SOMA_OTIMOS + 3 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Passos: ${total} (o mínimo seria ${SOMA_OTIMOS})`, reinicios.current ? `Trilhas refeitas: ${reinicios.current}` : "Nenhuma trilha refeita"],
    }), 2800);
  };

  const mover = (dx: number, dy: number) => {
    if (fim.current || travado) return;
    const x = (pos % t.W) + dx, y = Math.floor(pos / t.W) + dy;
    if (x < 0 || y < 0 || x >= t.W || y >= t.H) return;
    const q = y * t.W + x;
    if (t.celulas[q] === "#") { audio.sfx.alternado.bate(); setMsg("Parede. Esse caminho está fechado."); return; }
    const destinoEhSaida = q === t.alvo;
    if (!destinoEhSaida && corDe(t, q) === corDe(t, pos)) {
      audio.sfx.alternado.bate();
      setMsg(`A casa é da mesma cor (${corDe(t, q)}). Troque de cor a cada passo.`);
      return;
    }
    setHistorico([...historico, pos]);
    setPos(q);
    const n = passos + 1;
    setPassos(n);
    passosTotal.current++;
    if (destinoEhSaida) { concluir(n); return; }
    audio.sfx.alternado.passo(corDe(t, q));
    setMsg(`Casa ${corDe(t, q) === "a" ? "ciano" : "âmbar"}. Agora, a outra cor.`);
  };

  const desfazer = () => {
    if (fim.current || travado || historico.length === 0) return;
    setPos(historico[historico.length - 1]);
    setHistorico(historico.slice(0, -1));
    audio.sfx.alternado.passo("a");
    setMsg("Você volta um passo. Os passos já dados continuam contando.");
  };

  const reiniciar = () => {
    if (fim.current || travado) return;
    reinicios.current++;
    setPos(t.ini); setHistorico([]);
    audio.sfx.interagir();
    setMsg("Você volta ao começo da trilha. Os passos já dados continuam contando.");
  };

  const acoes = useRef({ mover });
  acoes.current = { mover };
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const d: Record<string, [number, number]> = {
        ArrowUp: [0, -1], w: [0, -1], W: [0, -1], ArrowDown: [0, 1], s: [0, 1], S: [0, 1],
        ArrowLeft: [-1, 0], a: [-1, 0], A: [-1, 0], ArrowRight: [1, 0], d: [1, 0], D: [1, 0],
      };
      if (d[e.key]) { e.preventDefault(); acoes.current.mover(...d[e.key]); }
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
      <AmbienteFase tipo="coral" />
      <div className="flex justify-center"><Cabecalho id="alternado" /></div>

      <p className="font-narrativa italic text-espuma/80">Trilha {rodada + 1} de {TRECHOS.length}: troque de cor a cada passo até a saída.</p>

      <div
        role="img"
        aria-label={`Trilha de ${t.W} por ${t.H} casas. Você está numa casa ${corDe(t, pos) === "a" ? "ciano" : "âmbar"}.`}
        className="mx-auto grid w-full gap-1 rounded-lg border border-latao/60 bg-abismo/60 p-2 backdrop-blur-sm"
        style={{ maxWidth: t.W * 60, gridTemplateColumns: `repeat(${t.W}, 1fr)` }}
      >
        {Array.from({ length: t.W * t.H }, (_, p) => {
          const c = t.celulas[p];
          if (c === "#") return <div key={p} className="aspect-square rounded-md bg-[#2a3d44] shadow-inner" />;
          const cor = c === "b" ? "bg-latao/60" : c === "*" ? "bg-lanterna/40" : "bg-alga/40";
          const eu = pos === p;
          return (
            <div key={p} className={`relative aspect-square rounded-md ${cor}`}>
              {c === "*" && <span className="absolute inset-[30%] rounded-full bg-lanterna shadow-[0_0_14px_4px_rgba(255,191,0,0.5)]" />}
              {eu && <span className="absolute inset-[22%] rounded-full bg-espuma shadow-[0_0_10px_2px_rgba(242,230,214,0.5)]" />}
            </div>
          );
        })}
      </div>

      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Passos: {passos} · Casa atual: {corDe(t, pos) === "a" ? "ciano" : "âmbar"}</span>
        <button onClick={desfazer} disabled={!historico.length || travado} className="flex items-center gap-1 underline disabled:opacity-40">Desfazer</button>
      </p>

      <div className="mx-auto grid grid-cols-3 gap-2" role="group" aria-label="Andar na trilha">
        <span />{seta("Subir", ArrowUp, 0, -1)}<span />
        {seta("Ir para a esquerda", ArrowLeft, -1, 0)}{seta("Descer", ArrowDown, 0, 1)}{seta("Ir para a direita", ArrowRight, 1, 0)}
      </div>

      <div className="flex justify-center">
        <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 text-sm text-espuma/70 underline disabled:opacity-40">
          <RotateCcw size={14} aria-hidden /> Voltar ao começo
        </button>
      </div>

      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
