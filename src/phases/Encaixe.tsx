import { useEffect, useRef, useState } from "react";
import { RotateCcw, Undo2 } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// Encaixe de corais. A região da costa precisa ser coberta por peças de coral de formas fixas.
// Toque numa peça para selecioná-la e depois numa casa para encaixá-la (a casa vira o canto superior esquerdo da peça).
// Não pode sobrar casa, nem sobrepor, nem sair da região. Cada encaixe errado conta como erro.
type Peca = { forma: [number, number][] };
type Trecho = { regiao: [number, number][]; pecas: Peca[] };
const TRECHOS: Trecho[] = [
  {
    regiao: [[0,0],[1,0],[2,0],[3,0],[0,1],[1,1],[2,1],[3,1],[0,2],[1,2],[2,2],[3,2]],
    pecas: [
      { forma: [[0,0],[1,0],[0,1],[1,1]] },
      { forma: [[0,0],[1,0],[0,1],[1,1]] },
      { forma: [[0,0],[1,0]] },
      { forma: [[0,0],[1,0]] },
    ],
  },
  {
    regiao: [[0,0],[1,0],[2,0],[3,0],[4,0],[0,1],[1,1],[2,1],[3,1],[4,1],[0,2],[1,2],[2,2],[3,2],[4,2]],
    pecas: [
      { forma: [[0,0],[1,0],[0,1],[1,1]] },
      { forma: [[0,0],[1,0],[0,1],[1,1]] },
      { forma: [[0,0],[0,1]] },
      { forma: [[0,0],[1,0]] },
      { forma: [[0,0],[1,0]] },
      { forma: [[0,0]] },
    ],
  },
];
const LIMITE = { tres: 0, dois: 3 };

const INTROS = [
  "Os corais formam uma costa com a forma exata. Encaixe as quatro peças sem deixar buraco nem sobreposição.",
  "A costa é mais larga e tem uma peça de uma casa só. Comece pelas peças grandes: elas deixam menos espaço para errar.",
];

type Colocada = { idx: number; x: number; y: number };

function casasDe(p: Peca, x: number, y: number): [number, number][] {
  return p.forma.map(([dx, dy]) => [x + dx, y + dy]);
}

export default function EncaixeFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const errosTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [colocadas, setColocadas] = useState<Colocada[]>([]);
  const [selecionada, setSelecionada] = useState<number | null>(null);
  const [erros, setErros] = useState(0);
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);

  const t = TRECHOS[rodada];
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const ocupadas = new Set<string>();
  colocadas.forEach((c) => casasDe(t.pecas[c.idx], c.x, c.y).forEach(([x, y]) => ocupadas.add(`${x},${y}`)));
  const regiaoSet = new Set(t.regiao.map(([x, y]) => `${x},${y}`));

  const concluir = () => {
    setTravado(true);
    audio.sfx.peca.completo();
    if (rodada < TRECHOS.length - 1) {
      setMsg("A costa encaixa sem nenhuma falha. O trecho seguinte se abre para o mar.");
      agendar(() => {
        const prox = rodada + 1;
        setRodada(prox);
        setColocadas([]); setSelecionada(null); setErros(0); setTravado(false);
        setMsg(INTROS[prox]);
      }, 2300);
      return;
    }
    fim.current = true;
    giveItem("costa-encaixada");
    const total = errosTotal.current;
    setMsg(`A costa se fecha inteira, sem uma casa de sobra (${total} ${total === 1 ? "erro" : "erros"} no total).`);
    agendar(() => complete("encaixe", {
      estrelas: total <= LIMITE.tres ? 3 : total <= LIMITE.dois ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Encaixes errados: ${total}`, reinicios.current ? `Costas refeitas: ${reinicios.current}` : "Nenhuma costa refeita"],
    }), 2800);
  };

  const tocarPeca = (i: number) => {
    if (fim.current || travado) return;
    if (colocadas.some((c) => c.idx === i)) { setColocadas(colocadas.filter((c) => c.idx !== i)); setSelecionada(i); audio.sfx.peca.tirar(); setMsg("Peça retirada. Escolha uma casa para ela."); return; }
    setSelecionada(selecionada === i ? null : i);
  };

  const tocarCasa = (x: number, y: number) => {
    if (fim.current || travado || selecionada === null) { if (selecionada === null) setMsg("Selecione uma peça de coral primeiro."); return; }
    const p = t.pecas[selecionada];
    const casas = casasDe(p, x, y);
    const fora = casas.some(([cx, cy]) => !regiaoSet.has(`${cx},${cy}`));
    const sobrepoe = casas.some(([cx, cy]) => ocupadas.has(`${cx},${cy}`));
    if (fora || sobrepoe) {
      errosTotal.current++;
      setErros((e) => e + 1);
      audio.sfx.peca.erro();
      setMsg(fora ? "A peça sairia da costa. Tente outra casa." : "Essa peça sobrepõe outro coral.");
      return;
    }
    const novo = [...colocadas, { idx: selecionada, x, y }];
    setColocadas(novo);
    setSelecionada(null);
    audio.sfx.peca.encaixar();
    if (novo.length === t.pecas.length) { concluir(); return; }
    setMsg("O coral encaixa. Escolha a próxima peça.");
  };

  const desfazer = () => {
    if (fim.current || travado || colocadas.length === 0) return;
    setColocadas(colocadas.slice(0, -1));
    audio.sfx.peca.tirar();
    setMsg("Você desfaz o último encaixe.");
  };

  const reiniciar = () => {
    if (fim.current || travado) return;
    reinicios.current++;
    setColocadas([]); setSelecionada(null);
    audio.sfx.interagir();
    setMsg("A costa volta a ser areia. Os erros já cometidos continuam contando.");
  };

  const W = Math.max(...t.regiao.map(([x]) => x)) + 1, H = Math.max(...t.regiao.map(([, y]) => y)) + 1;

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-3 overflow-y-auto px-4 py-3 fase-compacta">
      <AmbienteFase tipo="coral" />
      <div className="flex justify-center"><Cabecalho id="encaixe" /></div>

      <p className="font-narrativa italic text-espuma/80">Costa {rodada + 1} de {TRECHOS.length}: cubra toda a região com as peças de coral.</p>

      <div className="mx-auto grid w-full gap-1" style={{ maxWidth: W * 56, gridTemplateColumns: `repeat(${W}, 1fr)` }} role="grid" aria-label={`Região de ${t.regiao.length} casas`}>
        {Array.from({ length: W * H }, (_, k) => {
          const x = k % W, y = Math.floor(k / W);
          if (!regiaoSet.has(`${x},${y}`)) return <div key={k} className="aspect-square" />;
          const coberta = ocupadas.has(`${x},${y}`);
          const peca = colocadas.find((c) => casasDe(t.pecas[c.idx], c.x, c.y).some(([cx, cy]) => cx === x && cy === y));
          return (
            <button
              key={k}
              onClick={() => tocarCasa(x, y)}
              disabled={travado}
              aria-label={`Casa ${x + 1}, ${y + 1}, ${coberta ? "coberta" : "livre"}`}
              className={`aspect-square rounded-md border transition-colors duration-300 ${coberta ? "border-alga/60 bg-alga/25" : "border-latao/50 bg-mare/20 hover:border-lanterna/60"} disabled:cursor-default`}
            >
              {peca && <span className="block h-2 w-2 mx-auto rounded-full bg-alga" aria-hidden />}
            </button>
          );
        })}
      </div>

      <div className="mx-auto flex flex-wrap justify-center gap-3" role="group" aria-label="Peças de coral">
        {t.pecas.map((p, i) => {
          const usada = colocadas.some((c) => c.idx === i);
          const sel = selecionada === i;
          const cols = Math.max(...p.forma.map(([dx]) => dx)) + 1, rows = Math.max(...p.forma.map(([, dy]) => dy)) + 1;
          return (
            <button
              key={i}
              onClick={() => tocarPeca(i)}
              disabled={travado}
              aria-label={`Peça ${i + 1}${usada ? ", encaixada" : sel ? ", selecionada" : ""}`}
              className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2 transition-all ${sel ? "border-lanterna bg-lanterna/20" : usada ? "border-alga/40 opacity-50" : "border-latao/60 bg-[#4a3424]/40"}`}
            >
              <span className="grid gap-px" style={{ gridTemplateColumns: `repeat(${cols}, 10px)` }}>
                {Array.from({ length: cols * rows }, (_, k) => {
                  const dx = k % cols, dy = Math.floor(k / cols);
                  const ativa = p.forma.some(([fx, fy]) => fx === dx && fy === dy);
                  return <span key={k} className={`h-2.5 w-2.5 rounded-sm ${ativa ? "bg-alga" : "bg-transparent"}`} />;
                })}
              </span>
            </button>
          );
        })}
      </div>

      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Erros: {erros} · Peças: {colocadas.length}/{t.pecas.length}</span>
        <span className="flex items-center gap-4">
          <button onClick={desfazer} disabled={colocadas.length === 0 || travado} className="flex items-center gap-1 underline disabled:opacity-40"><Undo2 size={14} aria-hidden /> Desfazer</button>
          <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 underline disabled:opacity-40"><RotateCcw size={14} aria-hidden /> Recomeçar</button>
        </span>
      </p>

      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
