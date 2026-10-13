# Etapa 5 — Módulo 7: Objetivos Financeiros

> **Status:** concluído em código. Este é o último módulo da Etapa 5. Nenhum comando, teste, instalação ou serviço externo foi executado.

## Decisões arquiteturais

Objetivos usam a tabela `financial_goals`, já definida na Etapa 2. O percentual não é gravado no banco; ele é calculado na interface a partir de `current_amount_cents / target_amount_cents`. Isso impede inconsistências entre dados derivados e valores efetivamente persistidos.

Objetivos são arquivados em vez de excluídos, preservando o histórico de metas concluídas, abandonadas ou substituídas. O valor atual pode superar a meta, mas o indicador visual é limitado a 100% e o valor restante não fica negativo.

Cada objetivo pertence ao controle financeiro ativo e seu progresso é compartilhado com todos os participantes autorizados.

## Arquivos criados

- `src/features/financial-goals/domain/financial-goal.ts`
- `src/features/financial-goals/application/financial-goal-schema.ts`
- `src/features/financial-goals/application/financial-goal-actions.ts`
- `src/features/financial-goals/infrastructure/supabase-financial-goal-repository.ts`
- `src/features/financial-goals/presentation/financial-goal-manager.tsx`
- `src/app/(dashboard)/goals/page.tsx`
- `docs/ETAPA_05_MODULO_OBJETIVOS.md`

## Funcionalidades entregues

- Cadastro de objetivo com nome, meta, valor atual, data-alvo opcional e cor.
- Edição dos dados e do progresso.
- Cálculo de percentual concluído.
- Cálculo de valor restante.
- Arquivamento preservando histórico.
- Rota protegida: `/goals`.

## Teste manual sugerido — não executado

1. Com a aplicação configurada manualmente, acesse `http://localhost:3000/goals`.
2. Crie uma meta `Reserva de emergência` de `R$ 10.000,00` com valor atual de `R$ 2.500,00`.
3. Confirme o progresso exibido em `25%` e o restante de `R$ 7.500,00`.
4. Atualize o valor atual e valide a barra de progresso.
5. Arquive o objetivo e confirme que ele permanece acessível como arquivado.

## Etapa 5 concluída

Os sete módulos financeiros previstos foram implementados:

1. Categorias;
2. Despesas;
3. Cartões de crédito;
4. Parcelamentos;
5. Assinaturas recorrentes;
6. Contas fixas;
7. Objetivos financeiros.

## Próxima etapa

A **Etapa 6 — Dashboard** implementará KPIs, filtros e gráficos interativos a partir dos lançamentos, cartões e objetivos já registrados.