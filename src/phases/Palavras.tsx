import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// Sopa de letras 7x7. Toque na primeira letra e depois na última de uma palavra em linha reta
// (horizontal, vertical ou diagonal). Se a sequência for uma das palavras escondidas, ela fica marcada.
// Toques errados (que não formam palavra) contam como erros.
type Trecho = { grade: string[]; palavras: string[] };
const TRECHOS: Trecho[] = [
  { grade: ["SKLHKMP", "SONDAJL", "MFAROLI", "AHSINOV", "RCORALN", "EQQAOPP", "WLVIDLI"], palavras: ["FAROL", "ONDA", "SINO", "CORAL", "MARE"] },
  { grade: ["HHXXXCU", "HACOYOR", "IECOORN", "UALGAAX", "MCJBULE", "LACSINO", "PEROLAO"], palavras: ["ALGA", "ECO", "CORAL", "SINO", "PEROLA"] },
];
const INTROS = [
  "As palavras da cidade estão escondidas na sopa. Procure em todas as direções: horizontal, vertical e diagonal.",
  "Agora as palavras estão cruzadas com outras letras. Procure pela primeira letra de cada palavra e siga a linha.",
];

function linha(grade: string[], a: number, b: number): { texto: string; celulas: number[] } | null {
  const N = grade.length;
  const ax = a % N, ay = Math.floor(a / N), bx = b % N, by = Math.floor(b / N);
  const dx = Math.sign(bx - ax), dy = Math.sign(by - ay);
  const passos = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
  if (a !== b && !(ax === bx || ay === by || Math.abs(bx - ax) === Math.abs(by - ay))) return null;
  const celulas: number[] = [];
  let texto = "";
  for (let i = 0; i <= passos; i++) {
    const x = ax + dx * i, y = ay + dy * i;
    celulas.push(y * N + x);
    texto += grade[y][x];
  }
  return { texto, celulas };
}

export default function PalavrasFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const errosTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [achadas, setAchadas] = useState<string[]>([]);
  const [marcadas, setMarcadas] = useState<number[]>([]);
  const [inicial, setInicial] = useState<number | null>(null);
  const [erros, setErros] = useState(0);
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);

  const t = TRECHOS[rodada];
  const N = t.grade.length;
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const concluirRodada = () => {
    setTravado(true);
    audio.sfx.palavras.completo();
    if (rodada < TRECHOS.length - 1) {
      setMsg("Todas as palavras achadas. A correnteza empurra a próxima sopa para o seu lado.");
      agendar(() => {
        const prox = rodada + 1;
        setRodada(prox);
        setAchadas([]); setMarcadas([]); setInicial(null); setErros(0);
        setTravado(false);
        setMsg(INTROS[prox]);
      }, 2300);
      return;
    }
    fim.current = true;
    giveItem("letras-do-mar");
    const total = errosTotal.current;
    setMsg(`Todas as palavras da cidade estão de volta ao papel (${total} ${total === 1 ? "erro" : "erros"} no total).`);
    agendar(() => complete("palavras", {
      estrelas: total === 0 ? 3 : total <= 3 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Seleções erradas: ${total}`, reinicios.current ? `Sopas refeitas: ${reinicios.current}` : "Nenhuma sopa refeita"],
    }), 2800);
  };

  const tocar = (p: number) => {
    if (fim.current || travado) return;
    if (inicial === null) { setInicial(p); setMsg("Agora toque na última letra da palavra."); return; }
    const r = linha(t.grade, inicial, p);
    setInicial(null);
    if (!r) { errosTotal.current++; setErros((e) => e + 1); audio.sfx.palavras.erro(); setMsg("Essas letras não formam uma linha reta. Tente de novo."); return; }
    const ach = t.palavras.find((w) => (w === r.texto || w === [...r.texto].reverse().join("")) && !achadas.includes(w));
    if (!ach) { errosTotal.current++; setErros((e) => e + 1); audio.sfx.palavras.erro(); setMsg("Nenhuma palavra escondida nessa linha."); return; }
    const novasAchadas = [...achadas, ach];
    const novasMarcadas = [...marcadas, ...r.celulas];
    setAchadas(novasAchadas);
    setMarcadas(novasMarcadas);
    audio.sfx.palavras.achou();
    setMsg(`Você achou ${ach}.`);
    if (novasAchadas.length === t.palavras.length) concluirRodada();
  };

  const reiniciar = () => {
    if (fim.current || travado) return;
    reinicios.current++;
    setAchadas([]); setMarcadas([]); setInicial(null);
    audio.sfx.interagir();
    setMsg("A sopa é embaralhada de volta ao papel. Os erros já cometidos continuam contando.");
  };

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-5 overflow-y-auto px-6 py-10">
      <AmbienteFase tipo="palavras" />
      <div className="flex justify-center"><Cabecalho id="palavras" /></div>

      <p className="font-narrativa italic text-espuma/80">Sopa {rodada + 1} de {TRECHOS.length}: ache as {t.palavras.length} palavras.</p>

      <div
        role="grid"
        aria-label={`Sopa de letras ${N} por ${N}`}
        className="mx-auto grid w-full gap-1 rounded-lg border border-latao/60 bg-abismo/60 p-2 backdrop-blur-sm"
        style={{ maxWidth: N * 52, gridTemplateColumns: `repeat(${N}, 1fr)` }}
      >
        {t.grade.flatMap((linhaTxt, y) => [...linhaTxt].map((c, x) => {
          const p = y * N + x;
          const marcada = marcadas.includes(p), escolhida = inicial === p;
          return (
            <button
              key={p}
              onClick={() => tocar(p)}
              disabled={travado}
              aria-label={`Letra ${c}, linha ${y + 1}, coluna ${x + 1}${marcada ? ", marcada" : ""}`}
              className={`aspect-square rounded-md font-narrativa text-lg transition-colors duration-200 ${
                marcada ? "bg-alga/30 text-alga" : escolhida ? "bg-lanterna/30 text-lanterna" : "bg-mare/25 text-espuma hover:bg-mare/45"
              }`}
            >
              {c}
            </button>
          );
        }))}
      </div>

      <div className="flex flex-wrap justify-center gap-2 text-sm">
        {t.palavras.map((w) => (
          <span key={w} className={`rounded-full border px-3 py-1 ${achadas.includes(w) ? "border-alga text-alga line-through" : "border-mare text-espuma/80"}`}>{w}</span>
        ))}
      </div>

      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Achadas: {achadas.length}/{t.palavras.length} · Erros: {erros}</span>
        <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 underline disabled:opacity-40">
          <RotateCcw size={14} aria-hidden /> Embaralhar
        </button>
      </p>

      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
