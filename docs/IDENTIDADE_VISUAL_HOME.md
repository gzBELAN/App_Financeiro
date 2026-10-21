# Identidade visual — Ho.ME

> **Ho.ME** significa **House Management Environment**: um ambiente digital para administrar a rotina e as finanças da casa com clareza, controle e tecnologia.

## Conceito da marca

A identidade combina um lar com conectividade. O símbolo representa uma casa construída por linhas precisas, com um ponto luminoso no topo — a central de controle de uma residência conectada. Ele comunica organização doméstica, segurança e visão de futuro sem depender de símbolos financeiros convencionais.

### Assinatura

- **Nome exibido:** `Ho.ME`
- **Descriptor:** `HOUSE MANAGEMENT`
- **Tom de voz:** objetivo, acolhedor, tecnológico e confiável.

## Paleta de cores

| Papel | Token CSS | Cor de referência | Uso |
| --- | --- | --- | --- |
| Fundo escuro | `--background` (escuro) | `#091321` | Superfícies profundas, ícone e modo escuro |
| Fundo claro | `--background` (claro) | `#F7F9FC` | Área principal no modo claro |
| Superfície | `--card` | `#FFFFFF` / `#111D2A` | Cartões e blocos de conteúdo |
| Primária | `--primary` | `#168E8C` / `#16D7CA` | Ações, navegação ativa e foco visual |
| Ciano elétrico | uso do ícone | `#3DF3E4` | Contornos, brilho e estados de destaque |
| Azul de apoio | gradiente de fundo | `#2563EB` com transparência | Profundidade visual e atmosfera tecnológica |

As variáveis de cor vivem em `src/styles/globals.css`. Componentes devem usar tokens Tailwind como `bg-primary`, `text-primary` e `bg-card`; evite inserir novas cores hexadecimais em componentes, salvo dados visuais específicos como gráficos e categorias.

## Tipografia e composição

- A marca usa tipografia sem serifa, com peso alto e espaçamento negativo apenas no logotipo `Ho.ME`.
- Cards e botões usam cantos arredondados (`--radius: 1rem`) e contornos suaves.
- O fundo possui gradientes radiais sutis para acrescentar profundidade sem comprometer leitura.
- Navegação e autenticação usam transparência leve e `backdrop-blur` para o aspecto de interface tecnológica.

## Ícone do aplicativo

Os arquivos SVG vetoriais do ícone estão em:

- `public/icons/icon-192.svg`
- `public/icons/icon-512.svg`

Eles são usados pelo PWA e pelos metadados globais em `src/app/layout.tsx`. O manifesto, em `public/manifest.webmanifest`, define as dimensões e a cor de tema. Para manter compatibilidade com atalhos e instalação, preserve os dois arquivos e suas referências ao substituir o desenho.

## Onde alterar a identidade

| Elemento | Local |
| --- | --- |
| Nome, título do navegador, descrição e ícone do HTML | `src/app/layout.tsx` |
| Cores, fundo, seleção e raio global | `src/styles/globals.css` |
| Logotipo e aparência da barra lateral/mobile | `src/features/navigation/presentation/app-navigation.tsx` |
| Marca nas telas de autenticação | `src/features/auth/presentation/auth-card.tsx` |
| Marca na tela offline | `src/app/offline/page.tsx` |
| Nome e cores do aplicativo instalável | `public/manifest.webmanifest` |
| Arte dos ícones instaláveis | `public/icons/icon-192.svg` e `public/icons/icon-512.svg` |

## Regras de consistência

1. Use a assinatura `Ho.ME` em títulos curtos e o descriptor somente quando houver espaço.
2. Reserve o ciano para ações e informações prioritárias; não o use como fundo dominante de grandes áreas.
3. Preserve contraste suficiente entre texto e superfícies nos modos claro e escuro.
4. Use ícones Lucide já instalados para navegação e ações; o símbolo de casa conectada é exclusivo da marca e dos ícones do aplicativo.
