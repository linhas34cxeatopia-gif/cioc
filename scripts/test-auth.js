const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wvpjlcnrffhsikhwvtfr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2cGpsY25yZmZoc2lraHd2dGZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NDg4MzUsImV4cCI6MjA3MDUyNDgzNX0.LDL0iGWAvmL3jKG6pYwcIyGKBNoQfEaRQ9vQLnvI-xw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  const ts = Date.now();
  const email = `teste+${ts}@cioccoletti.com`;
  const password = 'Teste@12345';
  const name = 'Usuário Teste';
  const role = 'vendas';

  console.log('🧪 Teste de registro, aprovação e login');
  console.log('Email:', email);

  // 1) Registro no Auth
  console.log('\n1️⃣ Registrando usuário no Supabase Auth...');
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });
  if (signUpError) {
    console.error('❌ Erro no signUp:', signUpError.message);
    process.exit(1);
  }
  const authUser = signUpData.user;
  console.log('✅ Usuario no Auth:', authUser?.id);

  // 2) Inserir perfil em public.users
  console.log('\n2️⃣ Inserindo perfil em public.users...');
  const { error: insertProfileError } = await supabase.from('users').insert({
    id: authUser.id,
    email,
    name,
    role,
    approved: false,
  });
  if (insertProfileError) {
    console.error('❌ Erro ao inserir perfil:', insertProfileError.message);
    process.exit(1);
  }
  console.log('✅ Perfil criado com approved = false');

  // 3) Aprovar usuário (simulando admin)
  console.log('\n3️⃣ Aprovando usuário (approved = true)...');
  const { error: approveError } = await supabase
    .from('users')
    .update({ approved: true })
    .eq('id', authUser.id);
  if (approveError) {
    console.error('❌ Erro ao aprovar usuário:', approveError.message);
    process.exit(1);
  }
  console.log('✅ Usuário aprovado');

  // 4) Login
  console.log('\n4️⃣ Tentando login (signInWithPassword)...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) {
    console.warn('⚠️ Login falhou. Provável confirmação de email obrigatória nas configurações de Auth.');
    console.warn('Detalhe:', signInError.message);
  } else {
    console.log('✅ Login OK. session:', !!signInData.session);
  }

  // 5) Ler perfil para confirmar aprovado
  console.log('\n5️⃣ Lendo perfil em public.users...');
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();
  if (profileError) {
    console.error('❌ Erro lendo perfil:', profileError.message);
    process.exit(1);
  }
  console.log('✅ Perfil:', { id: profile.id, email: profile.email, approved: profile.approved, role: profile.role });

  console.log('\n🎉 Teste concluído.');
}

run().catch((e) => {
  console.error('💥 Erro não tratado:', e);
  process.exit(1);
});
