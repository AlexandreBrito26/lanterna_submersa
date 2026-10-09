import { useEffect, useRef, useState } from "react";
import { Clock, RotateCcw } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// Cada vela tem uma duração em turnos. A cada turno você pode acender UMA vela ainda não usada,
// e depois passa o tempo. Uma vela acesa no turno s continua acesa nos turnos seguintes até durar b turnos.
// A porta abre quando TODAS as velas do trecho estão acesas ao mesmo tempo, depois de passar o tempo.
// OTIMOS é o menor número de turnos que resolve cada trecho, por busca exaustiva sobre as ordens de acendimento.
const TRECHOS = [
  { duracoes: [3, 2, 2] },
  { duracoes: [4, 2, 3] },
];
const OTIMOS = [3, 3];
const SOMA_OTIMOS = OTIMOS.reduce((a, b) => a + b, 0);
const LIMITE_TURNOS = 8;

const INTROS = [
  "Você só pode acender uma vela por turno. As velas mais curtas apagam antes de as outras chegarem, então a ordem importa.",
  "Velas mais longas dão mais tempo, mas nenhuma pode ser acesa duas vezes. Descubra em que turno todas brilham juntas.",
];

// Estado de cada vela: null = ainda não acesa; número = turnos restantes (>= 0 = acesa; < 0 = apagada)
type Estado = (number | null)[];

export default function VelaFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const turnosTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [velas, setVelas] = useState<Estado>(() => TRECHOS[0].duracoes.map(() => null));
  const [turno, setTurno] = useState(0);
  const [acendeuNesteTurno, setAcendeuNesteTurno] = useState(false);
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);

  const t = TRECHOS[rodada];
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const acesas = (v: Estado) => v.map((r) => r !== null && r >= 0);

  const concluir = (n: number) => {
    setTravado(true);
    audio.sfx.vela.completo();
    const nota = n === OTIMOS[rodada] ? "o mínimo de turnos" : `o mínimo era ${OTIMOS[rodada]}`;
    if (rodada < TRECHOS.length - 1) {
      setMsg(`Todas as velas brilham juntas no turno ${n} (${nota}). A porta do trecho seguinte se abre.`);
      agendar(() => {
        const prox = rodada + 1;
        setRodada(prox);
        setVelas(TRECHOS[prox].duracoes.map(() => null));
        setTurno(0); setAcendeuNesteTurno(false); setTravado(false);
        setMsg(INTROS[prox]);
      }, 2300);
      return;
    }
    fim.current = true;
    giveItem("vela-que-derrete");
    const total = turnosTotal.current;
    setMsg(`A última porta se abre com todas as velas brilhando juntas (${nota}).`);
    agendar(() => complete("vela", {
      estrelas: total <= SOMA_OTIMOS ? 3 : total <= SOMA_OTIMOS + 2 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Turnos: ${total} (o mínimo seria ${SOMA_OTIMOS})`, reinicios.current ? `Trechos refeitos: ${reinicios.current}` : "Nenhum trecho refeito"],
    }), 2800);
  };

  const acender = (c: number) => {
    if (fim.current || travado || acendeuNesteTurno || velas[c] !== null) return;
    const novo = [...velas];
    novo[c] = t.duracoes[c];
    setVelas(novo);
    setAcendeuNesteTurno(true);
    audio.sfx.vela.acender();
    setMsg(`A vela ${c + 1} acende e vai durar ${t.duracoes[c]} ${t.duracoes[c] === 1 ? "turno" : "turnos"}.`);
  };

  // Passa o tempo: cada vela acesa perde um turno. Só conta como sucesso se todas estiverem acesas.
  const passar = () => {
    if (fim.current || travado) return;
    const novoTurno = turno + 1;
    const novo = velas.map((r) => (r === null ? null : r - 1));
    turnosTotal.current++;
    setTurno(novoTurno);
    setVelas(novo);
    setAcendeuNesteTurno(false);
    audio.sfx.vela.passar();
    if (acesas(novo).every(Boolean)) { concluir(novoTurno); return; }
    if (novoTurno >= LIMITE_TURNOS) {
      setTravado(true);
      setMsg("O tempo acabou sem que todas as velas brilhassem juntas. Recomece o trecho.");
      return;
    }
    const apagadas = novo.filter((r) => r !== null && r < 0).length;
    setMsg(apagadas ? `${apagadas} ${apagadas === 1 ? "vela apagou" : "velas apagaram"}. Escolha melhor o próximo acendimento.` : "O tempo passa. Ainda não estão todas acesas ao mesmo tempo.");
  };

  const reiniciar = () => {
    if (fim.current) return;
    reinicios.current++;
    setVelas(t.duracoes.map(() => null));
    setTurno(0); setAcendeuNesteTurno(false); setTravado(false);
    audio.sfx.interagir();
    setMsg("As velas são trocadas por novas. Os turnos já passados continuam contando.");
  };

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-3 overflow-y-auto px-4 py-3 fase-compacta">
      <AmbienteFase tipo="chama" />
      <div className="flex justify-center"><Cabecalho id="vela" /></div>

      <p className="font-narrativa italic text-espuma/80">Trecho {rodada + 1} de {TRECHOS.length}: acenda as velas e faça todas brilharem juntas.</p>

      <p className="flex items-center gap-2 text-sm uppercase tracking-widest text-latao">
        <Clock size={14} aria-hidden /> Turno {turno + 1} · {acendeuNesteTurno ? "vela acesa neste turno" : "você pode acender uma vela"}
      </p>

      <div className="mx-auto grid w-full grid-cols-3 gap-4" role="group" aria-label="Velas">
        {velas.map((r, c) => {
          const aceso = r !== null && r >= 0;
          const usada = r !== null;
          return (
            <button
              key={c}
              onClick={() => acender(c)}
              disabled={travado || usada || acendeuNesteTurno}
              aria-label={`Vela ${c + 1}, duração ${t.duracoes[c]} turnos, ${aceso ? `acesa, restam ${r} turnos` : usada ? "apagada" : "não acesa"}`}
              className={`flex aspect-square flex-col items-center justify-center rounded-2xl border-2 transition-all duration-500 ${
                aceso ? "border-lanterna bg-lanterna/25 shadow-[0_0_24px_6px_rgba(255,191,0,0.4)]"
                : usada ? "border-latao/30 bg-[#2a2016]/50"
                : "border-latao/60 bg-[#4a3424]/40 hover:border-lanterna/60"
              } disabled:cursor-default`}
            >
              <span aria-hidden className={`block h-10 w-3 rounded-full transition-all duration-500 ${aceso ? "bg-lanterna shadow-[0_0_14px_4px_rgba(255,191,0,0.6)]" : "bg-espuma/20"}`} />
              <span className="mt-2 text-xs text-espuma/70">{aceso ? `restam ${r}` : usada ? "apagada" : `dura ${t.duracoes[c]}`}</span>
            </button>
          );
        })}
      </div>

      <div className="flex justify-center">
        <button onClick={passar} disabled={travado} className="rounded-xl border border-lanterna/60 bg-mare/40 px-5 py-3 font-narrativa text-lanterna active:scale-95 disabled:opacity-40">
          Passar o tempo
        </button>
      </div>

      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Turnos: {turno}</span>
        <button onClick={reiniciar} disabled={travado && turno === 0} className="flex items-center gap-1 underline disabled:opacity-40">
          <RotateCcw size={14} aria-hidden /> Trocar as velas
        </button>
      </p>

      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
