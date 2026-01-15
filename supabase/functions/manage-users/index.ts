import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('📦 Recebendo requisição manage-users...')
    
    const body = await req.json()
    console.log('📝 Body recebido:', JSON.stringify(body))

    const { action, email, password, userId, metadata } = body

    if (!action) {
      throw new Error('Parâmetro "action" é obrigatório')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    if (action === 'create') {
      console.log('👤 Criando usuário:', email)

      if (!email || !password) {
        throw new Error('Email e senha são obrigatórios')
      }

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email.toLowerCase().trim(),
        password: password.trim(),
        email_confirm: true,
        user_metadata: metadata || {}
      })

      if (authError) {
        console.error('❌ Erro ao criar usuário:', authError.message)
        throw new Error(`Erro auth: ${authError.message}`)
      }

      console.log('✅ Usuário criado:', authData.user.id)

      return new Response(
        JSON.stringify({ 
          success: true, 
          user: authData.user 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 200 
        }
      )

    } else if (action === 'delete') {
      console.log('🗑️ Deletando usuário:', userId)
      
      if (!userId) throw new Error('userId é obrigatório')

      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (error) throw error

      return new Response(
        JSON.stringify({ success: true }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 200 
        }
      )

    } else {
      throw new Error(`Ação inválida: ${action}. Use "create" ou "delete"`)
    }

  } catch (error: any) {
    console.error('💥 ERRO NA FUNÇÃO:', error.message)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
      }
    )
  }
})