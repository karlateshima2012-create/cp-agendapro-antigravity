import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase Configuration Missing. Check your .env file.');
}

// 🚀 CONFIGURAÇÃO CRÍTICA: Isolar sessão por aba
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // 🔥 USAR sessionStorage PARA ISOLAMENTO POR ABA
    storage: {
      getItem: (key: string) => {
        // sessionStorage: isolado por aba, limpa ao fechar aba
        return sessionStorage.getItem(key);
      },
      setItem: (key: string, value: string) => {
        sessionStorage.setItem(key, value);
      },
      removeItem: (key: string) => {
        sessionStorage.removeItem(key);
      }
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Importante: desabilitar para evitar conflitos
    flowType: 'pkce'
  }
});