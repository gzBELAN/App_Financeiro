# Etapa 4 — Autenticação

> **Status:** concluída em código. Nenhum projeto Supabase foi criado, nenhuma configuração externa foi alterada e nenhum comando foi executado.

## 1. Arquitetura implementada

O fluxo usa `@supabase/ssr`, com clientes separados para navegador e servidor:

- `src/lib/supabase/client.ts`: autenticação iniciada por formulários do navegador.
- `src/lib/supabase/server.ts`: leitura de sessão em Server Components e Route Handlers.
- `src/lib/supabase/middleware.ts`: renovação de cookies de sessão e redirecionamento de rotas protegidas.
- `middleware.ts`: ponto de entrada do Next.js para executar a proteção antes da página ser entregue.

Essa separação impede que páginas protegidas dependam somente de verificações no navegador. O middleware consulta o usuário autenticado no Supabase e bloqueia a navegação para rotas privadas quando não houver sessão válida.

Após a autenticação, o controle financeiro ativo é resolvido no servidor e armazenado em cookie HTTP-only. A validação de participação e permissão permanece no PostgreSQL via RLS.

### Rotas

| Rota | Acesso | Função |
| --- | --- | --- |
| `/login` | Público | Login com e-mail e senha. |
| `/signup` | Público | Cadastro com confirmação de e-mail. |
| `/forgot-password` | Público | Solicitação de recuperação de senha. |
| `/reset-password` | Link de recuperação | Definição de uma nova senha. |
| `/auth/callback` | Público | Troca o código retornado pelo Supabase por uma sessão. |
| `/dashboard` | Protegido | Página temporária que prova a proteção e permite logout. |
| `/workspace` | Protegido | Seleção do controle ativo e gerenciamento de participantes pelo proprietário. |

## 2. Arquivos criados

- `middleware.ts`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/middleware.ts`
- `src/features/auth/presentation/auth-card.tsx`
- `src/features/auth/presentation/login-form.tsx`
- `src/features/auth/presentation/signup-form.tsx`
- `src/features/auth/presentation/forgot-password-form.tsx`
- `src/features/auth/presentation/reset-password-form.tsx`
- `src/features/auth/presentation/logout-button.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/signup/page.tsx`
- `src/app/(auth)/forgot-password/page.tsx`
- `src/app/(auth)/reset-password/page.tsx`
- `src/app/auth/callback/route.ts`
- `src/app/(dashboard)/dashboard/page.tsx`

## 3. Configuração manual do Supabase — não executada

### 3.1 Preparar variáveis locais

1. Na raiz do projeto, copie `.env.example` e renomeie a cópia para `.env.local`.
2. Acesse o painel do projeto Supabase criado manualmente.
3. Abra **Project Settings > API**.
4. Copie **Project URL** para `NEXT_PUBLIC_SUPABASE_URL`.
5. Copie a chave pública indicada como **Publishable key** para `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
6. Salve o arquivo. Não compartilhe e não versione `.env.local`.

### 3.2 Habilitar autenticação por e-mail

1. No menu do Supabase, abra **Authentication > Providers**.
2. Localize **Email** e confirme que está habilitado.
3. Mantenha a confirmação de e-mail habilitada para produção.
4. Defina a política de senha mínima conforme sua necessidade; o formulário exige ao menos 8 caracteres.

### 3.3 Configurar URLs de redirecionamento

1. No menu do Supabase, abra **Authentication > URL Configuration**.
2. Em **Site URL**, use durante o desenvolvimento: `http://localhost:3000`.
3. Em **Redirect URLs**, adicione exatamente:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/auth/callback?next=/dashboard`
   - `http://localhost:3000/auth/callback?next=/reset-password`
4. Quando houver uma URL de produção, ela será adicionada manualmente na Etapa 9, seguindo o mesmo padrão, por exemplo: `https://seu-dominio/auth/callback`.
5. Clique em **Save**.

### 3.4 Confirmar o banco

Antes de testar um cadastro, confirme que o script da Etapa 2 foi executado manualmente. O gatilho `on_auth_user_created` precisa existir para criar o registro correspondente em `public.profiles`.

## 4. Teste manual sugerido — não executado

Depois de configurar o ambiente e instalar dependências manualmente:

1. Inicie o projeto com `npm run dev`.
2. Abra `http://localhost:3000/signup`.
3. Cadastre um e-mail acessível.
4. Abra o link de confirmação enviado pelo Supabase.
5. Confirme o redirecionamento para `/dashboard`.
6. Clique em **Sair** e confirme o retorno ao login.
7. Acesse diretamente `http://localhost:3000/dashboard` sem sessão e confirme o redirecionamento para `/login`.
8. Em `/forgot-password`, solicite a redefinição e valide a atualização de senha pelo link recebido.

## 5. Tratamento de segurança

- A chave pública do Supabase é a única chave usada pelo cliente.
- A `service_role key` não deve ser usada no navegador nem adicionada a arquivos públicos.
- A autorização dos dados financeiros continuará no banco por RLS, independentemente do middleware.
- A validação visual dos formulários é complementar; as políticas, constraints e Auth do Supabase são a autoridade de segurança.

## 6. Próxima etapa

**Etapa 5 — Funcionalidades Financeiras** será implementada gradualmente, nesta ordem:

1. Categorias;
2. Despesas;
3. Cartões;
4. Parcelamentos;
5. Assinaturas;
6. Contas fixas;
7. Objetivos financeiros.

Dependências: configuração manual do Supabase, variáveis em `.env.local`, script da Etapa 2 aplicado e autenticação validada manualmente.