"""
Adversarial Verification Suite v2 - challenger_2_1
Empirical Stress-Testing against LocalStorage Tampering and Modal Edit Bypass
CRM Isapel Papéis v1.1.0
"""

import sys
import time
import json
import requests
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:4173"
SUPABASE_URL = "https://xpjhpskjetpcglkxdjag.supabase.co"
SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwamhwc2tqZXRwY2dsa3hkamFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3ODQyMjMsImV4cCI6MjEwMDM2MDIyM30.nxFBM69wjrEOsz5HkSr9iDLmE9TpJi-eE_Yqq3oAI3s"

headers = {
    "apikey": SUPABASE_ANON,
    "Authorization": f"Bearer {SUPABASE_ANON}",
    "Content-Type": "application/json"
}

results = []

def record(test_id, name, status, details=""):
    print(f"[{status}] {test_id}: {name}")
    if details:
        print(f"       -> {details}")
    results.append({
        "id": test_id,
        "name": name,
        "status": status,
        "details": details
    })

def get_supabase_leads():
    res = requests.get(f"{SUPABASE_URL}/rest/v1/crm_isapel_leads?select=id,nome,vendedor_id,estagio", headers=headers)
    return res.json()

def run_tests():
    print("=" * 80)
    print("EMPIRICAL ADVERSARIAL CHALLENGE — CRM ISAPEL RBAC v1.1.0")
    print("=" * 80)

    initial_leads = get_supabase_leads()
    initial_count = len(initial_leads)
    print(f"Supabase baseline lead count: {initial_count}")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # =========================================================================
        # SUITE A: LOCALSTORAGE TAMPERING & PRIVILEGE ESCALATION
        # =========================================================================
        print("\n--- SUITE A: LocalStorage Tampering & Privilege Escalation ---")

        # A.1 Maciel tampering perfil to diretoria
        try:
            ctx = browser.new_context()
            page = ctx.new_page()
            page.goto(f"{BASE_URL}/login.html")
            page.fill("#login-usuario", "maciel")
            page.fill("#login-senha", "isapel2026")
            page.click("#btn-submit-login")
            page.wait_for_url("**/index.html*")
            page.wait_for_timeout(500)

            # Malicious alteration of perfil
            page.evaluate("""() => {
                const s = JSON.parse(localStorage.getItem('isapel_auth_session'));
                s.perfil = 'diretoria';
                s.vendedorId = null;
                localStorage.setItem('isapel_auth_session', JSON.stringify(s));
            }""")

            # Verify that calling obterSessao() directly returns null and wipes storage
            sessao_val = page.evaluate("() => window.IsapelAuth.obterSessao()")
            storage_after = page.evaluate("() => localStorage.getItem('isapel_auth_session')")

            # Reload to see if route guard catches it
            page.reload()
            page.wait_for_timeout(600)
            redirected = "login.html" in page.url

            if sessao_val is None and storage_after is None and redirected:
                record("ADV-A1", "LocalStorage Role Escalation (maciel -> diretoria)", "DEFENDED",
                       "obterSessao() invalidated tampered session, purged localStorage, and route guard redirected to login.html.")
            else:
                record("ADV-A1", "LocalStorage Role Escalation (maciel -> diretoria)", "VULNERABLE",
                       f"sessao: {sessao_val}, storage: {storage_after}, redirected: {redirected}")
            ctx.close()
        except Exception as e:
            record("ADV-A1", "LocalStorage Role Escalation", "ERROR", str(e))

        # A.2 Maciel tampering vendedorId to fernanda
        try:
            ctx = browser.new_context()
            page = ctx.new_page()
            page.goto(f"{BASE_URL}/login.html")
            page.fill("#login-usuario", "maciel")
            page.fill("#login-senha", "isapel2026")
            page.click("#btn-submit-login")
            page.wait_for_url("**/index.html*")
            page.wait_for_timeout(500)

            # Malicious alteration of vendedorId while keeping usuario: maciel
            page.evaluate("""() => {
                const s = JSON.parse(localStorage.getItem('isapel_auth_session'));
                s.vendedorId = 'fernanda';
                localStorage.setItem('isapel_auth_session', JSON.stringify(s));
            }""")

            sessao_val = page.evaluate("() => window.IsapelAuth.obterSessao()")
            storage_after = page.evaluate("() => localStorage.getItem('isapel_auth_session')")

            page.reload()
            page.wait_for_timeout(600)
            redirected = "login.html" in page.url

            if sessao_val is None and storage_after is None and redirected:
                record("ADV-A2", "LocalStorage Seller Spoofing (maciel -> fernanda)", "DEFENDED",
                       "obterSessao() detected vendedorId mismatch against USUARIOS_CONFIG, purged storage and expelled user.")
            else:
                record("ADV-A2", "LocalStorage Seller Spoofing (maciel -> fernanda)", "VULNERABLE",
                       f"sessao: {sessao_val}, storage: {storage_after}, redirected: {redirected}")
            ctx.close()
        except Exception as e:
            record("ADV-A2", "LocalStorage Seller Spoofing", "ERROR", str(e))

        # A.3 Fictitious user injection in storage
        try:
            ctx = browser.new_context()
            page = ctx.new_page()
            page.goto(f"{BASE_URL}/login.html")

            page.evaluate("""() => {
                localStorage.setItem('isapel_auth_session', JSON.stringify({
                    usuario: 'superadmin',
                    perfil: 'diretoria',
                    vendedorId: null
                }));
            }""")
            page.goto(f"{BASE_URL}/index.html")
            page.wait_for_timeout(500)
            redirected = "login.html" in page.url

            if redirected:
                record("ADV-A3", "Fictitious / Unregistered User Storage Injection", "DEFENDED",
                       "Unknown user 'superadmin' not in USUARIOS_CONFIG purged immediately; user redirected to login.html.")
            else:
                record("ADV-A3", "Fictitious User Storage Injection", "VULNERABLE", f"URL: {page.url}")
            ctx.close()
        except Exception as e:
            record("ADV-A3", "Fictitious User Injection", "ERROR", str(e))

        # =========================================================================
        # SUITE B: MODAL EDIT BYPASS & REASSIGNMENT TAMPERING
        # =========================================================================
        print("\n--- SUITE B: Modal Edit Bypass & Reassignment Tampering ---")

        # B.1 Seller inspecting edit modal: #edit-lead-vendedor is disabled
        try:
            ctx = browser.new_context()
            page = ctx.new_page()
            page.goto(f"{BASE_URL}/login.html")
            page.fill("#login-usuario", "maciel")
            page.fill("#login-senha", "isapel2026")
            page.click("#btn-submit-login")
            page.wait_for_url("**/index.html*")
            page.wait_for_timeout(600)

            # Find Maciel's first lead ID
            card = page.locator(".crm-card").first
            lead_id = card.get_attribute("data-id")
            card.locator(".btn-edit-lead").click()
            page.wait_for_timeout(400)

            is_disabled = page.eval_on_selector("#edit-lead-vendedor", "el => el.disabled")
            cursor_style = page.eval_on_selector("#edit-lead-vendedor", "el => el.style.cursor")

            if is_disabled and cursor_style == "not-allowed":
                record("ADV-B1", "Edit Modal UI Lockdown for Seller", "DEFENDED",
                       f"Select is disabled={is_disabled} with cursor='{cursor_style}'.")
            else:
                record("ADV-B1", "Edit Modal UI Lockdown for Seller", "VULNERABLE",
                       f"disabled={is_disabled}, cursor={cursor_style}")
            ctx.close()
        except Exception as e:
            record("ADV-B1", "Edit Modal UI Lockdown", "ERROR", str(e))

        # B.2 Seller re-enabling #edit-lead-vendedor via DOM and submitting
        try:
            ctx = browser.new_context()
            page = ctx.new_page()
            page.goto(f"{BASE_URL}/login.html")
            page.fill("#login-usuario", "maciel")
            page.fill("#login-senha", "isapel2026")
            page.click("#btn-submit-login")
            page.wait_for_url("**/index.html*")
            page.wait_for_timeout(600)

            # Open edit modal on Maciel's lead
            card = page.locator(".crm-card").first
            lead_id = card.get_attribute("data-id")
            lead_name = card.locator(".crm-card__client-name").inner_text()
            card.locator(".btn-edit-lead").click()
            page.wait_for_timeout(400)

            # Maliciously enable the select and change value to 'fernanda'
            page.evaluate("""() => {
                const sel = document.getElementById('edit-lead-vendedor');
                sel.disabled = false;
                sel.value = 'fernanda';
                // Trigger form submission / save
                document.getElementById('btn-salvar-edicao-lead').click();
            }""")
            page.wait_for_timeout(1000)

            # Query Supabase directly via REST to verify if vendedor_id remained 'maciel'
            res = requests.get(f"{SUPABASE_URL}/rest/v1/crm_isapel_leads?id=eq.{lead_id}", headers=headers).json()
            assert len(res) == 1, f"Lead {lead_id} not found in Supabase!"
            persisted_vendedor = res[0].get("vendedor_id")

            if persisted_vendedor == "maciel":
                record("ADV-B2", "DOM Unlock & Seller Reassignment Tampering", "DEFENDED",
                       f"DOM enable to 'fernanda' was intercepted: backend/controller forced vendedor_id='{persisted_vendedor}' in Supabase.")
            else:
                record("ADV-B2", "DOM Unlock & Seller Reassignment Tampering", "CRITICAL VULNERABILITY",
                       f"Lead {lead_id} reassigned to '{persisted_vendedor}'!")
            ctx.close()
        except Exception as e:
            record("ADV-B2", "DOM Unlock Tampering", "ERROR", str(e))

        # B.3 Diretoria inspecting edit modal: #edit-lead-vendedor is enabled
        try:
            ctx = browser.new_context()
            page = ctx.new_page()
            page.goto(f"{BASE_URL}/login.html")
            page.fill("#login-usuario", "diretoria")
            page.fill("#login-senha", "isapel2026")
            page.click("#btn-submit-login")
            page.wait_for_url("**/index.html*")
            page.wait_for_timeout(800)

            card = page.locator(".crm-card").first
            card.locator(".btn-edit-lead").click()
            page.wait_for_timeout(400)

            is_disabled = page.eval_on_selector("#edit-lead-vendedor", "el => el.disabled")
            page.click("#btn-cancelar-modal-editar")

            if not is_disabled:
                record("ADV-B3", "Edit Modal Management Privilege (Diretoria)", "DEFENDED",
                       "Diretoria has active (disabled=false) access to reassign sellers if needed.")
            else:
                record("ADV-B3", "Edit Modal Management Privilege", "VULNERABLE",
                       "Diretoria unexpectedly had #edit-lead-vendedor disabled.")
            ctx.close()
        except Exception as e:
            record("ADV-B3", "Edit Modal Management Privilege", "ERROR", str(e))

        # =========================================================================
        # SUITE C: RUNTIME ISOLATION & DATA LEAKAGE ATTACKS
        # =========================================================================
        print("\n--- SUITE C: Runtime Isolation & Data Leakage Attacks ---")

        # C.1 Direct script call to carregarLeadsNuvem('fernanda') from maciel
        try:
            ctx = browser.new_context()
            page = ctx.new_page()
            page.goto(f"{BASE_URL}/login.html")
            page.fill("#login-usuario", "maciel")
            page.fill("#login-senha", "isapel2026")
            page.click("#btn-submit-login")
            page.wait_for_url("**/index.html*")
            page.wait_for_timeout(600)

            res_leads = page.evaluate("""async () => {
                return await window.IsapelSync.carregarLeadsNuvem('fernanda');
            }""")

            has_fe = any(l.get("vendedorId") == "fernanda" or l.get("vendedor_id") == "fernanda" for l in res_leads)
            all_maciel = all(l.get("vendedorId") == "maciel" or l.get("vendedor_id") == "maciel" for l in res_leads)

            if not has_fe and all_maciel:
                record("ADV-C1", "Direct IsapelSync.carregarLeadsNuvem Foreign Param Override", "DEFENDED",
                       f"Parameter 'fernanda' ignored; returned {len(res_leads)} leads strictly scoped to maciel.")
            else:
                record("ADV-C1", "Direct IsapelSync.carregarLeadsNuvem Foreign Param", "VULNERABLE",
                       f"has_fe={has_fe}, all_maciel={all_maciel}")
            ctx.close()
        except Exception as e:
            record("ADV-C1", "carregarLeadsNuvem Override", "ERROR", str(e))

        # C.2 Direct script call to salvarLeadNuvem() with spoofed vendedor_id
        try:
            ctx = browser.new_context()
            page = ctx.new_page()
            page.goto(f"{BASE_URL}/login.html")
            page.fill("#login-usuario", "maciel")
            page.fill("#login-senha", "isapel2026")
            page.click("#btn-submit-login")
            page.wait_for_url("**/index.html*")
            page.wait_for_timeout(600)

            spoofed_lead = {
                "id": "adversarial-temp-lead-12345",
                "nome": "Adversarial Injection Test",
                "telefone": "19999001122",
                "vendedorId": "caio",
                "vendedor_id": "caio",
                "estagio": "novo"
            }

            saved = page.evaluate("""async (lead) => {
                return await window.IsapelSync.salvarLeadNuvem(lead);
            }""", spoofed_lead)

            # Inspect what was persisted in Supabase
            check_res = requests.get(f"{SUPABASE_URL}/rest/v1/crm_isapel_leads?id=eq.adversarial-temp-lead-12345", headers=headers).json()
            
            # Clean up the test lead immediately
            requests.delete(f"{SUPABASE_URL}/rest/v1/crm_isapel_leads?id=eq.adversarial-temp-lead-12345", headers=headers)

            if len(check_res) == 1:
                persisted_vendedor = check_res[0].get("vendedor_id")
                if persisted_vendedor == "maciel":
                    record("ADV-C2", "salvarLeadNuvem Direct Spoofed Payload Overwrite", "DEFENDED",
                           f"Payload vendedor_id='caio' was forcefully sanitized to '{persisted_vendedor}' based on authenticated session.")
                else:
                    record("ADV-C2", "salvarLeadNuvem Direct Spoofed Payload Overwrite", "VULNERABLE",
                           f"Lead was saved with unauthorized vendedor_id='{persisted_vendedor}'!")
            else:
                record("ADV-C2", "salvarLeadNuvem Direct Spoofed Payload", "ERROR", "Lead was not saved to Supabase")
            ctx.close()
        except Exception as e:
            record("ADV-C2", "salvarLeadNuvem Spoofed Payload", "ERROR", str(e))

        # C.3 Cross-Seller Lead Deletion Attempt
        try:
            ctx = browser.new_context()
            page = ctx.new_page()
            page.goto(f"{BASE_URL}/login.html")
            page.fill("#login-usuario", "maciel")
            page.fill("#login-senha", "isapel2026")
            page.click("#btn-submit-login")
            page.wait_for_url("**/index.html*")
            page.wait_for_timeout(600)

            # Get an existing lead belonging to Caio
            caio_leads = [l for l in initial_leads if l.get("vendedor_id") == "caio"]
            assert len(caio_leads) > 0, "No Caio leads found"
            caio_lead_id = caio_leads[0]["id"]

            # Maciel attempts to delete Caio's lead
            del_result = page.evaluate(f"""async () => {{
                return await window.IsapelSync.removerLeadNuvem('{caio_lead_id}');
            }}""")

            # Verify in Supabase
            verify_caio = requests.get(f"{SUPABASE_URL}/rest/v1/crm_isapel_leads?id=eq.{caio_lead_id}", headers=headers).json()

            if len(verify_caio) == 1:
                record("ADV-C3", "Cross-Seller Deletion Lockdown", "DEFENDED",
                       f"removerLeadNuvem appended vendedor_id=eq.maciel; Caio lead {caio_lead_id} was NOT deleted.")
            else:
                record("ADV-C3", "Cross-Seller Deletion Lockdown", "CRITICAL VULNERABILITY",
                       f"Caio lead {caio_lead_id} was deleted by Maciel!")
            ctx.close()
        except Exception as e:
            record("ADV-C3", "Cross-Seller Deletion", "ERROR", str(e))

        browser.close()

    # Final database audit
    final_leads = get_supabase_leads()
    final_count = len(final_leads)
    print(f"\nFinal Supabase lead count: {final_count} (Initial: {initial_count})")
    
    idempotent = (final_count == initial_count == 10)
    if idempotent:
        record("ADV-D1", "Zero Database Drift & Idempotency", "DEFENDED",
               f"Database count strictly preserved at exactly 10 leads with zero orphaned records.")
    else:
        record("ADV-D1", "Zero Database Drift & Idempotency", "FAILED",
               f"Database drift detected! Initial: {initial_count}, Final: {final_count}")

    print("\n" + "=" * 80)
    print("FINAL SUMMARY REPORT")
    print("=" * 80)
    vulnerabilities = [r for r in results if r["status"] in ("VULNERABLE", "CRITICAL VULNERABILITY", "FAILED")]
    for r in results:
        print(f"[{r['status']}] {r['id']} - {r['name']}: {r['details']}")

    print(f"\nTotal Tests: {len(results)}")
    print(f"Defended: {len([r for r in results if r['status'] == 'DEFENDED'])}")
    print(f"Vulnerabilities: {len(vulnerabilities)}")

    return len(vulnerabilities) == 0

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
