import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { audio } from "../game/audio";
import { Anchor, BellRing, Library, Waves, type LucideIcon } from "lucide-react";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

type Pista = { id: string; lugar: string; titulo: string; texto: string; Icone: LucideIcon };

// A ordem aqui é a das estantes na sala, não a da história
const pistas: Pista[] = [
  { id: "cheia", lugar: "Mesa encharcada", titulo: "A Cheia", texto: "A maré subiu por três noites e a lanterna se apagou.", Icone: Waves },
  { id: "fundacao", lugar: "Estante de proa", titulo: "A Fundação", texto: "Os pescadores acenderam a primeira lanterna no cais, e a cidade nasceu em volta dela.", Icone: Anchor },
  { id: "silencio", lugar: "Armário de vidro", titulo: "O Silêncio", texto: "Depois da cheia, ninguém voltou à superfície. Os sinos seguem tocando sob a água.", Icone: BellRing },
  { id: "biblioteca", lugar: "Balcão do arquivista", titulo: "A Biblioteca", texto: "Anos depois da fundação, ergueram esta casa para guardar os registros da luz.", Icone: Library },
];
const ordemCerta = ["fundacao", "biblioteca", "cheia", "silencio"];

export default function Biblioteca() {
  const { inventory, giveItem, complete } = useGame();
  const erros = useRef(0);
  const inicio = useRef(performance.now());
  const [aberta, setAberta] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState<string[]>([]);
  const [lendo, setLendo] = useState(false);
  const [msg, setMsg] = useState("Examine os quatro cantos da sala.");

  const lida = (id: string) => inventory.includes(`pista:${id}`);
  const todas = pistas.every((p) => lida(p.id));
  const atual = pistas.find((p) => p.id === aberta);

  const examinar = (p: Pista) => {
    setAberta(p.id);
    if (!lida(p.id)) { giveItem(`pista:${p.id}`); audio.sfx.pista(); }
    else audio.sfx.interagir();
  };

  const escolher = (id: string) => {
    if (tentativa.includes(id)) return;
    audio.sfx.interagir();
    const nova = [...tentativa, id];
    setTentativa(nova);
    if (nova.length < ordemCerta.length) return;
    if (nova.every((x, i) => x === ordemCerta[i])) {
      audio.sfx.porta();
      audio.sfx.vitoria();
      giveItem("registro-da-luz");
      setMsg("O arquivo se abre. Entre as folhas molhadas, o registro da luz.");
      const e = erros.current;
      setTimeout(() => complete("biblioteca", {
        estrelas: e === 0 ? 3 : e <= 2 ? 2 : 1,
        tempo: Math.round((performance.now() - inicio.current) / 1000),
        detalhes: [e === 0 ? "Ordem certa de primeira" : `Tentativas erradas: ${e}`],
      }), 1500);
    } else {
      audio.sfx.erro();
      erros.current++;
      setTentativa([]);
      setMsg("As datas não fecham. Releia o que cada registro conta.");
    }
  };

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-5 overflow-y-auto px-6 py-10">
      <AmbienteFase tipo="biblioteca" />
      <div className="flex justify-center"><Cabecalho id="biblioteca" /></div>

      <p className="font-narrativa italic text-espuma/80">
        A água bate nos tornozelos. Tudo aqui foi escrito antes da cheia.
      </p>

      <p className="flex items-center gap-2 text-sm text-espuma/70" aria-label={`${pistas.filter((p) => lida(p.id)).length} de ${pistas.length} registros examinados`}>
        {pistas.map((p) => (
          <span key={p.id} aria-hidden className={`h-2.5 w-2.5 rounded-full transition-all duration-500 ${lida(p.id) ? "scale-125 bg-lanterna shadow-[0_0_10px_rgba(255,191,0,0.9)]" : "bg-mare"}`} />
        ))}
        <span>{pistas.filter((p) => lida(p.id)).length}/{pistas.length} registros</span>
      </p>

      <ul className="grid grid-cols-2 gap-3">
        {pistas.map((p, k) => (
          <motion.li key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: k * 0.1 }}>
            <button
              onClick={() => examinar(p)}
              className={`group relative h-full w-full overflow-hidden rounded-xl border p-3 text-left backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-lanterna ${
                lida(p.id) ? "border-alga bg-alga/10 shadow-[0_0_24px_rgba(61,139,122,0.3)]" : "border-mare bg-mare/40"
              }`}
            >
              <p.Icone size={22} className={lida(p.id) ? "text-alga" : "text-lanterna/80"} aria-hidden />
              {!lida(p.id) && (
                <span aria-hidden className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-lanterna/15 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
              )}
              <span className="mt-2 block font-narrativa text-lg">{p.lugar}</span>
              <span className="mt-1 block text-sm text-espuma/60">{lida(p.id) ? p.titulo : "Ainda não examinado"}</span>
            </button>
          </motion.li>
        ))}
      </ul>

      {atual && (
        <motion.blockquote
          key={atual.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          onPointerDown={() => setLendo(true)} onPointerUp={() => setLendo(false)} onPointerLeave={() => setLendo(false)}
          style={{ filter: lendo ? "none" : "blur(2.5px)", transition: "filter .4s", touchAction: "none", background: "linear-gradient(160deg, rgba(242,230,214,.2), rgba(166,124,82,.2))" }}
          className="select-none rounded-xl border-l-4 border-latao p-4 font-narrativa text-lg shadow-[0_0_30px_rgba(255,191,0,0.12)] backdrop-blur-sm"
        >
          <strong className="block text-lanterna">{atual.titulo}</strong>
          {atual.texto}
          <span className="mt-2 block text-xs text-espuma/50">{lendo ? "A tinta resiste." : "A tinta escorre. Segure o registro para ler."}</span>
        </motion.blockquote>
      )}

      {todas && (
        <section className="flex flex-col gap-3">
          <h3 className="font-narrativa text-xl">Ordene os registros, do mais antigo ao mais recente</h3>
          <div className="grid grid-cols-2 gap-3">
            {pistas.map((p) => {
              const pos = tentativa.indexOf(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => escolher(p.id)}
                  disabled={pos >= 0}
                  className="rounded-xl border border-mare bg-mare/30 p-3 text-left backdrop-blur-sm transition-all enabled:hover:-translate-y-0.5 enabled:hover:border-lanterna disabled:border-lanterna disabled:bg-lanterna/10 disabled:text-lanterna"
                >
                  {pos >= 0 && <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-lanterna text-sm font-bold text-abismo">{pos + 1}</span>}
                  {p.titulo}
                </button>
              );
            })}
          </div>
          <button onClick={() => setTentativa([])} className="self-start text-sm text-espuma/60 underline">
            Recomeçar a ordem
          </button>
        </section>
      )}

      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
