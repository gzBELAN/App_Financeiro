# Etapa 5 — Módulo 3: Bancos, Contas e Cartões

> **Status:** concluído em código. Nenhum comando, instalação, teste ou serviço externo foi executado.

## Decisões arquiteturais

O módulo usa Domain, Application, Infrastructure e Presentation. A rota `/cards` passou a ser a central de **Bancos e contas**: primeiro são cadastradas as contas bancárias; depois, cartões são vinculados a elas.

Cada conta armazena instituição, nome, tipo, saldo atual e cor. Os tipos disponíveis são conta corrente, poupança, dinheiro, investimento e outra. Cartões suportam os tipos crédito, débito e crédito/débito, mantendo bandeira, limite, fechamento, vencimento e cor.

Cartões podem ser **arquivados** por meio de `is_active = false`; os arquivados aparecem em seção separada, podem ser reativados e não são aceitos em novos parcelamentos ou assinaturas. Contas também podem ser arquivadas, preservando o histórico e os cartões já vinculados.

A exclusão definitiva exige que o cartão esteja arquivado e só é permitida quando não existem lançamentos vinculados. Essa regra preserva compras, parcelas e faturas históricas.

O limite é convertido para centavos no servidor. O controle do limite utilizado será calculado a partir dos lançamentos e itens de fatura no módulo de faturas/dashboard, evitando duplicação de valores derivados nesta tabela.

Contas e cartões pertencem ao controle financeiro ativo e podem ser usados por todos os editores desse mesmo controle. A configuração de salário mensal pertence ao controle e só pode ser alterada pelo proprietário, pois altera o planejamento compartilhado.

## Arquivos criados

- `src/features/credit-cards/domain/credit-card.ts`
- `src/features/credit-cards/application/credit-card-schema.ts`
- `src/features/credit-cards/application/credit-card-actions.ts`
- `src/features/credit-cards/infrastructure/supabase-credit-card-repository.ts`
- `src/features/credit-cards/presentation/credit-card-manager.tsx`
- `src/features/bank-accounts/domain/bank-account.ts`
- `src/features/bank-accounts/application/bank-account-actions.ts`
- `src/features/bank-accounts/infrastructure/supabase-bank-account-repository.ts`
- `src/features/bank-accounts/presentation/bank-account-manager.tsx`
- `src/app/(dashboard)/cards/page.tsx`
- `supabase/migrations/bank_accounts_and_salary.sql`

## Funcionalidades entregues

- Cadastro de contas com nome, banco/instituição, tipo, saldo atual e cor.
- Arquivamento de contas, preservando lançamentos e cartões vinculados.
- Cadastro do salário líquido mensal planejado por controle financeiro.
- Cadastro de múltiplos cartões vinculados a uma conta, com bandeira, tipo, limite, fechamento, vencimento e cor.
- Listagem visual em cartões responsivos.
- Edição de cartões ativos.
- Arquivamento com confirmação, preservando o histórico.
- Seção separada para cartões arquivados.
- Reativação de cartão arquivado.
- Exclusão definitiva segura de cartão arquivado sem lançamentos vinculados.
- Validações de limite positivo, dias entre 1 e 31, cor e tamanho dos campos.
- Atualização das páginas de cartões e dashboard após alterações.

## Rota protegida

`/cards`

## Teste manual sugerido — não executado

1. Configure o Supabase e as variáveis locais das etapas anteriores.
2. Inicie manualmente com `npm run dev`.
3. Entre na aplicação e abra `http://localhost:3000/cards`.
4. Execute previamente a migração `supabase/migrations/bank_accounts_and_salary.sql` no Supabase.
5. Cadastre uma conta, por exemplo: banco `Nubank`, nome `Conta principal`, tipo `Conta corrente`, saldo `1.000,00`.
6. Informe o salário mensal líquido planejado, por exemplo `5.000,00`.
7. Cadastre um cartão vinculado à conta: nome `Nubank Platinum`, bandeira `Mastercard`, tipo `Crédito`, limite `5.000,00`, fechamento `20`, vencimento `27`.
8. Edite a conta ou o cartão e confirme a atualização.
9. Arquive o cartão e confirme que ele aparece na seção de arquivados; reative-o em seguida.

## Próximo módulo

O próximo módulo é **Parcelamentos**, responsável por criar a compra de origem e gerar automaticamente as despesas futuras vinculadas ao cartão e, indiretamente, à conta bancária escolhida.