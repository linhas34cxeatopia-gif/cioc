# 🗄️ CONFIGURAÇÃO DO BANCO - SUPABASE DASHBOARD

## ⚠️ **IMPORTANTE: Execute no Supabase Dashboard**

O MCP está em modo somente leitura, então você precisa executar o SQL diretamente no Supabase.

## 🚀 **PASSO A PASSO:**

### **1. Acessar o Supabase Dashboard**
1. Vá para [supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Abra o projeto "Cioccoletti" (ID: wvpjlcnrffhsikhwvtfr)

### **2. Abrir o SQL Editor**
1. No menu lateral esquerdo, clique em **SQL Editor**
2. Clique em **New Query**
3. Dê um nome para a query (ex: "Setup Cioccoletti Database")

### **3. Executar o Script Completo**
Cole o seguinte script completo e clique em **Run**:

```sql
-- ===== CONFIGURAÇÃO COMPLETA DO BANCO CIOCCLETTI =====

-- ===== 1. TABELAS PRINCIPAIS =====

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'vendas', 'cozinha')),
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  addresses JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('bolo', 'doce', 'outro')),
  type TEXT NOT NULL CHECK (type IN ('kg', 'unidade', 'caixa')),
  base_price DECIMAL(10,2) NOT NULL,
  attributes JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de orçamentos
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'concluido')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de itens do orçamento
CREATE TABLE IF NOT EXISTS public.budget_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_id UUID REFERENCES public.budgets(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  attributes JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de pedidos
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_id UUID REFERENCES public.budgets(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_producao', 'pronto', 'entregue', 'cancelado')),
  delivery_date DATE,
  delivery_address JSONB,
  total_amount DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== 2. ÍNDICES PARA PERFORMANCE =====

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_approved ON public.users(approved);
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(active);
CREATE INDEX IF NOT EXISTS idx_budgets_client_id ON public.budgets(client_id);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON public.budgets(status);
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON public.orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- ===== 3. FUNÇÃO PARA ATUALIZAR TIMESTAMP =====

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ===== 4. TRIGGERS PARA TIMESTAMP =====

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== 5. HABILITAR RLS (Row Level Security) =====

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- ===== 6. POLÍTICAS DE SEGURANÇA =====

-- Usuários só veem seus próprios dados
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Todos os usuários autenticados podem gerenciar clientes, produtos, etc.
CREATE POLICY "Authenticated users can manage clients" ON public.clients
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage products" ON public.products
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage budgets" ON public.budgets
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage budget items" ON public.budget_items
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage orders" ON public.orders
  FOR ALL USING (auth.role() = 'authenticated');

-- ===== 7. DADOS INICIAIS =====

-- Produtos de exemplo
INSERT INTO public.products (name, category, type, base_price, attributes) VALUES 
  ('Bolo de Chocolate', 'bolo', 'kg', 25.00, '{"massa": "chocolate", "recheio": "brigadeiro", "cobertura": "chocolate"}'),
  ('Brigadeiro', 'doce', 'unidade', 2.50, '{"sabor": "chocolate", "tipo": "tradicional"}'),
  ('Bolo de Aniversário', 'bolo', 'kg', 30.00, '{"massa": "baunilha", "recheio": "creme", "cobertura": "chantilly"}'),
  ('Beijinho', 'doce', 'unidade', 2.00, '{"sabor": "coco", "tipo": "tradicional"}'),
  ('Bolo de Cenoura', 'bolo', 'kg', 22.00, '{"massa": "cenoura", "recheio": "chocolate", "cobertura": "chocolate"}')
ON CONFLICT DO NOTHING;

-- ===== 8. VERIFICAÇÃO =====

-- Execute esta query para verificar se tudo foi criado
SELECT 
  table_name, 
  table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### **4. Verificar o Resultado**
Após executar, você deve ver uma tabela com as seguintes tabelas criadas:
- `budget_items`
- `budgets`
- `clients`
- `orders`
- `products`
- `users`

## 🧪 **TESTAR APÓS CONFIGURAR:**

### **1. Verificar Conectividade:**
```bash
npm run test:supabase
```

### **2. Testar a Aplicação:**
```bash
npm start
```

## 🎯 **RESULTADO ESPERADO:**

Após executar o script:
- ✅ **6 tabelas criadas** com estrutura completa
- ✅ **Políticas de segurança** configuradas
- ✅ **Índices de performance** criados
- ✅ **Dados de exemplo** inseridos
- ✅ **Sistema de autenticação** funcionando

## 🆘 **SE DER ERRO:**

### **Erro de permissão:**
- Verifique se você está logado no projeto correto
- Confirme se tem permissões de administrador

### **Erro de sintaxe:**
- Copie o script exatamente como está
- Execute em uma única query

**🎯 Execute o script e me avise o resultado!**
