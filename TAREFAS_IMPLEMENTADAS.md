# TAREFAS IMPLEMENTADAS - APLICATIVO CIOCCLETTI

## ✅ ENTREGUE
- Menu de Tabs (Início, Encomendas, Orçamentos, Clientes, Cozinha) – apenas 5 itens
- Header com StatusBar preta e ícones claros
- SideMenu com Dashboard, Configurações, Notificações, Produtos (novo)
- Toast global para todas ações CRUD

### Clientes
- Lista: pesquisa por nome/WhatsApp, paginação, FAB novo cliente
- Detalhes: abas (Dados, Endereços, Histórico)
  - Endereços: CRUD, primeiro endereço vira Principal, “Tornar Principal” e “Deletar” com confirmação
  - FAB alinhado, formulário de novo endereço com CEP primeiro + ViaCEP + foco em Número
- Novo Cliente: CEP auto; somente Complemento/Observações enviam com Enter; teclado não cobre campos
- Editar Cliente
- Voltar de detalhes retorna para lista (stack local)

### Produtos (novo)
- Atalho no SideMenu (não aparece no TabBar)
- Lista com pesquisa por código/nome; FAB Novo Produto
- Cadastro com tipo (Bolo/Outros), campos dinâmicos, código automático (B/O), imagem via Supabase Storage (pré-visualização)
- Detalhes do produto (imagem, atributos)

## 🔄 EM ANDAMENTO
- Orçamentos (CRUD, integração com clientes e endereços)
- Notificações push reais

## 🗃️ BANCO/INFRA
- `products`: + `code` (único), `image_url`
- `client_addresses`: trigger para apenas um principal por cliente
- Storage: bucket `products`

## ▶️ PRÓXIMAS TAREFAS
- Orçamentos: listagem, novo orçamento, seleção de endereço do cliente
- Produtos: edição/remoção, upload com câmera/galeria (atualmente URL + upload)
- Melhorias UX: skeleton loaders, empty states mais ricos
- Relatórios/Dashboard
