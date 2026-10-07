import { Howler } from "howler";

export type TemaMusical = "menu" | "cais" | "biblioteca" | "jardins" | "armazem" | "recife" | "oficina" | "catedral" | "sinos" | "observatorio" | "abismo" | "coracao" | "infinito";

type Tema = {
  raiz: number;            // frequência base em Hz
  escala: number[];        // semitons para as notas de sino
  acordes: number[][];     // acordes do pad, em semitons
  passo: [number, number]; // intervalo (s) entre sinos
  onda: OscillatorType;
  filtro: number;          // brilho do pad
  pulso?: "coracao" | "corrente" | "forja" | "badalo" | "gotejo" | "sonar";
  grave?: boolean;         // drone sub-grave
};

const temas: Record<TemaMusical, Tema> = {
  menu:       { raiz: 196,   escala: [0, 3, 5, 7, 10, 12, 15], acordes: [[0, 7, 15], [-2, 5, 12], [-4, 3, 10], [-5, 2, 7]], passo: [2, 4.5], onda: "triangle", filtro: 800 },
  cais:       { raiz: 174.6, escala: [0, 2, 4, 7, 9, 12, 14],  acordes: [[0, 7, 16], [-3, 4, 12], [-5, 2, 9], [-7, 0, 7]], passo: [2.5, 5], onda: "sine", filtro: 900 },
  biblioteca: { raiz: 164.8, escala: [0, 2, 3, 5, 7, 9, 10, 12], acordes: [[0, 7, 14], [-2, 5, 12], [3, 10, 15], [-4, 3, 10]], passo: [2, 4], onda: "triangle", filtro: 650 },
  jardins:    { raiz: 185,   escala: [0, 1, 5, 7, 8, 12],      acordes: [[0, 7, 13], [-2, 5, 11], [-4, 3, 8], [-6, 1, 7]], passo: [3, 6], onda: "sine", filtro: 520, grave: true },
  armazem:    { raiz: 138.6, escala: [0, 2, 3, 7, 8, 12],      acordes: [[0, 7, 15], [-2, 5, 12], [-4, 3, 10], [-5, 2, 8]], passo: [2.5, 5], onda: "triangle", filtro: 760, pulso: "gotejo" },
  observatorio: { raiz: 220, escala: [0, 2, 7, 9, 14, 16],     acordes: [[0, 7, 14], [-3, 4, 9], [-5, 2, 9], [-7, 0, 7]], passo: [1.5, 3.5], onda: "sine", filtro: 1300, pulso: "sonar" },
  recife:     { raiz: 220,   escala: [0, 2, 4, 6, 7, 9, 11, 12], acordes: [[0, 7, 16], [2, 9, 18], [-3, 4, 11], [-5, 2, 9]], passo: [1.5, 3.5], onda: "triangle", filtro: 950 },
  oficina:    { raiz: 155.6, escala: [0, 2, 4, 7, 9, 12],      acordes: [[0, 7, 16], [-2, 5, 14], [-5, 4, 12], [-7, 0, 7]], passo: [2, 4.5], onda: "triangle", filtro: 850, pulso: "forja" },
  sinos:      { raiz: 196,   escala: [0, 4, 7, 9, 12, 16],     acordes: [[0, 7, 12, 16], [-3, 4, 9], [-5, 2, 7, 11], [-7, 0, 5]], passo: [2.4, 5], onda: "sine", filtro: 1100, pulso: "badalo", grave: true },
  catedral:   { raiz: 130.8, escala: [0, 2, 4, 7, 9, 12, 16],  acordes: [[0, 7, 12, 16], [-5, 2, 7, 11], [-3, 4, 9, 12], [-7, 0, 5, 9]], passo: [3, 6], onda: "sine", filtro: 700, grave: true },
  abismo:     { raiz: 110,   escala: [0, 3, 5, 7, 8, 12],      acordes: [[0, 7, 12], [-2, 5, 10], [-4, 3, 8], [-5, 2, 7]], passo: [1, 2.5], onda: "sawtooth", filtro: 380, pulso: "corrente", grave: true },
  coracao:    { raiz: 146.8, escala: [0, 2, 4, 7, 9, 12, 14, 16], acordes: [[0, 7, 16], [-3, 4, 12], [-5, 2, 9], [-7, 0, 7]], passo: [1.8, 3.6], onda: "triangle", filtro: 1000, pulso: "coracao", grave: true },
  infinito:   { raiz: 110,   escala: [0, 3, 5, 7, 8, 12],      acordes: [[0, 7, 12], [-2, 5, 10], [-4, 3, 8], [-5, 2, 7]], passo: [0.6, 1.5], onda: "sawtooth", filtro: 450, pulso: "corrente", grave: true },
};

const KEY = "lanterna-submersa:musica";
const hz = (raiz: number, semis: number) => raiz * 2 ** (semis / 12);
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

function lerAtiva(): boolean {
  try { return localStorage.getItem(KEY) !== "0"; } catch { return true; }
}

let ativa = lerAtiva();
let ligado = false;            // só depois do primeiro gesto do jogador
let alvo: TemaMusical = "menu";
let atual: { tema: TemaMusical; parar: () => void } | null = null;

function iniciarTema(nome: TemaMusical) {
  const ctx = Howler.ctx;
  const destino: AudioNode | undefined = Howler.masterGain ?? ctx?.destination;
  if (!ctx || !destino) return null;
  const t = temas[nome];
  const timers: number[] = [];
  const fontes: OscillatorNode[] = [];
  let vivo = true;

  const saida = ctx.createGain();
  saida.gain.value = 0;
  saida.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 2.5);
  saida.connect(destino);

  // eco que faz as notas ecoarem como numa caverna
  const atraso = ctx.createDelay(1.5);
  atraso.delayTime.value = 0.42;
  const fb = ctx.createGain(); fb.gain.value = 0.4;
  const molhado = ctx.createGain(); molhado.gain.value = 0.5;
  atraso.connect(fb); fb.connect(atraso); atraso.connect(molhado); molhado.connect(saida);

  // pad: acordes longos filtrados, que "respiram"
  const filtro = ctx.createBiquadFilter();
  filtro.type = "lowpass"; filtro.frequency.value = t.filtro;
  filtro.connect(saida);
  const acorde0 = t.acordes[0];
  const vozes = acorde0.map((s) => {
    const o = ctx.createOscillator();
    o.type = t.onda; o.frequency.value = hz(t.raiz, s); o.detune.value = rnd(-7, 7);
    const g = ctx.createGain(); g.gain.value = t.onda === "sawtooth" ? 0.035 : 0.07;
    o.connect(g); g.connect(filtro); o.start();
    fontes.push(o);
    return o;
  });
  const lfo = ctx.createOscillator();
  lfo.frequency.value = t.pulso === "corrente" ? 0.35 : 0.08;
  const lg = ctx.createGain(); lg.gain.value = t.pulso === "corrente" ? t.filtro * 0.7 : t.filtro * 0.3;
  lfo.connect(lg); lg.connect(filtro.frequency); lfo.start();
  fontes.push(lfo);

  if (t.grave) {
    const sub = ctx.createOscillator();
    sub.type = "sine"; sub.frequency.value = t.raiz / 2;
    const sg = ctx.createGain(); sg.gain.value = 0.1;
    sub.connect(sg); sg.connect(saida); sub.start();
    fontes.push(sub);
  }

  // troca de acorde a cada poucos segundos, com glissando suave
  let idx = 0;
  const mudar = () => {
    if (!vivo) return;
    idx = (idx + 1) % t.acordes.length;
    const ac = t.acordes[idx];
    vozes.forEach((o, i) => o.frequency.setTargetAtTime(hz(t.raiz, ac[i % ac.length]), ctx.currentTime, 1.6));
    timers.push(window.setTimeout(mudar, t.pulso === "corrente" ? 6000 : 9000));
  };
  timers.push(window.setTimeout(mudar, 7000));

  const sino = (f: number) => {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine"; o.frequency.value = f;
    o2.type = "sine"; o2.frequency.value = f * 2.76;
    const g2 = ctx.createGain(); g2.gain.value = 0.25;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.6);
    o.connect(g); o2.connect(g2); g2.connect(g);
    g.connect(saida); g.connect(atraso);
    o.start(); o2.start(); o.stop(ctx.currentTime + 2.7); o2.stop(ctx.currentTime + 2.7);
  };
  const notas = () => {
    if (!vivo) return;
    const s = t.escala[Math.floor(Math.random() * t.escala.length)];
    sino(hz(t.raiz * 2, s + (Math.random() < 0.25 ? 12 : 0)));
    timers.push(window.setTimeout(notas, rnd(t.passo[0], t.passo[1]) * 1000));
  };
  timers.push(window.setTimeout(notas, 1200));

  // batimento de coração (Coração da Lanterna)
  if (t.pulso === "coracao") {
    const batida = (atrasoS: number) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      const t0 = ctx.currentTime + atrasoS;
      o.type = "sine";
      o.frequency.setValueAtTime(95, t0);
      o.frequency.exponentialRampToValueAtTime(45, t0 + 0.15);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.5, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.35);
      o.connect(g); g.connect(saida); o.start(t0); o.stop(t0 + 0.4);
    };
    const bater = () => { if (!vivo) return; batida(0); batida(0.24); timers.push(window.setTimeout(bater, 1250)); };
    bater();
  }

  // Oficina: tinidos de martelo no ferro, em compasso de três, com eco
  if (t.pulso === "forja") {
    const tinido = (atrasoS: number, f: number, vol: number) => {
      const t0 = ctx.currentTime + atrasoS;
      [1, 2.4, 5.1].forEach((m, k) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "sine"; o.frequency.value = f * m;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(vol / (k + 1), t0 + 0.004);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.6 / (k + 1) + 0.1);
        o.connect(g); g.connect(saida); g.connect(atraso);
        o.start(t0); o.stop(t0 + 0.9);
      });
    };
    const martelar = () => {
      if (!vivo) return;
      tinido(0, 880, 0.07); tinido(0.45, 1320, 0.04); tinido(0.9, 880, 0.06);
      timers.push(window.setTimeout(martelar, 3600));
    };
    timers.push(window.setTimeout(martelar, 1500));
  }

  // Armazém: gotas pingando de um teto de pedra, cada uma num tom
  if (t.pulso === "gotejo") {
    const gota = () => {
      if (!vivo) return;
      const t0 = ctx.currentTime, f = rnd(520, 1100);
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(f, t0);
      o.frequency.exponentialRampToValueAtTime(f * 0.55, t0 + 0.14);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.09, t0 + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2);
      o.connect(g); g.connect(saida); g.connect(atraso);
      o.start(t0); o.stop(t0 + 0.3);
      timers.push(window.setTimeout(gota, rnd(900, 2800)));
    };
    timers.push(window.setTimeout(gota, 1200));
  }

  // Observatório: ping de sonar e o retorno fraco, vindo de longe
  if (t.pulso === "sonar") {
    const ping = (atrasoS: number, f: number, vol: number) => {
      const t0 = ctx.currentTime + atrasoS;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.4);
      o.connect(g); g.connect(saida); g.connect(atraso);
      o.start(t0); o.stop(t0 + 1.5);
    };
    const emitir = () => {
      if (!vivo) return;
      ping(0, 1320, 0.07); ping(0.9, 990, 0.025);
      timers.push(window.setTimeout(emitir, 5200));
    };
    timers.push(window.setTimeout(emitir, 2000));
  }

  // Sala dos Sinos: badalada grave e distante, com cauda longa
  if (t.pulso === "badalo") {
    const toque = () => {
      if (!vivo) return;
      const t0 = ctx.currentTime;
      [[1, 0.22, 5], [2, 0.1, 3.5], [2.76, 0.09, 2.8], [5.4, 0.04, 1.5]].forEach(([m, v, d]) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "sine"; o.frequency.value = (t.raiz / 2) * m;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(v, t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
        o.connect(g); g.connect(saida); g.connect(atraso);
        o.start(t0); o.stop(t0 + d + 0.1);
      });
      timers.push(window.setTimeout(toque, rnd(6500, 9500)));
    };
    timers.push(window.setTimeout(toque, 2500));
  }

  return {
    tema: nome,
    parar() {
      vivo = false;
      timers.forEach((id) => clearTimeout(id));
      saida.gain.cancelScheduledValues(ctx.currentTime);
      saida.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
      window.setTimeout(() => {
        fontes.forEach((o) => { try { o.stop(); } catch { /* já parado */ } });
        saida.disconnect();
      }, 2200);
    },
  };
}

function aplicar() {
  if (!ligado || !ativa) { atual?.parar(); atual = null; return; }
  if (atual?.tema === alvo) return;
  atual?.parar();
  atual = iniciarTema(alvo);
}

export const musica = {
  /** Chamado no primeiro gesto do jogador (navegadores bloqueiam áudio antes disso). */
  iniciar() { ligado = true; aplicar(); },
  tocar(tema: TemaMusical) { alvo = tema; aplicar(); },
  estaAtiva: () => ativa,
  definirAtiva(v: boolean) {
    ativa = v;
    try { localStorage.setItem(KEY, v ? "1" : "0"); } catch { /* sem armazenamento */ }
    aplicar();
  },
};
