import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw, Undo2 } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// Ar contado. Cada passo gasta 1 de ar. Bolhas (o) recarregam +2 de ar, até o máximo. Sem ar, o trecho acaba.
// Chegue à saída (E) com o menor número de passos. OTIMOS é o mínimo de passos de cada trecho (busca em largura sobre posição e ar).
const AR_INICIAL = 4, AR_MAXIMO = 6;
const MAPAS = [
  ["S...o", ".#.#.", "o...#", "##.oE"],
  ["..#oE", "...o.", "#oo..", "S.##o"],
];
const OTIMOS = [7, 7];
const SOMA_OTIMOS = OTIMOS.reduce((a, b) => a + b, 0);

type Trecho = { W: number; H: number; celulas: string[]; ini: number; saida: number };
function ler(m: string[]): Trecho {
  const celulas = m.flatMap((l) => [...l]);
  return { W: m[0].length, H: m.length, celulas, ini: celulas.indexOf("S"), saida: celulas.indexOf("E") };
}
const TRECHOS = MAPAS.map(ler);

const INTROS = [
  "O mergulhador tem ar para poucos passos. Cada movimento gasta um pouco, e as bolhas recarregam. Chegue à saída sem ficar sem ar.",
  "O mar tem mais pedras e bolhas espalhadas. Planeje a rota: pegar uma bolha a tempo pode salvar o trecho.",
];
const LIMITE = { tres: 3, dois: 6 };

export default function ArContadoFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const passosTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [pos, setPos] = useState(TRECHOS[0].ini);
  const [ar, setAr] = useState(AR_INICIAL);
  const [historico, setHistorico] = useState<{ pos: number; ar: number }[]>([]);
  const [passos, setPassos] = useState(0);
  const [afogado, setAfogado] = useState(false);
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);

  const t = TRECHOS[rodada];
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const concluir = (n: number) => {
    setTravado(true);
    audio.sfx.ar.chegou();
    const nota = n === OTIMOS[rodada] ? "o mínimo de passos" : `o mínimo era ${OTIMOS[rodada]}`;
    if (rodada < TRECHOS.length - 1) {
      setMsg(`Você chega à saída com ar sobrando (${n} passos, ${nota}). A próxima corrente se abre.`);
      agendar(() => { setRodada(rodada + 1); setPos(TRECHOS[rodada + 1].ini); setAr(AR_INICIAL); setHistorico([]); setPassos(0); setTravado(false); setMsg(INTROS[rodada + 1]); }, 2300);
      return;
    }
    fim.current = true;
    giveItem("ar-contado");
    const total = passosTotal.current;
    setMsg(`Você emerge na luz, com o ar de volta aos pulmões (${nota}).`);
    agendar(() => complete("ar", {
      estrelas: total <= SOMA_OTIMOS ? 3 : total <= SOMA_OTIMOS + LIMITE.dois - LIMITE.tres ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Passos: ${total} (o mínimo seria ${SOMA_OTIMOS})`, reinicios.current ? `Mergulhos refeitos: ${reinicios.current}` : "Nenhum mergulho refeito"],
    }), 2800);
  };

  const mover = (dx: number, dy: number) => {
    if (fim.current || travado || afogado) return;
    const x = (pos % t.W) + dx, y = Math.floor(pos / t.W) + dy;
    if (x < 0 || y < 0 || x >= t.W || y >= t.H) return;
    const q = y * t.W + x;
    if (t.celulas[q] === "#") { audio.sfx.ar.bate(); setMsg("Pedra. O caminho está fechado."); return; }
    const arNovo = ar - 1;
    setHistorico([...historico, { pos, ar }]);
    passosTotal.current++;
    setPassos(passos + 1);
    if (arNovo < 0) { setAfogado(true); setAr(0); audio.sfx.ar.falha(); setMsg("Sem ar. O mergulho acaba aqui: reinicie o trecho."); return; }
    const bolha = t.celulas[q] === "o";
    const arFinal = bolha ? Math.min(AR_MAXIMO, arNovo + 2) : arNovo;
    setPos(q); setAr(arFinal);
    if (q === t.saida) { concluir(passos + 1); return; }
    audio.sfx.ar.passo();
    setMsg(bolha ? "Uma bolha de ar! O pulmão se enche de novo." : `Ar restante: ${arFinal}.`);
  };

  const desfazer = () => {
    if (fim.current || travado || afogado || historico.length === 0) return;
    const ant = historico[historico.length - 1];
    setPos(ant.pos); setAr(ant.ar); setHistorico(historico.slice(0, -1));
    audio.sfx.ar.passo();
    setMsg("Você volta um passo e recupera o ar daquele ponto.");
  };

  const reiniciar = () => {
    if (fim.current || travado) return;
    reinicios.current++;
    setPos(t.ini); setAr(AR_INICIAL); setHistorico([]); setAfogado(false);
    audio.sfx.interagir();
    setMsg("Você volta à superfície e mergulha de novo. Os passos já dados continuam contando.");
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
    <button onClick={() => mover(dx, dy)} aria-label={rotulo} disabled={afogado}
      className="flex h-14 w-14 items-center justify-center rounded-xl border border-lanterna/60 bg-mare/40 text-lanterna active:scale-95 disabled:opacity-40">
      <Icone size={22} aria-hidden />
    </button>
  );

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-3 overflow-y-auto px-4 py-3 fase-compacta">
      <AmbienteFase tipo="silencio" />
      <div className="flex justify-center"><Cabecalho id="ar" /></div>

      <p className="font-narrativa italic text-espuma/80">Mergulho {rodada + 1} de {TRECHOS.length}: chegue à saída sem ficar sem ar.</p>

      <div role="img" aria-label={`Mar com ${t.W} por ${t.H} casas. Ar: ${ar} de ${AR_MAXIMO}.`}
        className="mx-auto grid w-full gap-1 rounded-lg border border-latao/60 bg-abismo/60 p-2 backdrop-blur-sm"
        style={{ maxWidth: t.W * 58, gridTemplateColumns: `repeat(${t.W}, 1fr)` }}>
        {t.celulas.map((c, p) => {
          if (c === "#") return <div key={p} className="aspect-square rounded-sm bg-[#2a3d44] shadow-inner" />;
          const eu = pos === p;
          return (
            <div key={p} className="relative aspect-square rounded-sm bg-mare/25">
              {c === "o" && <span className="absolute inset-[30%] rounded-full border-2 border-espuma/60" />}
              {c === "E" && <span className="absolute inset-[24%] rounded-full bg-lanterna shadow-[0_0_16px_4px_rgba(255,191,0,0.5)]" />}
              {eu && <span className={`absolute inset-[20%] rounded-full ${afogado ? "bg-coral/60" : "bg-espuma shadow-[0_0_10px_2px_rgba(242,230,214,0.5)]"}`} />}
            </div>
          );
        })}
      </div>

      <div className="mx-auto flex w-full max-w-xs flex-col gap-1">
        <span className="text-xs uppercase tracking-widest text-latao">Ar</span>
        <div className="flex gap-1">
          {Array.from({ length: AR_MAXIMO }, (_, k) => (
            <span key={k} className={`h-3 flex-1 rounded-full ${k < ar ? "bg-alga/70" : "bg-abismo/60"}`} />
          ))}
        </div>
      </div>

      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Passos: {passos}</span>
        <span className="flex items-center gap-4">
          <button onClick={desfazer} disabled={!historico.length || travado || afogado} className="flex items-center gap-1 underline disabled:opacity-40"><Undo2 size={14} aria-hidden /> Desfazer (Z)</button>
          <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 underline disabled:opacity-40"><RotateCcw size={14} aria-hidden /> Reiniciar</button>
        </span>
      </p>

      <div className="mx-auto grid grid-cols-3 gap-2" role="group" aria-label="Nadar">
        <span />{seta("Subir", ArrowUp, 0, -1)}<span />
        {seta("Ir para a esquerda", ArrowLeft, -1, 0)}{seta("Descer", ArrowDown, 0, 1)}{seta("Ir para a direita", ArrowRight, 1, 0)}
      </div>

      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
