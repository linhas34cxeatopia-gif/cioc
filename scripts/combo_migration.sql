-- Migração para funcionalidade de Combo
-- Execute este script no SQL Editor do Supabase

-- Adicionar campos à tabela products
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type VARCHAR(10) DEFAULT 'SIMPLES' CHECK (product_type IN ('SIMPLES', 'COMBO'));
ALTER TABLE products ADD COLUMN IF NOT EXISTS combo_capacity INTEGER;

-- Criar tabela de produtos permitidos em combos
CREATE TABLE IF NOT EXISTS combo_allowed_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  combo_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  allowed_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(combo_product_id, allowed_product_id)
);

-- Adicionar campo combo_selection à tabela budget_items
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS combo_selection JSONB;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_products_product_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_combo_allowed_products_combo_id ON combo_allowed_products(combo_product_id);
CREATE INDEX IF NOT EXISTS idx_combo_allowed_products_allowed_id ON combo_allowed_products(allowed_product_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_combo_allowed_products_updated_at 
    BEFORE UPDATE ON combo_allowed_products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies para combo_allowed_products
ALTER TABLE combo_allowed_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view combo allowed products" ON combo_allowed_products
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert combo allowed products" ON combo_allowed_products
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update combo allowed products" ON combo_allowed_products
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete combo allowed products" ON combo_allowed_products
    FOR DELETE USING (auth.role() = 'authenticated');

-- Exemplo de dados de teste (opcional)
-- INSERT INTO products (name, product_type, combo_capacity, base_price, category_id, type, code) 
-- VALUES ('Caixa de Bombons 9 unidades', 'COMBO', 9, 180.00, 'categoria_id_aqui', 'caixa', 'C1');
