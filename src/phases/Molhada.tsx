import { useEffect, useRef, useState } from "react";
import { Flame, RotateCcw } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// d lenha seca · m lenha molhada · # pedra · . chão.
// Lenha seca pega com uma tocha. Lenha molhada chia na primeira tocha (e fica revelada como molhada)
// e só pega com a segunda. Você tem um número limitado de tochas no trecho: cada tocha gasta conta.
// O mínimo de tochas é 1 por lenha seca + 2 por lenha molhada. Estrelas pelas tochas desperdiçadas.
const MAPAS = [
  ["dmd", "d#m", "dmd"],
  ["dmdd", "d#dm", "mdmd"],
  ["mdmm", "d#dd", "dmdm"],
];
const FOLGA = 2;

const INTROS = [
  "Lenha seca pega com uma tocha. Lenha molhada chia na primeira e só acende na segunda. Você tem tochas contadas: não as desperdice.",
  "Mais lenha, e mais chances de errar. Uma lenha molhada chiou? Ela já mostrou o que é: agora são duas tochas para ela.",
  "A última costa com lenha. Metade da madeira está molhada, e cada tocha perdida é uma que falta para o farol.",
];

type Trecho = { W: number; H: number; celulas: string[]; secas: number; molhadas: number; minimo: number; tochas: number };

function ler(mapa: string[]): Trecho {
  const H = mapa.length, W = mapa[0].length;
  const celulas = mapa.flatMap((l) => [...l]);
  const secas = celulas.filter((c) => c === "d").length;
  const molhadas = celulas.filter((c) => c === "m").length;
  const minimo = secas + 2 * molhadas;
  return { W, H, celulas, secas, molhadas, minimo, tochas: minimo + FOLGA };
}
const TRECHOS = MAPAS.map(ler);
const SOMA_MINIMOS = TRECHOS.reduce((a, t) => a + t.minimo, 0);

export default function MolhadaFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const tochasTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [acesas, setAcesas] = useState<Set<number>>(() => new Set());
  const [reveladas, setReveladas] = useState<Set<number>>(() => new Set());
  const [usadas, setUsadas] = useState(0);
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);

  const t = TRECHOS[rodada];
  const sobram = t.tochas - usadas;
  const falta = t.celulas.some((c, p) => (c === "d" || c === "m") && !acesas.has(p));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const concluir = () => {
    setTravado(true);
    audio.sfx.molhada.completo();
    const desperdicio = usadas - t.minimo;
    if (rodada < TRECHOS.length - 1) {
      setMsg(`Toda a lenha pega com ${usadas} ${usadas === 1 ? "tocha" : "tochas"} (${desperdicio} ${desperdicio === 1 ? "desperdiçada" : "desperdiçadas"}). A costa seguinte se acende.`);
      agendar(() => {
        const prox = rodada + 1;
        setRodada(prox);
        setAcesas(new Set()); setReveladas(new Set()); setUsadas(0); setTravado(false);
        setMsg(INTROS[prox]);
      }, 2300);
      return;
    }
    fim.current = true;
    giveItem("lenha-molhada");
    const total = tochasTotal.current;
    const minimoTotal = SOMA_MINIMOS;
    setMsg(`A última lenha pega, e a costa inteira brilha para o farol (${total - minimoTotal} ${total - minimoTotal === 1 ? "tocha desperdiçada" : "tochas desperdiçadas"}).`);
    agendar(() => complete("molhada", {
      estrelas: total - minimoTotal === 0 ? 3 : total - minimoTotal <= 2 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Tochas usadas: ${total} (o mínimo seria ${minimoTotal})`, reinicios.current ? `Costas refeitas: ${reinicios.current}` : "Nenhuma costa refeita"],
    }), 2800);
  };

  const tocar = (p: number) => {
    if (fim.current || travado) return;
    const c = t.celulas[p];
    if (c !== "d" && c !== "m") return;
    if (acesas.has(p)) return;
    if (sobram <= 0) { setMsg("Sem tochas. As lenhas que faltam ficam apagadas: reinicie a costa."); audio.sfx.molhada.falha(); return; }
    setUsadas(usadas + 1);
    tochasTotal.current++;
    if (c === "d") {
      const novo = new Set(acesas); novo.add(p); setAcesas(novo);
      audio.sfx.molhada.acender();
      setMsg("A lenha seca pega de imediato.");
      if (!t.celulas.some((cc, q) => (cc === "d" || cc === "m") && !novo.has(q))) concluir();
      return;
    }
    if (!reveladas.has(p)) {
      setReveladas(new Set([...reveladas, p]));
      audio.sfx.molhada.chiar();
      setMsg("A lenha chia e não pega. Está molhada: precisa de outra tocha.");
      return;
    }
    const novo = new Set(acesas); novo.add(p); setAcesas(novo);
    audio.sfx.molhada.acender();
    setMsg("A segunda tocha finalmente acende a lenha molhada.");
    if (!t.celulas.some((cc, q) => (cc === "d" || cc === "m") && !novo.has(q))) concluir();
  };

  const reiniciar = () => {
    if (fim.current || travado) return;
    reinicios.current++;
    setAcesas(new Set()); setReveladas(new Set()); setUsadas(0);
    audio.sfx.interagir();
    setMsg("As tochas são recolhidas e a costa volta a ser lenha. As tochas gastas continuam contando.");
  };

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-5 overflow-y-auto px-6 py-10">
      <AmbienteFase tipo="chama" />
      <div className="flex justify-center"><Cabecalho id="molhada" /></div>

      <p className="font-narrativa italic text-espuma/80">Costa {rodada + 1} de {TRECHOS.length}: acenda toda a lenha com as tochas que tem.</p>

      <div
        role="grid"
        aria-label={`Costa com ${t.secas + t.molhadas} lenhas. ${sobram} tochas restantes.`}
        className="mx-auto grid w-full gap-2 rounded-lg border border-latao/60 bg-abismo/60 p-2 backdrop-blur-sm"
        style={{ maxWidth: t.W * 84, gridTemplateColumns: `repeat(${t.W}, 1fr)` }}
      >
        {t.celulas.map((c, p) => {
          if (c === "#") return <div key={p} className="aspect-square rounded-md bg-[#2a3d44] shadow-inner" />;
          if (c === ".") return <div key={p} className="aspect-square rounded-md bg-mare/20" />;
          const acesa = acesas.has(p), revelada = reveladas.has(p);
          return (
            <button
              key={p}
              onClick={() => tocar(p)}
              disabled={travado || acesa}
              aria-label={`Lenha ${c === "m" && revelada ? "molhada" : "de origem desconhecida"}, ${acesa ? "acesa" : "apagada"}`}
              className={`flex aspect-square items-center justify-center rounded-md border transition-all duration-500 ${
                acesa ? "border-lanterna bg-lanterna/60 shadow-[0_0_18px_6px_rgba(255,191,0,0.5)]"
                : revelada ? "border-mare bg-mare/40"
                : "border-latao/70 bg-[#6e4f33] hover:border-lanterna"
              } disabled:cursor-default`}
            >
              {acesa ? <Flame size={18} className="text-abismo" aria-hidden /> : revelada ? <span className="text-xs text-espuma/80">úmida</span> : null}
            </button>
          );
        })}
      </div>

      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Tochas restantes: {sobram} · Lenha acesa: {acesas.size}/{t.secas + t.molhadas}</span>
        <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 underline disabled:opacity-40">
          <RotateCcw size={14} aria-hidden /> Recolher as tochas
        </button>
      </p>

      {!falta || sobram > 0 ? null : (
        <p className="text-sm text-coral">Sem tochas e ainda há lenha apagada: reinicie a costa.</p>
      )}
      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
