import { useState } from "react";
import { motion } from "framer-motion";
import { audio } from "../game/audio";
import Particulas from "../components/Particulas";
import Ondas from "../components/Ondas";
import { useGame } from "../store/useGame";

type Pista = { id: string; lugar: string; titulo: string; texto: string };

// A ordem aqui é a das estantes na sala, não a da história
const pistas: Pista[] = [
  { id: "cheia", lugar: "Mesa encharcada", titulo: "A Cheia", texto: "A maré subiu por três noites e a lanterna se apagou." },
  { id: "fundacao", lugar: "Estante de proa", titulo: "A Fundação", texto: "Os pescadores acenderam a primeira lanterna no cais, e a cidade nasceu em volta dela." },
  { id: "silencio", lugar: "Armário de vidro", titulo: "O Silêncio", texto: "Depois da cheia, ninguém voltou à superfície. Os sinos seguem tocando sob a água." },
  { id: "biblioteca", lugar: "Balcão do arquivista", titulo: "A Biblioteca", texto: "Anos depois da fundação, ergueram esta casa para guardar os registros da luz." },
];
const ordemCerta = ["fundacao", "biblioteca", "cheia", "silencio"];

export default function Biblioteca() {
  const { inventory, giveItem, complete, leave } = useGame();
  const [aberta, setAberta] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState<string[]>([]);
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
      setTimeout(() => complete("biblioteca"), 1800);
    } else {
      audio.sfx.erro();
      setTentativa([]);
      setMsg("As datas não fecham. Releia o que cada registro conta.");
    }
  };

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-5 overflow-y-auto px-6 py-10">
      <Particulas quantidade={16} />
      <Ondas />
      <header className="flex items-center justify-between">
        <h2 className="font-narrativa text-3xl text-lanterna">Biblioteca Alagada</h2>
        <button onClick={leave} className="text-sm text-espuma/70 underline">Voltar</button>
      </header>

      <p className="font-narrativa italic text-espuma/80">
        A água bate nos tornozelos. Tudo aqui foi escrito antes da cheia.
      </p>

      <ul className="grid grid-cols-2 gap-3">
        {pistas.map((p, k) => (
          <motion.li key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: k * 0.1 }}>
            <button
              onClick={() => examinar(p)}
              className={`h-full w-full rounded-lg border p-3 text-left transition-colors hover:border-lanterna ${
                lida(p.id) ? "border-alga bg-alga/10" : "border-mare bg-mare/40"
              }`}
            >
              <span className="font-narrativa text-lg">{p.lugar}</span>
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
          className="rounded-lg border-l-4 border-lanterna bg-mare/30 p-4 font-narrativa text-lg"
        >
          <strong className="block text-lanterna">{atual.titulo}</strong>
          {atual.texto}
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
                  className="rounded-lg border border-mare p-3 text-left enabled:hover:border-lanterna disabled:border-lanterna disabled:text-lanterna"
                >
                  {pos >= 0 && <span className="mr-2 font-bold">{pos + 1}.</span>}
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
