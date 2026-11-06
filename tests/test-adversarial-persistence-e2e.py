#!/usr/bin/env python3
"""
tests/test-adversarial-persistence-e2e.py
Empirical Browser E2E Adversarial Test Suite for Isapel CRM Persistence (R1, R2, R3, R4)

Tests live browser interactions via Playwright:
1. Route Guard & Login as Diretoria (unrestricted global Kanban view).
2. Tag toggling (licitação <-> consumidor_final) + page reload + stale poll injection.
3. Card movement across Kanban stages + page reload + stale poll injection.
4. Concurrent quick lead creation + page reload + non-destructive polling.
5. Supabase network disconnection simulation (route abort) + offline mutations + reconnection.
"""

import sys
import time
import json
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

PORT = 4173
BASE_URL = f"http://localhost:{PORT}"

results = []

def record(name: str, passed: bool, detail: str = ""):
    status = "PASS" if passed else "FAIL"
    icon = "✅" if passed else "❌"
    print(f"  {icon} [{status}] {name}{f': {detail}' if detail else ''}")
    results.append({"name": name, "passed": passed, "detail": detail})

def run_e2e_suite():
    print("=" * 80)
    print("⚡ INICIANDO SUÍTE ADVERSARIAL E2E PLAYWRIGHT (PERSISTÊNCIA ISAPEL CRM)")
    print("=" * 80)

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage"]
        )
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        console_errors = []
        page.on("pageerror", lambda err: console_errors.append(str(err)))

        print("\n--- 1. Autenticação & Carregamento da Aplicação no Navegador Real ---")
        page.goto(f"{BASE_URL}/login.html", wait_until="networkidle")
        page.fill("#login-usuario", "diretoria")
        page.fill("#login-senha", "Diretoria123!")
        page.click("#btn-submit-login")
        page.wait_for_url("**/index.html*", timeout=6000)
        page.wait_for_timeout(1000)

        total_cards_init = page.locator(".crm-card").count()
        print(f"   ✓ Diretoria autenticada. Kanban carregado com {total_cards_init} cards visíveis.")
        record("Autenticação e Carregamento Inicial", total_cards_init > 0, f"{total_cards_init} cards renderizados")

        # ==================================================================
        # CENÁRIO 1: PERSISTÊNCIA DE ALTERAÇÃO DE ETIQUETA (R1)
        # ==================================================================
        print("\n--- 2. Adversarial E2E R1: Alternância de Etiquetas & Proteção Contra Stale Poll ---")
        
        # Pega o primeiro card
        first_card = page.locator(".crm-card").first
        first_lead_id = first_card.get_attribute("data-id")
        lead_name = first_card.locator(".crm-card__client-name").inner_text()
        print(f"   Target Lead: {first_lead_id} ({lead_name})")

        # 1.1 Alternar para Licitação
        btn_tipo = first_card.locator(".btn-tipo-cliente")
        btn_tipo.click()
        page.wait_for_selector(".crm-tipo-popover", state="visible")
        page.locator('.crm-tipo-popover__option[data-tipo="licitacao"]').click()
        page.wait_for_timeout(300)

        # Validar no DOM
        tipo_badge = first_card.locator(".crm-card__tipo-text").inner_text()
        record("R1.1 DOM reflete 'Licitação'", "Licitação" in tipo_badge, f"Badge: {tipo_badge}")

        # Validar no localStorage
        storage_leads = page.evaluate("() => JSON.parse(localStorage.getItem('isapel_crm_leads_v1') || '[]')")
        target_in_storage = next((l for l in storage_leads if str(l["id"]) == str(first_lead_id)), None)
        record("R1.2 LocalStorage salvo como 'licitacao'", target_in_storage and target_in_storage.get("tipoCliente") == "licitacao")

        # 1.2 Recarregar a página (F5) e verificar persistência
        page.reload(wait_until="networkidle")
        page.wait_for_timeout(500)
        reloaded_card = page.locator(f'.crm-card[data-id="{first_lead_id}"]')
        reloaded_badge = reloaded_card.locator(".crm-card__tipo-text").inner_text()
        record("R1.3 'Licitação' persiste após F5 (Page Reload)", "Licitação" in reloaded_badge, f"Badge pós-F5: {reloaded_badge}")

        # 1.3 Alternar para Consumidor Final
        reloaded_card.locator(".btn-tipo-cliente").click()
        page.wait_for_selector(".crm-tipo-popover", state="visible")
        page.locator('.crm-tipo-popover__option[data-tipo="consumidor_final"]').click()
        page.wait_for_timeout(300)

        consumidor_badge = reloaded_card.locator(".crm-card__tipo-text").inner_text()
        record("R1.4 DOM reflete 'Consumidor Final'", "Consumidor Final" in consumidor_badge)

        # 1.4 Ataque de Stale Poll: Simula chegada de poll remoto atrasado com 'licitacao'
        print("   ⚡ Injetando stale cloud poll com 'licitacao' e timestamp anterior...")
        page.evaluate("""(leadId) => {
            const staleRemoteRow = [{
                id: leadId,
                tipo_cliente: 'licitacao',
                tipoCliente: 'licitacao',
                data_atualizacao: new Date(Date.now() - 30000).toISOString()
            }];
            window.IsapelCRM.definirLeads(staleRemoteRow);
            if (typeof window.renderizarKanbanGlobal === 'function') {
                window.renderizarKanbanGlobal();
            }
        }""", first_lead_id)
        page.wait_for_timeout(400)

        post_poll_card = page.locator(f'.crm-card[data-id="{first_lead_id}"]')
        post_poll_badge = post_poll_card.locator(".crm-card__tipo-text").inner_text()
        record("R1.5 Stale poll NÃO sobrescreve dirty local 'Consumidor Final'", "Consumidor Final" in post_poll_badge, f"Badge: {post_poll_badge}")

        page.reload(wait_until="networkidle")
        page.wait_for_timeout(400)
        post_reload_badge = page.locator(f'.crm-card[data-id="{first_lead_id}"]').locator(".crm-card__tipo-text").inner_text()
        record("R1.6 'Consumidor Final' permanece após segundo reload", "Consumidor Final" in post_reload_badge)

        # ==================================================================
        # CENÁRIO 2: PERSISTÊNCIA DE MOVIMENTAÇÃO NO FUNIL KANBAN (R2)
        # ==================================================================
        print("\n--- 3. Adversarial E2E R2: Movimentação de Cards & Imunidade à Regressão ---")

        novo_card = page.locator("#cards-novo .crm-card").first
        novo_id = novo_card.get_attribute("data-id")
        novo_name = novo_card.locator(".crm-card__client-name").inner_text()
        print(f"   Target Move Lead: {novo_id} ({novo_name})")

        btn_adv = novo_card.locator(".btn-advance-stage")
        btn_adv.click() # novo -> qualificacao
        page.wait_for_timeout(300)
        
        card_em_qualif = page.locator(f'#cards-qualificacao .crm-card[data-id="{novo_id}"]')
        expect(card_em_qualif).to_be_visible()
        card_em_qualif.locator(".btn-advance-stage").click() # qualificacao -> proposta
        page.wait_for_timeout(300)

        card_em_proposta = page.locator(f'#cards-proposta .crm-card[data-id="{novo_id}"]')
        record("R2.1 Card avançado com sucesso para coluna 'Proposta'", card_em_proposta.is_visible())

        # Ataque de Stale Poll: Cloud retorna snapshot antigo com o lead em 'novo'
        print("   ⚡ Injetando stale cloud poll com estágio 'novo'...")
        page.evaluate("""(leadId) => {
            const staleRemoteRow = [{
                id: leadId,
                estagio: 'novo',
                data_atualizacao: new Date(Date.now() - 45000).toISOString()
            }];
            window.IsapelCRM.definirLeads(staleRemoteRow);
        }""", novo_id)
        page.wait_for_timeout(400)

        card_ainda_proposta = page.locator(f'#cards-proposta .crm-card[data-id="{novo_id}"]')
        card_voltou_novo = page.locator(f'#cards-novo .crm-card[data-id="{novo_id}"]')
        record("R2.2 Card NÃO regride para 'novo' após stale polling", card_ainda_proposta.is_visible() and not card_voltou_novo.is_visible())

        # Recarrega a página e valida permanência
        page.reload(wait_until="networkidle")
        page.wait_for_timeout(500)
        card_pos_f5 = page.locator(f'#cards-proposta .crm-card[data-id="{novo_id}"]')
        record("R2.3 Card permanece na coluna 'Proposta' após Page Reload", card_pos_f5.is_visible())

        # ==================================================================
        # CENÁRIO 3: CADASTRO CONCORRENTE DE NOVOS LEADS (R3)
        # ==================================================================
        print("\n--- 4. Adversarial E2E R3: Novos Cadastros em Sequência Rápida & Não-Destruição ---")

        novos_leads_dados = [
            ("Hospital Samaritano Paulínia", "19987650001"),
            ("Prefeitura de Paulínia - Secretaria da Saúde", "19987650002"),
            ("Faculdade de Odontologia Piracicaba", "19987650003")
        ]

        for nome, tel in novos_leads_dados:
            page.locator("#lead-nome").fill(nome)
            page.locator("#lead-telefone").fill(tel)
            page.wait_for_timeout(100)
            page.locator("#btn-cadastrar-lead").click()
            page.wait_for_timeout(250)

        for nome, _ in novos_leads_dados:
            created_card = page.locator("#cards-novo .crm-card").filter(has_text=nome)
            record(f"R3.1 Novo lead renderizado: {nome}", created_card.is_visible())

        # Simula auto-polling da nuvem (que ainda NÃO contém esses 3 novos leads)
        print("   ⚡ Injetando cloud poll sem os novos leads cadastrados...")
        page.evaluate("""() => {
            const leadsAtuais = window.IsapelCRM.listarLeads();
            const leadsRemotos = leadsAtuais.filter(l => !l.nome.includes("Paulínia") && !l.nome.includes("Piracicaba"));
            window.IsapelCRM.definirLeads(leadsRemotos);
        }""")
        page.wait_for_timeout(400)

        for nome, _ in novos_leads_dados:
            still_card = page.locator("#cards-novo .crm-card").filter(has_text=nome)
            record(f"R3.2 Novo lead preservado após auto-polling: {nome}", still_card.is_visible())

        # Recarrega a página e valida permanência de todos os novos leads
        page.reload(wait_until="networkidle")
        page.wait_for_timeout(500)

        for nome, _ in novos_leads_dados:
            persisted_card = page.locator("#cards-novo .crm-card").filter(has_text=nome)
            record(f"R3.3 Novo lead permanece presente após Page Reload: {nome}", persisted_card.is_visible())

        # ==================================================================
        # CENÁRIO 4: SIMULAÇÃO DE QUEDA DE REDE & RECONEXÃO
        # ==================================================================
        print("\n--- 5. Adversarial E2E R4: Blackout de Rede (Supabase Unreachable) & Merge Pacifico ---")

        def abort_supabase(route):
            route.abort("failed")

        page.route("**/*supabase.co/**", abort_supabase)
        print("   📡 Blackout ativado: Todas as requisições HTTP para Supabase abortadas.")

        offline_lead_name = "Clínica Oftalmológica São José (Offline)"
        page.locator("#lead-nome").fill(offline_lead_name)
        page.locator("#lead-telefone").fill("19999998888")
        page.wait_for_timeout(100)
        page.locator("#btn-cadastrar-lead").click()
        page.wait_for_timeout(400)

        offline_card = page.locator("#cards-novo .crm-card").filter(has_text=offline_lead_name)
        record("R4.1 Lead criado com sucesso durante blackout de rede", offline_card.is_visible())

        # Recarrega a página durante a queda de rede
        page.reload(wait_until="networkidle")
        page.wait_for_timeout(600)

        reloaded_offline_card = page.locator("#cards-novo .crm-card").filter(has_text=offline_lead_name)
        record("R4.2 Lead criado offline sobrevive a Page Reload com rede caída", reloaded_offline_card.is_visible())

        # Restaura conexão da rede
        page.unroute("**/*supabase.co/**")
        print("   📡 Conexão restaurada com a nuvem.")

        # Polling com dados da nuvem não deve destruir o lead offline
        page.evaluate("""() => {
            const dadosNuvem = window.IsapelCRM.listarLeads().filter(l => !l.nome.includes("Offline"));
            window.IsapelCRM.definirLeads(dadosNuvem);
        }""")
        page.wait_for_timeout(400)

        post_reconnect_card = page.locator("#cards-novo .crm-card").filter(has_text=offline_lead_name)
        record("R4.3 Lead offline mantido após reconexão da nuvem", post_reconnect_card.is_visible())

        browser.close()

    print("\n" + "=" * 80)
    total_e2e = len(results)
    passed_e2e = sum(1 for r in results if r["passed"])
    failed_e2e = total_e2e - passed_e2e
    print(f"TOTAL DE TESTES E2E EXECUTADOS: {total_e2e}")
    print(f"TESTES APROVADOS:               {passed_e2e}")
    print(f"TESTES COM FALHA:               {failed_e2e}")
    print("=" * 80)

    if failed_e2e > 0:
        print("\n❌ FALHAS DETECTADAS:")
        for r in results:
            if not r["passed"]:
                print(f"- {r['name']}: {r['detail']}")
        sys.exit(1)
    else:
        print("\n🎉 TODOS OS TESTES ADVERSARIAIS E2E PLAYWRIGHT FORAM APROVADOS COM SUCESSO!")
        sys.exit(0)

if __name__ == "__main__":
    run_e2e_suite()
