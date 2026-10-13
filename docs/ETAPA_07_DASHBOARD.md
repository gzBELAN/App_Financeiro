# Etapa 6 — Dashboard

> **Status:** concluída em código. Nenhum comando, teste, instalação ou serviço externo foi executado.

## Decisões arquiteturais

O dashboard usa um repositório dedicado para consolidar leituras de `financial_entries` e `financial_goals`. Nenhuma agregação é persistida: KPIs e gráficos são derivados dos lançamentos atuais, evitando tabelas de resumo que possam divergir dos dados financeiros.

O filtro de período é baseado em query string (`/dashboard?month=YYYY-MM`), tornando a visualização compartilhável e recarregável. A página permanece Server Component e entrega os dados ao componente de gráficos, que é Client Component devido ao Recharts.

Todos os cálculos também são filtrados pelo controle financeiro ativo, evitando consolidar dados de controles diferentes de uma mesma pessoa.

## Arquivos criados e alterados

- `src/features/dashboard/domain/dashboard.ts`
- `src/features/dashboard/infrastructure/supabase-dashboard-repository.ts`
- `src/features/dashboard/presentation/dashboard-view.tsx`
- **Alterado:** `src/app/(dashboard)/dashboard/page.tsx`
- `docs/ETAPA_06_DASHBOARD.md`

## Indicadores entregues

| Indicador | Regra |
| --- | --- |
| Saldo atual | Receitas pagas menos despesas pagas até o fim do período selecionado. |
| Despesas do mês | Despesas pagas e pendentes dentro do período. |
| Despesas futuras | Despesas após o último dia do período. |
| A pagar no mês | Despesas pendentes dentro do período. |

## Gráficos e visualizações

- Evolução mensal de receitas e despesas nos seis meses até o período filtrado.
- Distribuição de gastos por categoria.
- Gastos por cartão de crédito.
- Progresso dos objetivos financeiros ativos.
- Lista das cinco despesas mais recentes do período.

## Rota protegida e filtro

- Rota: `/dashboard`
- Filtro: campo de mês que atualiza o parâmetro `month`.
- Exemplo: `/dashboard?month=2026-10`.

## Teste manual sugerido — não executado

1. Inicie a aplicação manualmente com `npm run dev`.
2. Entre com uma conta que tenha categorias, despesas, cartões e objetivos.
3. Acesse `http://localhost:3000/dashboard`.
4. Confirme os quatro KPIs e os gráficos.
5. Selecione outro mês e clique em **Filtrar**.
6. Confirme que os dados do período são atualizados e que a URL contém o parâmetro `month`.

## Próxima etapa

**Etapa 7 — Relatórios:** filtros especializados e exportação de dados em CSV e Excel.