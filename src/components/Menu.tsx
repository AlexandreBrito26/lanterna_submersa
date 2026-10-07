import { useState } from "react";
import { motion } from "framer-motion";
import { phases } from "../phases/data";
import { useGame } from "../store/useGame";
import { cutscenes, type CenaId } from "../game/cutscenes";
import { niveis, useDificuldade, type Nivel } from "../game/dificuldade";

const nomesFinais: Record<string, string> = {
  apagar: "Descanso no escuro",
  acender: "A luz na superfície",
  guardar: "O novo guardião",
};

export default function Menu({ aoRever }: { aoRever: (id: CenaId) => void }) {
  const { completed, inventory, start, reset } = useGame();
  const { nivel, definir } = useDificuldade();
  const [tela, setTela] = useState<"titulo" | "fases">("titulo");

  const liberada = (i: number) => phases[i].pronta && (i === 0 || completed.includes(phases[i - 1].id));
  const proxima = phases.find((_, i) => liberada(i) && !completed.includes(phases[i].id));
  const final = inventory.find((x) => x.startsWith("final:"))?.slice(6);

  if (tela === "fases") {
    return (
      <main className="mx-auto flex h-full max-w-xl flex-col gap-5 overflow-y-auto px-6 py-10">
        <header className="flex items-center justify-between">
          <h1 className="font-narrativa text-3xl text-lanterna">Escolher fase</h1>
          <button onClick={() => setTela("titulo")} className="text-sm text-espuma/70 underline">Voltar</button>
        </header>

        <ul className="flex flex-col gap-3">
          {phases.map((p, i) => {
            const feita = completed.includes(p.id);
            const aberta = liberada(i);
            return (
              <motion.li key={p.id} whileTap={aberta ? { scale: 0.98 } : undefined}>
                <button
                  disabled={!aberta}
                  onClick={() => start(p.id)}
                  className="w-full rounded-lg border border-mare bg-mare/40 p-4 text-left transition-colors enabled:hover:border-lanterna disabled:opacity-50"
                >
                  <span className="text-sm text-espuma/60">Fase {i + 1}</span>
                  <span className="block font-narrativa text-xl">{p.titulo}</span>
                  <span className="mt-1 block text-sm text-espuma/70">{p.resumo}</span>
                  <span className={`mt-2 block text-sm ${feita ? "text-alga" : "text-espuma/60"}`}>
                    {feita ? "Concluída. Toque para jogar de novo" : aberta ? "Liberada" : `Bloqueada: conclua ${phases[i - 1]?.titulo}`}
                  </span>
                </button>
                {p.id in cutscenes && inventory.includes(`cutscene:${p.id}`) && (
                  <button onClick={() => aoRever(p.id as CenaId)} className="mt-1 text-sm text-espuma/60 underline">
                    Rever história
                  </button>
                )}
              </motion.li>
            );
          })}
        </ul>
      </main>
    );
  }

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-6 overflow-y-auto px-6 py-10">
      <header>
        <h1 className="font-narrativa text-5xl font-semibold text-lanterna">Lanterna Submersa</h1>
        <p className="mt-3 font-narrativa text-lg italic text-espuma/80">
          A cidade afundou, mas uma luz ainda responde ao seu passo.
        </p>
      </header>

      {final && <p className="font-narrativa text-alga">Final alcançado: {nomesFinais[final]}</p>}

      <div className="flex flex-col gap-3">
        {proxima && (
          <button
            onClick={() => start(proxima.id)}
            className="rounded-lg bg-lanterna px-5 py-3 font-narrativa text-xl text-abismo"
          >
            {completed.length ? "Continuar" : "Começar"}: {proxima.titulo}
          </button>
        )}
        <button onClick={() => setTela("fases")} className="rounded-lg border border-lanterna px-5 py-3 text-lanterna">
          Escolher fase
        </button>
        <button onClick={() => aoRever("cais")} className="rounded-lg border border-mare px-5 py-3 text-espuma/80">
          Rever a abertura da história
        </button>
      </div>

      <section aria-label="Dificuldade" className="flex flex-col gap-2">
        <h2 className="font-narrativa text-lg">Dificuldade</h2>
        <div className="flex gap-2">
          {(Object.keys(niveis) as Nivel[]).map((n) => (
            <button
              key={n}
              onClick={() => definir(n)}
              aria-pressed={nivel === n}
              className={`flex-1 rounded-lg border px-3 py-2 ${nivel === n ? "border-lanterna text-lanterna" : "border-mare text-espuma/70"}`}
            >
              {niveis[n].nome}
            </button>
          ))}
        </div>
        <p className="text-sm text-espuma/60">Vale a partir da próxima vez que você entrar numa fase.</p>
      </section>

      <button onClick={reset} className="self-start text-sm text-espuma/60 underline">
        Apagar progresso
      </button>
    </main>
  );
}
