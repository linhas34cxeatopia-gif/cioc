-- Script para verificar se a migração de combo foi aplicada
-- Execute este script no SQL Editor do Supabase

-- Verificar se os campos foram adicionados à tabela products
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND column_name IN ('product_type', 'combo_capacity')
ORDER BY column_name;

-- Verificar se a tabela combo_allowed_products foi criada
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name = 'combo_allowed_products';

-- Verificar se o campo combo_selection foi adicionado à tabela budget_items
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'budget_items' 
  AND column_name = 'combo_selection';

-- Verificar se os índices foram criados
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('products', 'combo_allowed_products')
  AND indexname LIKE '%product_type%' 
     OR indexname LIKE '%combo_allowed%'
ORDER BY tablename, indexname;

-- Verificar se as RLS policies foram criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'combo_allowed_products'
ORDER BY policyname;
