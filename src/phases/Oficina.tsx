import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Hammer, Heart, Mail, Scroll, Wrench, type LucideIcon } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

type Objeto = { id: string; lugar: string; titulo: string; texto: string; Icone: LucideIcon; chave: boolean };

// "chave": traz uma pista de verdade para a montagem. Os outros são história (e um palpite furado)
const objetos: Objeto[] = [
  {
    id: "caderno", lugar: "Caderno de Tomás", titulo: "Sobre a base", chave: true, Icone: Scroll,
    texto: "O bronze envergou com o sal e o cedro apodreceu na primeira cheia. Só o ferro, pesado e feio, segura a lente no lugar.",
  },
  {
    id: "carta", lugar: "Carta de Lia", titulo: "Sobre a lente", chave: true, Icone: Mail,
    texto: "Papai dizia que a luz não passa pelo vidro liso: ela só dança dentro do lapidado. O cristal de sal ele nunca quis usar, porque derrete na umidade.",
  },
  {
    id: "receita", lugar: "Receita do óleo", titulo: "Sobre a chama", chave: true, Icone: Flame,
    texto: "Óleo de baleia fumega e escurece a lente. A brasa de coral queima depressa demais. O pavio de alga arde devagar e limpo, a noite toda.",
  },
  {
    id: "aprendiz", lugar: "Bilhete do aprendiz", titulo: "Um palpite", chave: false, Icone: Wrench,
    texto: "Bronze, bronze, sempre bronze! Brilha mais e custa menos. O mestre é teimoso e só quer saber de ferro. (A letra é de pressa. Há uma mancha de sal na página.)",
  },
  {
    id: "retrato", lugar: "Retrato na tampa", titulo: "Para Lia", chave: false, Icone: Heart,
    texto: "Riscado com um prego na tampa da caixa: Para Lia, quando eu voltar. Embaixo, mais fundo: Se o mar me levar, a luz continua. Foi para isso que a fiz.",
  },
];

type Peca = { id: string; nome: string };
type Encaixe = { id: string; nome: string; opcoes: Peca[]; certa: string };

const encaixes: Encaixe[] = [
  { id: "base", nome: "Base", certa: "ferro", opcoes: [{ id: "bronze", nome: "Aro de bronze" }, { id: "ferro", nome: "Aro de ferro" }, { id: "cedro", nome: "Aro de cedro" }] },
  { id: "lente", nome: "Lente", certa: "lapidado", opcoes: [{ id: "liso", nome: "Vidro liso" }, { id: "lapidado", nome: "Vidro lapidado" }, { id: "sal", nome: "Cristal de sal" }] },
  { id: "chama", nome: "Chama", certa: "alga", opcoes: [{ id: "oleo", nome: "Óleo de baleia" }, { id: "alga", nome: "Pavio de alga" }, { id: "coral", nome: "Brasa de coral" }] },
];

/* ---------- Etapa 2: forja ---------- */
// O ferro esquenta e esfria sem parar. Bata quando estiver na faixa brilhante.
// A cada golpe certo a faixa estreita e o ritmo aumenta.
const GOLPES = 3;
const CENTRO = 0.74;

function Forja({ aoErro, aoFim }: { aoErro: () => void; aoFim: () => void }) {
  const [calor, setCalor] = useState(0);
  const [golpes, setGolpes] = useState(0);
  const calorRef = useRef(0);
  const golpesRef = useRef(0);
  const fimRef = useRef(false);
  const meia = () => 0.11 - golpesRef.current * 0.025;

  useEffect(() => {
    let raf = 0, fase = 0, anterior = performance.now();
    const loop = (agora: number) => {
      const dt = Math.min(agora - anterior, 50);
      anterior = agora;
      fase += dt * (0.0021 + golpesRef.current * 0.0009);
      calorRef.current = 0.5 + 0.5 * Math.sin(fase);
      setCalor(calorRef.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const bater = () => {
    if (fimRef.current) return;
    if (Math.abs(calorRef.current - CENTRO) <= meia()) {
      golpesRef.current++;
      setGolpes(golpesRef.current);
      audio.sfx.martelo();
      if (golpesRef.current >= GOLPES) { fimRef.current = true; window.setTimeout(aoFim, 700); }
    } else {
      audio.sfx.falha();
      aoErro();
    }
  };
  const acao = useRef(bater);
  acao.current = bater;
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); acao.current(); } };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, []);

  const m = meia();
  return (
    <section className="flex flex-col gap-4" aria-label="Forja do aro">
      <h3 className="flex items-center gap-2 font-narrativa text-xl"><Hammer size={18} className="text-lanterna" aria-hidden /> Forje o aro</h3>
      <p className="text-sm text-espuma/70">Bata no ferro quando o brilho estiver dentro da faixa dourada. Golpes: {golpes}/{GOLPES}</p>
      <div className="relative h-10 overflow-hidden rounded-xl border border-mare" style={{ background: "linear-gradient(90deg, #0f3340, #5a3d33 55%, #E07A5F 85%, #fff3d6)" }} role="img" aria-label={`Calor do ferro: ${Math.round(calor * 100)}%`}>
        <div className="absolute inset-y-0 border-x-2 border-lanterna bg-lanterna/25" style={{ left: `${(CENTRO - m) * 100}%`, width: `${m * 200}%` }} />
        <div className="absolute inset-y-0 w-1.5 rounded bg-espuma shadow-[0_0_12px_rgba(255,255,255,0.9)]" style={{ left: `calc(${calor * 100}% - 3px)` }} />
      </div>
      <button
        onClick={bater}
        className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-lanterna to-[#e3b36a] px-5 py-4 font-narrativa text-xl text-abismo active:scale-[0.98]"
      >
        <Hammer size={20} aria-hidden /> Martelar (Espaço)
      </button>
    </section>
  );
}

/* ---------- Etapa 3: foco ---------- */
// Um barco vaga no horizonte. Gire o feixe até ele e mantenha a luz em cima.
const TOL = 7;

function Foco({ aoFim }: { aoFim: () => void }) {
  const [mira, setMira] = useState(8);
  const [barco, setBarco] = useState(50);
  const [prog, setProg] = useState(0);
  const miraRef = useRef(8);
  const fimRef = useRef(false);

  useEffect(() => {
    let raf = 0, anterior = performance.now(), t = 0, p = 0;
    const loop = (agora: number) => {
      const dt = Math.min(agora - anterior, 50);
      anterior = agora;
      t += dt / 1000;
      const b = 50 + 34 * Math.sin(t * 0.55) + 8 * Math.sin(t * 1.4 + 1);
      const sobre = Math.abs(b - miraRef.current) <= TOL;
      p = Math.max(0, Math.min(1, p + (sobre ? dt / 2600 : -dt / 5000)));
      setBarco(b);
      setProg(p);
      if (p >= 1 && !fimRef.current) { fimRef.current = true; aoFim(); return; }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const sobre = Math.abs(barco - mira) <= TOL;
  const xm = 14 + mira * 2.72, xb = 14 + barco * 2.72;
  return (
    <section className="flex flex-col gap-4" aria-label="Foco da lente">
      <h3 className="flex items-center gap-2 font-narrativa text-xl"><Flame size={18} className="text-lanterna" aria-hidden /> Aponte a luz</h3>
      <p className="text-sm text-espuma/70">Gire o feixe até o barco e mantenha a luz sobre ele até a barra encher.</p>
      <svg viewBox="0 0 300 150" className="w-full rounded-xl border border-mare bg-abismo/60" role="img" aria-label={sobre ? "A luz está sobre o barco" : "A luz está longe do barco"}>
        <rect x="0" y="108" width="300" height="42" fill="#0f3340" />
        <path d="M150 128 L142 128 L146 96 L154 96 Z" fill="#A67C52" />
        <polygon points={`150,94 ${xm - 16},28 ${xm + 16},28`} fill="#FFBF00" opacity={sobre ? 0.55 : 0.25} />
        <circle cx="150" cy="92" r="5" fill="#FFBF00" />
        <g transform={`translate(${xb} 106)`}>
          <path d="M-12 0 L12 0 L8 7 L-8 7 Z" fill="#E07A5F" />
          <rect x="-1" y="-12" width="2" height="12" fill="#F2E6D6" />
          <path d="M1 -12 L9 -3 L1 -3 Z" fill="#F2E6D6" opacity="0.85" />
        </g>
        {sobre && <circle cx={xb} cy="102" r="20" fill="none" stroke="#FFBF00" strokeWidth="2" opacity="0.8" />}
      </svg>
      <input
        type="range" min={0} max={100} step={0.5} value={mira}
        onChange={(e) => { const v = Number(e.target.value); miraRef.current = v; setMira(v); }}
        aria-label="Direção do feixe de luz"
        className="h-10 w-full accent-[#FFBF00]"
      />
      <div className="h-2.5 overflow-hidden rounded-full bg-mare" role="progressbar" aria-label="Luz fixada no barco" aria-valuenow={Math.round(prog * 100)} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-full rounded-full ${sobre ? "bg-lanterna" : "bg-alga"}`} style={{ width: `${prog * 100}%` }} />
      </div>
    </section>
  );
}

/* ---------- Fase ---------- */
export default function Oficina() {
  const { inventory, giveItem, complete } = useGame();
  const erros = useRef(0);
  const montagens = useRef(0);
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const [etapa, setEtapa] = useState<"bancada" | "forja" | "foco">("bancada");
  const [aberto, setAberto] = useState<string | null>(null);
  const [escolha, setEscolha] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("Examine a bancada. Algumas peças só fazem sentido depois de ler o que o faroleiro escreveu.");

  const lido = (id: string) => inventory.includes(`oficina:${id}`);
  const chavesLidas = objetos.filter((o) => o.chave).every((o) => lido(o.id));
  const lidos = objetos.filter((o) => lido(o.id)).length;
  const atual = objetos.find((o) => o.id === aberto);
  const completo = encaixes.every((e) => escolha[e.id]);

  const examinar = (o: Objeto) => {
    setAberto(o.id);
    if (!lido(o.id)) { giveItem(`oficina:${o.id}`); audio.sfx.pista(); }
    else audio.sfx.interagir();
  };

  const escolher = (e: Encaixe, peca: Peca) => {
    audio.sfx.encaixe();
    setEscolha((a) => ({ ...a, [e.id]: peca.id }));
  };

  const montar = () => {
    if (!completo) return;
    const certas = encaixes.filter((e) => escolha[e.id] === e.certa).length;
    if (certas === encaixes.length) {
      audio.sfx.chama();
      setEtapa("forja");
      setMsg("As peças servem. Falta forjar o aro: o ferro precisa ser batido no ponto.");
    } else {
      audio.sfx.falha();
      erros.current++;
      montagens.current++;
      setMsg(certas === 0
        ? "A chama pisca e morre. Nenhuma peça está no lugar. Releia as anotações."
        : `A luz falha. ${certas} de ${encaixes.length} peças estão certas. Descubra qual está errada.`);
    }
  };

  const erroForja = () => {
    erros.current++;
    setMsg("O ferro ainda estava mole demais ou frio demais. Espere o brilho entrar na faixa.");
  };

  const fimForja = () => {
    setEtapa("foco");
    audio.sfx.encaixe();
    setMsg("O aro está pronto. Agora a lente gira sozinha, e o feixe vai para onde ela quiser. Aponte-o para um barco.");
  };

  const fimFoco = () => {
    if (fim.current) return;
    fim.current = true;
    audio.sfx.lente();
    audio.sfx.vitoria();
    giveItem("lente-do-faroleiro");
    setMsg("O barco vira devagar e aponta a proa para a luz. Depois de tanto tempo, alguém voltou para casa.");
    const e = erros.current;
    window.setTimeout(() => complete("oficina", {
      estrelas: e <= 1 ? 3 : e <= 4 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Montagens erradas: ${montagens.current}`, `Golpes fora do ponto: ${e - montagens.current}`, `Anotações lidas: ${lidos} de ${objetos.length}`],
    }), 1800);
  };

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-3 overflow-y-auto px-4 py-3 fase-compacta">
      <AmbienteFase tipo="biblioteca" />
      <div className="flex justify-center"><Cabecalho id="oficina" /></div>

      {etapa === "bancada" && (
        <>
          <p className="font-narrativa italic text-espuma/80">
            Cheiro de ferro e óleo velho. A bancada ainda está do jeito que ele deixou.
          </p>

          <p className="flex items-center gap-2 text-sm text-espuma/70" aria-label={`${lidos} de ${objetos.length} anotações lidas`}>
            {objetos.map((o) => (
              <span key={o.id} aria-hidden className={`h-2.5 w-2.5 rounded-full transition-all duration-500 ${lido(o.id) ? "scale-125 bg-lanterna shadow-[0_0_10px_rgba(255,191,0,0.9)]" : "bg-mare"}`} />
            ))}
            <span>{lidos}/{objetos.length} anotações</span>
          </p>

          <ul className="grid grid-cols-2 gap-3">
            {objetos.map((o, k) => (
              <motion.li key={o.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: k * 0.08 }} className={k === objetos.length - 1 && objetos.length % 2 ? "col-span-2" : ""}>
                <button
                  onClick={() => examinar(o)}
                  className={`h-full w-full rounded-xl border p-3 text-left backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-lanterna ${
                    lido(o.id) ? "border-alga bg-alga/10 shadow-[0_0_24px_rgba(61,139,122,0.3)]" : "border-mare bg-mare/40"
                  }`}
                >
                  <o.Icone size={22} className={lido(o.id) ? "text-alga" : "text-lanterna/80"} aria-hidden />
                  <span className="mt-2 block font-narrativa text-lg">{o.lugar}</span>
                  <span className="mt-1 block text-sm text-espuma/60">{lido(o.id) ? o.titulo : "Ainda não lido"}</span>
                </button>
              </motion.li>
            ))}
          </ul>

          {atual && (
            <motion.blockquote
              key={atual.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ background: "linear-gradient(160deg, rgba(242,230,214,.2), rgba(166,124,82,.2))" }}
              className="rounded-xl border-l-4 border-latao p-4 font-narrativa text-lg shadow-[0_0_30px_rgba(255,191,0,0.12)] backdrop-blur-sm"
            >
              <strong className="block text-lanterna">{atual.lugar}</strong>
              {atual.texto}
            </motion.blockquote>
          )}

          {chavesLidas ? (
            <section className="flex flex-col gap-4" aria-label="Montagem da lente">
              <h3 className="flex items-center gap-2 font-narrativa text-xl"><Wrench size={18} className="text-lanterna" aria-hidden /> Escolha as peças</h3>
              {encaixes.map((e) => (
                <div key={e.id} className="flex flex-col gap-2">
                  <span className="text-xs uppercase tracking-[0.2em] text-latao">{e.nome}</span>
                  <div className="grid grid-cols-3 gap-2" role="group" aria-label={e.nome}>
                    {e.opcoes.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => escolher(e, p)}
                        aria-pressed={escolha[e.id] === p.id}
                        className={`rounded-xl border px-2 py-3 text-sm backdrop-blur-sm transition-all ${
                          escolha[e.id] === p.id ? "border-lanterna bg-lanterna/15 text-lanterna" : "border-mare bg-mare/30 hover:border-lanterna/70"
                        }`}
                      >
                        {p.nome}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <button
                onClick={montar}
                disabled={!completo}
                className="rounded-xl bg-gradient-to-b from-lanterna to-[#e3b36a] px-5 py-3 font-narrativa text-lg text-abismo transition-opacity disabled:opacity-40"
              >
                Montar e testar a chama
              </button>
            </section>
          ) : (
            <p className="text-sm text-espuma/60">A bancada tem três anotações que importam para a montagem. Leia as três para liberar as peças.</p>
          )}
        </>
      )}

      {etapa === "forja" && <Forja aoErro={erroForja} aoFim={fimForja} />}
      {etapa === "foco" && <Foco aoFim={fimFoco} />}

      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
