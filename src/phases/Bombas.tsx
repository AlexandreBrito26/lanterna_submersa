import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// o válvula fechada · . válvula aberta.
// Apertar uma válvula inverte ela e as vizinhas (acima, abaixo, esquerda e direita).
// OTIMOS é o mínimo de toques de cada casa, achado por busca em largura sobre todos os estados.
const MAPAS = [
  ["oo.", ".o.", ".oo"],
  ["ooo", "o.o", "ooo"],
  ["o.o", ".o.", "o.o"],
];
const OTIMOS = [5, 8, 9];
const SOMA_OTIMOS = OTIMOS.reduce((a, b) => a + b, 0);

const INTROS = [
  "Cada válvula que você aperta inverte a si mesma e às vizinhas. Abra todas para o ar voltar aos tubos.",
  "O painel está mais difícil: uma válvula que você fecha sem querer pode fechar a outra de volta.",
  "A última bomba da casa. Pense em cada toque antes de dar: aqui o caminho mais curto não é óbvio.",
];

type Campo = { W: number; H: number; fechadas: boolean[] };

function ler(mapa: string[]): Campo {
  const H = mapa.length, W = mapa[0].length;
  const fechadas: boolean[] = [];
  mapa.forEach((l) => [...l].forEach((c) => fechadas.push(c === "o")));
  return { W, H, fechadas };
}
const CAMPOS = MAPAS.map(ler);

// Válvulas que mudam quando a válvula p é apertada (ela mesma e as vizinhas)
function alvosDe(f: Campo, p: number): number[] {
  const x = p % f.W, y = Math.floor(p / f.W);
  const r = [p];
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, ny = y + dy;
    if (nx >= 0 && ny >= 0 && nx < f.W && ny < f.H) r.push(ny * f.W + nx);
  }
  return r;
}

export default function BombasFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const toquesTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [fechadas, setFechadas] = useState<boolean[]>(CAMPOS[0].fechadas);
  const [toques, setToques] = useState(0);
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);

  const f = CAMPOS[rodada];
  const abertas = fechadas.filter((v) => !v).length;
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const concluir = (m: number) => {
    setTravado(true);
    audio.sfx.bomba.cheia();
    const nota = m === OTIMOS[rodada] ? "o mínimo possível" : `o mínimo era ${OTIMOS[rodada]}`;
    if (rodada < CAMPOS.length - 1) {
      setMsg(`Todas as válvulas abertas em ${m} toques (${nota}). A pressão sobe e a próxima casa de bombas acorda.`);
      agendar(() => {
        const prox = rodada + 1;
        setRodada(prox);
        setFechadas(CAMPOS[prox].fechadas);
        setToques(0);
        setTravado(false);
        setMsg(INTROS[prox]);
      }, 2400);
      return;
    }
    fim.current = true;
    giveItem("pressao-restaurada");
    const total = toquesTotal.current;
    setMsg(`O ar desce pelos tubos e a sineira responde de novo (${nota}).`);
    agendar(() => complete("bombas", {
      estrelas: total <= SOMA_OTIMOS + 2 ? 3 : total <= SOMA_OTIMOS + 6 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Toques: ${total} (o mínimo seria ${SOMA_OTIMOS})`, reinicios.current ? `Painéis reiniciados: ${reinicios.current}` : "Nenhum reinício"],
    }), 2800);
  };

  const apertar = (p: number) => {
    if (fim.current || travado) return;
    const novo = [...fechadas];
    alvosDe(f, p).forEach((i) => { novo[i] = !novo[i]; });
    const m = toques + 1;
    toquesTotal.current++;
    setFechadas(novo);
    setToques(m);
    if (novo.every((v) => !v)) { concluir(m); return; }
    const agora = novo.filter((v) => !v).length;
    audio.sfx.bomba.valvula();
    if (agora > abertas) audio.sfx.bomba.ligar();
    setMsg(`${agora} de ${f.fechadas.length} válvulas abertas.`);
  };

  const reiniciar = () => {
    if (fim.current || travado) return;
    reinicios.current++;
    setFechadas(f.fechadas);
    audio.sfx.interagir();
    setMsg("O painel volta ao começo. Os toques já dados continuam contando.");
  };

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-3 overflow-y-auto px-4 py-3 fase-compacta">
      <AmbienteFase tipo="bombas" />
      <div className="flex justify-center"><Cabecalho id="bombas" /></div>

      <p className="font-narrativa italic text-espuma/80">Painel {rodada + 1} de {CAMPOS.length}: abra todas as válvulas.</p>

      <div
        role="group"
        aria-label={`Painel com ${abertas} de ${f.fechadas.length} válvulas abertas`}
        className="mx-auto grid w-full gap-2 rounded-lg border border-latao/60 bg-abismo/60 p-3 backdrop-blur-sm"
        style={{ maxWidth: f.W * 80, gridTemplateColumns: `repeat(${f.W}, 1fr)` }}
      >
        {fechadas.map((fechada, p) => {
          const x = p % f.W, y = Math.floor(p / f.W);
          return (
            <button
              key={p}
              onClick={() => apertar(p)}
              aria-label={`Válvula linha ${y + 1}, coluna ${x + 1}, ${fechada ? "fechada" : "aberta"}. Toque para inverter.`}
              className={`aspect-square rounded-full border-2 transition-all duration-300 active:scale-95 ${
                fechada
                  ? "border-latao/70 bg-[#4a3424] shadow-inner"
                  : "border-lanterna bg-lanterna/80 shadow-[0_0_18px_5px_rgba(255,191,0,0.45)]"
              }`}
            >
              <span className={`mx-auto block h-1/3 w-1/3 rounded-full ${fechada ? "bg-latao/40" : "bg-espuma/90"}`} aria-hidden />
            </button>
          );
        })}
      </div>

      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Toques: {toques} · Abertas: {abertas}/{f.fechadas.length}</span>
        <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 underline disabled:opacity-40">
          <RotateCcw size={14} aria-hidden /> Reiniciar
        </button>
      </p>

      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
