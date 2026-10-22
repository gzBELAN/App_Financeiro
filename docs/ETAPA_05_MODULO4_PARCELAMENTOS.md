# Etapa 5 — Módulo 4: Parcelamentos

> **Status:** concluído em código. Nenhum comando, teste, instalação ou serviço externo foi executado.

## Decisões arquiteturais

Parcelamentos são criados por uma função PostgreSQL transacional: `public.create_installment_purchase`. A função grava a compra de origem e todas as parcelas em uma operação atômica. Se qualquer inserção falhar, nada é salvo parcialmente.

O valor em centavos é dividido entre as parcelas sem perder precisão. Quando houver resto, os centavos são distribuídos nas primeiras parcelas. Por exemplo, `R$ 100,00` em `3x` resulta em `R$ 33,34`, `R$ 33,33` e `R$ 33,33`.

As datas futuras preservam o dia da compra sempre que possível. Se um mês tiver menos dias, a parcela é criada no último dia daquele mês. Parcelas com competência anterior ao dia do cadastro são registradas como **pagas**; a competência atual e as futuras permanecem **pendentes** e compõem as faturas abertas. Como os cartões são vinculados a uma conta bancária, a instituição de origem da compra também fica determinada por esse vínculo.

A função SQL de parcelamento recebe o controle financeiro ativo e valida a permissão de editor antes de criar a compra e as parcelas.

A interface de parcelamentos foi integrada à página **Lançamentos** (`/expenses`). A rota legada `/installments` apenas redireciona para essa página.

## Arquivos criados ou alterados

- **Alterado:** `supabase/migrations/descricao_consulta.sql`
- `src/features/installments/domain/installment-purchase.ts`
- `src/features/installments/application/installment-purchase-schema.ts`
- `src/features/installments/application/installment-purchase-actions.ts`
- `src/features/installments/infrastructure/supabase-installment-purchase-repository.ts`
- `src/features/installments/presentation/installment-manager-v2.tsx`
- `src/app/(dashboard)/installments/page.tsx`
- `src/app/(dashboard)/expenses/page.tsx`
- `docs/ETAPA_05_MODULO_PARCELAMENTOS.md`

## Ação manual obrigatória no Supabase

O script da Etapa 2 foi atualizado com a função `create_installment_purchase`. Se você já executou uma versão anterior do arquivo no Supabase, abra **SQL Editor**, copie novamente o conteúdo completo de `supabase/migrations/descricao_consulta.sql` e execute-o manualmente.

Para bancos que já possuem as migrações de controle compartilhado e integridade aplicadas, execute manualmente o arquivo `supabase/migrations/20261022_installment_historical_status.sql` no **SQL Editor**. Ele substitui somente a função de criação de parcelamentos; não altera compras já registradas.

O script usa comandos seguros de recriação para funções e views, mas tipos e tabelas não usam `if not exists`. Portanto, em uma base já inicializada, execute **somente** o bloco iniciado pelo comentário `-- Cria uma compra parcelada` e terminado antes de `-- View somente de leitura`.

## Funcionalidades entregues

- Registro de compra com descrição, valor total, data, cartão, categoria e observações.
- Geração automática de 2 a 360 parcelas mensais.
- Vínculo das parcelas ao cartão e à compra de origem.
- Listagem da parcela atual, parcelas restantes e cronograma completo.
- Preservação exata do valor total em centavos.
- Consulta exclusiva de cartões ativos no formulário.
- Seleção de parcelas pendentes para adiantamento.
- Desconto opcional ao adiantar parcelas; quando informado, ele é distribuído proporcionalmente entre as parcelas selecionadas.
- Parcelas adiantadas são marcadas como pagas na data atual e deixam de compor previsões pendentes.

## Rota protegida

`/expenses` concentra lançamentos e parcelamentos. A rota legada `/installments` redireciona para ela.

## Teste manual sugerido — não executado

1. Aplique manualmente a função SQL conforme a seção anterior.
2. Em `/cards`, cadastre uma conta bancária e um cartão de crédito ativo vinculado a ela.
3. Acesse `http://localhost:3000/expenses`.
4. Registre uma compra de `R$ 1.200,00` em `12` parcelas.
5. Confira que o cronograma contém parcelas de `1/12` a `12/12` e que o total é `R$ 1.200,00`.
6. Registre uma compra cujo total não seja divisível pelo número de parcelas e valide a distribuição de centavos.
7. Selecione parcelas pendentes, adiante-as sem desconto e confirme que são marcadas como pagas.
8. Repita com desconto e confirme que a soma dos valores pagos diminui exatamente pelo desconto informado.

## Próximo módulo

O próximo módulo da Etapa 5 é **Assinaturas Recorrentes**, com frequência, dia de cobrança, cartão opcional e geração de lançamentos futuros.