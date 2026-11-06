# Design

## Portfólio existente
Preservar papel quase preto, texto claro, destaque âmbar, Newsreader Variable e JetBrains Mono. A esfera de projetos permanece na abertura; a mensagem de trabalho e os caminhos de ação ficam explícitos. Entre vias é o primeiro destaque, com atalho na abertura, apresentação editorial e prévia ampla da cidade 3D. CAIJ.com.br e InfoCAIJ continuam na seção de destaques. Acesso ao app inicia a experiência guiada; o atalho de desafio usa `?desafio=1` para iniciar diretamente a comparação.

## Entre vias — /projetos/entrevias/
Laboratório de mobilidade educativo independente. Mapa como superfície principal, fundo azul-marinho, vias azul-acinzentadas, veículos laranja e ônibus verde-água. Painel de controles claro na lateral em desktop e abaixo do mapa em celular. Títulos editoriais Newsreader, controles sem serifa e números monoespaçados. Geometria no Canvas representa a rede real do modelo. Não usar uma imagem decorativa no lugar da simulação.

Mapa, controles e indicadores são prioritários. Explicação das hipóteses fica em conteúdo expansível abaixo. Movimento reduzido inicia pausado. Teclado opera cenários, ajustes e reprodução. Redimensionamento preserva a simulação. Execução para fora da tela ou em aba oculta. Informar que os números são simulados e não calibrados.

### Maquete 3D
Visualização principal em Three.js: base isométrica, prédios claros com alturas distintas, janelas e coberturas, parques com árvores, vias escuras e carros e ônibus derivados das posições do motor. InstancedMesh compartilha geometrias para reduzir chamadas de desenho. Luz de preenchimento e luz solar; sombras apenas em desktop, resolução limitada em celular. Sem órbita automática. Câmera responde sob demanda mesmo em pausa, com arraste em desktop, dois dedos em celular e botões acessíveis de giro, zoom e recentralização. Um dedo preserva a rolagem mobile. Movimento reduzido mantém a simulação pausada. Alternar para o mapa 2D não reinicia estado. Falha ou perda do contexto WebGL retorna ao mapa 2D.

Zoom de 0,7× a 8×, presets de visão geral, cruzamento, avenida e parque, foco na interseção selecionada e tela cheia. Botão direito move a câmera lateralmente. O entorno inclui rio, pontes e passeios arborizados com mobiliário, apenas como contexto visual, sem viagens simuladas fora da rede. Cada cruzamento interno tem quatro semáforos com poste, suporte, caixa e três lentes. Cores e autorização de passagem usam `trafficSignal` do motor, incluindo amarelo antes da troca. Sombras estáticas são calculadas uma vez; veículos não projetam sombras dinâmicas.

### Experiência guiada
Na página inicial, a prévia da cidade é uma cena Three.js real embutida na seção de destaque, sem iframe ou redirecionamento. Ela carrega ao entrar na tela, tem pausa e zoom, suspende fora de vista e em aba oculta e começa parada com movimento reduzido. A imagem estática permanece como fallback. Os botões levam ao app completo e ao desafio.

Introdução modal com título grande e progressão em seis etapas. A abertura e o encerramento ocupam a tela; demonstrações usam um painel em primeiro plano, deixando a cidade e os controles destacados visíveis. A animação de texto combina deslocamento curto e nitidez; os ajustes numéricos e os veículos vêm do modelo. Em celular, a maquete ocupa o topo e o painel fica abaixo. Há pausa, voltar, pular, Escape e repetição. Movimento reduzido usa etapas manuais sem transição espacial. O fechamento restaura os dados e o estado de reprodução anteriores.

O desafio mantém demanda, duração e semente iguais entre referência e tentativas. A apresentação usa uma tabela com chegadas, veículos parados, fila de entrada e tempo médio; não esconder indicadores que pioraram. Cálculo, edição, resultado e cancelamento têm estados explícitos. Ajustes posteriores tornam o resultado anterior identificado como desatualizado.
