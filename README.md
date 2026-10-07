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
| 5 | Recife dos Naufrágios | Coleta: fragmentos antes do ar acabar |
| 6 | Oficina do Faroleiro | Criação: bancada, forja e foco da lente |
| 7 | Catedral das Marés | Sincronia: mecanismos na maré certa |
| 8 | Sala dos Sinos | Escuta: ordenar os sinos e afinar o quinto de ouvido |
| 9 | Observatório Naufragado | Navegação: três anéis acoplados, Estrela no topo |
| 10 | Correntes do Abismo | Sobrevivência: resistir até a corrente acalmar |
| 11 | Coração da Lanterna | Duelo de sequência + 4 finais |

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
