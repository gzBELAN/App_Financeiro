# Etapa 5 — Módulo 3: Cartões de Crédito

> **Status:** concluído em código. Nenhum comando, instalação, teste ou serviço externo foi executado.

## Decisões arquiteturais

O módulo usa Domain, Application, Infrastructure e Presentation. A exclusão física não foi adotada: cartões são **arquivados** por meio de `is_active = false`. Esta decisão preserva compras, parcelas e faturas históricas que já referenciam o cartão.

O limite é convertido para centavos no servidor. O controle do limite utilizado será calculado a partir dos lançamentos e itens de fatura no módulo de faturas/dashboard, evitando duplicação de valores derivados nesta tabela.

Cartões pertencem ao controle financeiro ativo e podem ser usados por todos os editores desse mesmo controle.

## Arquivos criados

- `src/features/credit-cards/domain/credit-card.ts`
- `src/features/credit-cards/application/credit-card-schema.ts`
- `src/features/credit-cards/application/credit-card-actions.ts`
- `src/features/credit-cards/infrastructure/supabase-credit-card-repository.ts`
- `src/features/credit-cards/presentation/credit-card-manager.tsx`
- `src/app/(dashboard)/cards/page.tsx`
- `docs/ETAPA_05_MODULO_CARTOES.md`

## Funcionalidades entregues

- Cadastro de múltiplos cartões com nome, banco, bandeira, limite, fechamento, vencimento e cor.
- Listagem visual em cartões responsivos.
- Edição de cartões ativos.
- Arquivamento com confirmação, preservando o histórico.
- Validações de limite positivo, dias entre 1 e 31, cor e tamanho dos campos.
- Atualização das páginas de cartões e dashboard após alterações.

## Rota protegida

`/cards`

## Teste manual sugerido — não executado

1. Configure o Supabase e as variáveis locais das etapas anteriores.
2. Inicie manualmente com `npm run dev`.
3. Entre na aplicação e abra `http://localhost:3000/cards`.
4. Cadastre um cartão, por exemplo: nome `Nubank`, banco `Nubank`, bandeira `Mastercard`, limite `5000,00`, fechamento `20`, vencimento `27`.
5. Edite a cor ou limite e confirme a atualização.
6. Arquive o cartão e confirme que ele permanece visível como arquivado.

## Próximo módulo

O próximo módulo é **Parcelamentos**, responsável por criar a compra de origem e gerar automaticamente as despesas futuras vinculadas ao cartão escolhido.