// Configuração de ambiente para a aplicação
// As variáveis vêm do arquivo .env

export const ENV = {
  // Supabase Configuration
  SUPABASE_URL: 'https://wvpjlcnrffhsikhwvtfr.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2cGpsY25yZmZoc2lraHd2dGZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NDg4MzUsImV4cCI6MjA3MDUyNDgzNX0.LDL0iGWAvmL3jKG6pYwcIyGKBNoQfEaRQ9vQLnvI-xw',
  
  // Environment
  IS_DEVELOPMENT: __DEV__,
  IS_PRODUCTION: !__DEV__,
};

// Configuração específica para desenvolvimento
export const DEV_CONFIG = {
  // Logs detalhados em desenvolvimento
  LOG_LEVEL: 'debug',
  
  // Dados de teste
  TEST_USER: {
    email: 'test@cioccoletti.com',
    password: 'test123',
  },
};

// Configuração específica para produção
export const PROD_CONFIG = {
  // Logs mínimos em produção
  LOG_LEVEL: 'error',
};
