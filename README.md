# Lanterna Submersa

Jogo narrativo de exploração e puzzles, 100% front-end (React, Pixi.js, Zustand, Framer Motion, Howler).

```bash
npm install
npm run dev
```

## Fases e tipos de vitória
| # | Fase | Vitória |
|---|------|---------|
| 1 | Cais Afundado | Exploração: chave + conchas opcionais |
| 2 | Biblioteca Alagada | Dedução: ordenar a história |
| 3 | Jardins de Coral | Furtividade: chegar sem ser visto |
| 4 | Armazém do Porto | Equilíbrio: ordenar pedras comparando pesos numa balança |
| 5 | Porão da Estrela-d'Alva | Estiva: empurrar caixas até as marcas |
| 6 | Recife dos Naufrágios | Coleta: fragmentos antes do ar acabar |
| 7 | Oficina do Faroleiro | Criação: bancada, forja e foco da lente |
| 8 | Galeria dos Espelhos | Reflexo: virar espelhos até o feixe alcançar a lente |
| 9 | Catedral das Marés | Sincronia: mecanismos na maré certa |
| 10 | Sala dos Sinos | Escuta: ordenar os sinos e afinar o quinto de ouvido |
| 11 | Observatório Naufragado | Navegação: três anéis acoplados, Estrela no topo |
| 12 | Eclusas da Cidade Baixa | Medida: despejar água entre três câmaras até a medida exata |
| 13 | Torre dos Sinais | Sinalização: ouvir e repetir sinais de luz (ponto e traço) |
| 14 | Correntes do Abismo | Sobrevivência: resistir até a corrente acalmar |
| 15 | Coração da Lanterna | Duelo de sequência + 4 finais |

Cada fase dá de 1 a 3 estrelas e guarda o melhor tempo. Saves antigos (v1) são migrados.

## Estrutura
- `src/store`: estado (Zustand) e validação/migração do save (Zod)
- `src/phases`: dados e cenas de cada fase (`data.ts` lista os tipos de vitória)
- `src/components`: Menu, Cabecalho, Resultado (confete), Estrelas, Cutscene
- `src/game`: áudio, dificuldade, helpers de Pixi (`pixiBase.ts`) e paleta

## Deploy na Vercel
Suba para o GitHub e importe em vercel.com. O Vite é detectado automaticamente.

## Extras (v2.1)
- **Medalhas**: 14 conquistas em `src/game/conquistas.ts`, com aviso na tela e galeria no menu.
- **Maré Infinita**: modo sem fim das Correntes do Abismo, liberado após concluir a fase. Guarda o recorde.
- **Música**: trilha sintetizada por fase em `src/game/musica.ts` (sem arquivos de áudio), mais efeitos novos (medalha, pancada, bolha). Dá para desligar a trilha em Ajustes.

## Mecânicas e arte (v2.2)
- **Cais**: Interagir longe de objetos emite um *sonar* que revela as conchas.
- **Jardins**: tecla F / botão lança uma *isca de plâncton* que desvia as enguias (recarga de 9s).
- **Arte por fase**: `Tela.tsx` aplica um acabamento próprio (`.grade-*` em `index.css`): dourado pixelado no Cais, coral violáceo nos Jardins, ferrugem granulada no Recife, azul gelado e vinheta no Abismo.
- **Biblioteca**: a tinta escorre; segure o registro para lê-lo.
- **Catedral**: a maré é irregular, puxada pela lua; leia o ritmo antes de agir.
- **Coração**: o último canto deve ser repetido de trás para frente.
- **Recife**: prender o fôlego (Espaço) gasta menos ar, mas você nada devagar.
- **Abismo**: a âncora (Espaço) para a corrente por poucos segundos e recarrega devagar.

## Conteúdo novo (v7)
- **Oficina do Faroleiro** (`phases/Oficina.tsx`), em três etapas: ler a bancada e montar as peças (3 pistas de verdade, 1 palpite furado, 1 só história), **forjar o aro** (bata no ferro quando o brilho entra na faixa dourada, que estreita a cada golpe) e **apontar a luz** (gire o feixe até um barco à deriva e mantenha até a barra encher).
- **Sala dos Sinos** (`phases/Sinos.tsx`): ordene cinco sinos do grave ao agudo e depois **afine o quinto sino de ouvido** com um controle contínuo, igualando três tons. Sem som (ou depois de um erro) aparecem marcas visuais e dicas de direção.
- **Som próprio, todo sintetizado** (sem arquivos novos):
  - `audio.sino`: sino com parciais inarmônicas e cauda longa; `audio.puro` e `audio.afinador`: tom puro e oscilador contínuo.
  - `audio.sfx.martelo / encaixe / chama / falha / lente / afinado / desafina`.
  - `musica.ts`: a Oficina tem tinidos de martelo em compasso de três (`pulso: "forja"`), e a Sala dos Sinos tem badaladas graves e distantes (`pulso: "badalo"`).
- **Diário do Faroleiro** (`game/diario.ts`): 12 páginas da história de Tomás Vaz, abertas com o progresso.
- Cutscenes novas e 3 medalhas novas (17 no total). Saves antigos continuam valendo.

## Conteúdo novo (v8)
- **Armazém do Porto** (`phases/Armazem.tsx`): cinco pedras de lastro com pesos escondidos (sorteados a cada partida). Você só vê qual prato desce e precisa ordenar as pedras da mais leve à mais pesada com o menor número de pesagens. Duas rodadas (4 e 5 pedras). Som: pedra pousando, balança rangendo; trilha com gotas pingando (`pulso: "gotejo"`).
- **Observatório Naufragado** (`phases/Observatorio.tsx`): três anéis de bronze acoplados (girar um arrasta o seguinte). Leve a Estrela ao topo dos três com poucos lances. O embaralhamento parte do estado resolvido, então sempre tem solução. Som: estalo de engrenagem, ping de sonar; trilha com sonar (`pulso: "sonar"`).
- 2 cutscenes, 3 páginas novas no diário (15 no total), 2 medalhas novas (19 no total).

## Conteúdo novo (v9)
- **Eclusas da Cidade Baixa** (`phases/Eclusa.tsx`): três câmaras de capacidades diferentes, a maior começa cheia. Toque numa câmara e depois em outra para despejar (até esvaziar a origem ou encher o destino). Três rodadas: 4 medidas com `3/5/8`, 5 medidas com `3/7/10` e dividir 12 ao meio com `5/7/12`. O mínimo de movimentos de cada rodada é calculado por busca em largura (`minimo`), então as estrelas medem quanto você passou do ideal: até 3 a mais = 3 estrelas, até 10 = 2. Desfazer gasta um movimento e reiniciar não devolve os já feitos. Som: ruído filtrado de água que dura mais com mais volume, comporta rangendo; trilha com marulho e bolhas (`pulso: "marulho"`).
- **Torre dos Sinais** (`phases/Torre.tsx`): a lâmpada pisca um sinal em pontos e traços (com bipe), e você repete **tocando rápido (ponto) ou segurando (traço)**, a partir de 360 ms. Também funciona com a barra de espaço. Três rodadas: `LIA` com guia, `VEM` sem guia e um pedido de socorro no nevoeiro, em que a luz mostrada fica fraca e só o som chega forte. Um sinal errado recomeça o chamado; erros valem 2 pontos de custo e cada "ouvir de novo" vale 1 (até 2 = 3 estrelas, até 6 = 2). Som: tom contínuo enquanto você segura (`audio.afinador`), pulso de lâmpada (`audio.bipe`); trilha com buzina grave ao longe (`pulso: "buzina"`).
- 2 cutscenes, 2 páginas novas no diário (17 no total) e 2 medalhas novas, *Mão de eclusário* e *Luz que chama* (21 no total).
- As duas fases entram entre o Observatório e o Abismo. Saves antigos continuam valendo: quem já passou do Abismo tem as fases novas liberadas. A medalha *Céu estrelado* passa a exigir 3 estrelas nelas também (quem já a tinha, mantém).

## Conteúdo novo (v10)
- **Porão da Estrela-d'Alva** (`phases/Porao.tsx`), depois do Armazém: estiva no estilo Sokoban. Três porões (2, 3 e 3 caixas) que só se empurram, nunca se puxam. Cada mapa foi resolvido por busca em largura, então todos têm solução, e `OTIMOS` guarda o mínimo de passos (23, 34 e 40). Estrelas pelo total de passos: até 1,5x o mínimo = 3, até 2,5x = 2. Desfazer (Z) e reiniciar não devolvem passos. Controles: setas ou WASD, e setas na tela para o celular. Som: passo abafado, caixa arrastando na madeira, encaixe na marca; trilha com o casco rangendo (`pulso: "casco"`).
- **Galeria dos Espelhos** (`phases/Espelhos.tsx`), depois da Oficina: virar espelhos entre `/` e `\` até o feixe da lâmpada alcançar a lente, com pedras que bloqueiam a luz. Três galerias (5, 7 e 9 espelhos), geradas e conferidas por busca exaustiva: cada uma tem só 2 soluções, e o mínimo de toques (2, 4 e 6) é recalculado em `minimo`. Estrelas pelos toques acima do mínimo: até 2 a mais = 3, até 6 = 2. O feixe é redesenhado a cada toque. Som: o tom do espelho sobe a cada reflexo do feixe, e a lente acesa fecha com um brilho de prata; trilha com cintilar de vidro (`pulso: "cristal"`).
- 2 cutscenes, 2 páginas no diário (19 no total) e 2 medalhas, *Mãos de estivador* e *Prata e luz* (23 no total).
- **A Estrela-d'Alva** do diário do Armazém ganha o seu porão: Tomás nunca soube quantos eram, e a fase termina sem contar.
- As fases entram no meio do caminho (depois do Armazém e da Oficina). Saves antigos continuam valendo, e quem já passou delas tem as novas liberadas. *Céu estrelado* passa a exigir 3 estrelas nelas também, mas quem já a tinha mantém.

## Conteúdo novo (v11)
- **Manguezal Escorregadio** (`phases/Mangue.tsx`), depois da Torre: você desliza pela lama até bater em algo. O lodo mole cede depois que você passa, e não dá para parar sobre ele. Três trechos (5, 8 e 6 deslizes no mínimo, em `OTIMOS`). Estrelas pelo total de deslizes: até 1,5x o mínimo = 3, até 2,5x = 2. Som: deslize com ruído de lama, lodo que afunda, boia que acende; trilha com bolhas de lodo (`pulso: "lama"`).
- **Teatro de Sombras** (`phases/Teatro.tsx`), antes do Abismo: cada lâmpada ilumina em linha reta até a parede mais próxima. Acenda todas as marcas da cena com o menor número de lâmpadas (3, 4 e 4 no mínimo, em `MINIMOS`). Estrelas pelas lâmpadas acima do mínimo: até 2 = 3, até 6 = 2. Som: lâmpada que acende e apaga, feixe de luz, figura completa; trilha com sopro de cordas (`pulso: "lencol"`).
- 2 cutscenes, 2 páginas no diário (21 no total) e 2 medalhas, *Pé firme no lodo* e *Mestre das sombras* (25 no total).
- As fases entram antes do Abismo. Saves antigos continuam valendo, e quem já passou do Abismo tem as novas liberadas. *Céu estrelado* passa a exigir 3 estrelas nelas também, mas quem já a tinha mantém.

## Conteúdo novo (v12)
- **Casa das Bombas** (`phases/Bombas.tsx`), depois do Teatro: apertar uma válvula inverte ela e as vizinhas. Abra todas as válvulas. Três painéis (5, 8 e 9 toques no mínimo, em `OTIMOS`, achados por busca em largura). Estrelas pelos toques acima do mínimo: até 2 = 3, até 6 = 2. Som: válvula que range, bomba que ganha pressão, tubulação cheia; trilha com pistão (`pulso: "bombeo"`).
- **Rede do Porto** (`phases/Rede.tsx`), antes do Abismo: trace um laço fechado de células vizinhas em volta de todos os peixes, sem cruzar pedras nem a si mesmo. Três trechos (14, 14 e 18 células no mínimo, achados por busca exaustiva). Estrelas pelas células acima do mínimo: até 3 = 3, até 10 = 2. Som: fio que tece, fio que desfaz, laço que fecha; trilha com pingos de peixe (`pulso: "pesca"`).
- 2 cutscenes, 2 páginas no diário (23 no total) e 2 medalhas, *Mão de bombeiro* e *Nó de pescador* (27 no total).

## Conteúdo novo (v13)
- **Labirinto da Maré** (`phases/Mare.tsx`), depois da Rede: cada passo inverte a maré. Passagens de areia (`a`) só abrem na maré baixa, e passagens de água (`b`) só na alta. Você só pisa onde o mar deixa, e não pode ficar numa célula que fecha. Três canais (6, 10 e 11 passos no mínimo, em `OTIMOS`). Estrelas pelos passos acima do mínimo: até 3 = 3, até 9 = 2. Som: passo que sobe ou desce com a maré, passagem que fecha com espirro; trilha com onda que sobe e desce (`pulso: "mare"`).
- **Vento Contrário** (`phases/Vento.tsx`), depois do Labirinto: cada passo seu é seguido de um empurrão do vento, e a direção gira a cada passo (direita, baixo, esquerda, cima). Se o vento bate numa rocha, o barco fica parado. Três mares (5, 6 e 7 passos no mínimo, em `OTIMOS`). Estrelas pelos passos acima do mínimo: até 2 = 3, até 6 = 2. Som: sopro do vento, empurrão seco, batida na rocha e sino da chegada; trilha com rajada de ruído (`pulso: "vento"`).
- 2 cutscenes, 2 páginas no diário (25 no total) e 2 medalhas, *Relógio da maré* e *Vento a favor* (29 no total).

## Segundo Mar (v14): novo ato depois do Coração
- **Escuta do Segundo Mar** (`phases/Eco.tsx`), a primeira fase do ato: três faróis apagados escondidos numa grade 5x5. Você chama tocando numa casa, e o eco mostra a distância: quanto mais perto, mais alto e forte o som. Não dá para ver o farol antes de achá-lo. Estrelas pelo total de chamados (até 9 = 3, até 14 = 2). Som próprio: chamado com tom que sobe conforme a proximidade, eco com linha de atraso, fanfarra de farol achado; trilha com sinos distantes (`pulso: "eco"`).
- Cutscene de entrada do ato (4 cenas), página no diário *Ecos no escuro* (26 no total) e medalha *Ouvido do Segundo Mar* (30 no total).

## Atos (v15)
- A história tem **cinco atos**, listados em `atos` (`phases/data.ts`). O **Ato I** é o jogo original, até o Coração. O **Ato II** (Segundo Mar) começa na Escuta e tem visual próprio: fundo de mar aberto em azul-profundo, com brilho de alga (classe `.ato-2`, em `index.css`).
- No mapa da cidade, as fases aparecem agrupadas por ato, com o título e um resumo de cada um. Os Atos III a V aparecem no fim, marcados como em construção.
- `atoDe(id)` diz a qual ato uma fase pertence. Hoje só a Escuta é do Ato II.

## Ato II (v16): Cardume e Coral
- **Cardume Perdido** (`phases/Cardume.tsx`), depois da Escuta: cada movimento leva o cardume inteiro uma casa na mesma direção. Peixe que bateria numa rocha, na borda ou em outro peixe fica parado. Vence quando os peixes ocupam as marcas. Três trechos (4, 5 e 6 movimentos no mínimo, em `OTIMOS`, achados por busca em largura sobre as posições). Estrelas pelos movimentos acima do mínimo: até 2 = 3, até 6 = 2. Som: nado curto e tique seco quando o cardume trava; trilha com brilhos de peixes (`pulso: "cardume"`).
- **Coral Que Cresce** (`phases/Coral.tsx`), depois do Cardume: cada coral só pode ser plantado numa casa vizinha de outro coral. Cubra as marcas. Três jardins (5, 5 e 8 corais no mínimo, em `OTIMOS`). Estrelas pelos corais acima do mínimo: até 2 = 3, até 6 = 2. Som: crescimento que borbulha, bloqueio abafado e acorde do jardim completo; trilha com sinos longos (`pulso: "coral"`).
- As duas fases pertencem ao Ato II (`atoDe`). Medalhas *Guia do cardume* e *Jardineiro do mar*, páginas *Quem anda junto* e *O que cresce sobre a cidade* no diário.

## Ato II (v17): Neblina Azul
- **Neblina Azul** (`phases/Neblina.tsx`), depois do Coral: você só enxerga as casas que visitou e as vizinhas delas. Três trechos (7, 8 e 10 passos no mínimo, em `OTIMOS`, calculados com o mapa todo visível). Estrelas pelos passos acima do mínimo: até 4 = 3, até 10 = 2. Som: passo abafado, revelação de casa nova, pedra escondida; trilha com buzina de farol distante (`pulso: "neblina"`).
- Medalha *Navegador da neblina* e página *Mar sem horizonte* no diário.
- Progresso do Ato II: 4 fases. O desfecho só entra depois de pelo menos 10 fases no Segundo Mar.

## Ato II (v18): Portas de Ferro e Conchas Gêmeas
- **Portas de Ferro** (`phases/Alavancas.tsx`), depois da Neblina: cada alavanca inverte um conjunto fixo de portões de ferro, e você descobre o efeito só ao apertar. Três passagens (1, 2 e 3 alavancas no mínimo, em `OTIMOS`). Estrelas pelas alavancas acionadas acima do mínimo: até 1 = 3, até 3 = 2. Som: alavanca com rangido, portão com estrondo grave; trilha com clangor de ferro (`pulso: "ferro"`).
- **Conchas Gêmeas** (`phases/Memoria.tsx`), depois das Portas: mesa de conchas com símbolos, em que você vira duas por vez e acha os pares. Três caixas (6, 8 e 8 pares). Estrelas pelos erros: nenhum = 3, até 3 = 2. Som: concha virada, par com acorde, erro abafado; trilha de caixinha de música (`pulso: "caixinha"`).
- Medalhas *Portas de ferro* e *Casal de mar*, páginas *Portas de ferro* e *Casal de mar* no diário.
- Progresso do Ato II: 6 fases. O desfecho só entra depois de pelo menos 10 fases.

## Ato II (v19): Colar de Pérolas e Correnteza de Setas
- **Colar de Pérolas** (`phases/Perolas.tsx`), depois das Conchas Gêmeas: um picross 5x5. Os números nas bordas dizem quantas pérolas seguidas há em cada linha e coluna. Toque alterna vazio → pérola → X. Três colares. Estrelas pelos erros (pérolas postas onde não deviam): nenhum = 3, até 3 = 2. Som: conta que encaixa, erro abafado, colar completo; trilha de pérolas que tilintam (`pulso: "perolas"`).
- **Correnteza de Setas** (`phases/Setas.tsx`), depois do Colar: gire as setas até o barco, seguindo as setas, chegar ao farol. Três trechos (3, 2 e 3 toques no mínimo, em `OTIMOS`, achados por busca exaustiva). Estrelas pelos toques acima do mínimo: até 1 = 3, até 4 = 2. Som: giro seco da seta, acorde ao chegar ao farol; trilha com ruído de correnteza que passa (`pulso: "correnteza"`).
- Medalhas *Colar de pérolas* e *Correnteza certa*, páginas *Colar de pérolas* e *A correnteza certa* no diário.
- Progresso do Ato II: 8 fases. O desfecho só entra depois de pelo menos 10 fases.

## Ato II completo (v20): Pedras Que Caem e Sopa das Marés
- **Pedras Que Caem** (`phases/Dominos.tsx`), depois das Correntezas: uma fileira de pedras de coral. Cada uma tem um alcance e derruba as vizinhas até esse alcance para os dois lados. Derrube as pedras de pé com o menor número de toques. Três fileiras (3, 4 e 3 toques no mínimo, em `OTIMOS`, achados por busca exaustiva). Estrelas pelos toques: até o mínimo = 3, até mínimo+2 = 2. Som: toque seco de pedra, cascata com batidas graves; trilha de pedras (`pulso: "pedras"`).
- **Sopa das Marés** (`phases/Palavras.tsx`), depois das Pedras: sopa de letras com palavras em horizontal, vertical e diagonal. Marque a primeira e a última letra. Duas sopas. Estrelas pelos erros: nenhum = 3, até 3 = 2. Som: letra achada com pingo, erro abafado, acorde da sopa completa; trilha de sinos baixos (`pulso: "sopa"`).
- Medalhas *Pedras que caem* e *Letras do mar*, páginas *Pedras que caem* e *Letras do mar* no diário.
- **Ato II completo: 10 fases.** O desfecho e os Atos III a V vêm depois.

## Fim do Ato II (v21): O Último Farol
- **O Último Farol** (`phases/Final.tsx`), depois da Sopa das Marés: quatro faróis do Segundo Mar. O farol do seu final (lido do inventário, `final:*`, escolhido no Coração) acende primeiro. Depois, os outros três, em qualquer ordem. Quando todos brilham, o desfecho do Ato II é mostrado, com texto específico para cada final. Sem estrelas em disputa: sempre 3.
- Cutscene de entrada, medalha *Fim do Segundo Mar* e página *Fim do Segundo Mar* no diário.
- Tema musical próprio (`pulso: "coracao"`, reaproveitado do Coração).
- Ato II completo: 11 fases, contando o desfecho. Os Atos III a V ainda não foram construídos.

## Ato III (v22): início dos ramos, com o Apagar
- **Ramos:** fases podem ter o campo `ramo` (`"apagar" | "acender" | "guardar" | "renascer"`, em `phases/data.ts`). O menu só mostra as fases do ramo do final escolhido no Coração (lido de `final:*` no inventário). Fases sem `ramo` aparecem para todos.
- **Mar Sem Luz** (`phases/Silencio.tsx`), ramo *Apagar*, depois do Fim do Ato II: as paredes ficam invisíveis, e cada batida revela uma parede e conta como batida. Dois trechos (9 e 11 passos no mínimo, em `OTIMOS`, achados por busca em largura). Estrelas pelas batidas: nenhuma = 3, até 3 = 2. Som: passo quase inaudível, batida surda, sopro grave na saída; trilha de sopro distante (`pulso: "silencio"`).
- Medalha *Ouvido do silêncio* e página *Sem luz* no diário.
- **Pendente:** os ramos Acender, Guardar e Renascer. Enquanto não existirem, quem escolheu esses finais não vê nenhuma fase do Ato III.

## Ato III (v23): ramo Apagar, fases 2 e 3
- **Contagem no Escuro** (`phases/Contagem.tsx`), ramo Apagar: você não vê as paredes, mas cada casa visitada mostra quantas paredes a cercam. Dois trechos (9 e 10 passos no mínimo, em `OTIMOS`). Estrelas pelos passos: até o mínimo total = 3, até +4 = 2. Som: passo, batida surda, acorde de saída; trilha de pulsos de silêncio.
- **Fio do Breu** (`phases/Fio.tsx`), ramo Apagar: cada passo deixa um fio, e você não pode cruzá-lo. Dois trechos (6 e 8 passos no mínimo, em `OTIMOS`, por busca exaustiva). Estrelas pelos passos: até o mínimo total = 3, até +3 = 2. Som: passo com fio esticando, bloqueio seco, acorde de saída.
- Medalhas *Contagem certa* e *Fio do breu*.
- Ramo Apagar: 3 de 5 fases. Faltam 2 nesse ramo e 5 em cada um dos ramos Acender, Guardar e Renascer.

## Ato III (v24): ramo Apagar completo
- **Pedra Lançada** (`phases/Pedra.tsx`): atire pedras no escuro. Cada pedra revela a primeira parede da linha. Dois trechos (9 e 11 passos no mínimo). Estrelas pelas pedras e batidas: até 3 pedras = 3, até 6 = 2.
- **Breu Final** (`phases/Breu.tsx`): último trecho do Apagar. Três pedras por trecho, depois só tato. Dois trechos (10 e 9 passos no mínimo). Estrelas pelas batidas: nenhuma = 3, até 3 = 2.
- Cutscenes de entrada para as quatro fases novas do Apagar (Contagem, Fio, Pedra, Breu), páginas no diário e medalhas.
- **Ramo Apagar: 5 de 5 fases.** Faltam os ramos Acender, Guardar e Renascer, com 5 fases cada.

## Ato III (v25): ramo Acender, fase 1
- **Chama Que Corre** (`phases/Chama.tsx`), ramo Acender: toque numa lenha para acender uma tocha, e use "Soprar o fogo" para o fogo passar para a lenha vizinha, um passo por vez. Pedra e chão param o fogo. Dois trechos. O mínimo de tochas é o número de agrupamentos de lenha (3 e 4, calculados no próprio código, em `OTIMOS`). Estrelas pelas tochas: até o mínimo total = 3, até +2 = 2. Som: estalo de tocha, sopro que espalha o fogo, acorde da costa queimada (`pulso: "lencol"`).
- Cutscene de entrada, página *O fogo que corre* no diário e medalha *Mão de tocheiro*.
- **Ramo Acender: 1 de 5 fases.** Faltam 4.

## Ato III (v26): ramo Acender, fase 2
- **Vela Que Derrete** (`phases/Vela.tsx`), ramo Acender: cada vela tem uma duração em turnos. Por turno, você acende uma vela não usada e depois passa o tempo. A porta abre quando todas as velas do trecho brilham ao mesmo tempo. Dois trechos (durações [3,2,2] e [4,2,3]), ambos com mínimo de 3 turnos, em `OTIMOS` (achado por busca exaustiva). Estrelas pelos turnos: até o mínimo total = 3, até +2 = 2. Som: fósforo que risca, passagem de turno, acorde da porta; trilha com cordas (`pulso: "lencol"`).
- Cutscene de entrada, página *Cera e tempo* no diário e medalha *Relógio de cera*.
- **Ramo Acender: 2 de 5 fases.** Faltam 3.

## Ato III (v27): ramo Acender, fase 3
- **Forja de Pedras** (`phases/Forja.tsx`), ramo Acender: cada pedra tem uma temperatura-alvo. Brasas acesas em casas livres aquecem as pedras vizinhas em +1. Acerte cada pedra exatamente, sem passar do ponto. Três forjas, com mínimo de 2, 2 e 3 brasas (em `OTIMOS`, por busca exaustiva). Os mapas foram gerados com solução garantida. Estrelas pelas brasas: até o mínimo total = 3, até +2 = 2. Som: brasa que chia ao acender, vapor ao apagar, acorde com martelada na pedra no ponto; trilha de forja (`pulso: "forja"`).
- Cutscene de entrada, página *No ponto* no diário e medalha *Mão de ferreiro*.
- **Ramo Acender: 3 de 5 fases.** Faltam 2.

## Ato III (v28): ramo Acender, fase 4
- **Lenha Molhada** (`phases/Molhada.tsx`), ramo Acender: lenha seca pega com uma tocha. Lenha molhada chia na primeira e só acende na segunda. Você tem tochas contadas por costa: o mínimo é 1 por lenha seca + 2 por lenha molhada, mais 2 de folga. Três costas. Estrelas pelas tochas desperdiçadas: nenhuma = 3, até 2 = 2. Som: lenha que pega com estalo, chiado de lenha úmida, falha seca sem tochas; trilha de lenha (`pulso: "lencol"`).
- Cutscene de entrada, página *Lenha que chia* no diário e medalha *Pavio certo*.
- **Ramo Acender: 4 de 5 fases.** Falta 1.

## Ato III (v29): ramo Acender completo
- **Brasa Que Migra** (`phases/Brasa.tsx`), ramo Acender: a brasa anda sozinha por um caminho em ciclo, uma casa por turno. Atice-a só nos altares. Cada atiçada dá +1 de luz e reacende o fogo para 2 turnos. Passar o turno gasta um turno de fogo, e o fogo apagado reinicia o trecho. Três trechos, com mínimo de 3, 4 e 7 turnos (em `OTIMOS`, calculados por busca em largura sobre posição, luz e combustível). Estrelas pelos turnos: até o mínimo total = 3, até +2 = 2. Som: passo da brasa, fagulha ao atiçar, fogo que se apaga; trilha de forja (`pulso: "forja"`).
- Cutscene de entrada, página *A brasa que anda* no diário e medalha *Guardião da brasa*.
- **Ramo Acender: 5 de 5 fases.** Faltam 5 em cada um dos ramos Guardar e Renascer.

## Ato III (v30): ramo Guardar, fase 1
- **Arca Cheia** (`phases/Arca.tsx`), ramo Guardar: cargas de pesos diferentes precisam caber em arcas de capacidade fixa. Selecione uma carga e toque numa arca para guardá-la. Você tem uma arca a mais que o mínimo. Três depósitos, com mínimo de 2, 3 e 3 arcas (em `OTIMOS`, por busca exaustiva no próprio código). Estrelas pelas arcas acima do mínimo total: até o mínimo = 3, até +2 = 2. Som: carga que pousa com baque de madeira, arrasto ao tirar, falha por peso; trilha de passos graves (`pulso: "casco"`).
- Cutscene de entrada, página *O que fica guardado* no diário e medalha *Depósito perfeito*.
- **Ramo Guardar: 1 de 5 fases.** Faltam 4.

## Ato III (v31): ramo Guardar, fase 2
- **Muralha de Escudos** (`phases/Muralha.tsx`), ramo Guardar: ondas correm em linha reta, da esquerda para cada linha e do topo para cada coluna. Cada onda para numa parede ou num escudo. Proteja cada farol com o menor número de escudos. Três muralhas, com mínimo de 2, 3 e 4 escudos (em `OTIMOS`, por busca exaustiva). Estrelas pelos escudos acima do mínimo total: até o mínimo = 3, até +2 = 2. Som: escudo erguido com batida metálica, recolher com arrasto; trilha grave (`pulso: "casco"`).
- Cutscene de entrada, página *Ondas em linha reta* no diário e medalha *Guardião dos faróis*.
- **Ramo Guardar: 2 de 5 fases.** Faltam 3.

## Ato III (v32): ramo Guardar, fase 3
- **Ganchos da Corrente** (`phases/Ganchos.tsx`), ramo Guardar: ganchos numerados em ordem embaralhada. Só dá para trocar ganchos vizinhos. Ordene do menor para o maior. O mínimo de trocas é o número de pares fora de ordem (2, 5 e 5, em `OTIMOS`, calculados pelo código e conferidos por busca em largura). Estrelas pelas trocas acima do mínimo: até o mínimo total = 3, até +2 = 2. Som: gancho que tine no vizinho, falha seca, corrente ordenada que sobe; trilha de passos graves (`pulso: "casco"`).
- Cutscene de entrada, página *Nó desfeito* no diário e medalha *Nó desfeito*.
- **Ramo Guardar: 3 de 5 fases.** Faltam 2.

## Ato III (v33): ramo Guardar, fase 4
- **Fechadura de Pinos** (`phases/Fechadura.tsx`), ramo Guardar: cada pino tem três posições. O teste diz quantos pinos estão certos, sem dizer quais. Três cofres, com 3, 4 e 4 pinos. Estrelas pelas tentativas: até 9 = 3, até 14 = 2. Som: pino que clica ao girar, teste com tinido, cofre aberto com acorde grave; trilha de lencol (`pulso: "lencol"`).
- Cutscene de entrada, página *O cofre dos pinos* no diário e medalha *Dedução de cofre*.
- **Ramo Guardar: 4 de 5 fases.** Falta 1.

## Ato III (v34): ramo Guardar completo
- **Selos do Cofre** (`phases/Selos.tsx`), ramo Guardar: preencha a grade com selos 1, 2 e 3 sem que dois vizinhos iguais se encostem. Algumas casas já vêm marcadas. Três cofres (3x3, 3x4 e 4x4). Erros são contados quando um selo cria um vizinho igual. Estrelas pelos erros: nenhum = 3, até 3 = 2. Som: selo que bate na madeira, erro seco, cofre fechado com acorde; trilha de lencol (`pulso: "lencol"`).
- Cutscene de entrada, página *Vizinhos diferentes* no diário e medalha *Mão de selador*.
- **Ramo Guardar: 5 de 5 fases.** Faltam 5 no Renascer.

## Visual do Ato III (v35)
- O Ato III tem identidade visual própria, como o Ato II: **crepúsculo de brasas**, com fundo roxo-noite, brilho âmbar na base e coral no topo (classe `.ato-3`, em `index.css`).
- Aplicado às telas de todas as fases do Ato III (`App.tsx`), às molduras e aos títulos com brilho.
- No menu, o cabeçalho do Ato III aparece em coral, para distinguir do Ato I (dourado) e do Ato II (alga).

## Ato III (v36): ramo Renascer, fase 1
- **Escalada de Raízes** (`phases/Escalada.tsx`), ramo Renascer: cada casa tem uma altura de 0 a 3. Você só anda para casas vizinhas com diferença de no máximo um degrau. Três raízes, com mínimo de 8, 8 e 7 passos (em `OTIMOS`, por busca em largura). Estrelas pelos passos: até o mínimo total = 3, até +3 = 2. Som: passo que sobe com estalo, bloqueio por desnível, acorde no topo; trilha de lencol (`pulso: "lencol"`).
- Cutscene de entrada, página *Degrau a degrau* no diário e medalha *Pé de raiz*.
- **Ramo Renascer: 1 de 5 fases.** Faltam 4.

## Menu principal por ato (v37)
- Cada ato tem o seu menu principal. O ato é o da próxima fase a jogar (`atoDe(proxima.id)`), e define o visual da tela de título.
- **Ato I · Maré Alta:** dourado, com o orbe de sempre.
- **Ato II · O Segundo Mar:** azul-alga, orbe em alga.
- **Ato III · Os Ramos:** crepúsculo de brasas, orbe em coral.
- **Ato IV · Raízes da Cidade:** verde-musgo e cinza, orbe prateado-verde (identidade definida, fases a construir).
- **Ato V · O Farol Final:** azul-noturno, com brilho branco-dourado (identidade definida, fases a construir).
- O subtítulo sob o título "Lanterna Submersa" mostra o nome do ato. O orbe e as molduras mudam de cor conforme o ato.

## Ato III (v38): ramo Renascer, fases 2 e 3
- **Encaixe de Corais** (`phases/Encaixe.tsx`), ramo Renascer: encaixe peças de coral de formas fixas para cobrir a região sem sobras nem sobreposição. Toque numa peça e depois numa casa (a casa vira o canto superior esquerdo da peça). Dois trechos. Estrelas pelos encaixes errados: nenhum = 3, até 3 = 2. Som: encaixe de coral, erro seco, costa fechada com acorde; trilha de lencol.
- **Sementes em Linha** (`phases/Sementes.tsx`), ramo Renascer: plante uma semente por linha e por coluna, fugindo do solo fraco. Duas hortas (4x4 e 5x5). Estrelas pelos plantios errados. Som: semente que brota, erro abafado, horta florida; trilha de lencol.
- Cutscenes de entrada, páginas *A costa se fecha* e *Uma semente por linha* no diário, medalhas *Costa encaixada* e *Horta em ordem*.
- **Ramo Renascer: 3 de 5 fases.** Faltam 2.

## Menu muda só ao concluir um ato (v39)
- O menu principal agora mantém o visual do ato atual até que todas as fases visíveis desse ato estejam concluídas. Só então passa para o ato seguinte.
- Atos sem fases (IV e V, por enquanto) não são considerados concluídos, então o menu não avança para além do último ato com fases concluídas.
- O ato do menu é calculado em `components/Menu.tsx` (`atoConcluido` e o laço que avança o ato).

## Ato III (v40): ramo Renascer completo
- **Trilha Alternada** (`phases/Alternado.tsx`), ramo Renascer: casas de duas cores (ciano e âmbar). Cada passo precisa ir para uma casa de cor diferente da atual. Três trechos, com mínimo de 5, 7 e 7 passos (em `OTIMOS`, por busca em largura). Estrelas pelos passos: até o mínimo total = 3, até +3 = 2. Som: passo com tom de cor, parede seca, acorde na saída; trilha de lencol.
- **Pontes de Mangue** (`phases/Pontes.tsx`), ramo Renascer: ilhas com números. Ligue-as na mesma linha ou coluna, com 0, 1 ou 2 pontes, sem cruzar pontes e sem passar do número de cada ilha. Vence quando todas têm o número certo e estão ligadas. Dois mangues (4 e 6 ilhas). Estrelas pelos toques: até 14 = 3, até 20 = 2. Som: ponte que se estica, falha seca, costa ligada com acorde; trilha de lencol.
- Cutscenes de entrada, páginas *Cores que se revezam* e *Ilhas que se ligam* no diário, medalhas *Passo certo* e *Mestre das pontes*.
- **Ramo Renascer: 5 de 5 fases.** Ramo completo.

## Melhorias de UI: cutscenes (v41)
- **Progresso por cena:** pontos no rodapé mostram em que cena o jogador está, na cor do ato.
- **Bolhas no fundo:** partículas sobem devagar atrás da ilustração, para dar vida à cena.
- **Cor por ato:** dourado no Ato I, alga no Ato II, coral no Ato III, com cores próprias para os atos IV e V. A cor vem de `atoDe` e é passada pelo `App`.
- **Legibilidade:** gradiente escuro atrás do texto.
- **Dica de teclado:** "Toque ou pressione Espaço para continuar".

## Tela de resultado (v42)
- **Cor do ato:** a borda, a sombra e o confete seguem a cor do ato da fase concluída.
- **Estrelas animadas:** as estrelas acendem uma a uma, com um pequeno salto, em vez de aparecerem juntas.
- **Novo ato:** quando a próxima fase inicia outro ato, o botão mostra "Novo ato: ..." em vez de "Próxima: ...".
- O cabeçalho da tela mostra também o nome do ato da fase concluída.

## Motor de cutscene avançado (v43)
- **Texto à máquina:** as falas se escrevem letra por letra. Um toque mostra o texto inteiro; o segundo toque avança para a próxima cena.
- **Câmera que respira:** a ilustração faz um movimento lento de zoom e deslocamento, para dar sensação de profundidade.
- **Clarão por cena:** cada troca de cena tem um clarão na cor do ato, que se dissolve.
- Vale para as cutscenes de todos os atos, pelo mesmo componente.
- **Ainda não feito:** ilustrações e animações específicas por cena do Ato I (por exemplo, cada cena do Cais com elementos próprios).

## Cutscene do Cais avançada (v44)
- **Céu:** estrelas que piscam em tempos diferentes.
- **Farol:** torre com feixe de luz que gira devagar.
- **Lâmpada:** treme quando está quase apagada (brilho baixo) e acende com força quando o brilho volta.
- **Lanterna:** aparece na mão do jogador nas cenas finais, acesa ou apagada conforme a cena.
- **Mar:** duas camadas de ondas que se movem em velocidades diferentes, por cima da água que sobe.
- Próximas cenas do Ato I a receber o mesmo tratamento: Biblioteca, Jardins, Recife, Catedral, Abismo e Coração.

## Cutscenes do Ato I avançadas (v45)
- **Biblioteca:** páginas que sobem girando, tinta que escorre pelas prateleiras, estante que treme.
- **Jardins:** galhos de coral que balançam, enguias que cruzam a cena, anel de luz que pulsa.
- **Recife:** fragmentos de luz que flutuam entre ruínas, bolhas que sobem, farol partido.
- **Catedral:** arcos que pulsam, lua com anel que se expande, altar que brilha, inscrição que se revela nas cenas finais.
- **Abismo:** correntes que descem, destroços que giram, âncora que balança.
- **Coração:** núcleo que pulsa, anéis de vidro que se expandem, quatro vozes de luz que acendem conforme a história avança.
- As cenas do Cais (v44) já eram avançadas. Com esta versão, todas as cutscenes do Ato I têm arte própria animada.
- As cenas antigas foram removidas do código. As cenas de outras fases que usam os mesmos tipos (Recife, Coração) herdam a nova arte.

## Ato I completo com cutscenes avançadas (v46)
- Cenas que ainda estavam na arte antiga foram atualizadas: **Mangue** (raízes que balançam, bolhas de lodo, boia que pisca), **Teatro** (o barco se desenha no lençol conforme as lâmpadas acendem, e a cheia passa como sombra), **Casa das Bombas** (pistões que sobem e descem, rodas de válvula girando, vapor), **Rede** (rede que balança, peixes que atravessam), **Maré** (comportas que abrem e fecham, ondas em sentidos opostos), **Vento** (vela que balança, linhas de vento, sol que surge).
- Com isso, todas as cutscenes do Ato I têm arte animada própria.
- As versões antigas foram removidas do código.
- **Próximo:** cutscenes do Ato II, depois as do Ato III.

## Ato II: cutscenes avançadas, lote 1 (v47)
- **Escuta:** varredura de sonar que gira, com ecos de faróis distantes que piscam e somem.
- **Cardume:** peixes que nadam em formação, com a cauda ondulando; na cena final o cardume inverte a direção.
- **Neblina:** camadas de névoa que deslizam, o farol aparece por trás e as casas visitadas se revelam aos poucos.
- **Ainda não feito no Ato II:** Coral (tipo compartilhado com o Ato III), Portas de Ferro, Conchas Gêmeas, Colar de Pérolas, Correnteza de Setas, Pedras Que Caem, Sopa das Marés e Último Farol.

## Ato II completo com cutscenes avançadas (v48)
- **Coral:** ramos que crescem e recuam, bolhas, núcleo que respira.
- **Portas de Ferro:** portões que deslizam para cima conforme as alavancas são puxadas.
- **Conchas Gêmeas:** conchas que se viram umas para as outras.
- **Colar de Pérolas:** pérolas que balançam num fio curvo e brilham em sequência.
- **Correnteza:** setas que giram e uma linha de corrente que se move pelo canal.
- **Pedras Que Caem:** a fileira tomba em cascata.
- **Sopa das Marés:** letras que surgem na água, uma a uma.
- **Último Farol:** usa a arte do Coral (é a mais simples das cenas do Ato II e pode ser aprimorada depois).
- **Próximo:** Ato III.

## Ato III completo com cutscenes avançadas (v49)
- Cada ramo do Ato III tem arte de cutscene própria:
  - **Apagar** (Mar Sem Luz, Contagem, Fio, Pedra, Breu): mar escuro, luzes que se apagam uma a uma, névoa que desce.
  - **Acender** (Chama, Vela, Forja, Lenha Molhada, Brasa): brasas que sobem, chamas que tremulam sobre a costa.
  - **Guardar** (Arca, Muralha, Ganchos, Fechadura, Selos): cofres que se fecham, engrenagens que giram, escudos que brilham.
  - **Renascer** (Escalada, Encaixe, Sementes, Trilha Alternada, Pontes): raízes que crescem, brotos que se abrem, sol que nasce.
- As cenas do Ato III deixaram de usar a arte genérica do Abismo e do Coral.
- **Próximo:** melhoria completa de performance.

## Performance (v50)
**Diagnóstico (medido no build):**
- O bundle principal tinha 787 kB (238 kB gzip). A causa era `game/fx.ts`, que importa o Pixi inteiro e era usado para `reduzMovimento`. Como AmbienteFase, Resultado e o menu importavam essa função, o Pixi era carregado em todo o jogo, mesmo nas fases que não o usam.
- **Correção:** `reduzMovimento` foi para `game/acessibilidade.ts`, sem dependências. O Pixi agora só entra nas quatro fases que o usam (Cais, Abismo, Jardins e Recife).
- **Resultado:** bundle principal de 787 kB para 553 kB (165 kB gzip), redução de cerca de 30%.

**Ajustes de CPU:**
- Os fundos das fases e do menu (AmbienteFase e CenaMenu) rodam a 30 fps, em vez da taxa da tela. Metade do trabalho, sem diferença visível.

**Verificado sem mudança:**
- Todos os loops de animação são cancelados ao sair da tela (sem vazamento).
- Os fundos pausam quando a aba fica oculta.

**Ainda não medido:** a performance real no navegador (por exemplo, no DevTools, aba Performance). As mudanças acima são medidas no bundle e no código, não no quadro renderizado.

## Atualização do jogo no navegador (v51)
- **Causa:** o jogo é um PWA (instalável, com cache offline). O service worker era gerado, mas nunca registrado no `main.tsx`. Com isso, uma versão nova ficava esperando todas as abas fecharem, e o navegador continuava mostrando o conteúdo antigo: mapa, medalhas, finais e atos.
- **Correção:** `registerSW({ immediate: true })` em `main.tsx`, com `skipWaiting`, `clientsClaim` e `cleanupOutdatedCaches` no Workbox. A versão nova passa a ser ativada e a substituir o cache assim que estiver pronta.
- **Uma vez só:** em um dispositivo que já tinha o jogo instalado, é preciso recarregar à força (ou limpar os dados do site) para trocar o cache antigo pelo novo. A partir daí, as atualizações chegam sozinhas.
- Os dados de progresso (salvo no localStorage) não são afetados.

## Ato IV (v52): ramo Apagar, fase 1
- **Trilha Lembrada** (`phases/Trilha.tsx`), ato IV, ramo Apagar: um caminho aparece por alguns segundos e some. Refaça a sequência de direções de memória. Bater numa parede ou sair da trilha conta como erro e recomeça do início. Dois caminhos (5x4 e 5x5). Estrelas pelos erros: nenhum = 3, até 3 = 2. Som: passo com estalo de memória, erro seco, caminho refeito com acorde; trilha de pulsos de silêncio.
- Cutscene de entrada (arte do ramo Apagar), página *Trilha de memória* no diário e medalha *Memória de mapa*.
- **Ato IV:** 1 de 20 fases (4 ramos de 5). Próximo: segunda fase do ramo Apagar.

## Menu: fundo por ato e organização do mapa (v53)
- **Fundo que não aparecia:** o canvas do menu (`CenaMenu`) cobria por completo o fundo da tela, então as cores de cada ato nunca eram vistas. Agora o próprio canvas usa uma paleta por ato (céu e cor da luz) e muda quando o ato muda.
- **Ato III que "sumia":** os atos III a V só aparecem no mapa quando há fases visíveis para o seu ramo. Quem ainda não escolheu o final no Coração vê, no fim da lista, o aviso "escolha o final no Coração para abrir este ato". Atos sem fases mostram "em construção".
- **Organização do mapa:** cada ato tem seu cabeçalho, e dentro do Ato III as fases ficam agrupadas por ramo ("Ramo do Apagar", "Ramo do Acender" etc.).

## Ato IV (v54): ramo Apagar, fase 2
- **Sombra Espelhada** (`phases/Sombra.tsx`): sua sombra fica na posição espelhada em relação ao eixo vertical. Vence chegando à saída com a sombra sobre a lâmpada. Dois espelhos (mínimos de 4 e 7 passos, em `OTIMOS`, por busca em largura). Estrelas pelos passos: até o mínimo total = 3, até +3 = 2. Som: passo que ecoa do outro lado, lâmpada que acende com a sombra; trilha de pulsos de silêncio.
- Cutscene de entrada (arte do ramo Apagar), página *A sombra do outro lado* no diário, medalha *Luz espelhada*.
- **Ato IV:** 2 de 20 fases. Próximo: fase 3 do ramo Apagar.

## Ato IV (v55): ramo Apagar, fase 3
- **Luar de Linhas** (`phases/Luar.tsx`): lâmpadas acesas ou apagadas. Um toque numa linha (↔) ou coluna (↕) inverte todas as lâmpadas dela. Acenda todas com o menor número de toques. Três fileiras. O mínimo de toques de cada uma é calculado pelo próprio código, testando todas as combinações de linhas e colunas (3, 4 e 4, em `OTIMOS`). Estrelas pelos toques: até o mínimo total = 3, até +2 = 2. Som: clique de vidro ao virar uma fileira, acorde no porto aceso; trilha de pulsos de silêncio.
- Cutscene de entrada (arte do ramo Apagar), página *Luz em linhas* no diário, medalha *Mestre do luar*.
- **Ato IV:** 3 de 20 fases. Próximo: fase 4 do ramo Apagar.

## Ato IV (v56): ramo Apagar, fase 4
- **Ar Contado** (`phases/ArContado.tsx`): cada passo gasta 1 de ar (máximo 6, começa em 4). Bolhas recarregam +2. Sem ar, o mergulho acaba. Dois mergulhos, ambos com mínimo de 7 passos (em `OTIMOS`, por busca em largura sobre posição e ar). Estrelas pelos passos: até o mínimo total = 3, até +3 = 2. Som: braçada com bolha, falha de ar sufocada, chegada à superfície; trilha de pulsos de silêncio.
- Cutscene de entrada (arte do ramo Apagar), página *Fôlego contado* no diário, medalha *Fôlego de ferro*.
- Barra de ar visível na tela para o jogador acompanhar o gasto.
- **Ato IV:** 4 de 20 fases. Próximo: fase 5 do ramo Apagar.

## Armazém do Porto mais fácil (v57)
- **Menos pedras:** de 4 e 5 para 3 e 4 pedras por rodada.
- **Histórico das pesagens:** cada pesagem fica listada abaixo da balança (quem estava em cada prato e qual lado desceu), para o jogador não depender de memória.
- **Feedback na ordem errada:** a mensagem diz quantas pedras já estão no lugar certo, em vez de só dizer que a ordem está errada.
- **Estrelas mais generosas:** 3 estrelas com custo até 20 (antes 15), e 2 estrelas até 28 (antes 22). O custo é o número de pesagens mais 3 por cada ordem errada.
- Os pesos continuam escondidos, e a regra da balança não mudou.

## Menu: animação de fundo restaurada (v58)
- **Causa:** a tela principal do menu recebia a classe de fundo do ato (`ato-N`), que pintava um gradiente opaco sobre a área central. Esse gradiente cobria o canvas animado (medusas, feixes de luz, cidade), e só as bordas continuavam visíveis.
- **Correção:** a tela principal ganhou a classe `menu-raiz`, que remove o fundo. Agora o canvas aparece por inteiro, na coluna central e nas bordas.
- As classes `ato-N` continuam valendo para as telas das fases. No menu, o ato só colore molduras e o orbe.

## Legibilidade do título e da frase do menu (v59)
- O título "Lanterna Submersa", a linha do ato e a frase de abertura passam a ter uma sombra escura por trás das letras. Assim, continuam legíveis sobre o fundo animado.
- A frase de abertura ficou mais clara (cor espuma, sem transparência).

## Ato IV (v60): ramo Apagar completo
- **Chaves do Breu** (`phases/Chaves.tsx`), ramo Apagar, fase 5: chaves vermelha (r) e azul (b), que se pegam ao pisar e não se gastam. Portas (R e B) só abrem com a chave da mesma cor. Duas rodadas, com mínimos calculados pelo código por busca em largura sobre (posição, chaves). Estrelas pelos passos: até o mínimo total = 3, até +3 = 2. Som: chave que tine, passo, porta trancada que bate, porta aberta com acorde; trilha de pulsos de silêncio.
- Cutscene de entrada (arte do ramo Apagar), página *Chaves do breu* no diário, medalha *Chaveiro do breu*.
- **Ramo Apagar do Ato IV: 5 de 5 fases completo.** Ato IV: 5 de 20 fases. Próximo: ramo Acender do Ato IV.

## Ato IV (v61): ramo Acender completo (5 fases)
- **Brasa Viciosa:** cada casa exige um número de vizinhas queimando. Você acende algumas à mão, e o fogo corre sozinho. Duas costas; mínimo de toques calculado pelo código por enumeração.
- **Coluna de Vapor:** a coluna c está quente no turno t quando (t + c) % 3 == 0. Você anda ou espera, sem pisar numa coluna quente. Duas travessias; mínimo de turnos por busca em largura sobre (posição, turno módulo 3).
- **Pedra Aquecida:** o fogo sai de F e se espalha por casas livres. Ponha pedras para que nenhum alvo T queime. Dois campos; mínimo de pedras por enumeração.
- **Anel de Lamparinas:** seis lamparinas em anel; cada giro move todas uma casa. Gire até as chamas caírem nas marcas. Mínimo de giros calculado pelo código.
- **Fósforo Curto:** cada fósforo acende uma linha ou coluna inteira de lenha. Cubra toda a lenha com o mínimo de fósforos; enumeração das linhas e colunas.
- Cada fase tem estrelas pelo custo acima do mínimo, cutscene de entrada (arte do Acender), página no diário, medalha, som próprio e trilha.
- **Ato IV:** 10 de 20 fases (Apagar e Acender completos). Próximo: ramo Guardar.

## Ato IV (v62): ramo Guardar completo (5 fases)
- **Tanques da Chuva** (`phases/Tanques.tsx`): jarros de capacidades fixas. Encha, esvazie ou passe água entre eles até um jarro marcar o volume pedido. Duas rodadas (5 e 3 litros → 4; 7, 4 e 3 → 5). Mínimo de ações por busca em largura.
- **Simetria do Cofre** (`phases/Simetria.tsx`): a grade precisa ser simétrica no eixo vertical. Algumas casas já vêm travadas. Mínimo de pinturas por enumeração.
- **Prateleiras Iguais** (`phases/Prateleiras.tsx`): divida as cargas em prateleiras de mesmo peso. Duas rodadas (2 e 3 prateleiras).
- **Trilhos da Mina** (`phases/Trilhos.tsx`): a vagoneta segue as chaves. Ajuste as chaves até ela parar na estação pedida. Mínimo de trocas por enumeração das configurações.
- **Torre de Caixas** (`phases/TorreCaixas.tsx`): empilhe caixas de altura 1, 2 e 3 até a altura exata. Mínimo de caixas por programação dinâmica (alturas 7 e 10).
- **Correção:** a fase Torre do Ato I (`phases/Torre.tsx`) foi restaurada. Na primeira versão desta rodada, a nova torre de caixas tinha sobrescrito esse arquivo; ela agora tem o id `torrecaixas`.
- **Ato IV:** 15 de 20 fases (Apagar, Acender e Guardar completos). Próximo: ramo Renascer do Ato IV.

## Título do menu (v63)
- O título "Lanterna Submersa" usa um degradê de cor de lanterna (creme e âmbar) que passa para o azul-claro do oceano, com um brilho âmbar em volta.
- Removida a sombra escura que deixava as letras com aparência de lama.

## Ato IV completo (v64)
- **Ramo Renascer, fases 4 e 5:**
  - **Ninho de Pássaros:** pouse pássaros para que toda casa livre tenha um pássaro em cima ou ao lado. Duas rodadas (mínimos de 4 e 3, calculados pelo código por enumeração).
  - **Colheita Completa:** percorra o canteiro colhendo cada casa livre uma única vez, sem passar pela cerca nem repetir casas. Estrelas pelo número de voltas.
- Os cinco arquivos de fase de origem desconhecida (Adubo, Arvore, Colheita, Polinizacao, Regador) foram removidos, a pedido do Zé. O build de tipos volta a passar.
- **Ato IV:** 20 de 20 fases. Próximo: Ato V.

## Ato V, fase 1 (v65)
- **Travessia dos Quatro Pontos** (`phases/Travessia.tsx`): cada marco (A, B, C, D) é um pedaço de um dos ramos. Passe pelos quatro, em qualquer ordem, e chegue à saída. Duas travessias, com mínimos de 16 e 12 passos, calculados por busca em largura sobre (posição, marcos visitados). Estrelas pelos passos.
- Sem ramo: é uma fase comum, visível para todos os jogadores.
- Cutscene de entrada, página *Os quatro caminhos* no diário, medalha *Ponto de encontro*.
- **Estrutura assumida do Ato V:** 5 fases comuns, pela decisão de convergência dos ramos. Ato V: 1 de 5. Próximo: fase 2.

## Ato V, fase 2 (v66)
- **Bússola Girada** (`phases/Bussola.tsx`): a bússola gira 90° a cada passo dado, então a direção que você aperta vira outra direção no mapa. Bater numa parede não gira a bússola. Duas rodadas (mínimos de 7 e 5 passos, por busca em largura sobre posição e rotação). Estrelas pelos passos. Desfazer disponível.
- Cutscene de entrada, página *A bússola que gira* no diário, medalha *Norte de cabeça*.
- **Ato V:** 2 de 5 fases (estrutura assumida, a confirmar). Próximo: fase 3.

## Ato V, fase 3 (v67)
- **Cores que Não se Repetem** (`phases/Cores.tsx`): cada casa tem uma cor (a, b ou c). Você não pode pisar numa casa da mesma cor que a casa anterior. A interface avisa quando o passo é bloqueado. Duas rodadas, com mínimos calculados por busca em largura sobre (posição, cor anterior). Estrelas pelos passos.
- Cutscene de entrada, página *Cores em sequência* no diário, medalha *Sem repetir a cor*.
- **Ato V:** 3 de 5 fases (estrutura assumida, a confirmar). Próximo: fase 4.

## Ato V, fase 4 (v68)
- **Mosaico de Luz** (`phases/Mosaico.tsx`): grade 4x4 com algumas casas travadas. Cada linha e coluna precisa ter metade das casas acesas, e não pode haver três casas seguidas do mesmo estado. Duas rodadas, com mínimos de 6 e 4 casas por enumeração exaustiva. Validado: cada mosaico tem pelo menos uma solução.
- Cutscene de entrada, página *Luz equilibrada* no diário, medalha *Equilíbrio de luz*.
- **Ato V:** 4 de 5 fases (estrutura assumida, a confirmar). Próximo: fase 5.

## Ato V, fase 5 (v69)
- **Volta pelo Mar** (`phases/Volta.tsx`): trace a ida de S até E e depois uma volta de S até E que não passe por nenhuma casa da ida (exceto S e E). Duas rodadas, com mínimos de 10 e 8 passos, por enumeração exaustiva de caminhos simples. Validado: os dois mapas têm par de caminhos disjuntos.
- Cutscene de entrada, página *Ida e volta* no diário, medalha *Caminho de volta*.
- **Ato V:** 5 de 5 fases (estrutura assumida, a confirmar).

## Layout das fases no celular (v70)
- Problema: no Galaxy S20 FE, as fases (como o Porão da Estrela-d'Alva) exigiam rolar a tela para ver o tabuleiro e os controles.
- Correção: as 69 fases usam a classe `fase-compacta`, com espaçamento e margens menores. Os tabuleiros (`role="grid"` e `role="img"` com rótulo) têm largura máxima de 50% da altura visível da tela (`50dvh`). Limitar a largura, e não a altura, mantém as casas quadradas.
- Não testado no aparelho. Se o tabuleiro ficar pequeno demais ou as casas deixarem de ser quadradas, o próximo passo é ajustar a largura pela altura disponível.

## Auditoria de legibilidade (v72)
- **Coluna de Vapor:** o sinal que marca as colunas quentes passou de 9px para um símbolo de tamanho normal, mais visível no celular.
- Fases anteriores ao Ato IV (Arca, Espelhos, Final, Sinos, Armazém, Biblioteca, Coração, Eclusa e Pérolas) usam textos pequenos ou de baixo contraste. Não foram alteradas nesta rodada.

## Capturas e GIF para divulgação (v73)
- `tools/capturar_gif.py` abre a versão compilada no navegador, em tamanho de celular, e tira um print de cada tela do roteiro: menu e uma fase de cada ato (Cais, Sombra, Viciosa, Alturas e as cinco do Ato V).
- O script grava o progresso em `lanterna-submersa:save`, então as fases abrem sem precisar jogar tudo.
- Saída: `tools/capturas/*.png` e `tools/lanterna.gif`.
- Como usar: `npm run build`, depois `npm run preview` e, em outro terminal, `python tools/capturar_gif.py --url http://localhost:4173`.
- Não testado num navegador real no ambiente de desenvolvimento. Se algum print sair com erro, me manda a mensagem de erro.

## Cutscene cinematográfica do Cais (v74)
- **Tela panorâmica:** faixas pretas sobem e descem nas bordas no início, como em um filme.
- **Câmera:** o desenho do cais faz um movimento lento de aproximação e deslocamento lateral, em 22 segundos por ciclo.
- **Vinheta e grão de filme:** bordas escurecidas e um grão sutil que se move, para dar textura.
- **Raios de luz:** três feixes que balançam suavemente vindos do alto.
- **Título de capítulo:** "Capítulo I · O Cais Afundado" aparece na primeira cena e some sozinho.
- O texto e a dica de continuar ficam acima das faixas, para nunca serem cobertos.
- Só o Cais recebe essa versão. As outras cutscenes continuam com a arte anterior.

## Cutscene cinematográfica da Biblioteca (v75)
- A Biblioteca Alagada (fase 2 do Ato I) recebe o mesmo tratamento do Cais: faixas de tela panorâmica, vinheta, grão de filme, raios de luz, câmera lenta e título de capítulo na primeira cena.
- O título de capítulo agora depende da fase: "Capítulo I · O Cais Afundado" no Cais e "Capítulo I · A Biblioteca Alagada" na Biblioteca.
