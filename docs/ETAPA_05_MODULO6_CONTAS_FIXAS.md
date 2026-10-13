# Etapa 5 — Módulo 6: Contas Fixas

> **Status:** concluído em código. Nenhum comando, teste, instalação ou serviço externo foi executado.

## Decisões arquiteturais

Contas fixas reutilizam a infraestrutura de `recurring_rules`, identificadas por `rule_type = 'fixed_expense'`. A nova função transacional `create_fixed_expense_rule` cria a regra e materializa os lançamentos usando a função idempotente `generate_recurring_entries` entregue no módulo de assinaturas.

Contas fixas nesta versão não aceitam cartão de crédito, pois cobranças recorrentes no cartão são tratadas como assinaturas e devem aparecer nas faturas. As opções disponíveis são Pix, boleto, transferência, cartão de débito, dinheiro ou outro.

As regras de contas fixas também são vinculadas ao controle financeiro ativo e só podem ser criadas por proprietário ou editor.

## Arquivos criados ou alterados

- **Alterado:** `supabase/migrations/descricao_consulta.sql`
- `src/features/fixed-expenses/domain/fixed-expense.ts`
- `src/features/fixed-expenses/application/fixed-expense-schema.ts`
- `src/features/fixed-expenses/application/fixed-expense-actions.ts`
- `src/features/fixed-expenses/infrastructure/supabase-fixed-expense-repository.ts`
- `src/features/fixed-expenses/presentation/fixed-expense-manager.tsx`
- `src/app/(dashboard)/fixed-expenses/page.tsx`
- `docs/ETAPA_05_MODULO_CONTAS_FIXAS.md`

## Ação manual obrigatória no Supabase

Se a versão anterior do script já foi aplicada, abra **SQL Editor** e execute manualmente somente o bloco iniciado por:

`-- Cria uma conta fixa e materializa os respectivos lançamentos futuros.`

O bloco está em `supabase/migrations/descricao_consulta.sql`, após a função de assinatura e antes da view de faturas.

## Funcionalidades entregues

- Cadastro de contas como água, energia, condomínio, aluguel, internet, IPTU e seguros.
- Valor, categoria, forma de pagamento, frequência, dia de cobrança e observações.
- Frequências mensal, trimestral, semestral e anual.
- Lançamentos futuros gerados até uma data informada.
- Visualização de todas as ocorrências previstas.
- Rota protegida: `/fixed-expenses`.

## Teste manual sugerido — não executado

1. Execute manualmente a nova função SQL no Supabase.
2. Abra `http://localhost:3000/fixed-expenses` após iniciar a aplicação manualmente.
3. Cadastre `Internet`, valor `119,90`, frequência mensal, cobrança no dia `15`, pagamento via Pix e previsão até o fim do próximo ano.
4. Confira a lista de lançamentos futuros criada para a conta.
5. Cadastre um lançamento anual, como seguro, e confirme que somente uma ocorrência por ano é criada.

## Próximo módulo

O último módulo da Etapa 5 é **Objetivos Financeiros**, com meta, valor atual, percentual concluído e valor restante.