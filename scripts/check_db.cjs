
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vptwtwhadxcdfhveugkk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwdHd0d2hhZHhjZGZodmV1Z2trIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxODQ1NTcsImV4cCI6MjA4Mjc2MDU1N30.Zd-PpMNiTC2FIeSOH9FzblNpId5Hd8IFICeR-fGS9h0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConnection() {
  console.log('Verificando conexão com Supabase...');
  try {
    // Tenta buscar a data/hora do servidor ou fazer uma query simples
    // Como não temos certeza de qual tabela existe, vamos tentar 'profiles' que vimos no código
    const { data, error, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Erro ao conectar/consultar tabela profiles:', error.message);
      if (error.code) console.error('Código do erro:', error.code);
    } else {
      console.log('✅ Conexão bem-sucedida!');
      console.log(`ℹ️ Tabela 'profiles' encontrada. Registros: ${count !== null ? count : 'N/A'}`);
    }

    // Tentar listar outras tabelas inferidas pelo código
    const tablesToCheck = ['services', 'availability', 'appointments', 'public_busy_slots'];
    for (const table of tablesToCheck) {
        const { error: tableError } = await supabase.from(table).select('id').limit(1);
        if (tableError) {
             // Se o erro for 404/PGRST204 possivelmente a tabela não existe
             // Mas Supabase retorna 404 na API se a tabela não existir? 
             // Geralmente retorna erro 42P01 (undefined_table) se não existir.
            console.log(`⚠️ Erro ao verificar tabela '${table}': ${tableError.message} (${tableError.code})`);
        } else {
            console.log(`✅ Tabela '${table}' parece existir e ser acessível.`);
        }
    }

  } catch (err) {
    console.error('❌ Erro inesperado:', err);
  }
}

checkConnection();
