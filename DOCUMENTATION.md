# 📘 Documentação Técnica Completa — Conectados em Sergipe

> Gerada em: 09/03/2026  
> Versão: 1.0

---

## Sumário

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Arquitetura do Sistema](#2-arquitetura-do-sistema)
3. [Tecnologias Utilizadas](#3-tecnologias-utilizadas)
4. [Estrutura de Pastas](#4-estrutura-de-pastas)
5. [Páginas do Sistema](#5-páginas-do-sistema)
6. [Sistema de Usuários](#6-sistema-de-usuários)
7. [Sistema de Anúncios (Marketplace)](#7-sistema-de-anúncios-marketplace)
8. [Sistema de Lojas](#8-sistema-de-lojas)
9. [Sistema de Planos Premium](#9-sistema-de-planos-premium)
10. [Banco de Dados](#10-banco-de-dados)
11. [Integrações](#11-integrações)
12. [Fluxos do Sistema](#12-fluxos-do-sistema)
13. [Configuração do Ambiente](#13-configuração-do-ambiente)
14. [Boas Práticas e Manutenção](#14-boas-práticas-e-manutenção)
15. [Estrutura da Sidebar](#15-estrutura-da-sidebar)
16. [Formato da Documentação](#16-formato-da-documentação)

---

## 1. Visão Geral do Projeto

### Objetivo
**Conectados em Sergipe** é uma rede social e marketplace regional focada no estado de Sergipe, Brasil. A plataforma conecta pessoas, comerciantes e prestadores de serviço em um único ecossistema digital.

### Principais Funcionalidades
- **Rede social**: Feed de posts, amizades, seguidores, perfis públicos
- **Marketplace**: Compra e venda de produtos entre usuários com filtros por cidade e categoria
- **Lojas virtuais**: Criação de lojas com produtos, planos premium e métricas
- **Serviços**: Diretório de prestadores de serviço com categorias e subcategorias
- **Chat em tempo real**: Mensagens privadas com suporte a texto, imagens e áudio
- **Sistema de créditos**: Moeda virtual para patrocínio de anúncios
- **Sistema de pagamentos**: Integração com Asaas (PIX, boleto, cartão)
- **Moderação**: Painel de moderadores e admins, filtros de palavras proibidas, NSFW

### Público-Alvo
- Moradores de Sergipe que desejam comprar/vender produtos ou serviços
- Comerciantes locais que querem criar presença digital
- Prestadores de serviço que buscam visibilidade regional

### Funcionamento Geral
O usuário se cadastra, cria um perfil e pode: publicar no feed social, anunciar produtos no marketplace, criar uma loja virtual, contratar planos premium, enviar mensagens privadas e seguir outros usuários/lojas.

---

## 2. Arquitetura do Sistema

### Diagrama de Arquitetura

```
┌─────────────────────────────────────────────┐
│              FRONTEND (React SPA)           │
│  Vite + TypeScript + Tailwind + shadcn/ui   │
├─────────────────────────────────────────────┤
│            Supabase JS Client               │
│   (Auth, Realtime, Database, Storage)       │
├─────────────────────────────────────────────┤
│              SUPABASE BACKEND               │
│  ┌──────────┐ ┌──────────┐ ┌─────────────┐ │
│  │PostgreSQL│ │  Auth    │ │  Storage    │ │
│  │  (DB)    │ │ (JWT)   │ │  (Buckets)  │ │
│  └──────────┘ └──────────┘ └─────────────┘ │
│  ┌──────────────────────────────────────┐   │
│  │   Edge Functions (Deno)              │   │
│  │  - asaas-payment                     │   │
│  │  - asaas-webhook                     │   │
│  │  - asaas-subscription                │   │
│  │  - check-nsfw                        │   │
│  │  - delete-account                    │   │
│  │  - og-marketplace                    │   │
│  └──────────────────────────────────────┘   │
├─────────────────────────────────────────────┤
│          INTEGRAÇÕES EXTERNAS               │
│  ┌──────────┐ ┌──────────────────────┐      │
│  │  Asaas   │ │  Lovable AI (NSFW)  │      │
│  │(Payments)│ │                      │      │
│  └──────────┘ └──────────────────────┘      │
└─────────────────────────────────────────────┘
```

### Comunicação
- **Frontend ↔ Banco**: Via Supabase JS Client (REST/WebSocket)
- **Frontend ↔ Edge Functions**: Via `supabase.functions.invoke()`
- **Edge Functions ↔ Asaas**: Chamadas HTTP REST à API do Asaas
- **Asaas ↔ Backend**: Webhooks HTTP para notificação de pagamentos
- **Realtime**: Canal WebSocket do Supabase para mensagens em tempo real

---

## 3. Tecnologias Utilizadas

| Tecnologia | Versão | Papel |
|---|---|---|
| **React** | ^18.3.1 | Framework UI principal |
| **TypeScript** | ^5.8.3 | Tipagem estática |
| **Vite** | ^5.4.19 | Build tool e dev server |
| **Tailwind CSS** | ^3.4.17 | Framework de estilização utility-first |
| **shadcn/ui** | - | Componentes UI (Dialog, Select, Tabs, etc.) |
| **Supabase** | ^2.98.0 | Backend-as-a-Service (DB, Auth, Storage, Functions) |
| **React Router DOM** | ^6.30.1 | Roteamento SPA |
| **TanStack React Query** | ^5.83.0 | Cache e gerenciamento de estado servidor |
| **React Hook Form** | ^7.61.1 | Formulários com validação |
| **Zod** | ^3.25.76 | Validação de schemas |
| **Lucide React** | ^0.462.0 | Ícones SVG |
| **date-fns** | ^3.6.0 | Manipulação de datas |
| **Recharts** | ^2.15.4 | Gráficos e visualizações |
| **Sonner** | ^1.7.4 | Notificações toast |
| **Embla Carousel** | ^8.6.0 | Carrossel de imagens |
| **Asaas API** | v3 | Gateway de pagamentos (PIX, boleto, cartão) |
| **Deno** | - | Runtime para Edge Functions |

---

## 4. Estrutura de Pastas

```
/
├── public/                          # Arquivos estáticos
│   ├── favicon.ico
│   ├── placeholder.svg
│   ├── robots.txt
│   ├── sitemap.xml
│   └── sounds/
│       └── new-message.mp3          # Som de nova mensagem
│
├── src/
│   ├── App.tsx                      # Componente raiz, rotas e providers
│   ├── App.css                      # Estilos globais adicionais
│   ├── main.tsx                     # Entry point React
│   ├── index.css                    # Tokens de design (cores, fontes)
│   ├── vite-env.d.ts                # Tipos do Vite
│   │
│   ├── components/                  # Componentes reutilizáveis
│   │   ├── ui/                      # Componentes base shadcn/ui (~50 componentes)
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   │
│   │   ├── FacebookHeader.tsx       # Header principal (barra azul fixa)
│   │   ├── FacebookFooter.tsx       # Rodapé com links
│   │   ├── AppNavSidebar.tsx        # Sidebar de navegação (desktop)
│   │   ├── MobileQuickNav.tsx       # Menu rápido mobile
│   │   ├── FloatingChatSystem.tsx   # Sistema de chat flutuante
│   │   ├── FloatingChatWindow.tsx   # Janela individual de chat
│   │   ├── PostFeed.tsx             # Feed de publicações
│   │   ├── ProfileSidebar.tsx       # Sidebar do perfil do usuário
│   │   ├── FriendsSidebar.tsx       # Lista de amigos online
│   │   ├── FriendSuggestions.tsx    # Sugestões de amizade
│   │   ├── MarketplaceForm.tsx      # Formulário de criação de anúncio
│   │   ├── MarketplaceItemCard.tsx  # Card de produto no marketplace
│   │   ├── MarketplaceHighlights.tsx# Destaques do marketplace na home
│   │   ├── HomepageMarketplace.tsx  # Seção marketplace na homepage
│   │   ├── StoreProductForm.tsx     # Formulário de produto da loja
│   │   ├── StoreProductFeedCard.tsx # Card de produto da loja
│   │   ├── StorePlanBadge.tsx       # Badge visual do plano (Bronze/Prata/Ouro)
│   │   ├── FollowButton.tsx         # Botão seguir/desseguir usuário
│   │   ├── FollowStoreButton.tsx    # Botão seguir/desseguir loja
│   │   ├── FollowedStoresNewProducts.tsx # Novos produtos de lojas seguidas
│   │   ├── SellerRating.tsx         # Avaliação do vendedor (estrelas)
│   │   ├── SellerReviewsList.tsx    # Lista de avaliações
│   │   ├── ReviewForm.tsx           # Formulário de avaliação
│   │   ├── VerificationBadge.tsx    # Selo de verificação
│   │   ├── ReportButton.tsx         # Botão de denúncia
│   │   ├── PriceAlertButton.tsx     # Alerta de preço
│   │   ├── SimilarProducts.tsx      # Produtos similares
│   │   ├── BannerAd.tsx             # Banner publicitário
│   │   ├── BannerAdColumn.tsx       # Coluna de banners
│   │   ├── InlineBannerAd.tsx       # Banner inline no feed
│   │   ├── DeliveryInfo.tsx         # Informações de entrega
│   │   ├── DeliveryOptionsSelect.tsx# Seletor de opções de entrega
│   │   ├── SEOHead.tsx              # Meta tags SEO dinâmicas
│   │   ├── PresenceProvider.tsx     # Provider de presença online
│   │   ├── ProfileLinksDisplay.tsx  # Links sociais do perfil
│   │   ├── NavLink.tsx              # Link de navegação com estado ativo
│   │   │
│   │   ├── Admin*                   # Componentes do painel admin
│   │   │   ├── AdminBadgeManager.tsx
│   │   │   ├── AdminBannerManager.tsx
│   │   │   ├── AdminCategoryManager.tsx
│   │   │   ├── AdminFooterImage.tsx
│   │   │   ├── AdminForbiddenWords.tsx
│   │   │   ├── AdminHeaderOpacity.tsx
│   │   │   ├── AdminLoginSettings.tsx
│   │   │   ├── AdminModerationLogs.tsx
│   │   │   ├── AdminModeratorManager.tsx
│   │   │   ├── AdminPageEditor.tsx
│   │   │   ├── AdminProfileLinks.tsx
│   │   │   └── AdminServiceManager.tsx
│   │
│   ├── pages/                       # Páginas (uma por rota)
│   │   ├── Index.tsx                # Homepage (feed + marketplace)
│   │   ├── Login.tsx                # Tela de login
│   │   ├── Register.tsx             # Tela de cadastro
│   │   ├── Profile.tsx              # Perfil do usuário logado
│   │   ├── PublicProfile.tsx        # Perfil público de outro usuário
│   │   ├── Marketplace.tsx          # Marketplace completo
│   │   ├── ProductPage.tsx          # Página individual de produto
│   │   ├── Services.tsx             # Diretório de serviços
│   │   ├── Stores.tsx               # Lista de lojas
│   │   ├── StorePage.tsx            # Página pública de uma loja
│   │   ├── CreateStore.tsx          # Criação de loja
│   │   ├── MyStore.tsx              # Gerenciamento da própria loja
│   │   ├── StorePlans.tsx           # Assinatura de planos premium
│   │   ├── Messages.tsx             # Central de mensagens
│   │   ├── Friends.tsx              # Gerenciamento de amizades
│   │   ├── Settings.tsx             # Configurações do usuário
│   │   ├── Search.tsx               # Busca de usuários
│   │   ├── AdminPanel.tsx           # Painel administrativo
│   │   ├── ModeratorPanel.tsx       # Painel de moderação
│   │   ├── SellerDashboard.tsx      # Dashboard do vendedor
│   │   ├── TopSellers.tsx           # Ranking de vendedores
│   │   ├── BuyCredits.tsx           # Compra de créditos
│   │   ├── About.tsx                # Página sobre
│   │   ├── ResetPassword.tsx        # Redefinição de senha
│   │   ├── SitePage.tsx             # Páginas dinâmicas (CMS)
│   │   └── NotFound.tsx             # Página 404
│   │
│   ├── hooks/                       # Custom hooks
│   │   ├── useAdmin.ts              # Verificação de role admin
│   │   ├── useModerator.ts          # Verificação de role moderador
│   │   ├── useUnreadMessages.ts     # Contagem de mensagens não lidas
│   │   ├── useFollowers.ts          # Gestão de seguidores
│   │   ├── useStoreFollowers.ts     # Seguidores de loja
│   │   ├── useSellerReviews.ts      # Avaliações de vendedor
│   │   ├── useVerificationBadges.ts # Selos de verificação
│   │   ├── useForbiddenWords.ts     # Palavras proibidas
│   │   ├── useMarketplaceCategories.ts # Categorias do marketplace
│   │   ├── useMarketplaceRecommendations.ts # Recomendações personalizadas
│   │   ├── usePriceAlert.ts         # Alertas de preço
│   │   ├── usePresence.tsx          # Presença online
│   │   ├── useBrowserNotifications.ts # Notificações do navegador
│   │   ├── useAudioRecorder.ts      # Gravação de áudio
│   │   ├── useAdminReports.ts       # Relatórios admin
│   │   └── use-mobile.tsx           # Detecção de mobile
│   │
│   ├── context/                     # Contextos React (state global)
│   │   ├── AuthContext.tsx          # Autenticação e perfil do usuário
│   │   ├── LanguageContext.tsx      # Internacionalização (pt/en/es)
│   │   └── SocialContext.tsx        # Estado social (amigos, etc.)
│   │
│   ├── lib/                         # Utilitários
│   │   ├── utils.ts                 # Funções utilitárias (cn, formatação)
│   │   ├── cpfCnpjValidator.ts      # Validação matemática de CPF/CNPJ
│   │   ├── imageCompression.ts      # Compressão de imagens (max 5MB)
│   │   └── sergipeCities.ts         # Lista de cidades de Sergipe
│   │
│   ├── integrations/
│   │   ├── supabase/
│   │   │   ├── client.ts            # Cliente Supabase (auto-gerado)
│   │   │   └── types.ts             # Tipos do banco (auto-gerado)
│   │   └── lovable/
│   │       └── index.ts             # Integração Lovable
│   │
│   └── test/                        # Testes
│       ├── setup.ts
│       └── example.test.ts
│
├── supabase/
│   ├── config.toml                  # Configuração das Edge Functions
│   └── functions/                   # Edge Functions (Deno)
│       ├── asaas-payment/           # Criação de pagamentos no Asaas
│       ├── asaas-subscription/      # Gerenciamento de assinaturas
│       ├── asaas-webhook/           # Webhook de notificação do Asaas
│       ├── check-nsfw/              # Verificação de conteúdo NSFW via IA
│       ├── delete-account/          # Exclusão de conta
│       └── og-marketplace/          # Geração de Open Graph tags
│
├── tailwind.config.ts               # Configuração Tailwind (cores, fontes)
├── vite.config.ts                   # Configuração Vite
├── tsconfig.json                    # Configuração TypeScript
├── components.json                  # Configuração shadcn/ui
└── package.json                     # Dependências e scripts
```

---

## 5. Páginas do Sistema

### 5.1 Homepage (`/` — `Index.tsx`)
- **Função**: Página principal com feed social e marketplace
- **Componentes**: `FacebookHeader`, `ProfileSidebar`, `PostFeed`, `FriendsSidebar`, `FriendSuggestions`, `MarketplaceHighlights`, `HomepageMarketplace`, `FollowedStoresNewProducts`, `BannerAdColumn`, `MobileQuickNav`
- **Dados**: Posts, perfil do usuário, amigos online, itens do marketplace, banners

### 5.2 Login (`/login` — `Login.tsx`)
- **Função**: Autenticação com email/telefone e senha
- **Componentes**: Formulário de login, link para cadastro e redefinição de senha

### 5.3 Cadastro (`/register` — `Register.tsx`)
- **Função**: Registro de novo usuário
- **Campos**: Nome, email, senha, escola, data de nascimento, cidade, telefone (opcional)

### 5.4 Perfil (`/profile` — `Profile.tsx`)
- **Função**: Visualização e edição do perfil do usuário logado
- **Dados**: Informações pessoais, foto, bio, links sociais, posts

### 5.5 Perfil Público (`/user/:userId` — `PublicProfile.tsx`)
- **Função**: Visualização do perfil de outro usuário
- **Ações**: Seguir, enviar mensagem, adicionar como amigo, denunciar

### 5.6 Marketplace (`/marketplace` — `Marketplace.tsx`)
- **Função**: Listagem e busca de produtos
- **Filtros**: Categoria, cidade, condição, preço, texto
- **Dados**: `marketplace_items` com perfil do vendedor

### 5.7 Página do Produto (`/produto/:id` — `ProductPage.tsx`)
- **Função**: Detalhes de um produto específico
- **Componentes**: Galeria de imagens, informações do vendedor, avaliações, produtos similares, alerta de preço

### 5.8 Serviços (`/servicos` — `Services.tsx`)
- **Função**: Diretório de prestadores de serviço
- **Dados**: `service_listings` com `service_categories` e `service_subcategories`

### 5.9 Lojas (`/stores` — `Stores.tsx`)
- **Função**: Lista de lojas ativas com priorização por plano premium
- **Ordenação**: Ouro > Prata > Bronze > Free
- **Dados**: `stores` com `store_plans`

### 5.10 Página da Loja (`/store/:slug` — `StorePage.tsx`)
- **Função**: Vitrine pública de uma loja
- **Componentes**: Produtos, informações, selo do plano, botão seguir

### 5.11 Minha Loja (`/minha-loja` — `MyStore.tsx`)
- **Função**: Gerenciamento da própria loja (produtos, configurações)

### 5.12 Criar Loja (`/stores/create` — `CreateStore.tsx`)
- **Função**: Formulário de criação de nova loja

### 5.13 Planos de Loja (`/planos-loja` — `StorePlans.tsx`)
- **Função**: Assinatura de planos premium (Bronze, Prata, Ouro)
- **Integração**: Asaas para pagamento recorrente

### 5.14 Mensagens (`/messages` — `Messages.tsx`)
- **Função**: Central de mensagens privadas em tempo real
- **Recursos**: Texto, imagens, áudio, mensagens temporárias, edição, exclusão

### 5.15 Amigos (`/amigos` — `Friends.tsx`)
- **Função**: Gerenciamento de amizades (solicitações, lista de amigos)

### 5.16 Configurações (`/configuracoes` — `Settings.tsx`)
- **Função**: Preferências do usuário (tema, notificações, privacidade, idioma)

### 5.17 Busca (`/search` — `Search.tsx`)
- **Função**: Busca de usuários por nome

### 5.18 Top Vendedores (`/top-vendedores` — `TopSellers.tsx`)
- **Função**: Ranking dos melhores vendedores por avaliação

### 5.19 Comprar Créditos (`/comprar-creditos` — `BuyCredits.tsx`)
- **Função**: Compra de créditos para patrocínio de anúncios
- **Métodos**: PIX, boleto, cartão
- **Validação**: CPF/CNPJ no frontend

### 5.20 Painel Admin (`/admin` — `AdminPanel.tsx`)
- **Função**: Administração geral (usuários, categorias, banners, moderação, páginas, configurações)

### 5.21 Painel Moderador (`/moderator` — `ModeratorPanel.tsx`)
- **Função**: Moderação de conteúdo (denúncias, posts, anúncios)

### 5.22 Dashboard do Vendedor (`/seller-dashboard` — `SellerDashboard.tsx`)
- **Função**: Métricas e estatísticas de vendas

### 5.23 Páginas Dinâmicas (`/page/:slug` — `SitePage.tsx`)
- **Função**: Páginas CMS gerenciadas pelo admin

---

## 6. Sistema de Usuários

### 6.1 Cadastro
1. Usuário preenche: nome, email, senha, escola, data de nascimento, cidade
2. `supabase.auth.signUp()` cria o usuário no Auth
3. Trigger `handle_new_user()` cria automaticamente um registro na tabela `profiles`
4. Campos extras (escola, cidade, data de nascimento) são atualizados via `profiles.update()`

### 6.2 Login
- Suporta login por **email** ou **telefone** (`+55...`)
- `supabase.auth.signInWithPassword()` com email ou phone
- Sessão JWT persistida em `localStorage`

### 6.3 Autenticação
- **Provider**: `AuthContext.tsx` envolve toda a aplicação
- **Estado**: `user`, `loading`, `login()`, `register()`, `logout()`, `updateProfile()`
- **Listener**: `onAuthStateChange` reage a mudanças de sessão
- **Proteção de rotas**: Itens de navegação condicionais (`!user && [...].includes(to)`)

### 6.4 Gerenciamento de Perfil
- Edição de: nome, bio, foto, escola, cidade, data de nascimento
- Upload de foto via Storage bucket `avatars` (público)
- Links sociais customizáveis (Instagram, WhatsApp, YouTube, etc.)

### 6.5 Seguidores
- Tabela `followers` (follower_id, following_id)
- Hook `useFollowers` para seguir/desseguir
- Contagem de seguidores visível no perfil público

### 6.6 Amizades
- Tabela `friendships` com status: `pending`, `accepted`
- Fluxo: Enviar solicitação → Aceitar/Rejeitar
- Função SQL `get_friend_suggestions()` calcula sugestões com score baseado em: amigos em comum (×3), mesma cidade (×2), usuário novo (×1), seguidores (até ×5)

### 6.7 Presença Online
- Tabela `user_presence` (user_id, is_online, last_seen_at)
- `PresenceProvider` atualiza presença periodicamente
- Indicador visual de online/offline nos amigos

---

## 7. Sistema de Anúncios (Marketplace)

### 7.1 Criação de Anúncio
1. Usuário preenche: título, preço, categoria, condição, cidade, WhatsApp, descrição
2. Upload de até **5 imagens** (comprimidas para max 5MB via `imageCompression.ts`)
3. Verificação NSFW via Edge Function `check-nsfw` antes da publicação
4. Dados salvos em `marketplace_items`

### 7.2 Exibição
- Cards com imagem, preço, título, cidade, data
- Filtros: categoria, cidade, condição, busca textual
- Ordenação: mais recentes primeiro
- Anúncios patrocinados aparecem com destaque

### 7.3 Interações
- **Visualizações**: Registradas em `marketplace_views`
- **Contato**: Link direto wa.me para WhatsApp
- **Marcar como vendido**: Toggle pelo proprietário
- **Excluir**: Pelo proprietário ou moderador
- **Denunciar**: Via `ReportButton`
- **Alerta de preço**: Notifica quando preço baixar

### 7.4 Recomendações
- Hook `useMarketplaceRecommendations` usa `category_access` para personalizar
- Tabela `marketplace_views` rastreia interações por categoria

### 7.5 Patrocínio
- Tabela `sponsored_campaigns` com budget em créditos
- Controle de impressões, cliques e gastos
- Segmentação por cidade e categoria

---

## 8. Sistema de Lojas

### 8.1 Criação de Loja
1. Rota `/stores/create`
2. Campos: nome, descrição, categoria, cidade, foto
3. Slug gerado automaticamente do nome
4. Dados salvos em `stores`
5. Plano inicial: `free` (auto-inserido em `store_plans`)

### 8.2 Perfil da Loja (`/store/:slug`)
- Foto, nome, descrição, categoria, cidade
- Badge do plano (se Bronze/Prata/Ouro)
- Lista de produtos ativos
- Botão seguir loja
- Contagem de seguidores

### 8.3 Seguidores de Loja
- Tabela `store_followers`
- Hook `useStoreFollowers`
- Componente `FollowedStoresNewProducts` mostra novidades na home

### 8.4 Produtos da Loja
- Tabela `store_products` com FK para `stores`
- Suporte a múltiplas imagens, opções de entrega, categorias
- Limite de produtos por plano (ver seção 9)
- Métricas: `view_count`, `contact_count`

### 8.5 Gerenciamento (`/minha-loja`)
- CRUD de produtos
- Visualização de métricas
- Link para upgrade de plano

---

## 9. Sistema de Planos Premium

### 9.1 Tipos de Planos

| Plano | Limite de Produtos | Prioridade na Busca | Selo Visual |
|---|---|---|---|
| **Free** | 10 | Nenhuma | Nenhum |
| **Bronze** | 30 | Baixa | 🛡️ Bronze |
| **Prata** | 100 | Média | ⭐ Prata |
| **Ouro** | Ilimitado | Alta | 👑 Ouro |

### 9.2 Benefícios Implementados
- **Limite de produtos**: Verificado no `StoreProductForm` antes de permitir novo produto
- **Priorização**: `Stores.tsx` ordena por `plan_type` (ouro > prata > bronze > free)
- **Selo visual**: `StorePlanBadge.tsx` exibe ícone e label coloridos
- **Destaque**: Bordas coloridas nas cards de lojas premium

### 9.3 Integração com Pagamento
- Assinatura via Edge Function `asaas-subscription`
- Webhook `asaas-webhook` processa:
  - `PAYMENT_CONFIRMED` → ativa/renova plano (+30 dias)
  - `PAYMENT_OVERDUE` / `PAYMENT_REFUNDED` → reverte para free
- Tabela `store_plans`: `store_id`, `plan_type`, `is_active`, `starts_at`, `ends_at`

### 9.4 Controle de Acesso
- `PLAN_PRODUCT_LIMITS` em `StorePlanBadge.tsx` define limites
- Consulta `store_plans` para verificar plano ativo antes de inserir produto
- RLS: Donos da loja podem gerenciar seus planos

---

## 10. Banco de Dados

### 10.1 Diagrama de Relacionamentos

```
auth.users (Supabase Auth)
    │
    ├──→ profiles (1:1) ─── user_id
    ├──→ posts (1:N) ─── user_id
    ├──→ comments (1:N) ─── user_id
    ├──→ post_reactions (1:N) ─── user_id
    ├──→ marketplace_items (1:N) ─── user_id
    ├──→ messages (1:N) ─── sender_id, receiver_id
    ├──→ friendships (1:N) ─── requester_id, addressee_id
    ├──→ followers (1:N) ─── follower_id, following_id
    ├──→ stores (1:N) ─── user_id
    ├──→ store_products (1:N) ─── user_id
    ├──→ service_listings (1:N) ─── user_id
    ├──→ user_roles (1:N) ─── user_id
    ├──→ user_settings (1:1) ─── user_id
    ├──→ user_presence (1:1) ─── user_id
    ├──→ ad_credits (1:1) ─── user_id
    ├──→ payments (1:N) ─── user_id
    ├──→ seller_reviews (1:N) ─── reviewer_id, seller_id
    ├──→ reports (1:N) ─── reporter_id
    ├──→ bans (1:N) ─── user_id, banned_by
    └──→ moderation_logs (1:N) ─── moderator_id

stores
    ├──→ store_products (1:N) ─── store_id
    ├──→ store_plans (1:1) ─── store_id
    └──→ store_followers (1:N) ─── store_id

posts
    ├──→ comments (1:N) ─── post_id
    └──→ post_reactions (1:N) ─── post_id

marketplace_items
    ├──→ marketplace_views (1:N) ─── item_id
    └──→ sponsored_campaigns (1:N) ─── item_id

service_categories
    └──→ service_subcategories (1:N) ─── category_id
         └──→ service_listings (1:N) ─── subcategory_id
```

### 10.2 Tabelas Detalhadas

#### `profiles`
| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid (PK) | ID interno |
| user_id | uuid (UNIQUE) | Referência ao auth.users |
| name | text | Nome do usuário |
| email | text | Email |
| bio | text | Biografia |
| photo_url | text | URL da foto de perfil |
| school | text | Escola/Instituição |
| city | text | Cidade |
| birthdate | date | Data de nascimento |
| verified | boolean | Selo de verificação pessoal |
| business_verified | boolean | Selo de verificação comercial |
| profile_links | jsonb | Links sociais (Instagram, etc.) |
| created_at | timestamptz | Data de criação |
| updated_at | timestamptz | Última atualização |

#### `posts`
| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid (PK) | ID do post |
| user_id | uuid | Autor |
| content | text | Conteúdo textual |
| image_url | text | URL da imagem (opcional) |
| created_at | timestamptz | Data de criação |

#### `comments`
| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid (PK) | ID do comentário |
| post_id | uuid (FK→posts) | Post relacionado |
| user_id | uuid | Autor |
| content | text | Texto do comentário |
| created_at | timestamptz | Data |

#### `marketplace_items`
| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid (PK) | ID |
| user_id | uuid | Vendedor |
| title | text | Título do produto |
| price | text | Preço (texto formatado) |
| description | text | Descrição |
| category | text | Categoria |
| condition | text | Condição (novo/usado) |
| city | text | Cidade |
| whatsapp | text | Contato WhatsApp |
| image_url | text | Imagem principal |
| images | jsonb | Array de URLs de imagens (até 5) |
| sold | boolean | Marcado como vendido |
| view_count | integer | Contagem de visualizações |
| created_at | timestamptz | Data |

#### `stores`
| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid (PK) | ID |
| user_id | uuid | Proprietário |
| name | text | Nome da loja |
| slug | text (UNIQUE) | URL amigável |
| description | text | Descrição |
| category | text | Categoria |
| city | text | Cidade |
| photo_url | text | Logo da loja |
| is_active | boolean | Ativa/Inativa |
| created_at | timestamptz | Data de criação |

#### `store_products`
| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid (PK) | ID |
| store_id | uuid (FK→stores) | Loja |
| user_id | uuid | Proprietário |
| title | text | Título |
| price | text | Preço |
| description | text | Descrição |
| category | text | Categoria |
| image_url | text | Imagem principal |
| images | jsonb | Múltiplas imagens |
| is_active | boolean | Ativo |
| city | text | Cidade |
| delivery_options | jsonb | Opções de entrega |
| delivery_cost | text | Custo de entrega |
| view_count | integer | Visualizações |
| contact_count | integer | Contatos recebidos |
| created_at | timestamptz | Data |

#### `store_plans`
| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid (PK) | ID |
| store_id | uuid (FK→stores, UNIQUE) | Loja (1:1) |
| plan_type | text | free/bronze/prata/ouro |
| is_active | boolean | Plano ativo |
| starts_at | timestamptz | Início da assinatura |
| ends_at | timestamptz | Fim da assinatura |
| created_at | timestamptz | Data |

#### `messages`
| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid (PK) | ID |
| sender_id | uuid | Remetente |
| receiver_id | uuid | Destinatário |
| content | text | Texto da mensagem |
| image_url | text | Imagem anexada |
| audio_url | text | Áudio anexado |
| read | boolean | Lida |
| is_deleted | boolean | Deletada |
| edited_at | timestamptz | Editada em |
| expires_at | timestamptz | Expira em (temporária) |
| created_at | timestamptz | Data |

#### `friendships`
| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid (PK) | ID |
| requester_id | uuid | Quem enviou |
| addressee_id | uuid | Quem recebeu |
| status | text | pending/accepted |
| created_at | timestamptz | Data |
| updated_at | timestamptz | Última atualização |

#### `user_roles`
| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid (PK) | ID |
| user_id | uuid | Usuário |
| role | app_role (enum) | admin/moderator/user |

#### `user_settings`
| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid (PK) | ID |
| user_id | uuid | Usuário |
| theme | text | light/dark |
| language | text | pt/en/es |
| sound_enabled | boolean | Sons ativos |
| push_notifications | boolean | Notificações push |
| email_notifications | boolean | Notificações email |
| message_notifications | boolean | Notificações de mensagem |
| friend_request_notifications | boolean | Notificações de amizade |
| marketplace_notifications | boolean | Notificações marketplace |
| show_online_status | boolean | Mostrar status online |
| show_last_seen | boolean | Mostrar visto por último |
| profile_visibility | text | public/friends/private |
| allow_messages_from | text | everyone/friends/nobody |
| compact_mode | boolean | Modo compacto |

#### `payments`
| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid (PK) | ID |
| user_id | uuid | Comprador |
| amount | numeric | Valor em R$ |
| credits | integer | Créditos comprados |
| payment_method | text | PIX/BOLETO/CREDIT_CARD |
| status | text | PENDING/CONFIRMED/OVERDUE/REFUNDED |
| asaas_payment_id | text | ID no Asaas |
| pix_qr_code | text | QR code PIX (base64) |
| pix_copy_paste | text | Código PIX copia-e-cola |
| boleto_url | text | URL do boleto |
| invoice_url | text | URL da fatura |
| created_at | timestamptz | Data |

#### Outras tabelas
- **`ad_credits`**: Saldo de créditos (user_id, balance)
- **`banner_ads`**: Banners publicitários gerenciados pelo admin
- **`bans`**: Banimentos de usuários
- **`category_access`**: Rastreamento de categorias acessadas
- **`followers`**: Relações de seguimento entre usuários
- **`forbidden_words`**: Palavras proibidas (moderação)
- **`marketplace_categories`**: Categorias customizáveis do marketplace
- **`marketplace_views`**: Rastreamento de visualizações/interações
- **`moderation_logs`**: Log de ações de moderação
- **`post_reactions`**: Curtidas em posts
- **`price_alerts`**: Alertas de queda de preço
- **`reports`**: Denúncias de conteúdo
- **`seller_reviews`**: Avaliações de vendedores
- **`service_categories`**: Categorias de serviços
- **`service_subcategories`**: Subcategorias de serviços
- **`service_listings`**: Anúncios de serviços
- **`site_pages`**: Páginas CMS
- **`site_settings`**: Configurações globais do site
- **`sponsored_campaigns`**: Campanhas de anúncios patrocinados
- **`store_followers`**: Seguidores de lojas
- **`user_presence`**: Status online/offline

### 10.3 Enum
- **`app_role`**: `admin` | `moderator` | `user`

### 10.4 Funções SQL
| Função | Descrição |
|---|---|
| `handle_new_user()` | Trigger: cria perfil ao registrar usuário |
| `has_role(_user_id, _role)` | Security definer: verifica role sem recursão RLS |
| `get_friend_suggestions(_user_id, _limit)` | Calcula sugestões de amizade com score |
| `increment_banner_impressions(_banner_id)` | Incrementa impressões de banner |
| `increment_banner_clicks(_banner_id)` | Incrementa cliques de banner |

### 10.5 Segurança (RLS)
Todas as tabelas têm RLS ativado. Princípios:
- **Leitura pública**: profiles, posts, comments, marketplace_items, stores, etc.
- **Escrita própria**: Usuários só inserem/atualizam seus próprios dados
- **Admin total**: Admins têm acesso completo via `has_role()`
- **Moderação**: Moderadores podem deletar conteúdo e visualizar denúncias

---

## 11. Integrações

### 11.1 Supabase (Lovable Cloud)
- **Auth**: Cadastro, login, sessões JWT, recuperação de senha
- **Database**: PostgreSQL com RLS para todas as tabelas
- **Storage**: 5 buckets públicos (avatars, post-images, site-assets, chat-images, chat-audio)
- **Realtime**: Canal WebSocket para mensagens instantâneas
- **Edge Functions**: 6 funções serverless

### 11.2 Asaas (Pagamentos)
- **API**: `https://api.asaas.com/v3`
- **Edge Functions**:
  - `asaas-payment`: Cria pagamentos (PIX, boleto, cartão) para créditos
  - `asaas-subscription`: Cria assinaturas para planos de loja
  - `asaas-webhook`: Recebe notificações de status de pagamento
- **Secrets**: `ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN`
- **Fluxo**:
  ```
  Frontend → asaas-payment → Asaas API → (pagamento processado)
  Asaas → asaas-webhook → Atualiza DB (payments, ad_credits, store_plans)
  ```

### 11.3 Lovable AI (NSFW)
- Edge Function `check-nsfw` usa IA para detectar conteúdo impróprio em imagens
- Executada antes de publicar anúncios no marketplace

### 11.4 Open Graph
- Edge Function `og-marketplace` gera meta tags OG dinâmicas para compartilhamento de produtos

---

## 12. Fluxos do Sistema

### 12.1 Fluxo de Cadastro
```
Usuário → Preenche formulário → supabase.auth.signUp()
  → Trigger handle_new_user() → Cria profile
  → Atualiza campos extras (escola, cidade, etc.)
  → Redireciona para Home
```

### 12.2 Fluxo de Login
```
Usuário → Email/Telefone + Senha → supabase.auth.signInWithPassword()
  → onAuthStateChange → fetchProfile() → setUser()
  → Redireciona para Home
```

### 12.3 Fluxo de Criação de Anúncio
```
Usuário → MarketplaceForm → Upload imagens → Compressão
  → check-nsfw (validação IA) → Se aprovado:
  → INSERT marketplace_items → Exibe no marketplace
```

### 12.4 Fluxo de Criação de Loja
```
Usuário → /stores/create → Preenche dados → Gera slug
  → INSERT stores → INSERT store_plans (free)
  → Redireciona para /minha-loja
```

### 12.5 Fluxo de Assinatura de Plano
```
Usuário → /planos-loja → Escolhe plano → Valida CPF
  → asaas-subscription (Edge Function) → Cria assinatura no Asaas
  → Asaas gera cobrança → Webhook confirma pagamento
  → asaas-webhook → Atualiza store_plans (plan_type, ends_at)
```

### 12.6 Fluxo de Compra de Créditos
```
Usuário → /comprar-creditos → Escolhe pacote e método
  → Valida CPF → asaas-payment (Edge Function)
  → Retorna QR PIX / URL boleto / processa cartão
  → Webhook confirma → Atualiza payments + ad_credits
```

### 12.7 Fluxo de Mensagens
```
Usuário → Seleciona contato → Digita mensagem
  → INSERT messages → Realtime broadcast
  → Destinatário recebe via WebSocket → Notificação sonora
```

---

## 13. Configuração do Ambiente

### 13.1 Pré-requisitos
- Node.js 18+ (recomendado: instalação via nvm)
- npm ou bun

### 13.2 Instalação Local
```bash
# 1. Clonar o repositório
git clone <URL_DO_REPO>
cd <NOME_DO_PROJETO>

# 2. Instalar dependências
npm install

# 3. Iniciar servidor de desenvolvimento
npm run dev
```

### 13.3 Variáveis de Ambiente (`.env`)
```env
VITE_SUPABASE_URL=https://rkzjhpmoijnixmfljgip.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
VITE_SUPABASE_PROJECT_ID=rkzjhpmoijnixmfljgip
```
> ⚠️ O arquivo `.env` é auto-gerado pelo Lovable Cloud. Não editar manualmente.

### 13.4 Scripts Disponíveis
| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (porta 8080) |
| `npm run build` | Build de produção |
| `npm run build:dev` | Build de desenvolvimento |
| `npm run preview` | Preview do build |
| `npm run test` | Executar testes |
| `npm run test:watch` | Testes em modo watch |
| `npm run lint` | Verificar código com ESLint |

### 13.5 Secrets (Edge Functions)
| Secret | Descrição |
|---|---|
| `ASAAS_API_KEY` | Chave da API Asaas |
| `ASAAS_WEBHOOK_TOKEN` | Token de validação do webhook |
| `LOVABLE_API_KEY` | Chave da API Lovable AI |
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_ANON_KEY` | Chave anon pública |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço (acesso total) |
| `SUPABASE_DB_URL` | URL direta do banco |

---

## 14. Boas Práticas e Manutenção

### 14.1 Código
- **Componentes pequenos**: Cada componente tem uma responsabilidade clara
- **Hooks customizados**: Lógica reutilizável extraída em hooks (`/hooks`)
- **Tipagem forte**: TypeScript em todo o projeto com tipos do Supabase auto-gerados
- **Design tokens**: Cores via CSS variables semânticas em `index.css` — nunca usar cores hardcoded

### 14.2 Segurança
- **RLS em todas as tabelas**: Nenhuma tabela sem políticas de segurança
- **Roles separadas**: `user_roles` em tabela dedicada (nunca no profile)
- **`has_role()` security definer**: Evita recursão em RLS
- **Validação dupla**: Frontend (CPF, campos) + Backend (RLS, Edge Functions)
- **Secrets nunca no código**: Todas as chaves em variáveis de ambiente

### 14.3 Performance
- **React Query**: Cache automático de dados do servidor
- **Compressão de imagens**: Antes do upload (max 5MB)
- **Lazy loading**: Imagens e componentes pesados
- **`resolve.dedupe`**: Vite configurado para evitar duplicação de React

### 14.4 Escalabilidade
- **Edge Functions**: Serverless, escala automaticamente
- **Storage público**: CDN do Supabase para assets
- **Índices**: Considerar adicionar índices em campos de busca frequente (city, category)
- **Paginação**: Implementar em listagens grandes (marketplace, stores)

### 14.5 Manutenção
- **Tipos auto-gerados**: `types.ts` reflete o esquema do banco automaticamente
- **Migrations**: Usar ferramenta de migration para alterações no banco
- **Testes**: Expandir cobertura de testes unitários e de integração
- **Monitoramento**: Acompanhar logs das Edge Functions e métricas do banco

---

## 15. Estrutura da Sidebar

### Estrutura Atual (Simplificada)
A sidebar unifica a navegação em itens claros:

| Ícone | Label | Rota | Descrição |
|---|---|---|---|
| 🏠 Home | Início | `/` | Homepage |
| 👤 User | Perfil | `/profile` | Perfil do usuário |
| 🛒 ShoppingCart | Mercado | `/marketplace` | Marketplace |
| 🔧 Wrench | Serviços | `/servicos` | Diretório de serviços |
| 🏪 Store | Lojas | `/stores` | Lojas + acesso a planos |
| 🏆 Trophy | Top | `/top-vendedores` | Ranking vendedores |
| 💰 Coins | Créditos | `/comprar-creditos` | Compra de créditos |
| 💬 MessageCircle | Chat | `/messages` | Mensagens (com badge) |
| 👥 Users | Amigos | `/amigos` | Amizades |
| ⚙️ Settings | Config. | `/configuracoes` | Configurações |

> **Nota**: "Lojas" e "Planos" foram unificados. O acesso a planos ocorre através da página de lojas (`/stores`) e de dentro da gestão da loja (`/minha-loja`). A rota `/planos-loja` continua acessível diretamente pela URL.

---

## 16. Formato da Documentação

Esta documentação segue o formato Markdown com:
- **Títulos e subtítulos** hierárquicos (H1 → H4)
- **Tabelas** para dados estruturados
- **Blocos de código** para trechos técnicos
- **Diagramas ASCII** para fluxos e arquitetura
- **Listas** para enumerações
- **Notas** com ícones para avisos importantes

### Manutenção da Documentação
- Atualizar ao adicionar novas páginas, tabelas ou integrações
- Manter alinhada com o código-fonte
- Revisar diagramas de banco quando houver migrations

---

*Documentação gerada para o projeto Conectados em Sergipe — Plataforma de rede social e marketplace regional.*
