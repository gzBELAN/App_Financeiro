# Etapa 3 — Estrutura do Projeto

> **Status:** concluída (arquivos de configuração criados). Nenhuma dependência foi instalada, nenhum comando foi executado e nenhum serviço externo foi acessado.

## 1. Decisões arquiteturais

### Next.js App Router

O projeto usa o App Router, pois ele permite separar naturalmente componentes de servidor e cliente. Consultas autenticadas e operações sensíveis ficarão no servidor quando as funcionalidades forem implementadas. Componentes interativos serão marcados como cliente somente quando necessário.

### TypeScript estrito

`strict: true` está habilitado para reduzir erros em regras financeiras. O alias `@/*` aponta para `src/*`, eliminando imports relativos longos e mantendo os módulos por funcionalidade legíveis.

### Tailwind e shadcn/ui

O Tailwind usa variáveis CSS como tokens de design. Isso permite tema claro/escuro sem duplicar componentes. O `components.json` prepara a futura adição manual de componentes shadcn/ui; nenhum componente foi instalado nesta etapa.

### Qualidade de código

ESLint aplica as regras de qualidade e Web Vitals do Next.js. Prettier centraliza formatação e ordenará classes Tailwind após a instalação das dependências. Essas ferramentas serão verificadas manualmente antes de cada entrega futura.

## 2. Arquivos criados

| Arquivo | Finalidade |
| --- | --- |
| `package.json` | Dependências planejadas e scripts de desenvolvimento, build, lint, formatação e tipagem. |
| `tsconfig.json` | TypeScript estrito e alias `@/*`. |
| `next.config.ts` | Configuração do Next.js com Strict Mode e sem header identificador. |
| `tailwind.config.ts` | Tema, tokens e varredura dos arquivos TS/TSX. |
| `postcss.config.mjs` | Integração PostCSS, Tailwind e Autoprefixer. |
| `eslint.config.mjs` | Regras ESLint do Next.js. |
| `.prettierrc.json` e `.prettierignore` | Padronização de formato. |
| `.gitignore` | Proteção contra commit de dependências, builds e variáveis privadas. |
| `.env.example` | Referência das duas variáveis públicas do Supabase, sem segredo real. |
| `components.json` | Configuração preparada para shadcn/ui. |
| `src/app/layout.tsx` | Layout global, idioma e metadados básicos. |
| `src/app/page.tsx` | Página inicial temporária. |
| `src/styles/globals.css` | Tokens de design e tema claro/escuro. |
| `src/lib/utils/cn.ts` | Utilitário para composição segura de classes Tailwind. |

## 3. Estrutura criada e planejada

```text
App_Financeiro/
├── docs/
│   ├── ETAPA_01_DESCOBERTA_E_ARQUITETURA.md
│   ├── ETAPA_02_BANCO_DE_DADOS.md
│   └── ETAPA_03_ESTRUTURA_DO_PROJETO.md
├── src/
│   ├── app/                            # Rotas e layouts App Router
│   ├── components/
│   │   ├── ui/                         # shadcn/ui (etapas futuras)
│   │   ├── charts/                     # Recharts (etapa 6)
│   │   └── layout/                     # Navegação e shell (etapa 4)
│   ├── features/                       # Domínios financeiros (etapa 5)
│   │   ├── workspaces/                  # Controle ativo e participantes
│   ├── lib/
│   │   ├── supabase/                   # Clientes Supabase (etapa 4)
│   │   ├── utils/
│   │   └── validations/                # Schemas compartilhados (etapa 4)
│   ├── styles/
│   └── types/                          # Tipos do banco (etapa 4)
├── supabase/
│   └── migrations/
├── tests/                              # Testes (planejado)
├── .env.example
├── package.json
└── configurações de lint, TypeScript e Tailwind
```

As pastas sem arquivos ainda não foram criadas propositalmente. Elas serão materializadas junto à funcionalidade correspondente, evitando estruturas vazias e código prematuro.

## 4. Instalação manual — não executada

Pré-requisito: instale uma versão LTS atual do Node.js, preferencialmente Node.js 22 ou superior.

No terminal, dentro da pasta `App_Financeiro`, execute manualmente:

```powershell
npm install
```

Após a instalação, para iniciar o ambiente local manualmente:

```powershell
npm run dev
```

Para verificações manuais de qualidade:

```powershell
npm run typecheck
npm run lint
npm run format:check
```

Para gerar a versão de produção localmente:

```powershell
npm run build
```

Nenhum dos comandos acima foi executado nesta etapa.

## 5. Configuração manual de variáveis de ambiente — não executada

As variáveis não são necessárias até a Etapa 4. Quando existir um projeto Supabase configurado:

1. Duplique o arquivo `.env.example` e renomeie a cópia para `.env.local`.
2. No painel Supabase, acesse **Project Settings > API**.
3. Copie a URL do projeto para `NEXT_PUBLIC_SUPABASE_URL`.
4. Copie a chave pública/publishable para `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
5. Não inclua `.env.local` no Git. O arquivo já está listado em `.gitignore`.
6. Nunca use ou exponha a chave `service_role` no navegador.

## 6. Próxima etapa

**Etapa 4 — Autenticação** depende de:

- dependências instaladas manualmente pelo responsável;
- projeto Supabase criado manualmente;
- script de banco da Etapa 2 executado manualmente;
- preenchimento de `.env.local` com URL e chave pública do projeto.

Na próxima etapa serão implementados cadastro, login, logout, recuperação de senha, middleware e proteção de rotas, além do passo a passo manual de configuração de Auth no Supabase.