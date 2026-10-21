# Etapa 8 — PWA

> **Status:** concluída em código. Nenhum comando, teste, instalação ou serviço externo foi executado.

## Decisões arquiteturais

O PWA usa um service worker próprio e deliberadamente simples. Ele armazena o manifesto, ícones, recursos estáticos do Next.js e uma página de indisponibilidade offline.

Páginas autenticadas, dados financeiros e respostas do Supabase **não são armazenados pelo service worker**. Essa decisão evita que dados de uma sessão fiquem disponíveis para outra pessoa no mesmo navegador. Ao ficar sem conexão, a navegação recebe uma tela offline segura em vez de dados financeiros potencialmente desatualizados.

## Arquivos criados e alterados

- **Alterado:** `src/app/layout.tsx`
- `src/components/pwa/service-worker-registration.tsx`
- `public/manifest.webmanifest`
- `public/sw.js`
- `public/icons/icon-192.svg`
- `public/icons/icon-512.svg`
- `src/app/offline/page.tsx`
- `docs/ETAPA_08_PWA.md`

## Funcionalidades entregues

- Manifest com nome, descrição, cores, início em `/dashboard` e modo standalone.
- Ícones PWA escaláveis em SVG.
- Registro automático do service worker no navegador.
- Atualização explícita: o usuário decide quando ativar uma versão nova, sem interromper a sessão atual.
- Cache dos recursos estáticos e de tela offline.
- Fallback de navegação sem internet para `/offline`.
- Metadados para instalação e suporte Apple Web App.

## Instalação manual no Android

1. Publique ou execute localmente o projeto em HTTPS; navegadores normalmente exigem HTTPS para PWA, exceto `localhost`.
2. Abra o sistema no Chrome para Android.
3. Toque no menu de três pontos.
4. Escolha **Instalar app** ou **Adicionar à tela inicial**.
5. Confirme a instalação.

## Instalação manual no iPhone/iPad

1. Abra o sistema no Safari.
2. Toque em **Compartilhar**.
3. Escolha **Adicionar à Tela de Início**.
4. Confirme o nome e toque em **Adicionar**.

## Verificação manual sugerida — não executada

1. Instale dependências manualmente e inicie a aplicação.
2. No Chrome, abra DevTools > **Application** > **Manifest** e confirme nome, ícones e cores.
3. Em **Application** > **Service Workers**, confirme que `/sw.js` está ativo.
4. Acesse uma tela online, então simule modo offline no DevTools.
5. Recarregue uma rota e confirme a página `/offline`.
6. Confirme que ícones e recursos estáticos seguem disponíveis offline.

## Observação para produção

Antes de publicar, gere também ícones PNG de 192x192 e 512x512 a partir dos SVGs e atualize o manifesto caso seja necessário suporte máximo a navegadores que não aceitam SVG como ícone instalável.

## Próxima etapa

**Etapa 10 — Deploy:** guia manual detalhado para GitHub, Supabase e Vercel. Nenhum deploy será executado automaticamente.