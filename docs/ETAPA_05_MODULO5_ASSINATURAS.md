# Etapa 5 — Módulo 5: Assinaturas Recorrentes

> **Status:** concluído em código. Nenhum comando, teste, instalação ou serviço externo foi executado.

## Decisões arquiteturais

Uma assinatura é representada por uma regra em `recurring_rules` com `rule_type = 'subscription'`. A função SQL `create_subscription_rule` cria a regra e invoca `generate_recurring_entries` na mesma transação.

`generate_recurring_entries` é idempotente: a constraint única `(recurring_rule_id, occurred_on)` impede a duplicação quando a geração for acionada mais de uma vez. Para esta entrega, o horizonte de previsão é informado pelo usuário em `generate_until`. No futuro, uma rotina agendada poderá estender as regras ativas sem modificar os lançamentos existentes.

Assinaturas sem cartão são registradas como `other`; se um cartão for escolhido, recebem `credit_card` e aparecem naturalmente nas consultas de fatura.

Regras e previsões de assinatura são vinculadas ao controle financeiro ativo, garantindo que os participantes vejam a mesma projeção sem acessar outros controles.

## Arquivos criados ou alterados

- **Alterado:** `supabase/migrations/descricao_consulta.sql`
- `src/features/subscriptions/domain/subscription.ts`
- `src/features/subscriptions/application/subscription-schema.ts`
- `src/features/subscriptions/application/subscription-actions.ts`
- `src/features/subscriptions/infrastructure/supabase-subscription-repository.ts`
- `src/features/subscriptions/presentation/subscription-manager.tsx`
- `src/app/(dashboard)/subscriptions/page.tsx`
- `docs/ETAPA_05_MODULO_ASSINATURAS.md`

## Ação manual obrigatória no Supabase

Caso o script da Etapa 2 já tenha sido aplicado, abra **SQL Editor** no Supabase e execute manualmente somente os blocos iniciados por:

1. `-- Materializa lançamentos de uma regra recorrente`
2. `-- Cria uma assinatura e materializa seus lançamentos futuros`

Os blocos estão em `supabase/migrations/descricao_consulta.sql`, após a função de parcelamentos e antes da view de faturas.

## Funcionalidades entregues

- Cadastro de assinaturas com valor, cartão opcional, frequência, dia de cobrança, categoria e observações.
- Frequências mensal, trimestral, semestral e anual.
- Geração automática de lançamentos previstos até uma data escolhida.
- Consulta das previsões geradas por assinatura.
- Garantia de idempotência para impedir lançamentos duplicados.
- Edição da regra com recálculo apenas das previsões futuras pendentes.
- Encerramento que preserva lançamentos pagos e remove previsões pendentes futuras.
- Seções separadas para assinaturas ativas e encerradas, com opção de reativar.
- Exclusão definitiva apenas quando não há pagamentos no histórico.
- Rota protegida: `/subscriptions`.

## Teste manual sugerido — não executado

1. Execute manualmente os dois novos blocos SQL no Supabase.
2. Acesse `http://localhost:3000/subscriptions` após iniciar o projeto manualmente.
3. Cadastre `Netflix`, valor `39,90`, frequência mensal, dia `10` e geração até o fim do próximo ano.
4. Confira que os lançamentos previstos aparecem na assinatura.
5. Repita com um cartão selecionado e valide que a assinatura possui o cartão exibido.
6. Encerre a assinatura e confirme que ela vai para a seção de encerradas sem apagar pagamentos anteriores.
7. Reative-a e confirme a geração de novas previsões.

## Próximo módulo

O próximo módulo da Etapa 5 é **Contas Fixas**, reutilizando a infraestrutura de regras recorrentes com frequências mensal, trimestral, semestral e anual.