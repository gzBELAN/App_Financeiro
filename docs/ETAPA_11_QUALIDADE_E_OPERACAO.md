# Etapa 11 — Qualidade e operação

> **Status:** automação e documentação preparadas. Nenhum ambiente, banco, serviço externo ou comando local foi executado.

## Entregas desta etapa

- Pipeline GitHub Actions em `.github/workflows/ci.yml` para tipo, lint, formato e build.
- Faturas de cartão baseadas na view `credit_card_invoice_items`.
- Projeção de caixa e alertas financeiros no dashboard.
- Atualização explícita do PWA, sem substituir uma sessão em uso automaticamente.
- Operações financeiras compostas protegidas por RPCs transacionais.

## Gerar tipos TypeScript do Supabase — ação manual

Depois de criar o banco e aplicar todas as migrations, gere os tipos para reduzir casts inseguros nos repositórios.

1. Instale o Supabase CLI conforme a documentação oficial, fora deste projeto.
2. Autentique-se manualmente no terminal.
3. Gere os tipos para um arquivo versionado, por exemplo `src/lib/supabase/database.types.ts`.
4. Altere os clientes Supabase para usar o tipo `Database` gerado.
5. Substitua gradualmente os casts `as unknown as` nos repositórios.

Não inclua tokens, senhas, chaves de projeto ou saídas contendo segredos no repositório.

## Ambientes recomendados

| Ambiente | Objetivo | Configuração manual |
| --- | --- | --- |
| Desenvolvimento | Evolução local | Projeto Supabase de desenvolvimento e `.env.local`. |
| Preview | Revisão de pull requests | Variáveis de preview na Vercel e banco isolado ou dados descartáveis. |
| Produção | Usuários finais | Projeto Supabase independente, URLs de callback finais e backups habilitados. |

Nunca reutilize a `SUPABASE_SERVICE_ROLE_KEY` de produção em desenvolvimento ou preview.

## Backup e restauração

1. Antes do lançamento, defina uma periodicidade de backup compatível com a criticidade dos dados financeiros.
2. Documente o responsável, a retenção e o local seguro de armazenamento.
3. Faça uma restauração de teste em ambiente isolado antes de depender do processo.
4. Registre apenas metadados técnicos em logs; não registre lançamentos financeiros nem credenciais.

## Critérios manuais antes do lançamento

- Aplicar migrations na ordem descrita no README.
- Gerar e versionar `package-lock.json` com Node.js 22+.
- Confirmar a execução da pipeline CI em pull requests.
- Validar faturas com ciclos de fechamento e vencimento reais.
- Validar os papéis proprietário, editor e visualizador.
- Validar atualização e fallback offline do PWA em navegador real.