import { useEffect, useRef, useState } from "react";
import { RotateCcw, RotateCw } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// Lamparina circular. Seis lamparinas formam um anel, algumas acesas. Cada toque gira o anel uma casa.
// Gire até o anel bater com o desenho da cena (as marcas em dourado). OTIMOS é o menor número de giros.
const TRECHOS = [
  { p: [1, 0, 1, 0, 0, 0], alvo: [0, 0, 1, 0, 1, 0] },
  { p: [1, 1, 0, 0, 1, 0], alvo: [0, 1, 1, 0, 0, 1] },
];
function girado(p: number[], k: number): number[] { return p.map((_, i) => p[(i + k) % p.length]); }
function minimo(p: number[], alvo: number[]): number {
  for (let k = 0; k < p.length; k++) if (girado(p, k).every((v, i) => v === alvo[i])) return k;
  return Infinity;
}
const OTIMOS = TRECHOS.map((t) => minimo(t.p, t.alvo));
const SOMA_OTIMOS = OTIMOS.reduce((a, b) => a + b, 0);
const INTROS = [
  "As lamparinas formam um anel. Cada giro move todas uma casa. Gire até as chamas ficarem nas marcas.",
  "Mais chamas acesas, e o anel se move do mesmo jeito. Conte os giros e confira o desenho antes de girar de novo.",
];

export default function AnelFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const girosTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [k, setK] = useState(0);
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);
  const t = TRECHOS[rodada];
  const atual = girado(t.p, k);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const girar = () => {
    if (fim.current || travado) return;
    const nk = k + 1; girosTotal.current++;
    setK(nk); audio.sfx.anelFase.girar();
    if (girado(t.p, nk).every((v, i) => v === t.alvo[i])) { concluir(nk); return; }
    setMsg("O anel gira. Confira se as chamas estão nas marcas.");
  };

  const concluir = (n: number) => {
    setTravado(true);
    audio.sfx.anelFase.completo();
    const nota = n === OTIMOS[rodada] ? "o mínimo de giros" : `o mínimo era ${OTIMOS[rodada]}`;
    if (rodada < TRECHOS.length - 1) {
      setMsg(`O anel encaixa nas marcas com ${n} giros (${nota}).`);
      agendar(() => { setRodada(rodada + 1); setK(0); setTravado(false); setMsg(INTROS[rodada + 1]); }, 2300);
      return;
    }
    fim.current = true;
    giveItem("anel-de-lamparinas");
    setMsg(`O anel se fecha, e a luz circula pelo porto inteiro (${nota}).`);
    agendar(() => complete("anel", {
      estrelas: girosTotal.current <= SOMA_OTIMOS ? 3 : girosTotal.current <= SOMA_OTIMOS + 1 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Giros: ${girosTotal.current} (o mínimo seria ${SOMA_OTIMOS})`, reinicios.current ? `Anéis refeitos: ${reinicios.current}` : "Nenhum anel refeito"],
    }), 2800);
  };

  const reiniciar = () => { if (fim.current || travado) return; reinicios.current++; setK(0); audio.sfx.interagir(); setMsg("O anel volta à posição inicial. Os giros já dados continuam contando."); };

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-5 overflow-y-auto px-6 py-10">
      <AmbienteFase tipo="chama" />
      <div className="flex justify-center"><Cabecalho id="anel" /></div>
      <p className="font-narrativa italic text-espuma/80">Anel {rodada + 1} de {TRECHOS.length}: gire as lamparinas até as marcas.</p>
      <div className="relative mx-auto h-64 w-64">
        {atual.map((on, i) => {
          const ang = (i / 6) * Math.PI * 2 - Math.PI / 2;
          const x = 128 + Math.cos(ang) * 96, y = 128 + Math.sin(ang) * 96;
          const marca = t.alvo[i] === 1;
          return (
            <span key={i} role="img" aria-label={`Lamparina ${on ? "acesa" : "apagada"}${marca ? ", na marca" : ""}`}
              style={{ left: x - 18, top: y - 18 }}
              className={`absolute h-9 w-9 rounded-full border-2 transition-all duration-300 ${on ? "border-lanterna bg-lanterna/80 shadow-[0_0_12px_3px_rgba(255,191,0,0.5)]" : "border-latao/40 bg-[#2a3d44]"} ${marca ? "ring-2 ring-alga/70 ring-offset-2 ring-offset-abismo" : ""}`} />
          );
        })}
      </div>
      <div className="flex items-center justify-center gap-4">
        <button onClick={girar} disabled={travado} className="flex items-center gap-2 rounded-xl border border-lanterna/60 bg-mare/40 px-5 py-3 font-narrativa text-lanterna active:scale-95 disabled:opacity-40"><RotateCw size={18} aria-hidden /> Girar o anel</button>
        <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 text-sm underline disabled:opacity-40"><RotateCcw size={14} aria-hidden /> Voltar</button>
      </div>
      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
