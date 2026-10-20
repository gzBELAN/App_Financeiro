# Etapa 5 — Módulo 2: Lançamentos

> **Status:** concluído em código. Nenhum comando, teste, instalação ou serviço externo foi executado.

## Decisões arquiteturais

O módulo mantém a estrutura em camadas por funcionalidade:

- `domain`: tipos financeiros, formas de pagamento e contrato do repositório.
- `application`: schema Zod, conversão segura de moeda para centavos e Server Actions.
- `infrastructure`: persistência e leitura no Supabase.
- `presentation`: formulário e lista responsiva de lançamentos.

Valores inseridos como `12,50`, `12.50` ou `R$ 12,50` são convertidos para centavos antes da gravação. O banco permanece responsável pela integridade, RLS e constraints. O formulário registra receitas ou despesas avulsas; o saldo inicial é uma receita com a data de referência. Compras parceladas também são gerenciadas na página de lançamentos, em uma seção própria.

Cada despesa é vinculada ao controle financeiro ativo. Assim, participantes autorizados veem o mesmo lançamento, enquanto despesas de outros controles não são incluídas.

## Arquivos criados

- `src/features/expenses/domain/expense.ts`
- `src/features/expenses/application/expense-schema.ts`
- `src/features/expenses/application/expense-actions.ts`
- `src/features/expenses/infrastructure/supabase-expense-repository.ts`
- `src/features/expenses/presentation/expense-manager.tsx`
- `src/app/(dashboard)/expenses/page.tsx`
- `docs/ETAPA_05_MODULO_DESPESAS.md`

## Funcionalidades entregues

- Cadastro de receitas e despesas com descrição, valor, data, categoria, forma de pagamento, status e observações.
- Edição e exclusão de lançamentos avulsos.
- Registro de saldo inicial como receita.
- Inclusão e consulta de compras parceladas na mesma rota.
- Listagem em ordem decrescente de data.
- Categoria opcional, com identificação visual por cor.
- Validação de formato, valores positivos, tamanho de campos e data.
- Atualização de lançamentos, dashboard e relatórios após cada alteração.
- Lançamentos avulsos não aceitam cartão de crédito sem vínculo; use a seção de compras parceladas ou assinaturas para esse meio de pagamento.

## Rota protegida

`/expenses`

O middleware existente exige uma sessão válida antes de entregar a página.

## Teste manual sugerido — não executado

1. Configure Supabase e variáveis conforme as etapas anteriores.
2. Inicie a aplicação manualmente com `npm run dev`.
3. Entre na aplicação e crie pelo menos uma categoria em `/categories`.
4. Acesse `http://localhost:3000/expenses`.
5. Registre uma despesa com valor `125,90`, categoria e forma de pagamento.
6. Confirme que o valor é exibido como `R$ 125,90`.
7. Edite a despesa, marque-a como pendente e valide a atualização.
8. Registre uma receita ou saldo inicial e confirme o sinal positivo na lista e o reflexo no dashboard.
9. Exclua um lançamento e confirme que ele deixa de aparecer na lista.

## Integração com parcelamentos

O fluxo de parcelamentos está documentado em `ETAPA_05_MODULO4_PARCELAMENTOS.md`, mas a interface está integrada à rota `/expenses`.