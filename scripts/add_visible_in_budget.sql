-- Adiciona a coluna que controla se o produto aparece para seleção em orçamentos
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS visible_in_budget boolean NOT NULL DEFAULT true;

-- Opcional: índice para filtros por visibilidade
CREATE INDEX IF NOT EXISTS idx_products_visible_in_budget ON products(visible_in_budget);

-- Força recarregar o cache de schema do PostgREST (evita erros de coluna não encontrada)
NOTIFY pgrst, 'reload schema';


