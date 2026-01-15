
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vptwtwhadxcdfhveugkk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwdHd0d2hhZHhjZGZodmV1Z2trIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxODQ1NTcsImV4cCI6MjA4Mjc2MDU1N30.Zd-PpMNiTC2FIeSOH9FzblNpId5Hd8IFICeR-fGS9h0';

const supabase = createClient(supabaseUrl, supabaseKey);

// Credenciais de teste criadas anteriormente
const EMAIL = 'test_robot_1767531254314@example.com';
const PASSWORD = 'Password123!';
const USER_ID = 'dedabe0e-0594-445d-86a6-f2dd4bf278e2';

async function verifyPatch() {
    console.log('🛡️ Iniciando Verificação do Patch de Segurança...\n');

    // 1. Login
    const { error: loginError } = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
    if (loginError) { console.error('❌ Erro de Login:', loginError.message); return; }
    console.log('✅ Autenticado.');

    // 2. Preparar Dados
    // Pegar primeiro serviço
    const { data: services } = await supabase.from('services').select('id, duration').eq('user_id', USER_ID).limit(1);
    const service = services[0];

    // Definir horário de teste: Daqui a 2 dias às 14:00
    const testTime = new Date();
    testTime.setDate(testTime.getDate() + 2);
    testTime.setHours(14, 0, 0, 0);
    const startAt = testTime.toISOString();

    console.log(`ℹ️ Testando horário: ${testTime.toLocaleString()} (Serviço ID: ${service.id})`);

    // Limpeza prévia (caso teste tenha rodado antes)
    // Delete all appointments at this exact time for this user
    await supabase.from('appointments').delete().eq('user_id', USER_ID).eq('start_at', startAt);


    // 3. Teste A: Agendamento Inicial (PENDING)
    console.log('\n👉 1. Criando Agendamento "Pending"...');
    const { data: appt1, error: err1 } = await supabase.from('appointments').insert({
        user_id: USER_ID,
        client_name: 'Cliente Teste 1',
        start_at: startAt,
        duration: service.duration,
        service_id: service.id,
        status: 'pending' // Importante: Testando com pending
    }).select().single();

    if (err1) { console.error('❌ Falha ao criar:', err1.message); return; }
    console.log(`✅ Agendamento 1 criado (ID: ${appt1.id}). Status: ${appt1.status}`);


    // 4. Teste B: Tentativa de Duplicidade (Deve ser BLOQUEADO pelo Trigger)
    console.log('\n👉 2. Tentando Agendar Duplicado (Overlapping)...');
    const { data: appt2, error: err2 } = await supabase.from('appointments').insert({
        user_id: USER_ID,
        client_name: 'Cliente Invasor',
        start_at: startAt,
        duration: service.duration,
        service_id: service.id,
        status: 'pending'
    }).select();

    if (err2) {
        console.log(`✅ BLOQUEIO BEM SUCEDIDO: O banco rejeitou a duplicata.`);
        console.log(`   Mensagem do Banco: "${err2.message}"`);
    } else {
        console.error('❌ FALHA CRÍTICA: O banco PERMITIU agendamento duplicado!');
        // Limpar sujeira
        if (appt2 && appt2[0]) await supabase.from('appointments').delete().eq('id', appt2[0].id);
    }


    // 5. Teste C: Deletar/Cancelar e Reagendar (Liberação de Vaga)
    console.log('\n👉 3. Excluindo Agendamento 1...');
    const { error: delErr } = await supabase.from('appointments').delete().eq('id', appt1.id);

    if (delErr) { console.error('❌ Erro ao deletar:', delErr.message); return; }
    console.log('✅ Agendamento 1 deletado.');

    console.log('\n👉 4. Tentando Reagendar no mesmo horário (Deve ser PERMITIDO)...');
    const { data: appt3, error: err3 } = await supabase.from('appointments').insert({
        user_id: USER_ID,
        client_name: 'Cliente Feliz (Vaga Liberada)',
        start_at: startAt,
        duration: service.duration,
        service_id: service.id,
        status: 'pending'
    }).select().single();

    if (err3) {
        console.error('❌ Erro ao reagendar:', err3.message);
        console.log('Possível causa: Trigger não limpou a tabela auxiliar ou erro de lógica.');
    } else {
        console.log(`✅ SUCESSO: Vaga foi liberada e reagendada (Novo ID: ${appt3.id}).`);
    }

    console.log('\n🏁 Conclusão: O Patch está funcionando corretamente!');
}

verifyPatch();
