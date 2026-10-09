import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw, Undo2 } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// Escalada de raízes. Cada casa tem uma altura de 0 a 3. S = início, G = saída.
// Você só anda para uma casa vizinha cuja altura difere no máximo em 1 degrau. OTIMOS é o mínimo de passos de cada trecho (busca em largura).
const MAPAS = [
  ["S0011", "01122", "01223", "00123", "0001G"],
  ["S1230", "00120", "01012", "02100", "0001G"],
  ["S0122", "01001", "12320", "1000G", "10000"],
];
const OTIMOS = [8, 8, 7];
const SOMA_OTIMOS = OTIMOS.reduce((a, b) => a + b, 0);

const INTROS = [
  "As raízes da costa têm degraus. Você só sobe ou desce um degrau por vez. Descubra o caminho que sobe devagar até o topo.",
  "O terreno tem mais altos e baixos. Um desnível de dois degraus é um beco sem saída: volte e procure outra rota.",
  "A última escalada. Quase todo o caminho é plano, mas o topo está cercado. Procure o degrau certo para cada passo.",
];

type Trecho = { W: number; H: number; alturas: number[]; ini: number; alvo: number };

function ler(mapa: string[]): Trecho {
  const H = mapa.length, W = mapa[0].length;
  const alturas = mapa.flatMap((l) => [...l].map((c) => (c === "S" || c === "G" ? 0 : Number(c))));
  const flat = mapa.flatMap((l) => [...l]);
  return { W, H, alturas, ini: flat.indexOf("S"), alvo: flat.indexOf("G") };
}
const TRECHOS = MAPAS.map(ler);

export default function EscaladaFase() {
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
    audio.sfx.escalada.topo();
    const nota = n === OTIMOS[rodada] ? "o caminho mais curto" : `o mais curto tinha ${OTIMOS[rodada]}`;
    if (rodada < TRECHOS.length - 1) {
      setMsg(`Você chega ao topo em ${n} passos (${nota}). A raiz seguinte se estende para o alto.`);
      agendar(() => {
        const prox = rodada + 1;
        setRodada(prox);
        setPos(TRECHOS[prox].ini); setHistorico([]); setPassos(0); setTravado(false);
        setMsg(INTROS[prox]);
      }, 2300);
      return;
    }
    fim.current = true;
    giveItem("escalada-de-raizes");
    const total = passosTotal.current;
    setMsg(`O topo da raiz se abre, e a costa sobe inteira até a luz (${nota}).`);
    agendar(() => complete("escalada", {
      estrelas: total <= SOMA_OTIMOS ? 3 : total <= SOMA_OTIMOS + 3 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Passos: ${total} (o mínimo seria ${SOMA_OTIMOS})`, reinicios.current ? `Raízes refeitas: ${reinicios.current}` : "Nenhuma raiz refeita"],
    }), 2800);
  };

  const mover = (dx: number, dy: number) => {
    if (fim.current || travado) return;
    const x = (pos % t.W) + dx, y = Math.floor(pos / t.W) + dy;
    if (x < 0 || y < 0 || x >= t.W || y >= t.H) return;
    const q = y * t.W + x;
    const dif = Math.abs(t.alturas[q] - t.alturas[pos]);
    if (dif > 1) { audio.sfx.escalada.bloqueio(); setMsg(`Degrau alto demais: ${dif} de diferença. Você só sobe ou desce um degrau por vez.`); return; }
    setHistorico([...historico, pos]);
    setPos(q);
    const n = passos + 1;
    setPassos(n);
    passosTotal.current++;
    if (q === t.alvo) { concluir(n); return; }
    audio.sfx.escalada.passo();
    setMsg(t.alturas[q] > t.alturas[pos] ? "Você sobe um degrau." : t.alturas[q] < t.alturas[pos] ? "Você desce um degrau." : "Você anda pelo mesmo nível.");
  };

  const desfazer = () => {
    if (fim.current || travado || historico.length === 0) return;
    setPos(historico[historico.length - 1]);
    setHistorico(historico.slice(0, -1));
    audio.sfx.escalada.passo();
    setMsg("Você volta um passo. Os passos já dados continuam contando.");
  };

  const reiniciar = () => {
    if (fim.current || travado) return;
    reinicios.current++;
    setPos(t.ini); setHistorico([]);
    audio.sfx.interagir();
    setMsg("Você volta para a base da raiz. Os passos já dados continuam contando.");
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
      <AmbienteFase tipo="chama" />
      <div className="flex justify-center"><Cabecalho id="escalada" /></div>

      <p className="font-narrativa italic text-espuma/80">Raiz {rodada + 1} de {TRECHOS.length}: suba até o topo, um degrau por vez.</p>

      <div
        role="img"
        aria-label={`Raiz com ${t.W} por ${t.H} casas. Você está na altura ${t.alturas[pos]}. Use as setas para subir ou descer.`}
        className="mx-auto grid w-full gap-1 rounded-lg border border-latao/60 bg-abismo/60 p-2 backdrop-blur-sm"
        style={{ maxWidth: t.W * 62, gridTemplateColumns: `repeat(${t.W}, 1fr)` }}
      >
        {Array.from({ length: t.W * t.H }, (_, p) => {
          const h = t.alturas[p], eu = pos === p, topo = t.alvo === p;
          const tom = h === 0 ? "bg-mare/15" : h === 1 ? "bg-latao/25" : h === 2 ? "bg-latao/45" : "bg-latao/65";
          return (
            <div key={p} className={`relative flex aspect-square items-end justify-center rounded-md pb-1 transition-colors duration-300 ${tom}`}>
              <span className="font-narrativa text-xs text-espuma/60">{topo ? "topo" : h}</span>
              {eu && <span className="absolute inset-[30%] rounded-full bg-espuma shadow-[0_0_12px_3px_rgba(242,230,214,0.5)]" aria-hidden />}
            </div>
          );
        })}
      </div>

      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Passos: {passos} · Altura atual: {t.alturas[pos]}</span>
        <button onClick={desfazer} disabled={!historico.length || travado} className="flex items-center gap-1 underline disabled:opacity-40">
          <Undo2 size={14} aria-hidden /> Desfazer (Z)
        </button>
      </p>

      <div className="mx-auto grid grid-cols-3 gap-2" role="group" aria-label="Subir a raiz">
        <span />{seta("Subir", ArrowUp, 0, -1)}<span />
        {seta("Ir para a esquerda", ArrowLeft, -1, 0)}{seta("Descer", ArrowDown, 0, 1)}{seta("Ir para a direita", ArrowRight, 1, 0)}
      </div>

      <div className="flex justify-center">
        <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 text-sm text-espuma/70 underline disabled:opacity-40">
          <RotateCcw size={14} aria-hidden /> Voltar à base da raiz
        </button>
      </div>

      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
