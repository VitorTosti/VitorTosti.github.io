---
titulo: Quem escreve não revisa
data: 2026-11-08
resumo: Cinco regras que fizeram um time de agentes de IA entregar o Kairo sem pisar no código um do outro.
---

O Kairo foi construído por um orquestrador e cinco agentes especialistas, cada um dono de uma área do código. O que fez isso funcionar foram regras simples.

## As regras

- **Contratos primeiro.** Os tipos compartilhados só mudam pelo orquestrador, que avisa os outros agentes.
- **Um branch por agente**, em um worktree isolado. Só o orquestrador faz o merge.
- **Subagente não chama subagente.** Toda coordenação passa pela sessão principal.
- **Verifique, não acredite.** Nenhuma entrega entra sem typecheck, lint e testes verdes.
- **Quem escreve não revisa.** Desde a Fase 2b, uma sessão que não escreveu o código revisa cada branch antes do merge.

## O que a revisão independente pegou

Escritas que deveriam ser atômicas e um limite de 200 clientes que fazia o aviso por WhatsApp falhar. Eram erros que quem escreveu o código não via.

Projeto: [Kairo](/projetos/kairo/).
