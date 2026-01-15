
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            // Supabase API URL - Env var automatically injected by Supabase Functions
            Deno.env.get('SUPABASE_URL') ?? '',
            // Supabase Service Role Key - Env var automatically injected by Supabase Functions
            // CRITICAL: This allows us to select fields that might be protected by RLS or not exposed to public
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { professional_id, message_data } = await req.json()

        if (!professional_id) {
            throw new Error('Missing professional_id')
        }

        // 1. Buscar credenciais do Telegram do profissional no banco de dados
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('telegram_bot_token, telegram_chat_id')
            .eq('id', professional_id)
            .single()

        if (profileError || !profile) {
            console.error('Profile fetch error:', profileError)
            throw new Error('Professional profile not found or database error')
        }

        if (!profile.telegram_bot_token || !profile.telegram_chat_id) {
            return new Response(JSON.stringify({ message: 'Telegram not configured for this user, skipping.' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // 2. Montar a mensagem
        const { clientName, serviceName, date, time, phone } = message_data || {}
        const text =
            `🔔 <b>Novo Agendamento Recebido!</b>\n\n` +
            `👤 <b>Cliente:</b> ${clientName || 'N/A'}\n` +
            `🛠 <b>Serviço:</b> ${serviceName || 'N/A'}\n` +
            `📅 <b>Data:</b> ${date || 'N/A'}\n` +
            `⏰ <b>Hora:</b> ${time || 'N/A'}\n` +
            `📞 <b>WhatsApp:</b> ${phone || 'N/A'}\n\n` +
            `<i>Acesse seu painel para gerenciar.</i>`

        // 3. Enviar para API do Telegram
        const telegramRes = await fetch(`https://api.telegram.org/bot${profile.telegram_bot_token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: profile.telegram_chat_id,
                parse_mode: 'HTML',
                text
            })
        })

        const telegramData = await telegramRes.json()

        if (!telegramRes.ok) {
            console.error('Telegram API Error:', telegramData)
            throw new Error(`Telegram API Error: ${telegramData.description}`)
        }

        return new Response(JSON.stringify({ success: true, telegram: telegramData }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
