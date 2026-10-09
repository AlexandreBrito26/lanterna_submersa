import { useEffect, useRef, useState } from "react";
import { Undo2 } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// Colheita completa. Comece no S e ande de casa em casa (na horizontal ou vertical), colhendo cada casa livre
// exatamente uma vez. Não pode passar duas vezes pela mesma casa nem pela cerca (#).
const TRECHOS = [
  ["S..", "...", "..."],
  ["S..", ".#.", "..."],
];
type Trecho = { W: number; H: number; celulas: string[]; ini: number; total: number };
function ler(m: string[]): Trecho {
  const celulas = m.flatMap((l) => [...l]);
  return { W: m[0].length, H: m.length, celulas, ini: celulas.indexOf("S"), total: celulas.filter((c) => c !== "#").length };
}
const TRE = TRECHOS.map(ler);

export default function ColheitaFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const desfazeres = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [caminho, setCaminho] = useState<number[]>([TRE[0].ini]);
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState("Comece na casa marcada com S. Colha cada casa livre uma única vez.");
  const t = TRE[rodada];
  const ultimo = caminho[caminho.length - 1];
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const andar = (q: number) => {
    if (fim.current || travado) return;
    const x = ultimo % t.W, y = Math.floor(ultimo / t.W), qx = q % t.W, qy = Math.floor(q / t.W);
    if (Math.abs(x - qx) + Math.abs(y - qy) !== 1) return;
    if (t.celulas[q] === "#" || caminho.includes(q)) { audio.sfx.colheita.bate(); setMsg("Essa casa já foi colhida, ou é cerca."); return; }
    const novo = [...caminho, q];
    setCaminho(novo); audio.sfx.colheita.colher();
    if (novo.length === t.total) { concluir(); return; }
    setMsg(`Colhidas ${novo.length} de ${t.total} casas.`);
  };

  const desfazer = () => {
    if (fim.current || travado || caminho.length <= 1) return;
    desfazeres.current++;
    setCaminho(caminho.slice(0, -1)); audio.sfx.interagir();
    setMsg("Você volta uma casa. A casa volta a estar livre.");
  };

  const concluir = () => {
    setTravado(true);
    audio.sfx.colheita.completo();
    if (rodada < TRE.length - 1) {
      setMsg(`Toda a horta foi colhida, sem repetir nenhuma casa.`);
      agendar(() => { setRodada(rodada + 1); setCaminho([TRE[rodada + 1].ini]); setTravado(false); setMsg("Outro canteiro, com cerca no meio. Passe por todas as casas livres sem repetir."); }, 2300);
      return;
    }
    fim.current = true;
    giveItem("colheita-completa");
    setMsg("O jardim inteiro foi colhido sem desperdício.");
    const estrelas = desfazeres.current + reinicios.current === 0 ? 3 : desfazeres.current + reinicios.current <= 2 ? 2 : 1;
    agendar(() => complete("colheita", {
      estrelas,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Voltas: ${desfazeres.current}`, reinicios.current ? `Hortas refeitas: ${reinicios.current}` : "Nenhuma horta refeita"],
    }), 2800);
  };

  const reiniciar = () => { if (fim.current || travado) return; reinicios.current++; setCaminho([t.ini]); audio.sfx.interagir(); setMsg("A colheita recomeça do S. As voltas já feitas continuam contando."); };

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-3 overflow-y-auto px-4 py-3 fase-compacta">
      <AmbienteFase tipo="coral" />
      <div className="flex justify-center"><Cabecalho id="colheita" /></div>
      <p className="font-narrativa italic text-espuma/80">Canteiro {rodada + 1} de {TRE.length}: colha todas as casas livres, uma única vez.</p>
      <div role="grid" aria-label={`Canteiro ${t.W} por ${t.H}, ${caminho.length} de ${t.total} colhidas`} className="mx-auto grid w-full gap-2 rounded-lg border border-latao/60 bg-abismo/60 p-3"
        style={{ maxWidth: t.W * 72, gridTemplateColumns: `repeat(${t.W}, 1fr)` }}>
        {t.celulas.map((c, i) => {
          if (c === "#") return <div key={i} className="aspect-square rounded-md bg-[#2a3d44]" />;
          const idx = caminho.indexOf(i), colhida = idx >= 0, atual = i === ultimo;
          return (
            <button key={i} onClick={() => andar(i)} disabled={travado || colhida && !atual}
              aria-label={c === "S" ? "Início" : colhida ? `Colhida, passo ${idx + 1}` : "Casa livre"}
              className={`relative flex aspect-square items-center justify-center rounded-md border transition-colors duration-300 ${atual ? "border-lanterna bg-lanterna/50" : colhida ? "border-alga/60 bg-alga/25" : "border-latao/50 bg-mare/25 hover:border-lanterna/60"} disabled:cursor-default`}>
              {c === "S" && <span className="font-narrativa text-sm">S</span>}
              {colhida && !atual && <span className="text-xs text-espuma/70">{idx + 1}</span>}
            </button>
          );
        })}
      </div>
      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Colhidas: {caminho.length} / {t.total}</span>
        <span className="flex items-center gap-4">
          <button onClick={desfazer} disabled={caminho.length <= 1 || travado} className="flex items-center gap-1 underline disabled:opacity-40"><Undo2 size={14} aria-hidden /> Voltar (Z)</button>
          <button onClick={reiniciar} disabled={travado} className="underline disabled:opacity-40">Recomeçar</button>
        </span>
      </p>
      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
