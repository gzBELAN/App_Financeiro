# Etapa 5 — Módulo 1: Categorias

> **Status:** concluído em código. Este é o primeiro módulo da Etapa 5. Nenhum comando, teste, instalação ou serviço externo foi executado.

## Decisões arquiteturais

O módulo segue a organização por funcionalidade e as camadas definidas na Etapa 1:

- `domain`: entidade `Category` e contrato `CategoryRepository`.
- `application`: schema Zod e Server Actions que representam os casos de uso de criar, editar e excluir.
- `infrastructure`: implementação do repositório com Supabase.
- `presentation`: componente responsável pela experiência de cadastro e listagem.

O componente visual não consulta Supabase diretamente. Ele chama Server Actions, que validam a entrada, executam o repositório e revalidam a rota. O RLS do banco continua sendo a camada de autorização definitiva.

Com controles compartilhados, categorias pertencem ao `workspace_id` ativo e ficam disponíveis para todos os participantes desse controle. Proprietários e editores alteram dados; visualizadores apenas consultam.

## Arquivos criados

- `src/features/categories/domain/category.ts`
- `src/features/categories/application/category-schema.ts`
- `src/features/categories/application/category-actions.ts`
- `src/features/categories/infrastructure/supabase-category-repository.ts`
- `src/features/categories/presentation/category-manager.tsx`
- `src/app/(dashboard)/categories/page.tsx`
- `docs/ETAPA_05_MODULO_CATEGORIAS.md`

## Funcionalidades entregues

- Cadastro com nome, cor e ícone opcional.
- Listagem ordenada por nome.
- Edição de categoria.
- Exclusão com confirmação explícita.
- Mensagem de erro para categoria duplicada ou categoria vinculada a dados financeiros.
- Validação de nome, tamanho do campo e formato hexadecimal da cor.

## Rota

A rota protegida do módulo é:

`/categories`

Ela já está coberta pelo middleware de autenticação criado na Etapa 4.

## Teste manual sugerido — não executado

Após instalar dependências e configurar Supabase conforme as etapas anteriores:

1. Inicie a aplicação manualmente com `npm run dev`.
2. Entre com uma conta confirmada.
3. Acesse `http://localhost:3000/categories`.
4. Crie categorias como Alimentação, Transporte e Saúde.
5. Edite uma categoria e confira a atualização na listagem.
6. Exclua uma categoria sem lançamentos associados.
7. Após o módulo de despesas ser implementado, valide que uma categoria em uso não pode ser excluída.

## Próximo módulo

O próximo módulo da Etapa 5 é **Despesas**, que utilizará as categorias para classificação e incluirá cadastro, edição, exclusão e visualização de lançamentos.