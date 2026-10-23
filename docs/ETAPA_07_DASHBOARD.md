# Etapa 7 — Dashboard e personalização

> **Status:** concluída em código. Nenhum comando, teste, instalação ou serviço externo foi executado.

## Decisões arquiteturais

O dashboard usa um repositório dedicado para consolidar leituras de `financial_entries`, `financial_goals` e da configuração de salário do controle em `financial_workspaces`. Nenhuma agregação é persistida: KPIs e gráficos são derivados dos lançamentos atuais, evitando tabelas de resumo que possam divergir dos dados financeiros.

O filtro de período é baseado em query string (`/dashboard?month=YYYY-MM`), tornando a visualização compartilhável e recarregável. A página permanece Server Component e entrega os dados ao componente de gráficos, que é Client Component devido ao Recharts.

Todos os cálculos também são filtrados pelo controle financeiro ativo, evitando consolidar dados de controles diferentes de uma mesma pessoa.

## Arquivos criados e alterados

- `src/features/dashboard/domain/dashboard.ts`
- `src/features/dashboard/infrastructure/supabase-dashboard-repository.ts`
- `src/features/dashboard/presentation/dashboard-view.tsx`
- **Alterado:** `src/app/(dashboard)/dashboard/page.tsx`
- `docs/ETAPA_07_DASHBOARD.md`

## Indicadores entregues

| Indicador | Regra |
| --- | --- |
| Salário mensal | Valor líquido planejado no controle financeiro ativo. |
| Gastos do mês | Todas as despesas, pagas ou pendentes, no período; inclui contas, cartões e parcelas. |
| Sobra do salário | Salário mensal menos gastos do mês. Pode ser negativo. |
| Saldo atual | Receitas pagas menos despesas pagas até o fim do período selecionado. |
| Despesas do mês | Despesas pagas e pendentes dentro do período. |
| Despesas futuras | Despesas após o último dia do período. |
| A pagar no mês | Despesas pendentes dentro do período. |

## Melhorias de UX implementadas

- Resumo visual do próximo salário no início do dashboard, consolidando salário previsto, saídas previstas e sobra projetada em um único cartão com indicador de comprometimento e acesso aos detalhes.
- Ordem mobile orientada a resultado: o resumo financeiro aparece antes dos atalhos, alertas e opções de personalização, reduzindo a necessidade de rolagem para consultar a informação principal.
- Seletor de período com largura responsiva para não extrapolar o cabeçalho em telas pequenas.
- Gráfico de categorias sem rótulos externos que possam ser cortados em mobile; os detalhes ficam disponíveis em uma janela agrupada por categoria.
- Gráfico de categorias baseado nas saídas previstas para o próximo salário, com percentuais por fatia e total compatível com o resumo financeiro.
- Janelas de detalhes agrupados iniciam recolhidas e usam linhas inteiras com setas direcionais à direita para expandir ou ocultar lançamentos.
- Indicadores renomeados para **Gastos do período fechado** e **Contas em aberto**; o primeiro agrupa detalhes por cartão e lançamentos.
- Viewport PWA configurado com escala inicial normal, evitando ampliação ao abrir o aplicativo no celular.
- Indicadores do topo personalizáveis pelo usuário, persistidos somente no navegador.
- Ações rápidas para registrar lançamento e consultar contas/cartões.
- Separação explícita entre **saldo calculado** (lançamentos pagos) e saldo conciliado informado em contas bancárias.
- Cartões visuais, estados vazios e textos de apoio revisados para facilitar a leitura financeira.
- Projeção de caixa até o final do período, descontando pagamentos pendentes.
- Alertas para projeção negativa, orçamento mensal excedido e pagamentos pendentes.

## Gráficos e visualizações

- Evolução mensal de receitas e despesas nos seis meses até o período filtrado; despesas de cartão são contabilizadas no mês de vencimento da fatura, como nos indicadores de gastos.
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
4. Em `/cards`, informe o salário mensal planejado e registre contas, cartões ou lançamentos no mês.
5. Confirme os seis KPIs, especialmente o comparativo entre salário, gastos e sobra prevista.
6. Selecione outro mês e clique em **Filtrar**.
7. Confirme que os dados do período são atualizados e que a URL contém o parâmetro `month`.

## Próxima etapa

**Etapa 7 — Relatórios:** filtros especializados e exportação de dados em CSV e Excel.