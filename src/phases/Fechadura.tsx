import { useEffect, useRef, useState } from "react";
import { KeyRound, RotateCcw } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// Fechadura de pinos. Cada pino tem três posições (0, 1 ou 2). Toque num pino para girá-lo.
// Ao testar a fechadura, o mar diz quantos pinos estão na posição certa, sem dizer quais.
// Use as tentativas para deduzir a combinação. Estrelas pelo número de tentativas de cada trecho.
const TRECHOS = [
  { segredo: [2, 0, 1] },
  { segredo: [1, 2, 2, 0] },
  { segredo: [0, 1, 2, 1] },
];
const LIMITE_TENTATIVAS = { tres: 9, dois: 14 };

const INTROS = [
  "Três pinos, três posições. O mar não diz quais estão certos, só quantos. Teste, compare e deduza.",
  "Quatro pinos agora. Mude um pino de cada vez para saber o que ele faz ao número de acertos.",
  "A última fechadura do cofre. Use o que aprendeu com as tentativas anteriores antes de girar.",
];

export default function FechaduraFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const tentativasTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [pinos, setPinos] = useState<number[]>(TRECHOS[0].segredo.map(() => 0));
  const [tentativas, setTentativas] = useState(0);
  const [resultados, setResultados] = useState<{ pinos: number[]; acertos: number }[]>([]);
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);

  const t = TRECHOS[rodada];
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const girar = (i: number) => {
    if (fim.current || travado) return;
    const novo = [...pinos];
    novo[i] = (novo[i] + 1) % 3;
    setPinos(novo);
    audio.sfx.fechadura.girar();
  };

  const testar = () => {
    if (fim.current || travado) return;
    const acertos = pinos.filter((v, i) => v === t.segredo[i]).length;
    const n = tentativas + 1;
    tentativasTotal.current++;
    setTentativas(n);
    setResultados([...resultados, { pinos: [...pinos], acertos }]);
    if (acertos === t.segredo.length) { concluir(n); return; }
    audio.sfx.fechadura.testar();
    setMsg(`${acertos} de ${t.segredo.length} ${acertos === 1 ? "pino está" : "pinos estão"} na posição certa.`);
  };

  const concluir = (n: number) => {
    setTravado(true);
    audio.sfx.fechadura.abrir();
    if (rodada < TRECHOS.length - 1) {
      setMsg(`O pino certo encaixa de vez, em ${n} ${n === 1 ? "tentativa" : "tentativas"}. A próxima gaveta do cofre se abre.`);
      agendar(() => {
        const prox = rodada + 1;
        setRodada(prox);
        setPinos(TRECHOS[prox].segredo.map(() => 0));
        setTentativas(0); setResultados([]); setTravado(false);
        setMsg(INTROS[prox]);
      }, 2300);
      return;
    }
    fim.current = true;
    giveItem("cofre-aberto");
    const total = tentativasTotal.current;
    setMsg(`O cofre se abre, e o que estava guardado volta para o porto (${total} ${total === 1 ? "tentativa" : "tentativas"} no total).`);
    agendar(() => complete("fechadura", {
      estrelas: total <= LIMITE_TENTATIVAS.tres ? 3 : total <= LIMITE_TENTATIVAS.dois ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Tentativas: ${total}`, reinicios.current ? `Cofres refeitos: ${reinicios.current}` : "Nenhum cofre refeito"],
    }), 2800);
  };

  const reiniciar = () => {
    if (fim.current || travado) return;
    reinicios.current++;
    setPinos(t.segredo.map(() => 0));
    setResultados([]);
    audio.sfx.interagir();
    setMsg("Os pinos voltam a zero. As tentativas já feitas continuam contando.");
  };

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-3 overflow-y-auto px-4 py-3 fase-compacta">
      <AmbienteFase tipo="coral" />
      <div className="flex justify-center"><Cabecalho id="fechadura" /></div>

      <p className="font-narrativa italic text-espuma/80">Cofre {rodada + 1} de {TRECHOS.length}: descubra a posição de cada pino.</p>

      <div className="mx-auto flex flex-wrap justify-center gap-3" role="group" aria-label="Pinos da fechadura">
        {pinos.map((v, i) => (
          <button
            key={i}
            onClick={() => girar(i)}
            disabled={travado}
            aria-label={`Pino ${i + 1}, na posição ${v}. Toque para girar.`}
            className="flex h-24 w-14 flex-col items-center justify-end gap-2 rounded-2xl border-2 border-latao/60 bg-[#4a3424]/50 px-2 pb-2 transition-colors hover:border-lanterna/60 disabled:cursor-default"
          >
            <span className="flex flex-1 items-center justify-center">
              <span className="block h-3 w-3 rounded-full bg-lanterna transition-all duration-300" style={{ transform: `translateY(${(1 - v) * 16}px)`, opacity: 0.4 + v * 0.3 }} aria-hidden />
            </span>
            <span className="font-narrativa text-sm text-espuma/80">{v}</span>
          </button>
        ))}
      </div>

      <div className="flex justify-center">
        <button onClick={testar} disabled={travado} className="flex items-center gap-2 rounded-xl border border-lanterna/60 bg-mare/40 px-5 py-3 font-narrativa text-lanterna active:scale-95 disabled:opacity-40">
          <KeyRound size={18} aria-hidden /> Testar a fechadura
        </button>
      </div>

      {resultados.length > 0 && (
        <ul className="mx-auto w-full space-y-1 text-sm text-espuma/70" aria-label="Tentativas anteriores">
          {resultados.slice(-5).map((r, i) => (
            <li key={i} className="flex justify-between rounded-lg border border-mare/50 px-3 py-1">
              <span>Tentativa {resultados.length - Math.min(5, resultados.length) + i + 1}: {r.pinos.join(" · ")}</span>
              <span className="text-lanterna">{r.acertos} certos</span>
            </li>
          ))}
        </ul>
      )}

      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Tentativas: {tentativas}</span>
        <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 underline disabled:opacity-40">
          <RotateCcw size={14} aria-hidden /> Zerar os pinos
        </button>
      </p>

      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
