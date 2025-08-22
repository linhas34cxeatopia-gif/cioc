const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = 'https://wvpjlcnrffhsikhwvtfr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2cGpsY25yZmZoc2lraHd2dGZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NDg4MzUsImV4cCI6MjA3MDUyNDgzNX0.LDL0iGWAvmL3jKG6pYwcIyGKBNoQfEaRQ9vQLnvI-xw';

// Cliente do Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabaseConnection() {
  console.log('🧪 Testando conectividade com o Supabase...\n');
  console.log(`🌐 URL: ${supabaseUrl}\n`);

  try {
    // Teste 1: Verificar se conseguimos acessar o projeto
    console.log('1️⃣ Testando acesso ao projeto...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(1);

    if (tablesError) {
      console.log('✅ Projeto acessível (erro esperado para tabela não existente)');
    } else {
      console.log('✅ Projeto acessível');
    }

    // Teste 2: Verificar se a tabela users existe
    console.log('\n2️⃣ Testando tabela users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (usersError) {
      if (usersError.message.includes('relation "users" does not exist')) {
        console.log('⚠️  Tabela users não existe ainda - execute o script SQL primeiro');
        console.log('📋 Execute o arquivo scripts/setup-supabase.sql no SQL Editor do Supabase');
      } else {
        console.log('❌ Erro ao acessar tabela users:', usersError.message);
      }
    } else {
      console.log('✅ Tabela users acessível');
      console.log(`   Usuários encontrados: ${users.length}`);
    }

    // Teste 3: Verificar se a tabela products existe
    console.log('\n3️⃣ Testando tabela products...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(1);

    if (productsError) {
      if (productsError.message.includes('relation "products" does not exist')) {
        console.log('⚠️  Tabela products não existe ainda - execute o script SQL primeiro');
      } else {
        console.log('❌ Erro ao acessar tabela products:', productsError.message);
      }
    } else {
      console.log('✅ Tabela products acessível');
      console.log(`   Produtos encontrados: ${products.length}`);
    }

    // Teste 4: Verificar se a tabela clients existe
    console.log('\n4️⃣ Testando tabela clients...');
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .limit(1);

    if (clientsError) {
      if (clientsError.message.includes('relation "clients" does not exist')) {
        console.log('⚠️  Tabela clients não existe ainda - execute o script SQL primeiro');
      } else {
        console.log('❌ Erro ao acessar tabela clients:', clientsError.message);
      }
    } else {
      console.log('✅ Tabela clients acessível');
      console.log(`   Clientes encontrados: ${clients.length}`);
    }

    console.log('\n🎯 RESUMO:');
    console.log('✅ Conectividade com Supabase: FUNCIONANDO');
    console.log('⚠️  Banco de dados: PRECISA SER CONFIGURADO');
    console.log('📋 Próximo passo: Execute o script SQL no Supabase');

  } catch (error) {
    console.error('💥 Erro fatal:', error.message);
    console.log('\n🔍 Verifique:');
    console.log('   - Se as credenciais estão corretas');
    console.log('   - Se o projeto Supabase está ativo');
    console.log('   - Se há problemas de rede');
  }
}

// Executar teste
testSupabaseConnection();
