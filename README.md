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
- [x] Fase 3 — camada `PaymentService` com fluxo de pagamento e payout
      **totalmente simulados** (`src/lib/payments`). O cliente "paga" e
      confirma a conclusão do trabalho, o profissional "recebe" o valor
      líquido — mas nada disto liga a um processador real. Cada ecrã com
      dinheiro envolvido mostra um aviso "MODO SIMULADO" e cada registo na
      BD fica com `provider: "mock"`. Trocar para Stripe Connect no futuro é
      só escrever uma nova implementação de `PaymentService` — o resto da
      app não muda.
- [x] Fase 4 — chat persistente com deteção de contactos externos. Uma
      conversa por par (pedido, profissional), com histórico cronológico
      auditável: o backend insere automaticamente eventos de sistema
      (orçamento enviado/aceite/recusado, pagamento confirmado/falhado,
      trabalho concluído) na mesma conversa que as mensagens normais.
      Deteção de telefone/email/URL/apps de mensagens/frases de "combinar
      fora da plataforma" corre sempre no servidor (`src/lib/contact-detection.ts`)
      — nunca só no frontend — e bloqueia o envio com uma mensagem clara,
      sem apagar o que o utilizador escreveu.
- [ ] Fase 5 — disputas, avaliações reais, "A Minha Casa", métricas.

### Modo escuro/claro

Toggle manual no Topbar (persistido em localStorage, com fallback ao tema do
sistema na primeira visita). A paleta usa tokens CSS semânticos, por isso
tematizar é só redefinir esses tokens sob `:root.dark` — não é preciso
prefixar `dark:` em cada componente.

### Extra: pedido de fatura ao aceitar orçamento

Ao aceitar um orçamento, o cliente escolhe se quer fatura. Se sim, preenche
nome/firma, NIF (validado com o dígito de controlo real, não só o formato),
morada, código postal e localidade. Fica gravado como snapshot imutável no
`Job` — mudar os dados de faturação do perfil depois não altera um trabalho
já contratado. Os dados também ficam guardados no perfil do cliente para
pré-preencher da próxima vez. O profissional vê estes dados na página do
trabalho (precisa deles para emitir a fatura); a emissão da fatura em si
(documento fiscal, série, comunicação à AT) não está implementada — isto só
guarda a intenção e os dados.

### Extra: mapa "profissionais perto de ti"

Página `/cliente/mapa` com Leaflet + OpenStreetMap (sem chave de API). O
cliente pesquisa uma zona ou usa a localização do navegador; os profissionais
mostrados vêm de `ProfessionalProfile.latitude/longitude`, preenchidas por
geocodificação best-effort (Nominatim) da localização indicada no registo —
corre depois de responder ao pedido (`after()` do Next.js), nunca bloqueia o
registo. Se a geocodificação falhar, o profissional só não aparece no mapa.
Categorias e nº de trabalhos concluídos mostrados vêm de dados reais
(orçamentos aceites e trabalhos concluídos), nunca inventados.

## Comissão: visibilidade por papel

A comissão ReparaJá só é visível ao **profissional**. O cliente nunca a vê —
nem no ecrã nem no JSON devolvido pelas rotas que ele chama (`toClientSafeJob`
em `src/lib/serialize.ts` remove os campos de comissão antes de responder).
Isto inclui também não expor o valor líquido do profissional ao cliente, já
que dava para deduzir a comissão por subtração ao valor total.

## Notas importantes

- Não existe nenhuma simulação de pagamento ou "garantia"/escrow real — só o
  fluxo simulado descrito na Fase 3.
- Os escalões de comissão vivem na tabela `commission_tiers`, não estão
  hardcoded no código.
- O mapa e a geocodificação dependem de acesso à Internet em runtime
  (tiles do OpenStreetMap e Nominatim) — não têm chave de API, mas também
  não têm SLA. Para produção com volume, considerar um serviço pago.
- A deteção de contactos externos usa um limiar de 9+ dígitos para
  identificar números de telefone — por isso também apanha NIF ou IBAN
  partilhados no chat (ex: para efeitos de fatura). É uma limitação
  conhecida e aceite para já; sem mais contexto na mensagem não há forma
  simples de distinguir isso de um telefone.
