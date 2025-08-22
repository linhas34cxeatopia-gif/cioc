-- Script de configuração do banco de dados Supabase para Cioccoletti
-- Execute este script no SQL Editor do Supabase

-- ===== TABELA DE USUÁRIOS =====
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'vendas', 'cozinha')),
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== TABELA DE CLIENTES =====
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  addresses JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== TABELA DE PRODUTOS =====
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

-- ===== TABELA DE CATEGORIAS =====
-- Suporta catálogo dinâmico com unidade de medida
DO $$ BEGIN
  CREATE TYPE measurement_unit AS ENUM ('KG', 'UNIDADE', 'CAIXA', 'PACOTE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  measurement_unit measurement_unit NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories(name);

-- FK opcional no produto para categoria
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);

-- ===== TABELA DE ORÇAMENTOS =====
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'concluido')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coluna de taxa de entrega (para implementar Task 2.6)
ALTER TABLE public.budgets
  ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2) DEFAULT 0;

-- ===== TABELA DE ITENS DO ORÇAMENTO =====
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

-- ===== TABELA DE PEDIDOS =====
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

-- ===== ÍNDICES PARA PERFORMANCE =====
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_approved ON public.users(approved);
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(active);
CREATE INDEX IF NOT EXISTS idx_budgets_client_id ON public.budgets(client_id);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON public.budgets(status);
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON public.orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- ===== FUNÇÃO PARA ATUALIZAR TIMESTAMP =====
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ===== TRIGGERS PARA ATUALIZAR TIMESTAMP =====
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

-- ===== POLÍTICAS RLS (Row Level Security) =====

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Política para usuários (usuários só veem seus próprios dados)
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Política para clientes (todos os usuários autenticados podem ver/editar)
CREATE POLICY "Authenticated users can manage clients" ON public.clients
  FOR ALL USING (auth.role() = 'authenticated');

-- Política para produtos (todos os usuários autenticados podem ver/editar)
CREATE POLICY "Authenticated users can manage products" ON public.products
  FOR ALL USING (auth.role() = 'authenticated');

-- Política para orçamentos (usuários veem orçamentos de seus clientes ou todos se for admin)
CREATE POLICY "Users can manage budgets" ON public.budgets
  FOR ALL USING (auth.role() = 'authenticated');

-- Política para itens do orçamento
CREATE POLICY "Users can manage budget items" ON public.budget_items
  FOR ALL USING (auth.role() = 'authenticated');

-- Política para pedidos
CREATE POLICY "Users can manage orders" ON public.orders
  FOR ALL USING (auth.role() = 'authenticated');

-- Política para categorias
CREATE POLICY "Authenticated users can manage categories" ON public.categories
  FOR ALL USING (auth.role() = 'authenticated');

-- ===== DADOS INICIAIS =====

-- Inserir usuário administrador padrão (senha: admin123)
-- IMPORTANTE: Crie o usuário primeiro no Supabase Auth e depois execute:
INSERT INTO public.users (id, email, name, role, approved) VALUES 
  ('ID_DO_USUARIO_ADMIN', 'admin@cioccoletti.com', 'Administrador', 'admin', true)
ON CONFLICT (id) DO NOTHING;

-- Inserir produtos de exemplo
INSERT INTO public.products (name, category, type, base_price, attributes) VALUES 
  ('Bolo de Chocolate', 'bolo', 'kg', 25.00, '{"massa": "chocolate", "recheio": "brigadeiro", "cobertura": "chocolate"}'),
  ('Brigadeiro', 'doce', 'unidade', 2.50, '{"sabor": "chocolate", "tipo": "tradicional"}'),
  ('Bolo de Aniversário', 'bolo', 'kg', 30.00, '{"massa": "baunilha", "recheio": "creme", "cobertura": "chantilly"}')
ON CONFLICT DO NOTHING;

-- ===== COMENTÁRIOS =====
COMMENT ON TABLE public.users IS 'Tabela de usuários do sistema';
COMMENT ON TABLE public.clients IS 'Tabela de clientes';
COMMENT ON TABLE public.products IS 'Tabela de produtos/cardápio';
COMMENT ON TABLE public.budgets IS 'Tabela de orçamentos';
COMMENT ON TABLE public.budget_items IS 'Itens dos orçamentos';
COMMENT ON TABLE public.orders IS 'Tabela de pedidos';

-- ===== VERIFICAÇÃO =====
-- Execute esta query para verificar se tudo foi criado corretamente
SELECT 
  table_name, 
  table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
