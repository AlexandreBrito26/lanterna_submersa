import { useEffect, useRef, useState } from "react";
import { Flame, RotateCcw } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// Forja de pedras. Número = pedra com a temperatura-alvo (começa em 0). "x" = casa livre para uma brasa. "#" = bloqueio.
// Cada brasa soma +1 nas pedras vizinhas (cima, baixo, esquerda, direita). Vence quando cada pedra tem
// exatamente a sua temperatura-alvo. OTIMOS é o menor número de brasas de cada trecho, por busca exaustiva.
const MAPAS = [
  ["xxx", "x2x", "xx1"],
  ["x2x", "1xx", "x0x"],
  ["xx1x", "2xxx", "xx0x"],
];
const OTIMOS = [2, 2, 3];
const SOMA_OTIMOS = OTIMOS.reduce((a, b) => a + b, 0);

const INTROS = [
  "Cada brasa aquece as pedras vizinhas em um grau. Acerte a temperatura de cada pedra, sem passar do ponto.",
  "Mais pedras, e algumas casas livres estão cercadas por outras pedras. Quem aquece um lado também aquece o vizinho.",
  "A última forja do porto. Antes de acender uma brasa, veja quais pedras ela vai esquentar.",
];

type Trecho = { W: number; H: number; celulas: string[] };

function ler(mapa: string[]): Trecho {
  const H = mapa.length, W = mapa[0].length;
  return { W, H, celulas: mapa.flatMap((l) => [...l]) };
}
const TRECHOS = MAPAS.map(ler);

function vizinhos(W: number, H: number, p: number): number[] {
  const x = p % W, y = Math.floor(p / W);
  return [[1, 0], [-1, 0], [0, 1], [0, -1]]
    .map(([dx, dy]) => [x + dx, y + dy])
    .filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < W && ny < H)
    .map(([nx, ny]) => ny * W + nx);
}

// Temperatura de cada pedra com as brasas acesas
function temperaturas(t: Trecho, brasas: Set<number>): Map<number, number> {
  const temp = new Map<number, number>();
  t.celulas.forEach((c, p) => { if (/[0-9]/.test(c)) temp.set(p, 0); });
  brasas.forEach((b) => vizinhos(t.W, t.H, b).forEach((v) => { if (temp.has(v)) temp.set(v, (temp.get(v) ?? 0) + 1); }));
  return temp;
}

export default function ForjaFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const brasasTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [brasas, setBrasas] = useState<Set<number>>(() => new Set());
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);

  const t = TRECHOS[rodada];
  const temp = temperaturas(t, brasas);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const concluir = (n: number) => {
    setTravado(true);
    audio.sfx.forja.completo();
    const nota = n === OTIMOS[rodada] ? "o mínimo de brasas" : `o mínimo era ${OTIMOS[rodada]}`;
    if (rodada < TRECHOS.length - 1) {
      setMsg(`Todas as pedras no ponto com ${n} ${n === 1 ? "brasa" : "brasas"} (${nota}). A forja seguinte se acende.`);
      agendar(() => {
        const prox = rodada + 1;
        setRodada(prox);
        setBrasas(new Set()); setTravado(false);
        setMsg(INTROS[prox]);
      }, 2300);
      return;
    }
    fim.current = true;
    giveItem("forja-de-pedras");
    const total = brasasTotal.current;
    setMsg(`As pedras esfriam no ponto certo, e a lâmina do farol fica pronta (${nota}).`);
    agendar(() => complete("forja", {
      estrelas: total <= SOMA_OTIMOS ? 3 : total <= SOMA_OTIMOS + 2 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Brasas: ${total} (o mínimo seria ${SOMA_OTIMOS})`, reinicios.current ? `Forjas refeitas: ${reinicios.current}` : "Nenhuma forja refeita"],
    }), 2800);
  };

  const alternar = (p: number) => {
    if (fim.current || travado || t.celulas[p] !== "x") return;
    const novo = new Set(brasas);
    if (novo.has(p)) {
      novo.delete(p);
      audio.sfx.forja.apagar();
      setBrasas(novo);
      setMsg("A brasa se apaga e as pedras vizinhas esfriam.");
      return;
    }
    novo.add(p);
    brasasTotal.current++;
    audio.sfx.forja.acender();
    setBrasas(novo);
    const tt = temperaturas(t, novo);
    const certas = [...tt.entries()].filter(([q, v]) => v === Number(t.celulas[q])).length;
    const passou = [...tt.entries()].some(([q, v]) => v > Number(t.celulas[q]));
    if ([...tt.entries()].every(([q, v]) => v === Number(t.celulas[q]))) { concluir(novo.size); return; }
    setMsg(passou ? "Alguma pedra passou do ponto. Apague uma brasa para esfriar." : `${certas} de ${tt.size} pedras no ponto certo.`);
  };

  const reiniciar = () => {
    if (fim.current || travado) return;
    reinicios.current++;
    setBrasas(new Set());
    audio.sfx.interagir();
    setMsg("A forja esfria por completo. As brasas já acesas continuam contando.");
  };

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-3 overflow-y-auto px-4 py-3 fase-compacta">
      <AmbienteFase tipo="chama" />
      <div className="flex justify-center"><Cabecalho id="forja" /></div>

      <p className="font-narrativa italic text-espuma/80">Forja {rodada + 1} de {TRECHOS.length}: aqueça cada pedra até a temperatura certa.</p>

      <div
        role="grid"
        aria-label={`Forja ${t.W} por ${t.H}. ${brasas.size} brasas acesas.`}
        className="mx-auto grid w-full gap-2 rounded-lg border border-latao/60 bg-abismo/60 p-2 backdrop-blur-sm"
        style={{ maxWidth: t.W * 84, gridTemplateColumns: `repeat(${t.W}, 1fr)` }}
      >
        {t.celulas.map((c, p) => {
          if (c === "#") return <div key={p} className="aspect-square rounded-md bg-[#2a3d44] shadow-inner" />;
          if (c === "x") {
            const acesa = brasas.has(p);
            return (
              <button
                key={p}
                onClick={() => alternar(p)}
                disabled={travado}
                aria-label={acesa ? "Brasa acesa, toque para apagar" : "Casa livre, toque para acender uma brasa"}
                className={`flex aspect-square items-center justify-center rounded-md border transition-all duration-500 ${acesa ? "border-lanterna bg-lanterna/60 shadow-[0_0_18px_6px_rgba(255,191,0,0.5)]" : "border-latao/50 bg-mare/25 hover:border-lanterna/60"} disabled:cursor-default`}
              >
                {acesa && <Flame size={18} className="text-abismo" aria-hidden />}
              </button>
            );
          }
          const atual = temp.get(p) ?? 0, alvo = Number(c);
          const pronta = atual === alvo, passou = atual > alvo;
          return (
            <div
              key={p}
              role="img"
              aria-label={`Pedra, temperatura ${atual} de ${alvo}${pronta ? ", no ponto" : passou ? ", passou do ponto" : ""}`}
              className={`flex aspect-square flex-col items-center justify-center rounded-md border-2 transition-colors duration-500 ${pronta ? "border-alga bg-alga/25" : passou ? "border-coral bg-coral/25" : "border-latao bg-[#4a3424]"}`}
            >
              <span className="font-narrativa text-xl text-espuma">{atual}/{alvo}</span>
            </div>
          );
        })}
      </div>

      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Brasas acesas: {brasas.size}</span>
        <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 underline disabled:opacity-40">
          <RotateCcw size={14} aria-hidden /> Esfriar a forja
        </button>
      </p>

      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
