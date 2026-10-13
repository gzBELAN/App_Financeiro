# Etapa 7 — Relatórios

> **Status:** concluída em código. Nenhum comando, instalação, teste ou serviço externo foi executado.

## Arquivos criados e alterados

- **Alterado:** `package.json` — incluída a dependência `xlsx` para exportação Excel.
- `src/features/reports/domain/report.ts`
- `src/features/reports/infrastructure/supabase-report-repository.ts`
- `src/features/reports/presentation/report-view.tsx`
- `src/app/(dashboard)/reports/page.tsx`
- `docs/ETAPA_07_RELATORIOS.md`

## Decisões arquiteturais

O relatório consulta lançamentos de despesa não cancelados diretamente de `financial_entries`, com relacionamentos para categoria, cartão e regra recorrente. Os totais por categoria e cartão são derivados no repositório, sem dados consolidados persistidos.

As exportações são realizadas no navegador apenas com os dados já filtrados e visíveis ao usuário. CSV usa UTF-8 com BOM para compatibilidade com Excel em português. A exportação `.xlsx` usa SheetJS (`xlsx`).

O relatório sempre usa o controle financeiro ativo; um participante não exporta dados dos demais controles aos quais não está associado.

## Entregue

- Relatório por período.
- Filtros por categoria, cartão e origem: todos, assinaturas ou contas fixas.
- Total filtrado, pago e pendente.
- Resumos por categoria e cartão.
- Tabela de lançamentos exportável.
- Exportação CSV.
- Exportação Excel.
- Rota protegida: `/reports`.

## Instalação manual necessária

Como `xlsx` foi adicionado ao `package.json`, execute manualmente dentro da raiz do projeto:

```powershell
npm install
```

Esse comando não foi executado.

## Teste manual sugerido — não executado

1. Após instalar manualmente as dependências, inicie o projeto com `npm run dev`.
2. Acesse `http://localhost:3000/reports` com uma sessão autenticada.
3. Escolha datas, categoria, cartão ou tipo de recorrência e clique em **Aplicar filtros**.
4. Confirme os totais e registros exibidos.
5. Clique em **Exportar CSV** e valide a abertura no Excel.
6. Clique em **Exportar Excel** e valide a planilha `.xlsx` gerada.

## Próxima etapa

**Etapa 8 — PWA:** manifest, service worker, ícones e instruções de instalação em dispositivos móveis.