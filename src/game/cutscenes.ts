// agua: altura da água (0 a 1). brilho: força da luz (0 a 1)
export type Cena = { texto: string; agua: number; brilho: number };
export type CutsceneInfo = { tipo: "cais" | "biblioteca" | "jardins" | "recife" | "catedral" | "abismo" | "coracao"; entrada: string; cenas: Cena[] };

export const cutscenes = {
  cais: {
    tipo: "cais",
    entrada: "Toque para entrar no cais",
    cenas: [
      { texto: "Há muito tempo, a cidade de Maré Alta vivia da luz de uma única lanterna.", agua: 0.15, brilho: 1 },
      { texto: "Ela guiava os barcos de volta para casa, noite após noite.", agua: 0.15, brilho: 1 },
      { texto: "Numa madrugada, o mar subiu. Subiu por três noites, e a luz se apagou.", agua: 0.7, brilho: 0.15 },
      { texto: "Os sinos ainda tocam sob a água, mas ninguém responde.", agua: 0.85, brilho: 0 },
      { texto: "Você acorda no cais, com a lanterna fria nas mãos.", agua: 0.85, brilho: 0.1 },
      { texto: "Algo nela ainda lembra de acender.", agua: 0.85, brilho: 0.75 },
    ],
  },
  biblioteca: {
    tipo: "biblioteca",
    entrada: "Toque para entrar na biblioteca",
    cenas: [
      { texto: "Depois do cais, a rua some sob a água até os joelhos.", agua: 0.3, brilho: 0.3 },
      { texto: "No fim dela, uma casa de pedra guarda tudo o que a cidade escreveu sobre si.", agua: 0.3, brilho: 0.5 },
      { texto: "Os livros boiam e as páginas se soltam, mas a tinta resiste.", agua: 0.45, brilho: 0.5 },
      { texto: "Alguém separou quatro registros antes da cheia. Talvez para você.", agua: 0.45, brilho: 0.8 },
      { texto: "Para entender a lanterna, é preciso lembrar em que ordem a cidade a perdeu.", agua: 0.45, brilho: 1 },
    ],
  },
  jardins: {
    tipo: "jardins",
    entrada: "Toque para entrar nos jardins",
    cenas: [
      { texto: "A biblioteca termina num portão coberto de cracas. Do outro lado, o jardim da cidade virou recife.", agua: 0.2, brilho: 0.6 },
      { texto: "O coral cresceu sobre os canteiros e as fontes, em fileiras que parecem muros.", agua: 0.2, brilho: 0.5 },
      { texto: "Enguias patrulham os corredores. Elas seguem a luz como os barcos seguiam a lanterna.", agua: 0.2, brilho: 1 },
      { texto: "Quanto mais a lanterna brilha, de mais longe elas veem você.", agua: 0.2, brilho: 1 },
      { texto: "Para passar, será preciso aprender a andar no escuro.", agua: 0.2, brilho: 0.1 },
    ],
  },
  armazem: {
    tipo: "recife",
    entrada: "Toque para entrar no armazém",
    cenas: [
      { texto: "No fim do porto, um armazém de pedra guarda o lastro de todos os barcos que a lanterna trouxe de volta.", agua: 0.4, brilho: 0.3 },
      { texto: "Cada barco deixava uma pedra com o próprio nome. Pela ordem de peso, o armazém sabia a ordem em que chegaram.", agua: 0.4, brilho: 0.5 },
      { texto: "A água levou os livros e apagou as marcas. Mas as pedras continuam aqui, cada uma com o seu peso.", agua: 0.4, brilho: 0.5 },
      { texto: "Uma balança de dois pratos ainda pende do teto. Está enferrujada, mas continua honesta.", agua: 0.4, brilho: 0.8 },
      { texto: "Compare as pedras. O peso não mente, só engana quem pesa com pressa.", agua: 0.4, brilho: 1 },
    ],
  },
  observatorio: {
    tipo: "coracao",
    entrada: "Toque para subir ao observatório",
    cenas: [
      { texto: "Acima da Sala dos Sinos, uma escada em espiral sobe até uma cúpula de vidro. Mesmo debaixo d'água, ela ainda mostra as estrelas, trêmulas como numa lembrança.", agua: 0.7, brilho: 0.3 },
      { texto: "Os faroleiros vinham aqui para achar o norte quando as nuvens cobriam o céu.", agua: 0.7, brilho: 0.5 },
      { texto: "Três anéis de bronze giram em torno do mesmo eixo. Um arrasta o outro, e o outro arrasta o terceiro, como a lua arrasta a maré.", agua: 0.7, brilho: 0.7 },
      { texto: "Só quando a Estrela estiver no topo dos três anéis o caminho até a superfície vai aparecer.", agua: 0.7, brilho: 0.9 },
      { texto: "Gire com calma. Cada movimento tem uma consequência.", agua: 0.7, brilho: 1 },
    ],
  },
  recife: {
    tipo: "recife",
    entrada: "Toque para mergulhar no recife",
    cenas: [
      { texto: "Depois dos jardins, o fundo desce e desce. Ali dormem os barcos que a lanterna não conseguiu trazer de volta.", agua: 0.6, brilho: 0.3 },
      { texto: "A luz da cidade se estilhaçou no naufrágio. Cada caco ainda guarda um pouco de calor.", agua: 0.6, brilho: 0.7 },
      { texto: "Seis fragmentos esperam entre os cascos. Mas você está sem fôlego de verdade agora.", agua: 0.6, brilho: 0.5 },
      { texto: "Respire quando achar bolhas e não se perca. O ar não perdoa quem hesita.", agua: 0.6, brilho: 0.9 },
    ],
  },
  oficina: {
    tipo: "biblioteca",
    entrada: "Toque para entrar na oficina",
    cenas: [
      { texto: "Entre o recife e a catedral, uma casinha de tábuas resistiu à cheia. A porta nunca foi trancada.", agua: 0.35, brilho: 0.3 },
      { texto: "Era a oficina do faroleiro. Tomás Vaz passou quarenta anos ali, polindo vidro e trocando pavios.", agua: 0.35, brilho: 0.5 },
      { texto: "Na bancada, a lente da lanterna está desmontada. Alguém tentou consertá-la e não terminou.", agua: 0.35, brilho: 0.6 },
      { texto: "Bilhetes, uma carta e uma receita esperam ao lado das peças. Nem todos dizem a verdade.", agua: 0.35, brilho: 0.8 },
      { texto: "Monte a lente, forje o aro e aponte o feixe. Uma peça errada e a luz não passa.", agua: 0.35, brilho: 1 },
    ],
  },
  sinos: {
    tipo: "catedral",
    entrada: "Toque para escutar os sinos",
    cenas: [
      { texto: "Atrás do altar, uma escada de pedra desce até uma sala redonda. O som chega antes da luz.", agua: 0.6, brilho: 0.2 },
      { texto: "Cinco sinos pendem do teto, presos por correntes grossas de sal e ferrugem.", agua: 0.6, brilho: 0.4 },
      { texto: "Quatro deles já tocaram a vida inteira. Tocavam quando um barco voltava, e a cidade inteira sabia pelo som.", agua: 0.6, brilho: 0.6 },
      { texto: "O quinto sino nunca foi tocado. A corda dele está limpa, como se esperasse por alguém.", agua: 0.6, brilho: 0.8 },
      { texto: "Primeiro aprenda a voz de cada um. Depois afine o quinto, para que ele possa responder.", agua: 0.6, brilho: 1 },
    ],
  },
  catedral: {
    tipo: "catedral",
    entrada: "Toque para entrar na catedral",
    cenas: [
      { texto: "Além dos jardins, uma catedral guarda a nave inteira debaixo d'água.", agua: 0.2, brilho: 0.4 },
      { texto: "A água nunca fica parada. Ela sobe e desce num ciclo que ninguém conseguiu deter.", agua: 0.5, brilho: 0.4 },
      { texto: "Cada mecanismo foi feito para uma altura da maré: um no chão, um no alto, um no meio.", agua: 0.85, brilho: 0.7 },
      { texto: "No altar há uma inscrição. Leia com calma e observe a maré.", agua: 0.5, brilho: 0.5 },
      { texto: "A pressa não abre nada aqui. A água só respeita quem espera a hora certa.", agua: 0.2, brilho: 0.8 },
    ],
  },
  abismo: {
    tipo: "abismo",
    entrada: "Toque para enfrentar a corrente",
    cenas: [
      { texto: "A catedral termina num poço. Dele sobe a corrente que mantém a cidade presa no fundo.", agua: 0.8, brilho: 0.3 },
      { texto: "Destroços de todos os séculos caem por ali, empurrados de um lado para o outro.", agua: 0.8, brilho: 0.4 },
      { texto: "Não há como lutar contra o mar. Só como aguentar até ele mudar de ideia.", agua: 0.8, brilho: 0.6 },
      { texto: "Fique em movimento e proteja o casco.", agua: 0.8, brilho: 1 },
    ],
  },
  coracao: {
    tipo: "coracao",
    entrada: "Toque para encarar o Guardião",
    cenas: [
      { texto: "No centro da cidade, a lanterna original ainda pulsa, presa num coração de vidro e coral.", agua: 0.9, brilho: 0.5 },
      { texto: "Quem a guarda não tem rosto. Tem só uma voz, feita de quatro luzes.", agua: 0.9, brilho: 0.8 },
      { texto: "O Guardião não quer lutar. Quer saber se você ouviu a cidade até aqui.", agua: 0.9, brilho: 0.9 },
      { texto: "O que você decidir fazer com a luz, o mar vai lembrar.", agua: 0.9, brilho: 1 },
    ],
  },
} satisfies Record<string, CutsceneInfo>;

export type CenaId = keyof typeof cutscenes;
