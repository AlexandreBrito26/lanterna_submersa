import { Howl, Howler } from "howler";
import { musica } from "./musica";

const KEY = "lanterna-submersa:mudo";

function lerMudo(): boolean {
  try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
}

const som = (arquivo: string, volume = 0.6, loop = false) =>
  new Howl({ src: [`/audio/${arquivo}.wav`], volume, loop });

const ambiente = som("ambiente", 0.18, true);
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

// Tom sintetizado simples, com envelope exponencial
function tom(freq: number, dur: number, tipo: OscillatorType, vol: number, atraso = 0, ate?: number) {
  const ctx = Howler.ctx;
  const destino: AudioNode | undefined = Howler.masterGain ?? ctx?.destination;
  if (!ctx || !destino) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  const t0 = ctx.currentTime + atraso;
  o.type = tipo;
  o.frequency.setValueAtTime(freq, t0);
  if (ate) o.frequency.exponentialRampToValueAtTime(ate, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(destino);
  o.start(t0); o.stop(t0 + dur + 0.05);
}

export const audio = {
  // Navegadores só liberam áudio após um gesto do jogador
  iniciar() { if (!ambiente.playing()) ambiente.play(); musica.iniciar(); },
  sfx: {
    coletar: () => efeitos.coletar.play(),
    interagir: () => efeitos.interagir.play(),
    pista: () => efeitos.pista.play(),
    porta: () => efeitos.porta.play(),
    erro: () => efeitos.erro.play(),
    vitoria: () => efeitos.vitoria.play(),
    // Arpejo brilhante de medalha
    conquista: () => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tom(f, 0.9, "sine", 0.18, i * 0.09)),
    // Pancada de casco: grave seco e ruído curto
    pancada: () => { tom(140, 0.28, "sine", 0.5, 0, 45); tom(90, 0.2, "sawtooth", 0.12, 0, 40); },
    // Bolha estourando
    bolha: () => { tom(420, 0.12, "sine", 0.2, 0, 900); tom(640, 0.1, "sine", 0.12, 0.05, 1100); },
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
