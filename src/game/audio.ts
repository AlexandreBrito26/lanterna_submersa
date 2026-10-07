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
    // Oficina: martelada no ferro (batida grave + tinido metálico)
    martelo: () => { tom(180, 0.22, "sine", 0.45, 0, 60); tom(1100, 0.3, "square", 0.07, 0, 700); tom(2650, 0.45, "sine", 0.1); tom(4100, 0.25, "sine", 0.05); },
    // Oficina: peça que entra no lugar
    encaixe: () => { tom(1400, 0.05, "square", 0.08); tom(520, 0.14, "triangle", 0.18, 0.04); },
    // Oficina: chama que pega, sopro subindo
    chama: () => { tom(90, 0.75, "sawtooth", 0.07, 0, 520); tom(180, 0.9, "triangle", 0.1, 0.1, 360); },
    // Oficina: luz que falha
    falha: () => { tom(400, 0.5, "sawtooth", 0.1, 0, 90); tom(260, 0.4, "square", 0.05, 0.05, 70); },
    // Oficina: lente pronta, acorde de vidro
    lente: () => [392, 587.33, 783.99, 1174.66].forEach((f, i) => tom(f, 1.2, "triangle", 0.14, i * 0.12)),
    // Armazém: pedra pesada pousando no prato, e a balança que se acomoda
    peso: () => { tom(110, 0.22, "sine", 0.42, 0, 55); tom(330, 0.08, "square", 0.05); },
    balanca: () => { tom(520, 0.3, "sawtooth", 0.04, 0, 380); tom(170, 0.4, "triangle", 0.06, 0.05, 120); },
    ordemCerta: () => [523.25, 659.25, 783.99].forEach((f, i) => tom(f, 1, "triangle", 0.14, i * 0.1)),
    // Observatório: estalo de engrenagem, ping de sonar e constelação acesa
    anel: () => { tom(700, 0.04, "square", 0.06); tom(350, 0.1, "triangle", 0.12, 0.02); },
    sonar: () => { tom(1320, 1.1, "sine", 0.16); tom(990, 0.9, "sine", 0.05, 0.5); },
    constelacao: () => [784, 987.77, 1174.66, 1568].forEach((f, i) => tom(f, 1.5, "sine", 0.12, i * 0.14)),
    // Sinos: afinação certa e errada (dois tons batendo um no outro)
    afinado: () => [659.25, 987.77, 1318.5].forEach((f, i) => tom(f, 1.3, "sine", 0.15, i * 0.1)),
    desafina: () => { tom(300, 0.8, "sine", 0.18); tom(319, 0.8, "sine", 0.18); },
  },
  // Sino de verdade: parciais inarmônicas, ataque seco e cauda longa
  sino(freq: number) {
    [[1, 0.28, 2.8], [2, 0.14, 1.9], [2.76, 0.12, 1.3], [4.07, 0.07, 0.8], [5.4, 0.05, 0.5]].forEach(([m, v, d]) => tom(freq * m, d, "sine", v));
  },
  // Tom puro e longo, para comparar de ouvido
  puro(freq: number, dur = 1.2) { tom(freq, dur, "sine", 0.22); },
  // Oscilador contínuo para afinar: a frequência acompanha o controle
  afinador() {
    const ctx = Howler.ctx;
    const destino: AudioNode | undefined = Howler.masterGain ?? ctx?.destination;
    if (!ctx || !destino) return { definir: (_f: number) => {}, silenciar: () => {}, parar: () => {} };
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine"; o.frequency.value = 300; g.gain.value = 0.0001;
    o.connect(g); g.connect(destino); o.start();
    let vivo = true;
    return {
      definir(f: number) {
        if (!vivo) return;
        o.frequency.setTargetAtTime(f, ctx.currentTime, 0.02);
        g.gain.setTargetAtTime(0.22, ctx.currentTime, 0.03);
      },
      silenciar() { if (vivo) g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.06); },
      parar() {
        if (!vivo) return;
        vivo = false;
        g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.03);
        window.setTimeout(() => { try { o.stop(); } catch { /* já parado */ } o.disconnect(); g.disconnect(); }, 300);
      },
    };
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
