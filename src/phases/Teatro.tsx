import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// # parede · . chão · o marca a iluminar.
// Cada lâmpada ilumina em linha reta, nas quatro direções, até a parede. MINIMOS foi conferido por busca exaustiva.
const MAPAS = [
  ["######", "#o#..#", "####.#", "###.o#", "#o##o#", "######"],
  ["######", "#..#o#", "#..o##", "##.#o#", "#o####", "######"],
  ["######", "#o#o.#", "##o###", "##.o.#", "##.o.#", "######"],
];
const MINIMOS = [3, 4, 4];
const SOMA_MINIMOS = MINIMOS.reduce((a, b) => a + b, 0);

const INTROS = [
  "Acenda as lâmpadas para revelar cada marca da cena. Cada lâmpada ilumina até a parede mais próxima, nas quatro direções.",
  "O lençol ficou maior. Procure os cantos onde a luz não chega e veja quais paredes podem servir de apoio.",
  "A última cena tem mais marcas do que lâmpadas à vista. Toque numa lâmpada para apagá-la e tente outra posição.",
];

type Campo = { W: number; H: number; paredes: Set<number>; marcas: number[] };

function ler(mapa: string[]): Campo {
  const H = mapa.length, W = mapa[0].length;
  const paredes = new Set<number>(), marcas: number[] = [];
  mapa.forEach((linha, y) => [...linha].forEach((c, x) => {
    const p = y * W + x;
    if (c === "#") paredes.add(p);
    if (c === "o") marcas.push(p);
  }));
  return { W, H, paredes, marcas };
}
const CAMPOS = MAPAS.map(ler);

// Células iluminadas por uma lâmpada em p (ela mesma incluída)
function luzDe(f: Campo, p: number): number[] {
  const x0 = p % f.W, y0 = Math.floor(p / f.W);
  const celulas = [p];
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    let x = x0 + dx, y = y0 + dy;
    while (x >= 0 && y >= 0 && x < f.W && y < f.H && !f.paredes.has(y * f.W + x)) {
      celulas.push(y * f.W + x); x += dx; y += dy;
    }
  }
  return celulas;
}

function acesasDe(f: Campo, lampadas: number[]): Set<number> {
  const s = new Set<number>();
  lampadas.forEach((l) => luzDe(f, l).forEach((c) => s.add(c)));
  return s;
}

export default function TeatroFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const extras = useRef(0);
  const usos = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [lampadas, setLampadas] = useState<number[]>([]);
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);

  const f = CAMPOS[rodada];
  const acesas = acesasDe(f, lampadas);
  const marcasAcesas = f.marcas.filter((m) => acesas.has(m)).length;
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const vencer = (total: number) => {
    setTravado(true);
    const extra = Math.max(0, total - MINIMOS[rodada]);
    extras.current += extra;
    const nota = extra === 0 ? "o mínimo possível" : `o mínimo era ${MINIMOS[rodada]}`;
    agendar(() => audio.sfx.luz.figura(), 200);
    if (rodada < CAMPOS.length - 1) {
      setMsg(`A cena se completa com ${total} ${total === 1 ? "lâmpada" : "lâmpadas"} (${nota}). O lençol sobe para a cena seguinte.`);
      agendar(() => {
        const prox = rodada + 1;
        setRodada(prox);
        setLampadas([]);
        setTravado(false);
        setMsg(INTROS[prox]);
      }, 2400);
      return;
    }
    fim.current = true;
    giveItem("lencol-do-teatro");
    setMsg(`O barco inteiro aparece na parede, com todas as marcas acesas (${nota}).`);
    const ex = extras.current;
    agendar(() => { audio.sfx.porta(); audio.sfx.vitoria(); }, 700);
    agendar(() => complete("teatro", {
      estrelas: ex <= 2 ? 3 : ex <= 6 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [
        `Lâmpadas acima do mínimo: ${ex} (mínimo total: ${SOMA_MINIMOS})`,
        reinicios.current ? `Cenas reiniciadas: ${reinicios.current}` : "Nenhum reinício",
      ],
    }), 2800);
  };

  const tocar = (p: number) => {
    if (fim.current || travado || f.paredes.has(p)) return;
    if (lampadas.includes(p)) {
      setLampadas(lampadas.filter((l) => l !== p));
      audio.sfx.luz.apagar();
      setMsg("Você apaga a lâmpada. As marcas que ela iluminava escurecem.");
      return;
    }
    const nova = [...lampadas, p];
    const agora = acesasDe(f, nova);
    const novas = f.marcas.filter((m) => agora.has(m) && !acesas.has(m)).length;
    usos.current++;
    setLampadas(nova);
    audio.sfx.luz.acender();
    if (novas) audio.sfx.luz.feixe();
    if (f.marcas.every((m) => agora.has(m))) { vencer(nova.length); return; }
    const contagem = f.marcas.filter((m) => agora.has(m)).length;
    setMsg(`${contagem} de ${f.marcas.length} marcas acesas.`);
  };

  const reiniciar = () => {
    if (fim.current || travado) return;
    reinicios.current++;
    setLampadas([]);
    audio.sfx.interagir();
    setMsg("As lâmpadas são recolhidas. As tentativas já feitas continuam contando.");
  };

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-3 overflow-y-auto px-4 py-3 fase-compacta">
      <AmbienteFase tipo="teatro" />
      <div className="flex justify-center"><Cabecalho id="teatro" /></div>

      <p className="font-narrativa italic text-espuma/80">Cena {rodada + 1} de {CAMPOS.length}: {f.marcas.length} marcas para acender.</p>

      <div
        role="grid"
        aria-label={`Teatro de sombras com ${f.marcas.length} marcas. ${marcasAcesas} acesas.`}
        className="mx-auto grid w-full gap-px rounded-lg border border-latao/60 bg-abismo/60 p-1 backdrop-blur-sm"
        style={{ maxWidth: f.W * 54, gridTemplateColumns: `repeat(${f.W}, 1fr)` }}
      >
        {Array.from({ length: f.W * f.H }, (_, p) => {
          const x = p % f.W, y = Math.floor(p / f.W);
          if (f.paredes.has(p)) return <div key={p} className="aspect-square rounded-sm bg-[#2a3d44] shadow-inner" />;
          const marca = f.marcas.includes(p), lit = acesas.has(p), lampada = lampadas.includes(p);
          return (
            <button
              key={p}
              onClick={() => tocar(p)}
              aria-label={`Linha ${y + 1}, coluna ${x + 1}${lampada ? ", lâmpada acesa" : lit ? ", iluminado" : ""}${marca ? ", marca da cena" : ""}`}
              className={`relative aspect-square rounded-sm transition-colors duration-300 ${lit ? "bg-lanterna/25" : "bg-mare/25"} hover:bg-mare/45`}
            >
              {marca && (
                <span className={`absolute inset-[22%] rounded-full border-2 transition-all duration-300 ${lit ? "border-lanterna bg-lanterna/80 shadow-[0_0_14px_3px_rgba(255,191,0,0.5)]" : "border-lanterna/50 border-dashed"}`} />
              )}
              {lampada && (
                <span className="absolute inset-[30%] rounded-full bg-lanterna shadow-[0_0_18px_6px_rgba(255,191,0,0.6)]" />
              )}
            </button>
          );
        })}
      </div>

      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Lâmpadas: {lampadas.length} · Marcas: {marcasAcesas}/{f.marcas.length}</span>
        <button onClick={reiniciar} disabled={travado || !lampadas.length} className="flex items-center gap-1 underline disabled:opacity-40">
          <RotateCcw size={14} aria-hidden /> Apagar todas
        </button>
      </p>

      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
