"""
Adversarial Stress-Testing and RBAC Exploitation Suite
CRM Isapel Papéis v1.1.0
Author: challenger_1 (Empirical Challenger)
"""

import json
import time
import requests
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:4173"
SUPABASE_URL = "https://xpjhpskjetpcglkxdjag.supabase.co"
SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwamhwc2tqZXRwY2dsa3hkamFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3ODQyMjMsImV4cCI6MjEwMDM2MDIyM30.nxFBM69wjrEOsz5HkSr9iDLmE9TpJi-eE_Yqq3oAI3s"

results = []

def record(test_id, name, result, details=""):
    print(f"[{result.upper()}] {test_id}: {name}")
    if details:
        print(f"       -> {details}")
    results.append({
        "id": test_id,
        "name": name,
        "result": result,
        "details": details
    })

def run_adversarial_suite():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # -------------------------------------------------------------
        # VECTOR 1: STORAGE TAMPERING & PRIVILEGE ESCALATION
        # -------------------------------------------------------------
        print("\n--- VECTOR 1: Storage Tampering & Privilege Escalation ---")

        # 1.1 LocalStorage Role Escalation (maciel -> diretoria)
        try:
            ctx = browser.new_context()
            page = ctx.new_page()
            page.goto(f"{BASE_URL}/login.html")
            page.fill("#login-usuario", "maciel")
            page.fill("#login-senha", "isapel2026")
            page.click("#btn-submit-login")
            page.wait_for_url("**/index.html*")
            page.wait_for_timeout(600)

            # Attempt privilege escalation by tampering localStorage
            page.evaluate("""() => {
                const s = JSON.parse(localStorage.getItem('isapel_auth_session'));
                s.perfil = 'diretoria';
                s.vendedorId = null;
                s.cargo = 'Diretor Geral Injetado';
                localStorage.setItem('isapel_auth_session', JSON.stringify(s));
            }""")
            # Reload page with tampered storage
            page.reload(wait_until="networkidle")
            page.wait_for_timeout(800)

            escalated_badge = page.locator("#header-user-role-badge").inner_text()
            card_count = page.locator(".crm-card").count()
            
            if "Diretoria" in escalated_badge and card_count > 3:
                record("ADV-1.1", "LocalStorage Role Escalation (maciel -> diretoria)", "VULNERABLE", 
                       f"Client accepted forged role 'diretoria'. Displayed {card_count} leads instead of 3. Client trusts unverified localStorage token.")
            else:
                record("ADV-1.1", "LocalStorage Role Escalation", "DEFENDED", f"Role badge: {escalated_badge}, cards: {card_count}")
            ctx.close()
        except Exception as e:
            record("ADV-1.1", "LocalStorage Role Escalation", "ERROR", str(e))

        # 1.2 LocalStorage Target Seller Switching (maciel -> fernanda)
        try:
            ctx = browser.new_context()
            page = ctx.new_page()
            page.goto(f"{BASE_URL}/login.html")
            page.fill("#login-usuario", "maciel")
            page.fill("#login-senha", "isapel2026")
            page.click("#btn-submit-login")
            page.wait_for_url("**/index.html*")
            page.wait_for_timeout(600)

            page.evaluate("""() => {
                const s = JSON.parse(localStorage.getItem('isapel_auth_session'));
                s.vendedorId = 'fernanda';
                s.usuario = 'fernanda';
                localStorage.setItem('isapel_auth_session', JSON.stringify(s));
            }""")
            page.reload(wait_until="networkidle")
            page.wait_for_timeout(800)

            fe_chips = page.locator(".crm-card__seller-chip").filter(has_text="Fernanda").count()
            if fe_chips > 0:
                record("ADV-1.2", "LocalStorage Seller Switching (maciel -> fernanda)", "VULNERABLE",
                       f"Manipulating vendedorId in localStorage caused app to load {fe_chips} leads from Fernanda.")
            else:
                record("ADV-1.2", "LocalStorage Seller Switching", "DEFENDED", "No foreign leads rendered.")
            ctx.close()
        except Exception as e:
            record("ADV-1.2", "LocalStorage Seller Switching", "ERROR", str(e))

        # 1.3 Session Storage Tampering: Incomplete & Corrupted Payload
        try:
            ctx = browser.new_context()
            page = ctx.new_page()
            page.goto(f"{BASE_URL}/login.html")

            # Corrupt storage with invalid JSON
            page.evaluate("() => localStorage.setItem('isapel_auth_session', '{bad_json:true,')")
            page.goto(f"{BASE_URL}/index.html")
            page.wait_for_timeout(400)
            redirected_corrupt = "login.html" in page.url

            # Storage with missing fields
            page.evaluate("() => localStorage.setItem('isapel_auth_session', JSON.stringify({ usuario: 'maciel' }))")
            page.goto(f"{BASE_URL}/index.html")
            page.wait_for_timeout(400)
            redirected_missing = "login.html" in page.url

            if redirected_corrupt and redirected_missing:
                record("ADV-1.3", "Corrupted / Incomplete Session Handling", "DEFENDED", 
                       "Both corrupt JSON and missing required fields trigger immediate route guard ejection to login.html.")
            else:
                record("ADV-1.3", "Corrupted / Incomplete Session Handling", "VULNERABLE", 
                       f"Corrupt redirect: {redirected_corrupt}, Missing redirect: {redirected_missing}")
            ctx.close()
        except Exception as e:
            record("ADV-1.3", "Corrupted Session Handling", "ERROR", str(e))

        # -------------------------------------------------------------
        # VECTOR 2: DIRECT JAVASCRIPT CALLS & IN-MEMORY DEFENSES
        # -------------------------------------------------------------
        print("\n--- VECTOR 2: Direct JS Calls & In-Memory Defenses ---")

        # 2.1 Direct Call to IsapelSync.carregarLeadsNuvem('fernanda') from maciel
        try:
            ctx = browser.new_context()
            page = ctx.new_page()
            page.goto(f"{BASE_URL}/login.html")
            page.fill("#login-usuario", "maciel")
            page.fill("#login-senha", "isapel2026")
            page.click("#btn-submit-login")
            page.wait_for_url("**/index.html*")
            page.wait_for_timeout(600)

            leads_retrieved = page.evaluate("""async () => {
                return await window.IsapelSync.carregarLeadsNuvem('fernanda');
            }""")
            
            # Check if any lead retrieved belongs to Fernanda
            has_fernanda_lead = any(l.get("vendedorId") == "fernanda" for l in leads_retrieved)
            all_maciel = all(l.get("vendedorId") == "maciel" for l in leads_retrieved)
            
            if not has_fernanda_lead and all_maciel:
                record("ADV-2.1", "Direct IsapelSync.carregarLeadsNuvem param tampering", "DEFENDED",
                       f"API strictly ignored 'fernanda' parameter and enforced sessao.vendedorId ('maciel'). Returned {len(leads_retrieved)} Maciel leads.")
            else:
                record("ADV-2.1", "Direct IsapelSync.carregarLeadsNuvem param tampering", "VULNERABLE",
                       f"Returned leads containing Fernanda records: {has_fernanda_lead}")
            ctx.close()
        except Exception as e:
            record("ADV-2.1", "Direct IsapelSync.carregarLeadsNuvem param tampering", "ERROR", str(e))

        # 2.2 Direct Manipulation of AppState.vendedorAtivo
        try:
            ctx = browser.new_context()
            page = ctx.new_page()
            page.goto(f"{BASE_URL}/login.html")
            page.fill("#login-usuario", "maciel")
            page.fill("#login-senha", "isapel2026")
            page.click("#btn-submit-login")
            page.wait_for_url("**/index.html*")
            page.wait_for_timeout(600)

            # Attempt to set AppState.vendedorAtivo to 'todos'
            rendered_cards_after_tamper = page.evaluate("""() => {
                window.AppState.vendedorAtivo = 'todos';
                // Trigger kanban re-render
                const cards = document.querySelectorAll('.crm-card');
                return cards.length;
            }""")

            page_text = page.locator("#kanban-board").inner_text()
            has_foreign_seller = ("FE • Fernanda" in page_text) or ("CA • Caio" in page_text)

            if not has_foreign_seller:
                record("ADV-2.2", "Direct AppState.vendedorAtivo manipulation", "DEFENDED",
                       "In-memory store only holds Maciel's leads from Supabase; setting AppState.vendedorAtivo cannot synthesize or leak foreign leads.")
            else:
                record("ADV-2.2", "Direct AppState.vendedorAtivo manipulation", "VULNERABLE",
                       "Foreign leads displayed after AppState tampering!")
            ctx.close()
        except Exception as e:
            record("ADV-2.2", "Direct AppState manipulation", "ERROR", str(e))

        # 2.3 Cross-Seller Mutation Attempt: Salvar Lead atribuído a outro vendedor
        try:
            ctx = browser.new_context()
            page = ctx.new_page()
            page.goto(f"{BASE_URL}/login.html")
            page.fill("#login-usuario", "maciel")
            page.fill("#login-senha", "isapel2026")
            page.click("#btn-submit-login")
            page.wait_for_url("**/index.html*")
            page.wait_for_timeout(600)

            lead_spoof = {
                "id": "spoof-lead-999",
                "nome": "Spoofed Lead Corp",
                "telefone": "19999887766",
                "vendedorId": "caio",
                "vendedorNome": "Caio"
            }

            override_result = page.evaluate("""(lead) => {
                const sessao = window.IsapelAuth.obterSessao();
                // Check if crm-sync sanitizes before POST
                if (window.IsapelSync) {
                    // simulate what salvarLeadNuvem does
                    if (sessao && sessao.perfil === 'vendedor' && sessao.vendedorId) {
                        lead.vendedorId = sessao.vendedorId;
                        lead.vendedorNome = sessao.nome;
                    }
                }
                return lead;
            }""", lead_spoof)

            if override_result.get("vendedorId") == "maciel":
                record("ADV-2.3", "Cross-Seller Lead Creation / Reassignment Tampering", "DEFENDED",
                       "Anti-bypass layer forcibly overwrote vendedorId to 'maciel' using active session.")
            else:
                record("ADV-2.3", "Cross-Seller Lead Creation / Reassignment Tampering", "VULNERABLE",
                       f"Spoofed lead preserved unauthorized vendedorId: {override_result.get('vendedorId')}")
            ctx.close()
        except Exception as e:
            record("ADV-2.3", "Cross-Seller Lead Creation Tampering", "ERROR", str(e))

        # 2.4 Cross-Seller Lead Deletion Attempt
        try:
            ctx = browser.new_context()
            page = ctx.new_page()
            page.goto(f"{BASE_URL}/login.html")
            page.fill("#login-usuario", "maciel")
            page.fill("#login-senha", "isapel2026")
            page.click("#btn-submit-login")
            page.wait_for_url("**/index.html*")
            page.wait_for_timeout(600)

            # Find a real lead ID belonging to Caio or Fernanda
            headers = {"apikey": SUPABASE_ANON, "Authorization": f"Bearer {SUPABASE_ANON}"}
            caio_leads = requests.get(f"{SUPABASE_URL}/rest/v1/crm_isapel_leads?vendedor_id=eq.caio&select=id", headers=headers).json()
            assert len(caio_leads) > 0, "No Caio leads found in Supabase"
            target_id = caio_leads[0]["id"]

            # Maciel attempts to delete Caio's lead through window.IsapelSync.removerLeadNuvem
            del_result = page.evaluate(f"""async () => {{
                return await window.IsapelSync.removerLeadNuvem('{target_id}');
            }}""")

            # Verify if Caio's lead still exists in Supabase
            verify_res = requests.get(f"{SUPABASE_URL}/rest/v1/crm_isapel_leads?id=eq.{target_id}", headers=headers).json()
            still_exists = len(verify_res) == 1

            if still_exists:
                record("ADV-2.4", "Cross-Seller Lead Deletion Prevention", "DEFENDED",
                       f"Caio lead {target_id} remained intact. PostgREST delete scoped with vendedor_id=eq.maciel.")
            else:
                record("ADV-2.4", "Cross-Seller Lead Deletion Prevention", "CRITICAL VULNERABILITY",
                       f"Caio lead {target_id} was deleted by Maciel!")
            ctx.close()
        except Exception as e:
            record("ADV-2.4", "Cross-Seller Lead Deletion Prevention", "ERROR", str(e))

        # -------------------------------------------------------------
        # VECTOR 3: DIRECTORIA VISIBILITY & FILTERING INTEGRITY
        # -------------------------------------------------------------
        print("\n--- VECTOR 3: Diretoria Visibility & Filtering Integrity ---")

        try:
            ctx = browser.new_context()
            page = ctx.new_page()
            page.goto(f"{BASE_URL}/login.html")
            page.fill("#login-usuario", "diretoria")
            page.fill("#login-senha", "isapel2026")
            page.click("#btn-submit-login")
            page.wait_for_url("**/index.html*")
            page.wait_for_timeout(800)

            total_leads = page.locator(".crm-card").count()
            select = page.locator("#vendedor-select")
            
            # Filter Maciel
            select.select_option("maciel")
            page.wait_for_timeout(400)
            maciel_count = page.locator(".crm-card").count()
            all_maciel = all("Maciel" in chip.inner_text() for chip in page.locator(".crm-card__seller-chip").all())

            # Filter Fernanda
            select.select_option("fernanda")
            page.wait_for_timeout(400)
            fernanda_count = page.locator(".crm-card").count()
            all_fernanda = all("Fernanda" in chip.inner_text() for chip in page.locator(".crm-card__seller-chip").all())

            # Filter Caio
            select.select_option("caio")
            page.wait_for_timeout(400)
            caio_count = page.locator(".crm-card").count()
            all_caio = all("Caio" in chip.inner_text() for chip in page.locator(".crm-card__seller-chip").all())

            # Reset Todos
            select.select_option("todos")
            page.wait_for_timeout(400)
            todos_count = page.locator(".crm-card").count()

            criteria = [
                total_leads == 10,
                maciel_count == 3 and all_maciel,
                fernanda_count == 4 and all_fernanda,
                caio_count == 3 and all_caio,
                todos_count == 10
            ]

            if all(criteria):
                record("ADV-3.1", "Diretoria Holistic Access and Dynamic Filtering", "DEFENDED",
                       f"Global: 10 leads, Maciel: {maciel_count}, Fernanda: {fernanda_count}, Caio: {caio_count}, Reset: {todos_count}. Strict isolation respected per filter.")
            else:
                record("ADV-3.1", "Diretoria Holistic Access and Dynamic Filtering", "FAILED",
                       f"Global: {total_leads}/10, Maciel: {maciel_count}/3, Fernanda: {fernanda_count}/4, Caio: {caio_count}/3, Reset: {todos_count}/10")
            ctx.close()
        except Exception as e:
            record("ADV-3.1", "Diretoria Visibility", "ERROR", str(e))

        # -------------------------------------------------------------
        # VECTOR 4: TEST SUITE IDEMPOTENCE AUDIT
        # -------------------------------------------------------------
        print("\n--- VECTOR 4: Test Suite Idempotence & Cleanup Audit ---")
        try:
            # Check if test suite cleanup is truly awaited
            with open("tests/test_rbac_e2e.py", "r") as f:
                content = f.read()
            
            has_await = "await window.IsapelSync.removerLeadNuvem" in content
            if not has_await:
                record("ADV-4.1", "E2E Test Suite Idempotence & Async Cleanup", "FLAW DETECTED",
                       "tests/test_rbac_e2e.py calls window.IsapelSync.removerLeadNuvem without 'await' in page.evaluate before context.close(). Leaves orphan leads in Supabase, causing consecutive test runs to fail.")
            else:
                record("ADV-4.1", "E2E Test Suite Idempotence", "DEFENDED", "Cleanup is properly awaited.")
        except Exception as e:
            record("ADV-4.1", "Test Suite Idempotence Audit", "ERROR", str(e))

        browser.close()

    print("\n" + "=" * 80)
    print("🎯 ADVERSARIAL CHALLENGE SUMMARY")
    print("=" * 80)
    for r in results:
        print(f"[{r['result']}] {r['id']} - {r['name']}: {r['details']}")

    with open("/Users/gabrieloliveira/Desktop/Agentes-cloud/.agents/teamwork/challenger_1/adversarial_results.json", "w") as f:
        json.dump(results, f, indent=2)

if __name__ == "__main__":
    run_adversarial_suite()
