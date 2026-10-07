import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Scale, Undo2 } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

type Pedra = { id: string; nome: string; peso: number };
type Prato = "esq" | "dir" | null;

const nomes = ["Aurora", "Gaivota", "Bom Retiro", "Maré Mansa", "Estrela-d'Alva"];
// Rodada 1: 4 pedras. Rodada 2: 5 pedras. Os pesos mudam a cada partida e nunca aparecem na tela.
const QUANTAS = [4, 5];

function sortear(n: number): Pedra[] {
  const pesos = Array.from({ length: 16 }, (_, i) => i + 1).sort(() => Math.random() - 0.5).slice(0, n);
  return pesos.map((peso, i) => ({ id: `p${i}`, nome: nomes[i], peso }));
}

// Fora do componente da fase, para a animação da balança não reiniciar a cada renderização
function Lado({ nome, itens, y }: { nome: string; itens: Pedra[]; y: number }) {
  return (
    <motion.div animate={{ y }} transition={{ type: "spring", stiffness: 70, damping: 9 }} className="flex w-[44%] flex-col items-center gap-1">
      <div className="flex min-h-[3.5rem] w-full flex-wrap items-end justify-center gap-1 rounded-b-3xl border-x border-b border-latao/70 bg-mare/30 px-1 pb-1">
        {itens.map((s) => <span key={s.id} className="rounded-md bg-latao/40 px-1.5 py-0.5 text-xs">{s.nome}</span>)}
      </div>
      <span className="text-xs uppercase tracking-[0.2em] text-espuma/50">{nome}</span>
    </motion.div>
  );
}

export default function Armazem() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const pesagens = useRef(0);
  const errosOrdem = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [pedras, setPedras] = useState<Pedra[]>(() => sortear(QUANTAS[0]));
  const [pratos, setPratos] = useState<Record<string, Prato>>({});
  const [ultima, setUltima] = useState<{ chave: string; diff: number } | null>(null);
  const [total, setTotal] = useState(0);
  const [ordem, setOrdem] = useState<string[]>([]);
  const [msg, setMsg] = useState("Ponha pedras nos pratos e pese. A balança só mostra qual lado desce, nunca quanto pesa cada pedra.");

  const em = (p: Prato) => pedras.filter((s) => pratos[s.id] === p);
  const soma = (p: Prato) => em(p).reduce((a, s) => a + s.peso, 0);
  const chave = `${em("esq").map((s) => s.id).join(",")}|${em("dir").map((s) => s.id).join(",")}`;
  // O resultado só vale enquanto os pratos estão como estavam na pesagem
  const vivo = ultima && ultima.chave === chave ? ultima : null;
  const inclinacao = vivo ? Math.sign(vivo.diff) : 0;

  const girar = (s: Pedra) => {
    if (fim.current) return;
    audio.sfx.peso();
    const atual = pratos[s.id] ?? null;
    const prox: Prato = atual === null ? "esq" : atual === "esq" ? "dir" : null;
    setPratos((a) => ({ ...a, [s.id]: prox }));
  };

  const pesar = () => {
    if (fim.current) return;
    if (!em("esq").length && !em("dir").length) { setMsg("Os dois pratos estão vazios."); return; }
    if (vivo) { setMsg("Você já pesou assim. Mude as pedras de lugar."); return; }
    pesagens.current++;
    setTotal(pesagens.current);
    const diff = soma("esq") - soma("dir");
    setUltima({ chave, diff });
    audio.sfx.balanca();
    setMsg(diff === 0 ? "Os pratos ficam parados, no mesmo nível." : diff > 0 ? "O prato da esquerda desce." : "O prato da direita desce.");
  };

  const escolher = (s: Pedra) => {
    if (fim.current || ordem.includes(s.id)) return;
    audio.sfx.interagir();
    const nova = [...ordem, s.id];
    setOrdem(nova);
    if (nova.length < pedras.length) return;
    const certa = [...pedras].sort((a, b) => a.peso - b.peso).map((p) => p.id);
    if (nova.every((id, i) => id === certa[i])) {
      audio.sfx.ordemCerta();
      if (rodada < QUANTAS.length - 1) {
        const prox = rodada + 1;
        setRodada(prox);
        setPedras(sortear(QUANTAS[prox]));
        setPratos({}); setUltima(null); setOrdem([]);
        setMsg("A ordem está certa. O armazém abre uma segunda estante, com mais uma pedra.");
        return;
      }
      fim.current = true;
      audio.sfx.porta();
      audio.sfx.vitoria();
      giveItem("lastro-do-porto");
      setMsg("As pedras se alinham sozinhas na estante. Cada uma volta para o lugar de onde o barco saiu.");
      const custo = pesagens.current + errosOrdem.current * 3;
      window.setTimeout(() => complete("armazem", {
        estrelas: custo <= 15 ? 3 : custo <= 22 ? 2 : 1,
        tempo: Math.round((performance.now() - inicio.current) / 1000),
        detalhes: [`Pesagens: ${pesagens.current}`, errosOrdem.current ? `Ordens erradas: ${errosOrdem.current}` : "Nenhuma ordem errada"],
      }), 1700);
    } else {
      audio.sfx.erro();
      errosOrdem.current++;
      setOrdem([]);
      setMsg("A ordem está errada. Pese mais antes de arriscar de novo (cada erro conta como três pesagens).");
    }
  };

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-5 overflow-y-auto px-6 py-10">
      <AmbienteFase tipo="catedral" />
      <div className="flex justify-center"><Cabecalho id="armazem" /></div>

      <p className="font-narrativa italic text-espuma/80">
        Rodada {rodada + 1} de {QUANTAS.length}: {pedras.length} pedras, e nenhuma legenda de peso.
      </p>

      <section aria-label="Balança" className="flex flex-col items-center gap-2">
        <motion.div animate={{ rotate: -inclinacao * 10 }} transition={{ type: "spring", stiffness: 70, damping: 9 }} className="h-1.5 w-full rounded bg-latao" />
        <div className="flex w-full justify-between">
          <Lado nome="Esquerda" itens={em("esq")} y={inclinacao * 14} />
          <Lado nome="Direita" itens={em("dir")} y={-inclinacao * 14} />
        </div>
        <p className="flex items-center gap-2 text-sm text-espuma/70"><Scale size={16} className="text-lanterna" aria-hidden /> Pesagens: {total}</p>
      </section>

      <ul className="grid grid-cols-2 gap-3" aria-label="Pedras de lastro">
        {pedras.map((s) => {
          const lado = pratos[s.id] ?? null;
          return (
            <li key={s.id} className={pedras.length % 2 && s.id === pedras[pedras.length - 1].id ? "col-span-2" : ""}>
              <button
                onClick={() => girar(s)}
                aria-label={`${s.nome}: ${lado === "esq" ? "no prato da esquerda" : lado === "dir" ? "no prato da direita" : "fora da balança"}. Toque para mudar.`}
                className={`w-full rounded-xl border px-3 py-3 text-left backdrop-blur-sm transition-all ${lado ? "border-lanterna bg-lanterna/10" : "border-mare bg-mare/40 hover:border-lanterna/70"}`}
              >
                <span className="block font-narrativa text-lg">{s.nome}</span>
                <span className="block text-xs text-espuma/60">{lado === "esq" ? "← esquerda" : lado === "dir" ? "direita →" : "fora da balança"}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <button
        onClick={pesar}
        className="rounded-xl bg-gradient-to-b from-lanterna to-[#e3b36a] px-5 py-3 font-narrativa text-lg text-abismo"
      >
        Pesar
      </button>

      <section className="flex flex-col gap-3" aria-label="Ordem de peso">
        <h3 className="font-narrativa text-xl">Ordem de chegada: da mais leve à mais pesada</h3>
        <div className="grid grid-cols-2 gap-2">
          {pedras.map((s) => {
            const pos = ordem.indexOf(s.id);
            return (
              <button
                key={s.id}
                onClick={() => escolher(s)}
                disabled={pos >= 0}
                className="rounded-xl border border-mare bg-mare/30 p-3 text-left text-sm transition-all enabled:hover:border-lanterna disabled:border-lanterna disabled:bg-lanterna/10 disabled:text-lanterna"
              >
                {pos >= 0 && <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-lanterna text-sm font-bold text-abismo">{pos + 1}</span>}
                {s.nome}
              </button>
            );
          })}
        </div>
        <button onClick={() => setOrdem(ordem.slice(0, -1))} disabled={!ordem.length} className="flex items-center gap-1 self-start text-sm text-espuma/60 underline disabled:opacity-40">
          <Undo2 size={14} aria-hidden /> Desfazer a última
        </button>
      </section>

      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
