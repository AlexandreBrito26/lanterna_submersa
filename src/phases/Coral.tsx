import { useEffect, useRef, useState } from "react";
import { RotateCcw, Undo2 } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// # rocha · c coral inicial · o marca a cobrir.
// Cada toque planta um coral numa casa vizinha de um coral já existente: nada cresce do nada.
// OTIMOS é o mínimo de corais plantados em cada trecho, achado por busca em largura sobre os conjuntos de corais.
const MAPAS = [
  ["c...", "....", "...o", "...."],
  ["c...", "....", "o.oo", "...."],
  ["c.o.", "..#.", "...o", "o..."],
];
const OTIMOS = [5, 5, 8];
const SOMA_OTIMOS = OTIMOS.reduce((a, b) => a + b, 0);

const INTROS = [
  "O coral só cresce colado ao que já existe. Plante uma casa vizinha do seu coral e veja o caminho se formar.",
  "Algumas marcas estão separadas por areia. Para chegar até elas, o coral precisa crescer por entre as casas vazias.",
  "O último jardim da cidade. Uma rocha bloqueia o crescimento, então contorne-a antes de plantar.",
];

type Campo = { W: number; H: number; rochas: Set<number>; marcas: number[]; base: number[] };

function ler(mapa: string[]): Campo {
  const H = mapa.length, W = mapa[0].length;
  const rochas = new Set<number>(), marcas: number[] = [], base: number[] = [];
  mapa.forEach((l, y) => [...l].forEach((c, x) => {
    const p = y * W + x;
    if (c === "#") rochas.add(p);
    if (c === "o") marcas.push(p);
    if (c === "c") base.push(p);
  }));
  return { W, H, rochas, marcas, base };
}
const CAMPOS = MAPAS.map(ler);

function vizinhoDeCoral(f: Campo, p: number, coral: number[]): boolean {
  const x = p % f.W, y = Math.floor(p / f.W);
  return coral.some((c) => {
    const cx = c % f.W, cy = Math.floor(c / f.W);
    return Math.abs(cx - x) + Math.abs(cy - y) === 1;
  });
}

export default function CoralFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const plantadosTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [coral, setCoral] = useState<number[]>(CAMPOS[0].base);
  const [historico, setHistorico] = useState<number[][]>([]);
  const [plantados, setPlantados] = useState(0);
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);

  const f = CAMPOS[rodada];
  const cobertas = f.marcas.filter((m) => coral.includes(m)).length;
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const concluir = (n: number) => {
    setTravado(true);
    audio.sfx.coral.completo();
    const nota = n === OTIMOS[rodada] ? "o mínimo possível" : `o mínimo era ${OTIMOS[rodada]}`;
    if (rodada < CAMPOS.length - 1) {
      setMsg(`Todas as marcas cobertas com ${n} corais (${nota}). O jardim se estende para o trecho seguinte.`);
      agendar(() => {
        const prox = rodada + 1;
        setRodada(prox);
        setCoral(CAMPOS[prox].base);
        setHistorico([]); setPlantados(0); setTravado(false);
        setMsg(INTROS[prox]);
      }, 2300);
      return;
    }
    fim.current = true;
    giveItem("coral-da-cidade");
    const total = plantadosTotal.current;
    setMsg(`O coral segura a cidade inteira, e as casas submersas voltam a ter um caminho (${nota}).`);
    agendar(() => complete("coral", {
      estrelas: total <= SOMA_OTIMOS + 2 ? 3 : total <= SOMA_OTIMOS + 6 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Corais plantados: ${total} (o mínimo seria ${SOMA_OTIMOS})`, reinicios.current ? `Jardins refeitos: ${reinicios.current}` : "Nenhum jardim refeito"],
    }), 2800);
  };

  const plantar = (p: number) => {
    if (fim.current || travado) return;
    if (f.rochas.has(p) || coral.includes(p)) return;
    if (!vizinhoDeCoral(f, p, coral)) { audio.sfx.coral.bloqueio(); setMsg("O coral só cresce numa casa vizinha de outro coral."); return; }
    const novo = [...coral, p];
    const n = plantados + 1;
    plantadosTotal.current++;
    setHistorico((h) => [...h, coral]);
    setCoral(novo);
    setPlantados(n);
    audio.sfx.coral.crescer();
    if (f.marcas.every((m) => novo.includes(m))) { concluir(n); return; }
    setMsg(`${f.marcas.filter((m) => novo.includes(m)).length} de ${f.marcas.length} marcas cobertas.`);
  };

  const desfazer = () => {
    const ant = historico[historico.length - 1];
    if (!ant || fim.current || travado) return;
    setCoral(ant);
    setHistorico(historico.slice(0, -1));
    audio.sfx.coral.bloqueio();
    setMsg("Você arranca o último coral. Os corais já plantados continuam contando.");
  };

  const reiniciar = () => {
    if (fim.current || travado) return;
    reinicios.current++;
    setCoral(f.base); setHistorico([]);
    audio.sfx.interagir();
    setMsg("O jardim volta ao começo do trecho. Os corais já plantados continuam contando.");
  };

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-3 overflow-y-auto px-4 py-3 fase-compacta">
      <AmbienteFase tipo="coral" />
      <div className="flex justify-center"><Cabecalho id="coral" /></div>

      <p className="font-narrativa italic text-espuma/80">Jardim {rodada + 1} de {CAMPOS.length}: cubra todas as marcas com coral.</p>

      <div
        role="grid"
        aria-label={`Jardim de coral com ${f.marcas.length} marcas, ${cobertas} cobertas`}
        className="mx-auto grid w-full gap-px rounded-lg border border-latao/60 bg-abismo/60 p-1 backdrop-blur-sm"
        style={{ maxWidth: f.W * 60, gridTemplateColumns: `repeat(${f.W}, 1fr)` }}
      >
        {Array.from({ length: f.W * f.H }, (_, p) => {
          const x = p % f.W, y = Math.floor(p / f.W);
          if (f.rochas.has(p)) return <div key={p} className="aspect-square rounded-sm bg-[#2a3d44] shadow-inner" />;
          const marca = f.marcas.includes(p), tem = coral.includes(p);
          return (
            <button
              key={p}
              onClick={() => plantar(p)}
              disabled={tem || travado}
              aria-label={`Linha ${y + 1}, coluna ${x + 1}${tem ? ", coral" : ""}${marca ? ", marca a cobrir" : ""}`}
              className={`relative aspect-square rounded-sm transition-colors duration-300 ${tem ? "bg-alga/35" : "bg-mare/25 hover:bg-mare/45"} disabled:cursor-default`}
            >
              {marca && <span className={`absolute inset-[30%] rounded-full border-2 transition-all duration-300 ${tem ? "border-alga bg-alga/70 shadow-[0_0_14px_3px_rgba(127,224,208,0.5)]" : "border-lanterna/60 border-dashed"}`} />}
              {tem && !marca && <span className="absolute inset-[38%] rounded-full bg-alga/80" />}
            </button>
          );
        })}
      </div>

      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Corais: {plantados} · Marcas: {cobertas}/{f.marcas.length}</span>
        <span className="flex items-center gap-4">
          <button onClick={desfazer} disabled={!historico.length || travado} className="flex items-center gap-1 underline disabled:opacity-40">
            <Undo2 size={14} aria-hidden /> Desfazer
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
