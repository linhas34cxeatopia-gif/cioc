# PRD - APLICATIVO CIOCCLETTI
## Documento de Requisitos de Produto

### 📋 **VISÃO GERAL DO PRODUTO**

**Nome do Produto:** Aplicativo de Gestão Cioccoletti  
**Versão:** 1.2  
**Data de Criação:** Dezembro 2024  
**Objetivo:** Sistema completo de gestão para confeitaria, incluindo controle de clientes, produtos, orçamentos, pedidos e produção.

---

### 🎯 **OBJETIVOS E METAS**

- ✅ Autenticação com aprovação
- ✅ Gestão de Clientes (lista, detalhes com abas, múltiplos endereços, histórico)
- ✅ Navegação: Header + SideMenu + Tabs (5 itens fixos)
- ✅ Toast global
- ✅ Integração ViaCEP
- ✅ Módulo de Produtos (lista, detalhes, cadastro com código automático e imagem)

---

### 🏗️ **ARQUITETURA TÉCNICA**

- Frontend: React Native + Expo + Expo Router
- Backend: Supabase (Auth, Postgres, Storage)
- Estado: Context API
- UI: Header/SideMenu/Toast customizados, Ionicons
- Storage: Supabase Storage (bucket `products`) para imagens de produtos

---

### 📱 **FUNCIONALIDADES IMPLEMENTADAS**

#### Clientes
- Lista com pesquisa e paginação
- Detalhes com abas: Dados, Endereços (CRUD, principal), Histórico
- Novo Cliente (CEP auto, teclado não cobre campos)
- Editar Cliente

#### Produtos (novo)
- Atalho no SideMenu (não aparece no TabBar)
- Lista com pesquisa por código/nome e FAB para novo
- Código automático: B1..Bn (bolo), O1..On (outros)
- Cadastro com seleção de tipo (Bolo/Outros)
- Upload de imagem no Supabase Storage com pré-visualização
- Detalhes do produto com imagem e atributos

---

### 🔄 **EM ANDAMENTO / PRÓXIMO**
- Orçamentos (listagem e criação)
- Integração de seleção de endereço do cliente ao criar orçamento
- Notificações push reais

---

### 🔧 **REQUISITOS TÉCNICOS (ATUALIZAÇÕES)**

- Banco:
  - `products`: colunas `code TEXT UNIQUE`, `image_url TEXT` (adicionadas)
  - `client_addresses`: garante endereço principal único via trigger
- Storage:
  - Bucket: `products` (acesso público para leitura)
  - Upload: caminho `products/{code || timestamp}.jpg`

---

### 🐛 **PROBLEMAS RESOLVIDOS RECENTES**
- TabBar com item extra (removido)
- Voltar de Detalhes do Cliente retorna para lista (stack local de Clients)
- CEP primeiro no formulário de endereço, foco no Número e ViaCEP
- FAB alinhados

---

### 📚 **ROTAS RELEVANTES**
- `/(main)/(tabs)/clients` (stack local: `index`, `[id]`, `edit`, `address-new`, `address-edit`)
- `/(main)/(tabs)/products` (stack local: `index`, `new`, `[id]`)

---

### 🔗 **INTEGRAÇÕES EXTERNAS**
- Supabase Postgres + Storage
- ViaCEP

---

### 📝 **HISTÓRICO DE VERSÕES**

| Versão | Data | Descrição |
|--------|------|-----------|
| 1.0.0 | Dez/2024 | PRD inicial |
| 1.1.0 | Dez/2024 | Clientes completo (abas, endereços) |
| 1.2.0 | Dez/2024 | Produtos com upload de imagem + código automático |
