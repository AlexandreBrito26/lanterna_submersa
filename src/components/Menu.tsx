import { Fragment, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Award, BookOpen, Film, Infinity as InfinityIcon, Lock, Music, Play, Settings2, Trash2, Trophy } from "lucide-react";
import { atoDe, atos, phases as todasFases, tiposVitoria, type Ramo } from "../phases/data";
import { useGame } from "../store/useGame";
import { cutscenes, type CenaId } from "../game/cutscenes";
import { niveis, useDificuldade, type Nivel } from "../game/dificuldade";
import CenaMenu from "./CenaMenu";
import Estrelas from "./Estrelas";
import { iconeConquista, iconeTipo } from "./tipos";
import { conquistas } from "../game/conquistas";
import { paginas } from "../game/diario";
import { musica } from "../game/musica";

const finais: Record<string, string> = {
  apagar: "Descanso no escuro",
  acender: "A luz na superfície",
  guardar: "O novo guardião",
  renascer: "A cidade desperta",
};
const descNiveis: Record<Nivel, string> = {
  facil: "Mais ar, mais vidas e inimigos lentos.",
  normal: "A experiência pensada para a história.",
  dificil: "Menos ar, correntes rápidas e erros caros.",
};
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

type Tela = "titulo" | "fases" | "ajustes" | "galeria" | "diario";

const nomeRamo: Record<string, string> = { apagar: "do Apagar", acender: "do Acender", guardar: "do Guardar", renascer: "do Renascer" };

export default function Menu({ aoRever }: { aoRever: (id: CenaId) => void }) {
  const { completed, inventory, estrelas, melhorTempo, start, startInfinito, reset, conquistas: ganhas, recordeInfinito } = useGame();
  const estado = useGame();
  const { nivel, definir } = useDificuldade();
  const [tela, setTela] = useState<Tela>("titulo");
  const [confirmar, setConfirmar] = useState(false);
  const [musicaOn, setMusicaOn] = useState(musica.estaAtiva());

  // Ramo do Ato III: só as fases do final escolhido no Coração aparecem
  const ramoAtual = (["apagar", "acender", "guardar", "renascer"] as Ramo[]).reverse().find((r) => inventory.includes(`final:${r}`));
  const phases = todasFases.filter((p) => !p.ramo || p.ramo === ramoAtual);
  // Fases novas entre as antigas não trancam quem já passou delas
  const liberada = (i: number) => phases[i].pronta && (i === 0 || completed.includes(phases[i - 1].id) || phases.slice(i).some((p) => completed.includes(p.id)));
  const proxima = phases.find((_, i) => liberada(i) && !completed.includes(phases[i].id));
  // Cada ato tem o seu menu principal. O menu só muda quando o ato atual é concluído por completo.
  const atoConcluido = (n: number) => {
    const fases = phases.filter((p) => atoDe(p.id) === n);
    return fases.length > 0 && fases.every((p) => completed.includes(p.id));
  };
  let atoMenu = 1;
  while (atoMenu <= 5 && atoConcluido(atoMenu)) atoMenu++;
  atoMenu = Math.min(atoMenu, 5);
  const subtitulos: Record<number, string> = { 1: "Maré Alta", 2: "O Segundo Mar", 3: "Os Ramos", 4: "Raízes da Cidade", 5: "O Farol Final" };
  const totalEstrelas = Object.values(estrelas).reduce((a, b) => a + b, 0);
  const finaisVistos = Object.keys(finais).filter((f) => inventory.includes(`final:${f}`));

  const Voltar = () => (
    <button onClick={() => setTela("titulo")} className="flex items-center gap-1 text-sm text-espuma/70 hover:text-espuma">
      <ArrowLeft size={16} aria-hidden /> Voltar
    </button>
  );
  const fundo = <CenaMenu ato={atoMenu} />;

  if (tela === "fases") {
    return (
      <main className="mx-auto flex h-full max-w-xl flex-col gap-4 overflow-y-auto px-6 py-6">
        {fundo}
        <header className="flex items-center justify-between">
          <h1 className="font-narrativa text-3xl text-lanterna">Mapa da cidade</h1>
          <Voltar />
        </header>
        <p className="flex items-center gap-2 text-sm text-espuma/70">
          <Trophy size={16} className="text-lanterna" aria-hidden />
          {totalEstrelas} de {todasFases.length * 3} estrelas
        </p>

        <ol className="relative flex flex-col gap-3 pl-8 before:absolute before:bottom-4 before:left-3 before:top-4 before:w-px before:bg-mare">
          {phases.map((p, i) => {
            const inicioDeAto = i === 0 || atoDe(phases[i - 1].id) !== atoDe(p.id);
            const feita = completed.includes(p.id);
            const aberta = liberada(i);
            const Icone = iconeTipo[p.tipo];
            const tempo = melhorTempo[p.id];
            return (
              <Fragment key={p.id}>
              {!inicioDeAto && p.ramo && phases[i - 1]?.ramo !== p.ramo && (
                <li className="pt-3">
                  <h3 className="text-xs uppercase tracking-[0.25em] text-espuma/50">Ramo {nomeRamo[p.ramo]}</h3>
                </li>
              )}
              {inicioDeAto && (
                <li className="pt-2">
                  <h2 className={`font-narrativa text-xl ${atoDe(p.id) === 2 ? "text-alga" : atoDe(p.id) === 3 ? "text-coral" : "text-lanterna"}`}>{atos[atoDe(p.id) - 1].titulo}</h2>
                  <p className="text-sm text-espuma/60">{atos[atoDe(p.id) - 1].resumo}</p>
                </li>
              )}
              <motion.li
                key={`item-${p.id}`}
                className="relative"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <span
                  aria-hidden
                  className={`absolute -left-8 top-5 flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                    feita ? "border-alga bg-alga text-abismo" : aberta ? "border-lanterna bg-abismo text-lanterna" : "border-mare bg-abismo text-espuma/40"
                  }`}
                >
                  {aberta ? i + 1 : <Lock size={12} />}
                </span>
                <motion.button
                  disabled={!aberta}
                  onClick={() => start(p.id)}
                  whileTap={aberta ? { scale: 0.98 } : undefined}
                  className="w-full rounded-xl border border-mare bg-mare/40 p-4 text-left transition-colors enabled:hover:border-lanterna disabled:opacity-50"
                >
                  <span className="flex items-center justify-between text-xs uppercase tracking-wide text-espuma/60">
                    <span className="flex items-center gap-1.5"><Icone size={14} aria-hidden /> {tiposVitoria[p.tipo].nome}</span>
                    {feita && <Estrelas valor={estrelas[p.id] ?? 1} />}
                  </span>
                  <span className="mt-1 block font-narrativa text-xl">{p.titulo}</span>
                  <span className="mt-1 block text-sm text-espuma/70">{p.resumo}</span>
                  <span className={`mt-2 block text-sm ${feita ? "text-alga" : "text-espuma/60"}`}>
                    {feita
                      ? `Concluída${tempo !== undefined ? ` · melhor tempo ${fmt(tempo)}` : ""}. Toque para melhorar`
                      : aberta ? "Liberada" : `Conclua antes: ${phases[i - 1]?.titulo}`}
                  </span>
                </motion.button>
                {p.id in cutscenes && inventory.includes(`cutscene:${p.id}`) && (
                  <button onClick={() => aoRever(p.id as CenaId)} className="mt-1 flex items-center gap-1 text-sm text-espuma/60 hover:text-espuma">
                    <Film size={14} aria-hidden /> Rever história
                  </button>
                )}
              </motion.li>
              </Fragment>
            );
          })}
        </ol>
        <div className="flex flex-col gap-2 pt-2">
          {atos.map((a) => {
            const temFases = todasFases.some((p) => atoDe(p.id) === a.n);
            const visivel = phases.some((p) => atoDe(p.id) === a.n);
            if (visivel) return null;
            const motivo = !temFases ? "em construção" : ramoAtual ? "em breve para o seu ramo" : "escolha o final no Coração para abrir este ato";
            return <p key={a.n} className="flex items-center gap-2 text-sm text-espuma/50"><Lock size={12} aria-hidden /> {a.titulo}: {motivo}</p>;
          })}
        </div>
      </main>
    );
  }

  if (tela === "diario") {
    const abertas = paginas.filter((p) => p.check(estado)).length;
    return (
      <main className="mx-auto flex h-full max-w-xl flex-col gap-5 overflow-y-auto px-6 py-6">
        {fundo}
        <header className="flex items-center justify-between">
          <h1 className="font-narrativa text-3xl text-lanterna">Diário do Faroleiro</h1>
          <Voltar />
        </header>
        <p className="flex items-center gap-2 text-sm text-espuma/70">
          <BookOpen size={16} className="text-lanterna" aria-hidden />
          {abertas} de {paginas.length} páginas. Cada fase concluída abre uma nova.
        </p>
        <ol className="flex flex-col gap-3">
          {paginas.map((p, k) => {
            const ok = p.check(estado);
            return (
              <motion.li
                key={p.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: k * 0.04 }}
                className={`rounded-xl border p-4 backdrop-blur-sm ${ok ? "border-latao/70 bg-espuma/5" : "border-mare bg-mare/20 opacity-70"}`}
              >
                <span className="text-xs uppercase tracking-[0.2em] text-latao">Página {k + 1}</span>
                <h2 className="mt-1 font-narrativa text-xl text-lanterna">{ok ? p.titulo : "???"}</h2>
                <p className={`mt-2 font-narrativa leading-relaxed ${ok ? "text-espuma/90" : "text-sm text-espuma/50"}`}>{ok ? p.texto : p.dica}</p>
              </motion.li>
            );
          })}
        </ol>
      </main>
    );
  }

  if (tela === "galeria") {
    return (
      <main className="mx-auto flex h-full max-w-xl flex-col gap-6 overflow-y-auto px-6 py-6">
        {fundo}
        <header className="flex items-center justify-between">
          <h1 className="font-narrativa text-3xl text-lanterna">Galeria</h1>
          <Voltar />
        </header>

        <section aria-label="Resumo" className="grid grid-cols-3 gap-2 text-center">
          {[
            { v: `${totalEstrelas}/${todasFases.length * 3}`, t: "Estrelas" },
            { v: `${ganhas.length}/${conquistas.length}`, t: "Medalhas" },
            { v: recordeInfinito ? `${recordeInfinito}s` : "–", t: "Maré Infinita" },
          ].map((x) => (
            <div key={x.t} className="rounded-xl border border-mare bg-mare/30 p-3 backdrop-blur-sm">
              <div className="font-narrativa text-xl text-lanterna">{x.v}</div>
              <div className="text-xs uppercase tracking-wide text-espuma/60">{x.t}</div>
            </div>
          ))}
        </section>

        <section aria-label="Medalhas" className="flex flex-col gap-2">
          <h2 className="font-narrativa text-lg">Medalhas</h2>
          <ul className="grid grid-cols-2 gap-3">
            {conquistas.map((c, k) => {
              const ok = ganhas.includes(c.id);
              const Icone = iconeConquista[c.id] ?? Award;
              return (
                <motion.li
                  key={c.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: k * 0.03 }}
                  className={`rounded-xl border p-3 backdrop-blur-sm ${ok ? "border-lanterna/70 bg-lanterna/10 shadow-[0_0_24px_rgba(255,191,0,0.18)]" : "border-mare bg-mare/20 opacity-70"}`}
                >
                  <span className={`flex h-9 w-9 items-center justify-center rounded-full ${ok ? "bg-lanterna text-abismo" : "bg-mare text-espuma/40"}`}>
                    {ok ? <Icone size={18} aria-hidden /> : <Lock size={16} aria-hidden />}
                  </span>
                  <span className="mt-2 block font-narrativa leading-tight">{ok ? c.nome : "???"}</span>
                  <span className="mt-1 block text-xs text-espuma/60">{c.desc}</span>
                </motion.li>
              );
            })}
          </ul>
        </section>

        <section aria-label="Finais" className="flex flex-col gap-2">
          <h2 className="font-narrativa text-lg">Finais ({finaisVistos.length}/4)</h2>
          <ul className="flex flex-col gap-1 text-sm">
            {Object.entries(finais).map(([id, nome]) => (
              <li key={id} className={inventory.includes(`final:${id}`) ? "text-alga" : "text-espuma/40"}>
                {inventory.includes(`final:${id}`) ? nome : id === "renascer" ? "Final secreto: exige 3 estrelas em todas as fases" : "Final ainda não descoberto"}
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Histórias" className="flex flex-col gap-2">
          <h2 className="font-narrativa text-lg">Histórias já vistas</h2>
          <ul className="flex flex-col gap-1">
            {phases.filter((p) => p.id in cutscenes && inventory.includes(`cutscene:${p.id}`)).map((p) => (
              <li key={p.id}>
                <button onClick={() => aoRever(p.id as CenaId)} className="flex items-center gap-2 text-sm text-espuma/80 hover:text-lanterna">
                  <Film size={14} aria-hidden /> {p.titulo}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </main>
    );
  }

  if (tela === "ajustes") {
    return (
      <main className="mx-auto flex h-full max-w-xl flex-col gap-6 overflow-y-auto px-6 py-6">
        {fundo}
        <header className="flex items-center justify-between">
          <h1 className="font-narrativa text-3xl text-lanterna">Ajustes</h1>
          <Voltar />
        </header>

        <section aria-label="Dificuldade" className="flex flex-col gap-2">
          <h2 className="font-narrativa text-lg">Dificuldade</h2>
          <div className="flex gap-2" role="group">
            {(Object.keys(niveis) as Nivel[]).map((n) => (
              <button
                key={n}
                onClick={() => definir(n)}
                aria-pressed={nivel === n}
                className={`flex-1 rounded-lg border px-3 py-2 transition-colors ${nivel === n ? "border-lanterna bg-lanterna/10 text-lanterna" : "border-mare text-espuma/70"}`}
              >
                {niveis[n].nome}
              </button>
            ))}
          </div>
          <p className="text-sm text-espuma/60">{descNiveis[nivel]} Vale a partir da próxima vez que você entrar numa fase.</p>
        </section>

        <section aria-label="Música" className="flex flex-col gap-2">
          <h2 className="font-narrativa text-lg">Música</h2>
          <button
            onClick={() => { const v = !musicaOn; musica.definirAtiva(v); setMusicaOn(v); }}
            aria-pressed={musicaOn}
            className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 transition-colors ${musicaOn ? "border-lanterna bg-lanterna/10 text-lanterna" : "border-mare text-espuma/70"}`}
          >
            <Music size={16} aria-hidden /> Trilha de cada fase: {musicaOn ? "ligada" : "desligada"}
          </button>
          <p className="text-sm text-espuma/60">O botão Som, no topo, silencia tudo.</p>
        </section>

        <section aria-label="Finais" className="flex flex-col gap-2">
          <h2 className="font-narrativa text-lg">Finais descobertos ({finaisVistos.length}/4)</h2>
          <ul className="flex flex-col gap-1 text-sm">
            {Object.entries(finais).map(([id, nome]) => (
              <li key={id} className={inventory.includes(`final:${id}`) ? "text-alga" : "text-espuma/40"}>
                {inventory.includes(`final:${id}`) ? nome : id === "renascer" ? "Final secreto: exige 3 estrelas em todas as fases" : "Final ainda não descoberto"}
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Progresso" className="flex flex-col gap-2">
          <h2 className="font-narrativa text-lg">Progresso</h2>
          {confirmar ? (
            <div className="flex flex-col gap-2 rounded-lg border border-coral/60 p-3">
              <p className="text-sm">Isso apaga fases, estrelas, recordes e finais. Tem certeza?</p>
              <div className="flex gap-2">
                <button onClick={() => { reset(); setConfirmar(false); setTela("titulo"); }} className="flex-1 rounded-lg bg-coral px-3 py-2 text-abismo">Apagar tudo</button>
                <button onClick={() => setConfirmar(false)} className="flex-1 rounded-lg border border-mare px-3 py-2">Cancelar</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setConfirmar(true)} className="flex items-center gap-2 self-start text-sm text-espuma/60 hover:text-coral">
              <Trash2 size={14} aria-hidden /> Apagar progresso
            </button>
          )}
        </section>
      </main>
    );
  }

  const palavras = ["Lanterna", "Submersa"];
  return (
    <main className={`relative mx-auto flex h-full max-w-xl flex-col justify-center gap-10 overflow-y-auto px-6 py-8 ato-${atoMenu} menu-raiz`}>
      {fundo}
      <header className="text-center">
        <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center" aria-hidden>
          {[0, 1, 2].map((k) => (
            <motion.span
              key={k}
              className="absolute h-full w-full rounded-full border border-lanterna/50"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: [0.4, 1.9], opacity: [0.7, 0] }}
              transition={{ duration: 4, repeat: Infinity, delay: k * 1.3, ease: "easeOut" }}
            />
          ))}
          <motion.div
            className="orbe-menu h-14 w-14 rounded-full bg-gradient-to-b from-espuma to-lanterna shadow-[0_0_70px_26px_rgba(255,191,0,0.45)]"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [1, 1.1, 1], opacity: [0.9, 1, 0.9] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        <h1 className="menu-titulo font-narrativa text-5xl font-semibold leading-tight sm:text-6xl" aria-label="Lanterna Submersa">
          {palavras.map((pal, wi) => (
            <span key={pal} className="block" aria-hidden>
              {pal.split("").map((ch, k) => (
                <motion.span
                  key={k}
                  className="titulo-brilho inline-block"
                  initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ delay: 0.3 + wi * 0.5 + k * 0.06, duration: 0.8, ease: "easeOut" }}
                >
                  {ch}
                </motion.span>
              ))}
            </span>
          ))}
        </h1>
        <p className="mt-3 text-sm uppercase tracking-[0.3em] text-espuma/60">{subtitulos[atoMenu]}</p>
        <motion.p
          className="menu-frase mt-5 font-narrativa text-lg italic text-espuma"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6, duration: 1.2 }}
        >
          A cidade afundou, mas uma luz ainda responde ao seu passo.
        </motion.p>
        {(totalEstrelas > 0 || finaisVistos.length > 0) && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }} className="mt-3 flex items-center justify-center gap-3 text-sm text-espuma/70">
            <span className="flex items-center gap-1"><Trophy size={14} aria-hidden /> {totalEstrelas}/{todasFases.length * 3}</span>
            <span>Finais {finaisVistos.length}/4</span>
          </motion.p>
        )}
      </header>

      <motion.nav
        className="flex flex-col gap-3" aria-label="Menu principal"
        initial="oculto" animate="visivel"
        variants={{ visivel: { transition: { delayChildren: 1.9, staggerChildren: 0.12 } } }}
      >
        {proxima ? (
          <motion.button
            variants={{ oculto: { opacity: 0, y: 18 }, visivel: { opacity: 1, y: 0 } }}
            whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.02 }}
            onClick={() => start(proxima.id)}
            className="botao-pulso flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-lanterna to-[#e3b36a] px-5 py-4 font-narrativa text-xl text-abismo"
          >
            <Play size={20} aria-hidden /> {completed.length ? "Continuar" : "Começar"}: {proxima.titulo}
          </motion.button>
        ) : (
          <motion.p variants={{ oculto: { opacity: 0 }, visivel: { opacity: 1 } }} className="text-center font-narrativa text-alga">
            Você completou a jornada. Refine suas estrelas no mapa.
          </motion.p>
        )}
        <motion.button
          variants={{ oculto: { opacity: 0, y: 18 }, visivel: { opacity: 1, y: 0 } }}
          whileTap={{ scale: 0.97 }} onClick={() => setTela("fases")}
          className="rounded-2xl border border-lanterna/70 bg-abismo/40 px-5 py-3 text-lanterna backdrop-blur-md transition-colors hover:bg-lanterna/10"
        >
          Mapa da cidade
        </motion.button>
        {completed.includes("abismo") && (
          <motion.button
            variants={{ oculto: { opacity: 0, y: 18 }, visivel: { opacity: 1, y: 0 } }}
            whileTap={{ scale: 0.97 }} onClick={startInfinito}
            className="flex items-center justify-center gap-2 rounded-2xl border border-coral/70 bg-coral/10 px-5 py-3 text-coral backdrop-blur-md transition-colors hover:bg-coral/20"
          >
            <InfinityIcon size={18} aria-hidden /> Maré Infinita{recordeInfinito ? ` · recorde ${recordeInfinito}s` : ""}
          </motion.button>
        )}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { t: "Galeria", I: Award, f: () => setTela("galeria") },
            { t: "Diário", I: BookOpen, f: () => setTela("diario") },
            { t: "Abertura", I: Film, f: () => aoRever("cais") },
            { t: "Ajustes", I: Settings2, f: () => setTela("ajustes") },
          ].map(({ t, I, f }) => (
            <motion.button
              key={t}
              variants={{ oculto: { opacity: 0, y: 18 }, visivel: { opacity: 1, y: 0 } }}
              whileTap={{ scale: 0.97 }} onClick={f}
              className="flex items-center justify-center gap-1.5 rounded-2xl border border-espuma/20 bg-abismo/40 px-2 py-3 text-sm text-espuma/85 backdrop-blur-md transition-colors hover:border-espuma/50"
            >
              <I size={16} aria-hidden /> {t}
            </motion.button>
          ))}
        </div>
      </motion.nav>
    </main>
  );
}
