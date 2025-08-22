# TAREFAS DE IMPLEMENTAÇÃO - APLICATIVO CIOCCLETTI

## FASE 1: AUTENTICAÇÃO E CADASTROS BÁSICOS

### 1. CONFIGURAÇÃO INICIAL
- [x] Projeto React Native com Expo configurado
- [ ] Configurar variáveis de ambiente para Google Sheets API
- [ ] Criar estrutura de pastas para o projeto
- [ ] Configurar tema e cores baseado no logo (dourado/bronze)

### 2. AUTENTICAÇÃO E CONTROLE DE ACESSO
- [ ] Criar tela de login
- [ ] Criar tela de cadastro de usuário
- [ ] Criar tela de espera para aprovação
- [ ] Implementar integração com Google Sheets para autenticação
- [ ] Implementar controle de acesso baseado na coluna "Acesso Aprovado"
- [ ] Criar contexto de autenticação

### 3. GESTÃO DE USUÁRIOS
- [ ] Implementar CRUD de usuários via Google Sheets
- [ ] Sistema de aprovação de usuários
- [ ] Perfis de usuário (Vendas, Cozinha, Administrador)

### 4. GESTÃO DE CLIENTES
- [ ] Criar tela de listagem de clientes
- [ ] Criar tela de cadastro de cliente
- [ ] Criar tela de edição de cliente
- [ ] Implementar CRUD de clientes via Google Sheets
- [ ] Suporte a múltiplos endereços por cliente

### 5. GESTÃO DE PRODUTOS
- [ ] Criar tela de listagem de produtos
- [ ] Criar tela de cadastro de produto
- [ ] Criar tela de edição de produto
- [ ] Implementar CRUD de produtos via Google Sheets
- [ ] Categorias: Bolos, Doces, Produtos Sazonais

### 6. INTEGRAÇÃO COM GOOGLE SHEETS
- [ ] Configurar Google Apps Script
- [ ] Implementar funções para:
  - Autenticação de usuários
  - CRUD de usuários
  - CRUD de clientes
  - CRUD de produtos
- [ ] Tratamento de erros e validações

### 7. INTERFACE E UX
- [ ] Design system baseado no logo Cioccoletti
- [ ] Paleta de cores: Dourado/Bronze como cor principal
- [ ] Componentes reutilizáveis
- [ ] Navegação intuitiva
- [ ] Feedback visual para ações do usuário

### 8. TESTES E VALIDAÇÃO
- [ ] Testes de integração com Google Sheets
- [ ] Validação de formulários
- [ ] Testes de fluxo de autenticação
- [ ] Testes de controle de acesso

## ESTRUTURA DE PASTAS RECOMENDADA

```
app/
├── (auth)/
│   ├── login.tsx
│   ├── register.tsx
│   └── waiting-approval.tsx
├── (main)/
│   ├── _layout.tsx
│   ├── clients/
│   │   ├── index.tsx
│   │   ├── create.tsx
│   │   └── edit.tsx
│   ├── products/
│   │   ├── index.tsx
│   │   ├── create.tsx
│   │   └── edit.tsx
│   └── profile/
│       └── index.tsx
├── components/
│   ├── ui/
│   ├── forms/
│   └── layout/
├── services/
│   ├── sheets-api.ts
│   └── auth.ts
├── hooks/
├── types/
└── utils/
```

## PRÓXIMOS PASSOS

1. **Configurar ambiente e dependências**
2. **Implementar sistema de autenticação**
3. **Criar estrutura de navegação**
4. **Implementar integração com Google Sheets**
5. **Desenvolver telas de cadastro**
6. **Implementar controle de acesso**
7. **Testes e refinamentos**

## DEPENDÊNCIAS NECESSÁRIAS

- `@react-native-async-storage/async-storage` - Para armazenamento local
- `react-hook-form` - Para formulários
- `zod` - Para validação de dados
- `axios` - Para requisições HTTP
- `react-native-paper` - Para componentes de UI
- `react-native-vector-icons` - Para ícones
