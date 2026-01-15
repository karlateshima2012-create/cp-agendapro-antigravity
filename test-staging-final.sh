#!/bin/bash
echo "🔍 TESTE COMPLETO RLS - STAGING"
echo "================================"

ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlaHBocGhsYnFpeW1wemdxenp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxOTk0MzMsImV4cCI6MjA4Mzc3NTQzM30.9mjyLsxek05BqXDHyTz45-AjCtD_kOzWcuXs16UwCbQ"
PROJECT_ID="uehphphlbqiympzgqzzv"
BASE_URL="https://${PROJECT_ID}.supabase.co/rest/v1"

echo "Projeto: ${PROJECT_ID}"
echo ""

# Função para testar tabela
test_table() {
    local table="$1"
    local expected="$2"  # "allow" ou "deny"
    local description="$3"
    
    echo -n "🧪 ${description}: "
    
    response=$(curl -s -w "\n%{http_code}" \
        "${BASE_URL}/${table}?select=id&limit=1" \
        -H "apikey: ${ANON_KEY}" \
        -H "Accept: application/json")
    
    http_code=$(echo "$response" | tail -1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ]; then
        if [ "$expected" = "deny" ]; then
            echo "❌ PROBLEMA: Público VÊ ${table} (RLS falhou!)"
        else
            echo "✅ OK: Público pode ver ${table}"
        fi
    else
        if [ "$expected" = "deny" ]; then
            echo "✅ CORRETO: RLS bloqueia ${table}"
            echo "   Erro: $(echo "$body" | jq -r '.message // .' 2>/dev/null || echo "$body" | head -30)"
        else
            echo "❌ PROBLEMA: Público NÃO vê ${table} (deveria ver)"
            echo "   Erro: $(echo "$body" | jq -r '.message // .' 2>/dev/null || echo "$body" | head -30)"
        fi
    fi
}

# Executar testes
test_table "profiles" "deny" "Público → profiles"
test_table "services" "allow" "Público → services"
test_table "availability" "allow" "Público → availability"
test_table "appointments" "deny" "Público → appointments"
test_table "public_busy_slots" "allow" "Público → busy_slots"

echo ""
echo "🎯 RESUMO:"
echo "Se profiles/appointments estiverem ✅ BLOQUEADOS e services/availability ✅ PERMITIDOS:"
echo "👉 RLS ESTÁ CONFIGURADO CORRETAMENTE!"
