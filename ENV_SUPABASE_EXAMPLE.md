# 📋 Variáveis de Ambiente - Supabase

## 🔧 Como Configurar

1. **Copie o arquivo `.env`** (se não existir, crie um)
2. **Preencha as variáveis** conforme este exemplo
3. **Reinicie a aplicação** para carregar as novas variáveis

## 📝 Exemplo do Arquivo `.env`

```bash
# Supabase Configuration
# URL do seu projeto Supabase (obrigatório)
EXPO_PUBLIC_SUPABASE_URL=https://wvpjlcnrffhsikhwvtfr.supabase.co

# Chave anônima do Supabase (obrigatório)
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
```

## 🔧 Como Obter as Configurações

### 1. URL do Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Abra seu projeto "Cioccoletti"
4. Vá em **Settings** → **API**
5. Copie a **Project URL**

### 2. Chave Anônima
1. Na mesma página **Settings** → **API**
2. Copie a **anon public** key

## 📱 Como Usar

### 1. Aplicação React Native
As variáveis são carregadas automaticamente pelo Expo

### 2. Verificar Configuração
```bash
node -e "require('dotenv').config(); console.log('Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL)"
```

## ⚠️ Observações Importantes

- **Prefixo EXPO_PUBLIC_**: Necessário para o Expo carregar as variáveis
- **Reiniciar**: Sempre reinicie a aplicação após modificar o `.env`
- **Git**: O arquivo `.env` não deve ser commitado (já está no .gitignore)
- **Segurança**: A chave anônima é segura para uso público

## 🚀 Próximos Passos

Após configurar as variáveis:

1. ✅ **Configurar banco de dados** usando `scripts/setup-database.sql`
2. ✅ **Testar autenticação** no aplicativo
3. ✅ **Implementar funcionalidades** de CRUD
4. ✅ **Sistema completo** funcionando
