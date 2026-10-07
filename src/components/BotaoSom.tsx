import { useState } from "react";
import { audio } from "../game/audio";

export default function BotaoSom() {
  const [mudo, setMudo] = useState(audio.estaMudo());
  return (
    <button
      onClick={() => setMudo(audio.alternarMudo())}
      aria-pressed={mudo}
      className="fixed right-3 z-10 rounded-md border border-mare bg-abismo/80 px-3 py-1 text-sm text-espuma/80 min-h-0"
      style={{ top: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}
    >
      {mudo ? "Som desligado" : "Som ligado"}
    </button>
  );
}
