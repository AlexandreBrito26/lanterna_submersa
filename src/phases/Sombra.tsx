import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw, Undo2 } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// Sombra espelhada. Você anda numa grade com paredes (#). Sua sombra fica na posição espelhada (eixo vertical).
// Vence chegando à saída (E) com a sombra sobre a lâmpada (L). OTIMOS é o menor número de passos de cada trecho (busca em largura).
const MAPAS = [
  ["....#", "E...L", "...S.", "....."],
  ["##...", ".E#L#", ".#.S.", "....."],
];
const OTIMOS = [4, 7];
const SOMA_OTIMOS = OTIMOS.reduce((a, b) => a + b, 0);

type Trecho = { W: number; H: number; paredes: Set<number>; ini: number; saida: number; lampada: number };
function ler(mapa: string[]): Trecho {
  const H = mapa.length, W = mapa[0].length;
  const paredes = new Set<number>(); let ini = 0, saida = 0, lampada = 0;
  mapa.forEach((l, y) => [...l].forEach((c, x) => {
    const p = y * W + x;
    if (c === "#") paredes.add(p);
    if (c === "S") ini = p;
    if (c === "E") saida = p;
    if (c === "L") lampada = p;
  }));
  return { W, H, paredes, ini, saida, lampada };
}
const TRECHOS = MAPAS.map(ler);
const sombraDe = (t: Trecho, p: number) => (t.W - 1 - (p % t.W)) + Math.floor(p / t.W) * t.W;

const INTROS = [
  "Sua sombra anda espelhada: quando você vai para a direita, ela vai para a esquerda. Leve a sombra até a lâmpada e você chega à saída.",
  "Há paredes espalhadas, e a sombra só acende a lâmpada se você estiver certo na saída. Pense no espelho antes de cada passo.",
];
const LIMITE = { tres: 3, dois: 6 };

export default function SombraFase() {
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
    audio.sfx.sombra.acender();
    const nota = n === OTIMOS[rodada] ? "o caminho mais curto" : `o mais curto tinha ${OTIMOS[rodada]}`;
    if (rodada < TRECHOS.length - 1) {
      setMsg(`A lâmpada acende com a sombra e a saída se abre em ${n} passos (${nota}).`);
      agendar(() => { setRodada(rodada + 1); setPos(TRECHOS[rodada + 1].ini); setHistorico([]); setPassos(0); setTravado(false); setMsg(INTROS[rodada + 1]); }, 2300);
      return;
    }
    fim.current = true;
    giveItem("sombra-espelhada");
    const total = passosTotal.current;
    setMsg(`A última sombra se alinha com a luz, e o farol responde (${nota}).`);
    agendar(() => complete("sombra", {
      estrelas: total <= SOMA_OTIMOS ? 3 : total <= SOMA_OTIMOS + LIMITE.dois - LIMITE.tres ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Passos: ${total} (o mínimo seria ${SOMA_OTIMOS})`, reinicios.current ? `Sombras refeitas: ${reinicios.current}` : "Nenhuma sombra refeita"],
    }), 2800);
  };

  const mover = (dx: number, dy: number) => {
    if (fim.current || travado) return;
    const x = (pos % t.W) + dx, y = Math.floor(pos / t.W) + dy;
    if (x < 0 || y < 0 || x >= t.W || y >= t.H) return;
    const q = y * t.W + x;
    if (t.paredes.has(q)) { audio.sfx.sombra.bate(); setMsg("Uma parede. Nem você nem a sombra atravessam."); return; }
    const n = passos + 1;
    setHistorico([...historico, pos]);
    setPos(q);
    setPassos(n);
    passosTotal.current++;
    audio.sfx.sombra.passo();
    if (q === t.saida && sombraDe(t, q) === t.lampada) { concluir(n); return; }
    setMsg(q === t.saida ? "Você está na saída, mas a sombra não alcança a lâmpada." : "Sua sombra se move do outro lado do espelho.");
  };

  const desfazer = () => {
    if (fim.current || travado || historico.length === 0) return;
    setPos(historico[historico.length - 1]);
    setHistorico(historico.slice(0, -1));
    audio.sfx.sombra.passo();
    setMsg("Você volta um passo. Os passos já dados continuam contando.");
  };

  const reiniciar = () => {
    if (fim.current || travado) return;
    reinicios.current++;
    setPos(t.ini); setHistorico([]);
    audio.sfx.interagir();
    setMsg("Você volta ao começo do trecho. Os passos já dados continuam contando.");
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

  const sombra = sombraDe(t, pos);
  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-5 overflow-y-auto px-6 py-10">
      <AmbienteFase tipo="silencio" />
      <div className="flex justify-center"><Cabecalho id="sombra" /></div>

      <p className="font-narrativa italic text-espuma/80">Espelho {rodada + 1} de {TRECHOS.length}: leve a sombra até a lâmpada e chegue à saída.</p>

      <div role="img" aria-label={`Espelho com ${t.W} por ${t.H} casas. Você e sua sombra estão marcadas.`}
        className="mx-auto grid w-full gap-px rounded-lg border border-latao/60 bg-abismo/60 p-1 backdrop-blur-sm"
        style={{ maxWidth: t.W * 58, gridTemplateColumns: `repeat(${t.W}, 1fr)` }}>
        {Array.from({ length: t.W * t.H }, (_, p) => {
          if (t.paredes.has(p)) return <div key={p} className="aspect-square rounded-sm bg-[#2a3d44] shadow-inner" />;
          const eu = pos === p, sh = sombra === p, lamp = t.lampada === p, saida = t.saida === p;
          return (
            <div key={p} className="relative aspect-square rounded-sm bg-mare/25">
              {saida && <span className="absolute inset-[30%] rounded-full border-2 border-espuma/60" />}
              {lamp && <span className={`absolute inset-[26%] rounded-full ${sh ? "bg-lanterna shadow-[0_0_16px_4px_rgba(255,191,0,0.6)]" : "bg-lanterna/30"}`} />}
              {sh && !lamp && <span className="absolute inset-[34%] rounded-full bg-espuma/30" />}
              {eu && <span className="absolute inset-[18%] rounded-full bg-espuma shadow-[0_0_10px_2px_rgba(242,230,214,0.5)]" />}
            </div>
          );
        })}
      </div>

      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Passos: {passos}</span>
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
