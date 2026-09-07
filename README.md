# ReparaJá

Plataforma de obras, remodelações e manutenção. Cliente usa a plataforma de graça;
o profissional paga comissão progressiva só quando fecha um trabalho.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- PostgreSQL + Prisma (v7, com driver adapter `@prisma/adapter-pg`)
- Autenticação própria (email/password + JWT em cookie httpOnly)

## Desenvolvimento local

1. Criar `.env` a partir de `.env.example` (ou ajustar o `.env` existente) com `DATABASE_URL` e `JWT_SECRET`.
2. Instalar dependências: `npm install`
3. Aplicar migrações: `npx prisma migrate dev`
4. Popular escalões de comissão: `npx prisma db seed`
5. Correr em desenvolvimento: `npm run dev`

## Estado do projeto

Este projeto está a ser construído por fases a partir de um protótipo estático
(`legacy/mockup.html`, mantido só como referência de UX/UI — não está ligado à
aplicação real).

- [x] Fase 1 — projeto Next.js, schema base (`User`, `ProfessionalProfile`,
      `CommissionTier`), autenticação própria (registo/login/logout/sessão),
      dashboards protegidas por papel.
- [x] Fase 2 — pedidos, orçamentos com linhas e motor de cálculo de comissão
      progressiva. Construtor de orçamento pensado para telemóvel: o
      profissional toca numa categoria (Mão de obra, Materiais, Deslocação...)
      para acrescentar logo a linha, preenche quantidade/preço e envia — sem
      escrever tudo de raiz. Todos os totais (linha, subtotal, IVA, comissão)
      são recalculados no servidor, nunca confiando no valor vindo do cliente.
- [ ] Fase 3 — pagamentos via Stripe Connect (`PaymentService`).
- [ ] Fase 4 — chat persistente com deteção de contactos externos.
- [ ] Fase 5 — disputas, avaliações reais, "A Minha Casa", métricas.

## Notas importantes

- Não existe nenhuma simulação de pagamento ou "garantia"/escrow no código —
  isso só será implementado quando a integração Stripe Connect estiver
  realmente ligada (Fase 3).
- Os escalões de comissão vivem na tabela `commission_tiers`, não estão
  hardcoded no código.
