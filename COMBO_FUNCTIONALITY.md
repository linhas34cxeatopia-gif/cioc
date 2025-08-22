# Funcionalidade de Combo - Documentação

## Visão Geral
A funcionalidade de Combo permite criar produtos que funcionam como "containers" que podem ser preenchidos com produtos específicos até sua capacidade máxima. Exemplo: "Caixa de Bombons 9 unidades" que pode ser montada com diferentes sabores.

## Configuração do Banco de Dados

### 1. Execute a Migração
Execute o script `scripts/combo_migration.sql` no SQL Editor do Supabase para:
- Adicionar campos `product_type` e `combo_capacity` à tabela `products`
- Criar tabela `combo_allowed_products` para definir quais produtos podem compor um combo
- Adicionar campo `combo_selection` à tabela `budget_items`
- Configurar RLS policies e índices

### 2. Estrutura das Tabelas

#### Tabela `products` (novos campos)
- `product_type`: 'SIMPLES' ou 'COMBO'
- `combo_capacity`: número máximo de itens no combo (apenas para combos)

#### Tabela `combo_allowed_products`
- `combo_product_id`: ID do produto combo
- `allowed_product_id`: ID do produto simples que pode compor o combo

#### Tabela `budget_items` (novo campo)
- `combo_selection`: JSON com a seleção de sabores do cliente

## Fluxo do Administrador

### 1. Criar Produtos Simples
Primeiro, crie os produtos individuais que podem compor o combo:
- Ex: "Crocante Nero", "Gold", "Pão de Mel"
- Tipo: Produto Simples
- Categoria: apropriada (ex: "Bombons")

### 2. Criar o Combo
1. Vá para "Novo Produto"
2. Selecione "Combo" como tipo de produto
3. Informe:
   - Nome: "Caixa de Bombons 9 unidades"
   - Capacidade: 9
   - Produtos Permitidos: selecione todos os bombons disponíveis
   - Preço: R$ 180,00
4. Salve

## Fluxo do Usuário (Montando Orçamento)

### 1. Seleção do Combo
- Na lista de produtos, o usuário vê o card "Caixa de Bombons 9 unidades"
- Clica no ícone do carrinho

### 2. Modal de Configuração
- **Quantidade de Caixas**: usuário define quantas caixas quer
- **Seleção de Sabores**: lista de todos os bombons permitidos
- **Contador**: mostra "X / 9" sabores selecionados
- **Validação**: não permite mais de 9 sabores por caixa
- **Botão Adicionar**: só fica ativo quando a caixa está "cheia"

### 3. Múltiplas Caixas
Se o cliente quiser caixas com combinações diferentes:
1. Monte a primeira caixa e adicione ao orçamento
2. Clique novamente no card "Caixa de Bombons 9 unidades"
3. Monte a segunda caixa com sabores diferentes
4. Adicione como novo item

## Exemplo de Uso

### Cenário: Caixa de Bombons
1. **Produtos Simples criados**:
   - Crocante Nero (R$ 15,00)
   - Gold (R$ 18,00)
   - Pão de Mel (R$ 12,00)

2. **Combo criado**:
   - Nome: "Caixa de Bombons 9 unidades"
   - Capacidade: 9
   - Produtos permitidos: Crocante Nero, Gold, Pão de Mel
   - Preço: R$ 180,00

3. **Cliente monta orçamento**:
   - Caixa 1: 3 Crocante Nero + 4 Gold + 2 Pão de Mel
   - Caixa 2: 5 Crocante Nero + 2 Gold + 2 Pão de Mel

## Dados Salvos

### No Orçamento
```json
{
  "product_id": "id_da_caixa",
  "quantity": 1,
  "combo_selection": [
    {"product_id": "id_crocante_nero", "quantity": 3},
    {"product_id": "id_gold", "quantity": 4},
    {"product_id": "id_pao_mel", "quantity": 2}
  ]
}
```

## Validações Implementadas

1. **Capacidade**: não permite mais itens que a capacidade do combo
2. **Preenchimento**: exige que a caixa esteja "cheia" para adicionar
3. **Produtos Permitidos**: só mostra produtos autorizados para cada combo
4. **Interface**: contador em tempo real e botões desabilitados quando necessário

## Próximos Passos

- [ ] Implementar edição de combos existentes
- [ ] Adicionar visualização detalhada de combos no resumo do orçamento
- [ ] Implementar relatórios de combos mais vendidos
- [ ] Adicionar suporte a combos com preços variáveis por item
