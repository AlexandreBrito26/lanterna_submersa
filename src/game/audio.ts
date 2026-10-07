import { Howl, Howler } from "howler";

const KEY = "lanterna-submersa:mudo";

function lerMudo(): boolean {
  try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
}

const som = (arquivo: string, volume = 0.6, loop = false) =>
  new Howl({ src: [`/audio/${arquivo}.wav`], volume, loop });

const ambiente = som("ambiente", 0.35, true);
const efeitos = {
  coletar: som("coletar"),
  interagir: som("interagir", 0.5),
  pista: som("pista"),
  porta: som("porta"),
  erro: som("erro", 0.5),
  vitoria: som("vitoria"),
};

let mudo = lerMudo();
Howler.mute(mudo);

// Pausa o áudio quando o jogador troca de app ou bloqueia a tela
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    const ctx = Howler.ctx;
    if (!ctx) return;
    if (document.hidden) void ctx.suspend(); else void ctx.resume();
  });
}

export const audio = {
  // Navegadores só liberam áudio após um gesto do jogador
  iniciar() { if (!ambiente.playing()) ambiente.play(); },
  sfx: {
    coletar: () => efeitos.coletar.play(),
    interagir: () => efeitos.interagir.play(),
    pista: () => efeitos.pista.play(),
    porta: () => efeitos.porta.play(),
    erro: () => efeitos.erro.play(),
    vitoria: () => efeitos.vitoria.play(),
  },
  // Nota curta sintetizada, usada no duelo do chefe
  nota(freq: number) {
    const ctx = Howler.ctx;
    if (mudo || !ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.25, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.5);
  },
  estaMudo: () => mudo,
  alternarMudo() {
    mudo = !mudo;
    Howler.mute(mudo);
    try { localStorage.setItem(KEY, mudo ? "1" : "0"); } catch { /* sem armazenamento */ }
    return mudo;
  },
};
