---
titulo: Quando a mediana esconde o gargalo
data: 2026-11-09
resumo: O servidor MCP apontou o gargalo errado porque eu ordenava as etapas pela mediana. A cauda longa estava em outra etapa.
---

O InfoCAIJ MCP responde perguntas sobre a fila de máquinas da CAIJ Informática. Uma das ferramentas deve dizer **onde a fila trava**.

## O erro

A primeira versão escolhia o gargalo pela **mediana** do tempo em cada etapa. O resultado apontava uma etapa com mediana de 0,8 h, o que não parecia um problema.

Com dados reais, o problema era outro: a etapa "Aguardando retirada". A maioria das máquinas passava rápido por ela, mas cerca de 10% esperavam **mais de 3 dias** (p90 de 77,8 h). A mediana não enxerga isso.

## O ajuste

- O gargalo passou a ser escolhido pela **soma de horas** acumuladas na etapa, que pesa a cauda longa.
- Entrou na suíte um teste que reproduz a cauda longa, para o erro não voltar.

## O que eu levo disso

Só os dados reais mostraram o defeito, e foi um teste que o fixou. A avaliação com dados reais pega o que a avaliação de exemplo não pega.

Projeto: [InfoCAIJ MCP](/projetos/infocaij-mcp/).
