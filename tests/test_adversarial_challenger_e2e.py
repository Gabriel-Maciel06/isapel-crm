#!/usr/bin/env python3
"""
tests/test_adversarial_challenger_e2e.py
Empirical Adversarial Playwright E2E Suite for Isapel CRM (R1, R2, R3, R4)
Challenger Agent: challenger_m1_2
"""

import sys
import time
import json
import urllib.request
import urllib.parse
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:4173"
SUPABASE_URL = "https://xpjhpskjetpcglkxdjag.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwamhwc2tqZXRwY2dsa3hkamFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3ODQyMjMsImV4cCI6MjEwMDM2MDIyM30.nxFBM69wjrEOsz5HkSr9iDLmE9TpJi-eE_Yqq3oAI3s"

stats = {
    "total": 0,
    "passed": 0,
    "failed": 0,
    "failures": []
}

def log_pass(name):
    stats["total"] += 1
    stats["passed"] += 1
    print(f"  ✅ [PASS] {name}")

def log_fail(name, error):
    stats["total"] += 1
    stats["failed"] += 1
    stats["failures"].append((name, str(error)))
    print(f"  ❌ [FAIL] {name} -> {error}")

def cleanup_remote_lead(name_prefix):
    """Purges any test lead matching prefix from Supabase."""
    try:
        url = f"{SUPABASE_URL}/rest/v1/crm_isapel_leads?nome=like.{urllib.parse.quote(name_prefix)}%25"
        req = urllib.request.Request(
            url,
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Prefer": "return=representation"
            },
            method="DELETE"
        )
        with urllib.request.urlopen(req, timeout=5.0) as resp:
            data = resp.read().decode('utf-8')
            res = json.loads(data) if data else []
            if res:
                print(f"  🧹 [Supabase Cleanup] Removidos {len(res)} leads de teste remotos.")
    except Exception as e:
        print(f"  ⚠️ [Supabase Cleanup] Aviso: {e}")

def run_e2e_adversarial():
    print("=" * 80)
    print("🚀 INICIANDO TESTE ADVERSARIAL E2E NO BROWSER (PLAYWRIGHT)")
    print(f"📡 Alvo: {BASE_URL}")
    print("=" * 80)

    test_lead_name = f"Hospital Challenger E2E {int(time.time())}"
    test_lead_phone = "19988776655"

    cleanup_remote_lead("Hospital Challenger E2E")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        # ----------------------------------------------------------------------
        # Test 1: Route Guard & Server on 4173
        # ----------------------------------------------------------------------
        try:
            print("\n--- 1. ROTA E AUTENTICAÇÃO ---")
            page.goto(f"{BASE_URL}/index.html", wait_until="networkidle")
            page.wait_for_timeout(500)
            current_url = page.url
            assert "login.html" in current_url, f"Acesso anônimo deve redirecionar para login.html, obtido: {current_url}"
            log_pass("T1: Route Guarding redireciona para login.html")
        except Exception as e:
            log_fail("T1: Route Guarding", e)

        # ----------------------------------------------------------------------
        # Test 2: Login com Diretoria
        # ----------------------------------------------------------------------
        try:
            page.fill("#login-usuario", "diretoria")
            page.fill("#login-senha", "isapel2026")
            page.click("#btn-submit-login")
            page.wait_for_url(f"**/index.html", timeout=5000)
            # Aguarda inicialização completa do Isapel CRM
            page.wait_for_function("() => window.IsapelCRM && typeof window.IsapelCRM.listarLeads === 'function'", timeout=8000)
            page.wait_for_timeout(1500)
            log_pass("T2: Login Diretoria autentica com sucesso e inicializa CRM")
        except Exception as e:
            log_fail("T2: Login Diretoria", e)

        # ----------------------------------------------------------------------
        # Test 3: Cadastro de Novo Cliente (R3)
        # ----------------------------------------------------------------------
        created_lead_id = None
        try:
            print("\n--- 2. R3: CADASTRO E PERSISTÊNCIA DE NOVOS CLIENTES ---")
            page.fill("#lead-nome", test_lead_name)
            page.fill("#lead-telefone", test_lead_phone)
            page.click("#btn-cadastrar-lead")

            # Aguarda card aparecer na interface
            page.wait_for_selector(f'.crm-card:has-text("{test_lead_name}")', timeout=8000)
            card = page.locator(f'.crm-card:has-text("{test_lead_name}")').first
            created_lead_id = card.get_attribute("data-id")
            assert created_lead_id, "Card criado deve ter data-id válido"
            log_pass(f"T3.1: Lead cadastrado aparece na coluna Novo com ID {created_lead_id}")

            # Verifica localStorage
            storage_leads = page.evaluate("() => JSON.parse(localStorage.getItem('isapel_crm_leads_v1') || '[]')")
            found_lead = next((l for l in storage_leads if l.get("id") == created_lead_id), None)
            assert found_lead is not None, "Lead criado deve estar presente em localStorage['isapel_crm_leads_v1']"
            assert found_lead.get("nome") == test_lead_name, "Nome no storage deve bater"
            log_pass("T3.2: Lead persistido no localStorage imediatamente")
        except Exception as e:
            log_fail("T3: Cadastro de Novo Lead", e)

        # ----------------------------------------------------------------------
        # Test 4: Alteração de Etiqueta Licitação / Consumidor (R1)
        # ----------------------------------------------------------------------
        try:
            print("\n--- 3. R1: PERSISTÊNCIA DA ETIQUETA LICITAÇÃO / CONSUMIDOR ---")
            card = page.locator(f'.crm-card[data-id="{created_lead_id}"]').first
            tipo_btn = card.locator(".btn-tipo-cliente").first
            tipo_btn.click()

            # Aguarda popover abrir e seleciona "Licitação"
            page.wait_for_selector('.crm-tipo-popover__option[data-tipo="licitacao"]', timeout=4000)
            page.click('.crm-tipo-popover__option[data-tipo="licitacao"]')
            page.wait_for_timeout(1000)

            # Verifica texto do botão na interface
            btn_text = card.locator(".crm-card__tipo-text").inner_text()
            assert "Licitação" in btn_text, f"Texto da etiqueta deve ser Licitação, obtido: {btn_text}"
            log_pass("T4.1: Etiqueta atualizada para Licitação na interface")

            # Verifica localStorage
            storage_leads = page.evaluate("() => JSON.parse(localStorage.getItem('isapel_crm_leads_v1') || '[]')")
            found_lead = next((l for l in storage_leads if l.get("id") == created_lead_id), None)
            assert found_lead.get("tipoCliente") == "licitacao", f"tipoCliente em storage deve ser licitacao, obtido: {found_lead.get('tipoCliente')}"
            log_pass("T4.2: Etiqueta persistida como 'licitacao' no localStorage")
        except Exception as e:
            log_fail("T4: Alteração de Etiqueta R1", e)

        # ----------------------------------------------------------------------
        # Test 5: Movimentação de Card no Funil (R2)
        # ----------------------------------------------------------------------
        try:
            print("\n--- 4. R2: PERSISTÊNCIA DE MOVIMENTAÇÃO NO FUNIL KANBAN ---")
            card = page.locator(f'.crm-card[data-id="{created_lead_id}"]').first
            advance_btn = card.locator(".btn-advance-stage").first
            advance_btn.click()
            page.wait_for_timeout(1000)

            # Card deve estar agora na coluna "qualificacao"
            qualif_col = page.locator("#cards-qualificacao")
            assert qualif_col.locator(f'.crm-card[data-id="{created_lead_id}"]').count() == 1, "Card deve estar na coluna qualificacao"
            log_pass("T5.1: Card avançado para etapa de Qualificação")

            # Verifica localStorage
            storage_leads = page.evaluate("() => JSON.parse(localStorage.getItem('isapel_crm_leads_v1') || '[]')")
            found_lead = next((l for l in storage_leads if l.get("id") == created_lead_id), None)
            assert found_lead.get("estagio") == "qualificacao", f"Estágio no storage deve ser qualificacao, obtido: {found_lead.get('estagio')}"
            log_pass("T5.2: Novo estágio persistido no localStorage")
        except Exception as e:
            log_fail("T5: Movimentação de Card R2", e)

        # ----------------------------------------------------------------------
        # Test 6: Auto-polling de 15s (Resistência a Race Condition)
        # ----------------------------------------------------------------------
        try:
            print("\n--- 5. CONCORRÊNCIA COM AUTO-POLLING DE 15s ---")
            print("  ⏳ Aguardando 16 segundos para garantir disparo do setInterval de 15s...")
            page.wait_for_timeout(16000)

            # Verifica se o card continuou na coluna qualificacao
            qualif_col = page.locator("#cards-qualificacao")
            assert qualif_col.locator(f'.crm-card[data-id="{created_lead_id}"]').count() == 1, "Card NÃO pode voltar para 'novo' após polling de 15s"
            
            # Verifica se a etiqueta continua 'Licitação'
            card = qualif_col.locator(f'.crm-card[data-id="{created_lead_id}"]').first
            btn_text = card.locator(".crm-card__tipo-text").inner_text()
            assert "Licitação" in btn_text, f"Etiqueta deve permanecer Licitação após polling, obtido: {btn_text}"
            log_pass("T6: Card e Etiqueta preservados intactos após disparo do timer de 15 segundos")
        except Exception as e:
            log_fail("T6: Auto-polling de 15s", e)

        # ----------------------------------------------------------------------
        # Test 7: Recarregamento de Página (F5 / Reload)
        # ----------------------------------------------------------------------
        try:
            print("\n--- 6. PERSISTÊNCIA APÓS RECARREGAMENTO DE PÁGINA (F5) ---")
            page.reload(wait_until="networkidle")
            page.wait_for_function("() => window.IsapelCRM && typeof window.IsapelCRM.listarLeads === 'function'", timeout=8000)
            page.wait_for_timeout(1500)

            # Card ainda na coluna qualificacao?
            qualif_col = page.locator("#cards-qualificacao")
            assert qualif_col.locator(f'.crm-card[data-id="{created_lead_id}"]').count() == 1, "Após reload, card DEVE permanecer em qualificacao"

            # Etiqueta ainda Licitação?
            card = qualif_col.locator(f'.crm-card[data-id="{created_lead_id}"]').first
            btn_text = card.locator(".crm-card__tipo-text").inner_text()
            assert "Licitação" in btn_text, f"Após reload, etiqueta deve permanecer Licitação, obtido: {btn_text}"

            # Lead criado ainda existe no storage?
            storage_leads = page.evaluate("() => JSON.parse(localStorage.getItem('isapel_crm_leads_v1') || '[]')")
            found_lead = next((l for l in storage_leads if l.get("id") == created_lead_id), None)
            assert found_lead is not None, "Lead criado deve continuar no storage após reload"
            assert found_lead.get("tipoCliente") == "licitacao", "tipoCliente deve continuar licitacao após reload"
            assert found_lead.get("estagio") == "qualificacao", "estagio deve continuar qualificacao após reload"
            log_pass("T7: R1, R2 e R3 validados com 100% de persistência após reload da aplicação!")
        except Exception as e:
            log_fail("T7: Recarregamento de Página", e)

        # ----------------------------------------------------------------------
        # Test 8: Filtro de Vendedores e Não-Truncamento
        # ----------------------------------------------------------------------
        try:
            print("\n--- 7. FILTRAGEM DE VENDEDORES E NÃO-TRUNCAMENTO DO STORAGE ---")
            page.select_option("#vendedor-select", "maciel")
            page.wait_for_timeout(1000)

            storage_leads = page.evaluate("() => JSON.parse(localStorage.getItem('isapel_crm_leads_v1') || '[]')")
            vendedores_no_storage = set(l.get("vendedorId") for l in storage_leads if l.get("vendedorId"))
            assert len(vendedores_no_storage) > 1, f"O storage deve manter múltiplos vendedores mesmo filtrando para maciel. Vendedores encontrados: {vendedores_no_storage}"
            log_pass("T8.1: Filtro para 'maciel' não descartou leads de outros vendedores no storage")

            page.reload(wait_until="networkidle")
            page.wait_for_timeout(1000)

            page.select_option("#vendedor-select", "todos")
            page.wait_for_timeout(1000)

            storage_apos_reload = page.evaluate("() => JSON.parse(localStorage.getItem('isapel_crm_leads_v1') || '[]')")
            assert len(storage_apos_reload) >= len(storage_leads), "Nenhum lead pode ter sido perdido no ciclo de filtro e reload"
            log_pass("T8.2: Visualização global restaurada com 100% dos leads de todos os consultores")
        except Exception as e:
            log_fail("T8: Filtro de Vendedores", e)

        # ----------------------------------------------------------------------
        # Cleanup
        # ----------------------------------------------------------------------
        if created_lead_id:
            try:
                page.evaluate(f"""() => {{
                    const leads = JSON.parse(localStorage.getItem('isapel_crm_leads_v1') || '[]');
                    const filtered = leads.filter(l => l.id !== '{created_lead_id}');
                    localStorage.setItem('isapel_crm_leads_v1', JSON.stringify(filtered));
                }}""")
            except Exception:
                pass
            cleanup_remote_lead("Hospital Challenger E2E")

        browser.close()

    print("\n" + "=" * 80)
    print("📊 RESUMO DOS TESTES ADVERSARIAIS E2E PLAYWRIGHT:")
    print("=" * 80)
    print(f"   • Total de Testes:    {stats['total']}")
    print(f"   • Aprovados com Sucesso: {stats['passed']}")
    print(f"   • Falhas Encontradas:    {stats['failed']}")
    print("=" * 80)

    if stats["failed"] > 0:
        print("\n❌ FALHAS DETECTADAS:")
        for name, err in stats["failures"]:
            print(f"   - {name}: {err}")
        sys.exit(1)
    else:
        print("\n🎉 PARABÉNS! 100% DOS TESTES ADVERSARIAIS E2E FORAM APROVADOS!")
        sys.exit(0)

if __name__ == "__main__":
    run_e2e_adversarial()
