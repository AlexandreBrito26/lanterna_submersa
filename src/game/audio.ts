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

// Ruído filtrado que varre de uma frequência a outra: água, sopro, comporta rangendo
function ruido(dur: number, de: number, ate: number, vol: number, atraso = 0) {
  const ctx = Howler.ctx;
  const destino: AudioNode | undefined = Howler.masterGain ?? ctx?.destination;
  if (!ctx || !destino) return;
  const n = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  const t0 = ctx.currentTime + atraso;
  src.buffer = buf;
  f.type = "bandpass"; f.Q.value = 1.2;
  f.frequency.setValueAtTime(de, t0);
  f.frequency.exponentialRampToValueAtTime(ate, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + Math.min(0.06, dur / 3));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f); f.connect(g); g.connect(destino);
  src.start(t0); src.stop(t0 + dur + 0.05);
}

// Pulso de lâmpada: tom firme do começo ao fim (diferente de `tom`, que decai)
function bipe(dur: number, freq = 620) {
  const ctx = Howler.ctx;
  const destino: AudioNode | undefined = Howler.masterGain ?? ctx?.destination;
  if (!ctx || !destino) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  const t0 = ctx.currentTime;
  o.type = "sine"; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(0.2, t0 + 0.012);
  g.gain.setValueAtTime(0.2, t0 + Math.max(0.02, dur - 0.03));
  g.gain.linearRampToValueAtTime(0.0001, t0 + dur);
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
    // Eclusa: câmara escolhida, água despejada (mais longa quanto mais água) e comporta que se abre
    escolher: () => tom(480, 0.07, "triangle", 0.1, 0, 640),
    verter: (q: number) => {
      const dur = 0.35 + Math.min(q, 12) * 0.05;
      ruido(dur, 500, 1500, 0.22);
      tom(220, 0.12, "sine", 0.1, 0.04, 380);
      tom(300, 0.1, "sine", 0.08, dur * 0.6, 520);
    },
    comporta: () => { ruido(1.5, 320, 80, 0.2); tom(80, 1.3, "sawtooth", 0.05, 0, 42); tom(262, 0.9, "triangle", 0.1, 0.5); tom(392, 0.9, "triangle", 0.1, 0.62); },
    // Torre: sinal respondido, e o chamado final que sobe
    sinalOk: () => { tom(660, 0.3, "triangle", 0.14); tom(880, 0.5, "triangle", 0.14, 0.14); },
    chamado: () => [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tom(f, 1.4, "sine", 0.12, i * 0.16)),
    // Espelhos: o tom sobe a cada espelho que o feixe atravessa; lente acesa fecha com um brilho de prata
    espelho: (n: number) => { tom(1800, 0.03, "square", 0.05); const f = 520 * 1.1225 ** Math.min(n, 9); tom(f, 0.4, "sine", 0.14); tom(f * 2.76, 0.22, "sine", 0.04); },
    lenteAcesa: () => [659.25, 830.61, 987.77, 1318.5, 1661.2].forEach((f, i) => { tom(f, 1.3, "sine", 0.11, i * 0.09); tom(f * 2.01, 0.6, "sine", 0.03, i * 0.09); }),
    // Porão: passo abafado, caixa arrastando na madeira e caixa que encaixa na marca
    passo: () => tom(140, 0.06, "triangle", 0.05, 0, 95),
    empurrar: () => { ruido(0.22, 320, 110, 0.22); tom(90, 0.14, "sine", 0.3, 0, 50); },
    caixaNoLugar: () => { tom(520, 0.12, "triangle", 0.15); tom(780, 0.55, "sine", 0.12, 0.08); },
    estivaOk: () => { ruido(1.2, 260, 70, 0.16); [196, 293.66, 392].forEach((f, i) => tom(f, 1.2, "triangle", 0.12, 0.3 + i * 0.12)); },
    ordemCerta: () => [523.25, 659.25, 783.99].forEach((f, i) => tom(f, 1, "triangle", 0.14, i * 0.1)),
    // Observatório: estalo de engrenagem, ping de sonar e constelação acesa
    anel: () => { tom(700, 0.04, "square", 0.06); tom(350, 0.1, "triangle", 0.12, 0.02); },
    sonar: () => { tom(1320, 1.1, "sine", 0.16); tom(990, 0.9, "sine", 0.05, 0.5); },
    constelacao: () => [784, 987.77, 1174.66, 1568].forEach((f, i) => tom(f, 1.5, "sine", 0.12, i * 0.14)),
    // Sinos: afinação certa e errada (dois tons batendo um no outro)
    afinado: () => [659.25, 987.77, 1318.5].forEach((f, i) => tom(f, 1.3, "sine", 0.15, i * 0.1)),
    desafina: () => { tom(300, 0.8, "sine", 0.18); tom(319, 0.8, "sine", 0.18); },
    // Manguezal: lodo que puxa, água que fecha sobre a marca e boia que acende
    lama: {
      deslizar: () => ruido(0.45, 900, 260, 0.14),
      afunda: () => { ruido(0.7, 700, 180, 0.2); tom(160, 0.6, "sine", 0.12, 0, 70); },
      bater: () => tom(150, 0.16, "sine", 0.35, 0, 60),
      boia: () => [392, 523.25, 659.25, 784].forEach((f, i) => tom(f, 0.9, "triangle", 0.12, i * 0.1)),
    },
    // Teatro: lâmpada que acende e apaga, feixe de luz e figura completa
    luz: {
      acender: () => { tom(1200, 0.05, "square", 0.06); tom(440, 0.25, "triangle", 0.14, 0.02, 880); },
      apagar: () => tom(660, 0.2, "triangle", 0.12, 0, 220),
      feixe: () => ruido(0.4, 800, 2400, 0.07),
      figura: () => [293.66, 369.99, 440, 587.33].forEach((f, i) => tom(f, 1.5, "sine", 0.12, i * 0.11)),
    },
    // Casa das Bombas: válvula que range, bomba que ganha pressão, tubulação cheia e falha seca
    bomba: {
      valvula: () => { ruido(0.12, 1800, 700, 0.12); tom(260, 0.12, "square", 0.08, 0, 150); },
      ligar: () => { ruido(0.9, 300, 900, 0.1); tom(90, 0.8, "sawtooth", 0.05, 0, 180); },
      cheia: () => { ruido(1.6, 500, 2400, 0.14); [261.63, 329.63, 392, 523.25].forEach((f, i) => tom(f, 1.4, "triangle", 0.1, 0.2 + i * 0.1)); },
      falha: () => tom(180, 0.25, "square", 0.08, 0, 90),
    },
    // Rede do porto: fio que tece, fio que desfaz, laço que fecha e nó que falha
    rede: {
      tecer: () => tom(520, 0.05, "triangle", 0.09, 0, 600),
      desfazer: () => tom(340, 0.09, "triangle", 0.08, 0, 220),
      falha: () => tom(140, 0.14, "sine", 0.22, 0, 110),
      fechar: () => { ruido(0.9, 400, 1400, 0.1); [392, 523.25, 659.25].forEach((f, i) => tom(f, 1.1, "sine", 0.12, 0.1 + i * 0.12)); },
    },
    // Labirinto da maré: passo que sobe ou desce com a maré, passagem que fecha e bloqueio
    mare: {
      subir: () => tom(330, 0.12, "triangle", 0.1, 0, 520),
      descer: () => tom(520, 0.12, "triangle", 0.1, 0, 330),
      fecha: () => { ruido(0.6, 900, 200, 0.18); tom(200, 0.5, "sine", 0.1, 0, 80); },
      bloqueio: () => tom(150, 0.18, "square", 0.08, 0, 110),
      chegou: () => [392, 493.88, 587.33, 783.99].forEach((f, i) => tom(f, 1.0, "sine", 0.12, i * 0.1)),
    },
    // Vento contrário: sopro do vento, empurrão seco, batida na rocha e sino da chegada
    vento: {
      sopro: () => ruido(0.6, 300, 1400, 0.12),
      empurrao: () => { ruido(0.3, 1200, 300, 0.2); tom(220, 0.2, "sine", 0.1, 0, 120); },
      bate: () => tom(130, 0.2, "sine", 0.3, 0, 60),
      chegou: () => [880, 1108.73, 1318.5].forEach((f, i) => tom(f, 1.6, "sine", 0.12, i * 0.12)),
    },
    // Escuta do Segundo Mar: o chamado sai alto e o eco volta mais agudo quanto mais perto está o farol
    eco: {
      ping: (d: number) => {
        const f = Math.max(520, 1500 - d * 170);
        tom(f, 1.2, "sine", 0.14);
        tom(f * 1.5, 0.8, "sine", 0.05, 0.35);
      },
      achou: () => [523.25, 783.99, 1046.5, 1568].forEach((f, i) => tom(f, 1.8, "sine", 0.14, i * 0.14)),
    },
    // Cardume: nado rápido e um tique seco quando o cardume trava
    cardume: {
      nada: () => { ruido(0.25, 1800, 600, 0.08); tom(1400, 0.1, "triangle", 0.05, 0, 900); },
      parado: () => tom(220, 0.08, "triangle", 0.1),
      chegou: () => [659.25, 784, 987.77, 1318.5].forEach((f, i) => tom(f, 1.2, "triangle", 0.1, i * 0.1)),
    },
    // Coral: crescimento que borbulha, bloqueio abafado e jardim completo
    coral: {
      crescer: () => { ruido(0.5, 300, 900, 0.12); tom(180, 0.4, "sine", 0.1, 0, 320); },
      bloqueio: () => tom(140, 0.12, "sine", 0.2),
      completo: () => [392, 523.25, 659.25, 784].forEach((f, i) => { tom(f, 1.6, "sine", 0.12, i * 0.12); tom(f * 2, 0.8, "sine", 0.03, i * 0.12); }),
    },
    // Neblina: passo abafado, revelação de casa nova (tom que se abre) e pedra escondida
    neblina: {
      passo: () => tom(260, 0.08, "triangle", 0.06, 0, 200),
      revela: () => { tom(520, 0.25, "sine", 0.1, 0, 780); tom(1040, 0.3, "sine", 0.03, 0.05); },
      parede: () => { ruido(0.12, 500, 200, 0.14); tom(120, 0.12, "sine", 0.18, 0, 70); },
      achou: () => [330, 415, 494, 659].forEach((f, i) => tom(f, 1.5, "sine", 0.12, i * 0.14)),
    },
    // Portas de ferro: alavanca que puxa com rangido e portão que cede com estrondo grave
    alavancas: {
      puxar: () => { ruido(0.2, 400, 900, 0.1); tom(180, 0.15, "square", 0.1, 0, 260); },
      portao: () => { ruido(0.9, 500, 200, 0.14); tom(110, 0.8, "sine", 0.2, 0, 60); },
    },
    // Conchas gêmeas: virar a concha, par que chega ao fim com acorde e erro abafado
    memoria: {
      virar: () => tom(640, 0.07, "triangle", 0.1),
      par: () => [784, 988, 1175].forEach((f, i) => tom(f, 0.6, "triangle", 0.1, i * 0.07)),
      erro: () => tom(200, 0.2, "sine", 0.1, 0, 150),
      completo: () => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tom(f, 1.2, "sine", 0.12, i * 0.1)),
    },
    // Colar de pérolas: conta que encaixa com um clique, erro abafado e colar completo com brilho
    perolas: {
      pinta: () => { tom(1100, 0.06, "sine", 0.1); tom(1650, 0.1, "sine", 0.05, 0.02); },
      erro: () => tom(160, 0.18, "triangle", 0.1, 0, 120),
      completo: () => [659.25, 830.61, 987.77, 1318.5, 1661.2].forEach((f, i) => tom(f, 1.3, "sine", 0.1, i * 0.08)),
    },
    // Selos do cofre: selo que bate na madeira, erro com batida seca e cofre fechado com acorde
    selos: {
      colocar: () => tom(520, 0.08, "triangle", 0.1, 0, 420),
      erro: () => { tom(180, 0.14, "square", 0.08, 0, 120); ruido(0.05, 900, 300, 0.06); },
      completo: () => [392, 523.25, 659.25, 880].forEach((f, i) => tom(f, 1.4, "sine", 0.12, i * 0.1)),
    },
    // Escalada de raízes: passo que sobe um degrau com estalo, bloqueio por desnível e topo alcançado com acorde
    escalada: {
      passo: () => tom(300, 0.1, "triangle", 0.07, 0, 420),
      bloqueio: () => { tom(140, 0.18, "square", 0.08, 0, 100); ruido(0.05, 800, 300, 0.05); },
      topo: () => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tom(f, 1.4, "sine", 0.12, i * 0.12)),
    },
    // Encaixe de corais: peça que encaixa com clique de coral, erro seco e costa fechada com acorde
    peca: {
      encaixar: () => { tom(640, 0.07, "triangle", 0.1, 0, 480); tom(960, 0.1, "sine", 0.04, 0.03); },
      tirar: () => tom(360, 0.08, "triangle", 0.07, 0, 240),
      erro: () => { tom(170, 0.15, "square", 0.08, 0, 110); },
      completo: () => [392, 523.25, 659.25, 784, 1046.5].forEach((f, i) => tom(f, 1.4, "sine", 0.1, i * 0.09)),
    },
    // Sementes em linha: semente que brota com um tom de terra, erro abafado e horta florida
    sementes: {
      plantar: () => { tom(260, 0.12, "sine", 0.08, 0, 330); tom(520, 0.2, "triangle", 0.04, 0.06); },
      tirar: () => ruido(0.15, 700, 300, 0.06),
      erro: () => tom(180, 0.16, "square", 0.07, 0, 120),
      completo: () => [329.63, 392, 493.88, 659.25].forEach((f, i) => tom(f, 1.5, "sine", 0.11, i * 0.12)),
    },
    // Trilha alternada: passo com tom de cor (ciano agudo, âmbar grave), parede seca e saída com acorde
    alternado: {
      passo: (cor: string) => tom(cor === "a" ? 660 : 330, 0.1, "triangle", 0.07),
      bate: () => tom(140, 0.14, "square", 0.07, 0, 100),
      chegou: () => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tom(f, 1.4, "triangle", 0.11, i * 0.11)),
    },
    // Pontes de mangue: ponte que se estica com tábua, falha seca e costa ligada com acorde
    pontes: {
      ponte: () => { tom(320, 0.12, "triangle", 0.09, 0, 240); ruido(0.06, 900, 400, 0.05); },
      falha: () => tom(150, 0.16, "square", 0.07, 0, 110),
      completo: () => [392, 493.88, 587.33, 783.99].forEach((f, i) => tom(f, 1.5, "sine", 0.11, i * 0.12)),
    },
    // Pedras que caem: toque seco de pedra e, na cascata, uma batida grave que se repete
    dominos: {
      toque: () => { tom(520, 0.06, "square", 0.08, 0, 180); ruido(0.05, 1500, 600, 0.06); },
      cascata: () => { [0, 0.08, 0.16, 0.26].forEach((d) => tom(240 - d * 60, 0.12, "square", 0.08, d, 120)); },
    },
    // Sopa das marés: letra achada com um pingo, erro abafado e acorde da sopa completa
    palavras: {
      achou: () => { tom(880, 0.2, "sine", 0.1); tom(1320, 0.3, "sine", 0.05, 0.05); },
      erro: () => tom(170, 0.18, "triangle", 0.1, 0, 120),
      completo: () => [523.25, 659.25, 783.99, 987.77, 1174.66].forEach((f, i) => tom(f, 1.4, "sine", 0.1, i * 0.1)),
    },
    // Mar sem luz: passo que quase não se ouve, batida surda na parede e um sopro grave na saída
    silencio: {
      passo: () => tom(120, 0.05, "sine", 0.04, 0, 90),
      bate: () => { tom(110, 0.2, "sine", 0.35, 0, 60); ruido(0.08, 300, 120, 0.1); },
      achou: () => [110, 146.8, 185].forEach((f, i) => tom(f, 2.0, "sine", 0.1, i * 0.25)),
    },
    // Contagem no escuro: tique de cada casa contada, bate surda e acorde de saída encontrada
    contagem: {
      passo: () => tom(330, 0.06, "triangle", 0.07),
      bate: () => { tom(110, 0.18, "sine", 0.3, 0, 60); ruido(0.06, 300, 120, 0.08); },
      achou: () => [262, 330, 392, 523].forEach((f, i) => tom(f, 1.6, "triangle", 0.1, i * 0.12)),
    },
    // Fio do breu: passo com linha esticando, bloqueio seco do próprio fio e saída encontrada
    fio: {
      passo: () => ruido(0.12, 900, 500, 0.05),
      bate: () => tom(180, 0.12, "square", 0.08, 0, 120),
      achou: () => [330, 392, 494, 659].forEach((f, i) => tom(f, 1.5, "sine", 0.1, i * 0.14)),
    },
    // Pedra lançada: estalo de pedra cortando a água e o baque da parede revelada
    pedra: {
      atirar: () => { ruido(0.3, 1500, 400, 0.08); tom(900, 0.08, "triangle", 0.05, 0, 300); },
      bate: () => { tom(130, 0.16, "sine", 0.3, 0, 60); ruido(0.05, 400, 150, 0.08); },
      passo: () => tom(260, 0.05, "sine", 0.04, 0, 200),
      achou: () => [440, 554.37, 659.25, 880].forEach((f, i) => tom(f, 1.4, "sine", 0.1, i * 0.12)),
    },
    // Breu final: tato, pedras poucas e uma luz fraca ao fim
    breu: {
      atirar: () => { ruido(0.25, 1200, 300, 0.07); tom(700, 0.07, "triangle", 0.04, 0, 260); },
      bate: () => { tom(120, 0.18, "sine", 0.32, 0, 55); ruido(0.06, 300, 120, 0.09); },
      passo: () => tom(200, 0.05, "sine", 0.035, 0, 160),
      achou: () => [196, 246.94, 293.66, 392].forEach((f, i) => tom(f, 1.8, "sine", 0.1, i * 0.16)),
    },
    // Chama que corre: tocha que acende com estalo, sopro que espalha o fogo e a costa toda queimando
    fogo: {
      acender: () => { ruido(0.2, 1200, 400, 0.1); tom(330, 0.2, "sawtooth", 0.05, 0, 560); },
      soprar: () => { ruido(0.6, 300, 1100, 0.12); tom(180, 0.6, "sawtooth", 0.04, 0, 360); },
      completo: () => [262, 330, 392, 523].forEach((f, i) => tom(f, 1.6, "triangle", 0.12, i * 0.12)),
    },
    // Forja de pedras: brasa que acende com chiado, apagar com vapor e pedra no ponto com martelada
    forja: {
      acender: () => { ruido(0.25, 900, 2400, 0.1); tom(160, 0.3, "sawtooth", 0.05, 0, 320); },
      apagar: () => { ruido(0.4, 2500, 500, 0.12); },
      completo: () => { tom(180, 0.25, "sine", 0.4, 0, 90); [659.25, 880, 1174.66].forEach((f, i) => tom(f, 1.4, "sine", 0.1, 0.08 + i * 0.1)); },
    },
    // Lenha molhada: lenha seca que pega com estalo, chiado de lenha úmida e falha seca sem tochas
    molhada: {
      acender: () => { ruido(0.2, 1200, 400, 0.1); tom(330, 0.2, "sawtooth", 0.05, 0, 560); },
      chiar: () => { ruido(0.6, 2500, 1200, 0.14); },
      falha: () => tom(150, 0.25, "square", 0.07, 0, 90),
      completo: () => [262, 330, 392, 523].forEach((f, i) => tom(f, 1.5, "triangle", 0.12, i * 0.12)),
    },
    // Ar contado: braçada com bolha que borbulha, falha de ar sufocada e chegada à superfície
    ar: {
      passo: () => { tom(260, 0.1, "sine", 0.05, 0, 320); },
      bate: () => tom(130, 0.14, "square", 0.06, 0, 90),
      falha: () => { ruido(0.8, 600, 150, 0.12); tom(120, 0.6, "sine", 0.1, 0, 60); },
      chegou: () => [392, 523.25, 659.25, 784].forEach((f, i) => tom(f, 1.4, "sine", 0.11, i * 0.12)),
    },
    // Luar de linhas: toque que vira uma fileira com clique de vidro e porto aceso com acorde
    luar: {
      toque: () => { tom(700, 0.07, "triangle", 0.07, 0, 500); },
      completo: () => [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tom(f, 1.3, "sine", 0.11, i * 0.09)),
    },
    // Brasa viciosa: brasa que pega com estalo, fogo que se espalha e costa queimando com acorde
    viciosaFase: {
      acender: () => { ruido(0.15, 1400, 500, 0.1); tom(360, 0.15, "triangle", 0.07, 0, 520); },
      completo: () => [262, 330, 392, 523].forEach((f, i) => tom(f, 1.5, "triangle", 0.12, i * 0.12)),
    },
    // Coluna de vapor: sopro quente que sobe, passo na coluna fria e travessia concluída com acorde
    vaporFase: {
      passo: () => { ruido(0.2, 600, 1400, 0.06); tom(300, 0.1, "sine", 0.05, 0, 380); },
      bate: () => { tom(180, 0.15, "square", 0.07, 0, 110); ruido(0.1, 2000, 900, 0.07); },
      completo: () => [329.63, 415.3, 493.88, 659.25].forEach((f, i) => tom(f, 1.4, "sine", 0.11, i * 0.1)),
    },
    // Pedra aquecida: pedra que cai com baque surdo, calor que é barrado e campo salvo com acorde
    aquecidaFase: {
      pedra: () => { tom(140, 0.2, "sine", 0.3, 0, 80); ruido(0.08, 500, 180, 0.08); },
      tirar: () => ruido(0.15, 800, 300, 0.06),
      completo: () => [392, 523.25, 659.25, 783.99].forEach((f, i) => tom(f, 1.5, "sine", 0.12, i * 0.12)),
    },
    // Anel de lamparinas: giro com tinido metálico e anel encaixado com acorde
    anelFase: {
      girar: () => { tom(880, 0.06, "triangle", 0.07, 0, 1100); tom(1320, 0.05, "sine", 0.03, 0.02); },
      completo: () => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tom(f, 1.4, "sine", 0.12, i * 0.1)),
    },
    // Fósforo curto: fósforo que risca e pega, linha inteira que acende e praça iluminada
    fosforoFase: {
      riscar: () => { ruido(0.12, 3000, 1200, 0.1); tom(900, 0.1, "triangle", 0.06, 0, 500); },
      completo: () => [392, 493.88, 587.33, 783.99, 987.77].forEach((f, i) => tom(f, 1.3, "sine", 0.1, i * 0.09)),
    },
    // Tanques da chuva: água que escorre entre jarros, com gorgolejo
    tanques: { agua: () => { ruido(0.5, 900, 300, 0.08); tom(320, 0.3, "sine", 0.05, 0, 240); }, completo: () => [392, 523.25, 659.25, 783.99].forEach((f, i) => tom(f, 1.3, "sine", 0.1, i * 0.1)) },
    // Simetria do cofre: pintura com clique seco e cofre em equilíbrio com acorde
    simetria: { pintar: () => tom(600, 0.06, "triangle", 0.07, 0, 500), completo: () => [440, 554.37, 659.25, 880].forEach((f, i) => tom(f, 1.3, "sine", 0.1, i * 0.1)) },
    // Prateleiras iguais: carga que pousa com baque de madeira e estantes equilibradas com acorde
    prateleiras: { colocar: () => { tom(140, 0.18, "sine", 0.28, 0, 80); ruido(0.06, 500, 180, 0.07); }, completo: () => [392, 493.88, 587.33, 783.99].forEach((f, i) => tom(f, 1.4, "sine", 0.11, i * 0.11)) },
    // Trilhos da mina: chave que estala e vagoneta que chega à estação com apito
    trilhos: { chave: () => { tom(260, 0.08, "square", 0.08, 0, 180); ruido(0.06, 1500, 600, 0.06); }, completo: () => { tom(880, 0.4, "sine", 0.1, 0, 1320); [523.25, 659.25].forEach((f, i) => tom(f, 1.2, "sine", 0.1, 0.4 + i * 0.12)); } },
    // Torre de caixas: caixa que pousa com baque e torre firme com acorde grave
    torre: { caixa: () => { tom(150, 0.2, "sine", 0.3, 0, 90); ruido(0.05, 600, 200, 0.06); }, falha: () => tom(170, 0.18, "square", 0.07, 0, 110), completo: () => { tom(160, 0.35, "sine", 0.3, 0, 90); [392, 523.25, 659.25].forEach((f, i) => tom(f, 1.3, "sine", 0.1, 0.1 + i * 0.1)); } },
    chaves: {
      pegar: () => { tom(1400, 0.12, "triangle", 0.1, 0, 1100); tom(2100, 0.1, "sine", 0.05, 0.05); },
      passo: () => tom(260, 0.06, "sine", 0.05, 0, 200),
      bate: () => tom(130, 0.16, "square", 0.07, 0, 90),
      abrir: () => [392, 523.25, 659.25, 783.99].forEach((f, i) => tom(f, 1.4, "sine", 0.12, i * 0.12)),
    },
    // Sombra espelhada: passo que ecoa do outro lado do espelho e lâmpada que acende com a sombra
    sombra: {
      passo: () => tom(300, 0.1, "sine", 0.06, 0, 220),
      bate: () => tom(130, 0.14, "square", 0.07, 0, 90),
      acender: () => [392, 523.25, 659.25, 783.99].forEach((f, i) => tom(f, 1.5, "sine", 0.12, i * 0.12)),
    },
    // Trilha lembrada: passo com estalo de memória, erro seco e caminho refeito com acorde
    trilha: {
      passo: () => tom(440, 0.08, "triangle", 0.06, 0, 520),
      erro: () => { tom(170, 0.18, "square", 0.08, 0, 100); ruido(0.06, 700, 200, 0.06); },
      chegou: () => [392, 523.25, 659.25, 880].forEach((f, i) => tom(f, 1.4, "sine", 0.12, i * 0.12)),
    },
    // Brasa que migra: passo da brasa pelo caminho, atiçar com fagulha que sobe e fogo que se apaga
    brasa: {
      passar: () => tom(220, 0.08, "triangle", 0.05, 0, 180),
      atiçar: () => { ruido(0.2, 1400, 2600, 0.1); tom(440, 0.2, "sawtooth", 0.05, 0, 880); },
      apagar: () => { ruido(0.7, 1500, 200, 0.14); tom(200, 0.6, "sine", 0.1, 0, 60); },
      completo: () => [392, 523.25, 659.25, 784].forEach((f, i) => tom(f, 1.4, "sine", 0.12, i * 0.1)),
    },
    // Arca cheia: carga que pousa com baque de madeira, tirar com arrasto e falha por peso
    arca: {
      guardar: () => { tom(120, 0.2, "sine", 0.3, 0, 60); ruido(0.08, 500, 180, 0.08); },
      tirar: () => ruido(0.2, 800, 300, 0.07),
      falha: () => tom(160, 0.2, "square", 0.07, 0, 110),
      completo: () => [262, 330, 392, 523].forEach((f, i) => tom(f, 1.5, "triangle", 0.12, i * 0.12)),
    },
    // Muralha de escudos: escudo que se ergue com batida metálica, recolher com arrasto e escudos que param a onda
    muralha: {
      erguer: () => { tom(260, 0.15, "square", 0.07, 0, 180); tom(1100, 0.2, "sine", 0.05); },
      tirar: () => ruido(0.2, 900, 300, 0.07),
      completo: () => [392, 523.25, 659.25, 784].forEach((f, i) => tom(f, 1.5, "sine", 0.12, i * 0.12)),
    },
    // Ganchos da corrente: gancho que bate no vizinho com tinido, falha seca e corrente ordenada que sobe
    ganchos: {
      trocar: () => { tom(900, 0.06, "square", 0.05, 0, 700); tom(1400, 0.08, "triangle", 0.04, 0.02); },
      falha: () => tom(160, 0.15, "square", 0.07, 0, 110),
      completo: () => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tom(f, 1.4, "triangle", 0.12, i * 0.1)),
    },
    // Fechadura de pinos: pino que gira com clique, teste com tinido e cofre aberto com tinido grave
    fechadura: {
      girar: () => tom(1500, 0.03, "square", 0.04),
      testar: () => { tom(700, 0.2, "triangle", 0.09); tom(1050, 0.25, "sine", 0.05, 0.05); },
      abrir: () => { tom(180, 0.4, "sine", 0.3, 0, 90); [659.25, 880, 1174.66].forEach((f, i) => tom(f, 1.3, "sine", 0.1, 0.1 + i * 0.12)); },
    },
    // Vela que derrete: fósforo que risca, vela que passa um turno e porta que abre com todas acesas
    vela: {
      acender: () => { ruido(0.08, 2000, 900, 0.1); tom(900, 0.15, "triangle", 0.08, 0, 600); },
      passar: () => tom(440, 0.1, "sine", 0.06, 0, 380),
      completo: () => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tom(f, 1.5, "sine", 0.12, i * 0.1)),
    },
    // Correnteza de setas: giro seco da seta, barco que chega ao farol com acorde
    setas: {
      girar: () => tom(480, 0.06, "triangle", 0.09, 0, 620),
      chegou: () => [392, 523.25, 659.25, 784].forEach((f, i) => tom(f, 1.3, "triangle", 0.12, i * 0.12)),
    },
  },
  // Sino de verdade: parciais inarmônicas, ataque seco e cauda longa
  sino(freq: number) {
    [[1, 0.28, 2.8], [2, 0.14, 1.9], [2.76, 0.12, 1.3], [4.07, 0.07, 0.8], [5.4, 0.05, 0.5]].forEach(([m, v, d]) => tom(freq * m, d, "sine", v));
  },
  // Pulso de lâmpada de sinais (Torre): `dur` em segundos
  bipe,
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
