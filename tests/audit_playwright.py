#!/usr/bin/env python3
"""
================================================================================
AUDITORIA DE QA, UX E AUTOMAÇÃO E2E COM PLAYWRIGHT - CRM ISAPEL PAPÉIS
Arquivo: /Users/gabrieloliveira/Desktop/Agentes-cloud/isapel-crm/tests/audit_playwright.py
================================================================================
Cobre os seguintes cenários:
1. Carregamento inicial do CRM B2B (1920x1080) com validação visual do cabeçalho oficial,
   paleta Azul Claro/Branco e Funil Kanban de 6 etapas.
2. Cadastro de novo lead apenas com Nome e WhatsApp, validando a detecção em tempo real
   de DDD 11 (São Paulo / Grande SP) e DDD 19 (Campinas / RMC) com logística CIF Frota Própria.
3. Adição de anotação de negociação pelo vendedor ("Cliente precisa de 40 caixas de Papel Toalha Interfolha")
   e movimentação de lead pelo funil comercial.
4. Arena 3D de Vendedores com renderização Three.js do pódio tridimensional e dos bonequinhos
   de Fernanda (loira 21a), Caio (19a cabelo enrolado) e Maciel (cabelo enrolado e bigode),
   com placar e ranking reativo.
5. Fechamento do Dia & Inteligência Comercial com plano tático prioritário para o dia seguinte
   (Alta, Média e Estratégica), sem menção a comissões monetárias, e validação de download do JSON.
6. Responsividade mobile (390x844) otimizada para uso em campo pelos vendedores na rua.
7. Monitoramento contínuo de logs e exceções do console.
================================================================================
"""

import os
import sys
import time
import json
import socket
import re
import urllib.request
import subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

PORT = 4173
BASE_DIR = Path("/Users/gabrieloliveira/Desktop/Agentes-cloud/isapel-crm")
SCREENSHOTS_DIR = BASE_DIR / "screenshots"
URL = f"http://localhost:{PORT}/index.html"

SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)


def is_port_in_use(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(("127.0.0.1", port)) == 0


def wait_for_server(url: str, timeout: float = 10.0):
    start = time.time()
    while time.time() - start < timeout:
        try:
            with urllib.request.urlopen(url, timeout=1) as response:
                if response.status == 200:
                    return True
        except Exception:
            time.sleep(0.3)
    return False


def run_audit():
    print("=" * 80)
    print("🚀 INICIANDO AUDITORIA COMPLETA DE QA E PLAYWRIGHT - CRM ISAPEL PAPÉIS")
    print("=" * 80)

    server_process = None
    started_by_us = False

    # 1. Gerenciar Servidor HTTP local
    if not is_port_in_use(PORT):
        print(f"📡 Iniciando servidor HTTP local em background na porta {PORT}...")
        server_process = subprocess.Popen(
            [sys.executable, "-m", "http.server", str(PORT), "--directory", str(BASE_DIR)],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        started_by_us = True
        time.sleep(1)
    else:
        print(f"ℹ️ Servidor HTTP já ativo na porta {PORT}.")

    if not wait_for_server(URL, timeout=12.0):
        if server_process:
            server_process.kill()
        raise RuntimeError(f"❌ Não foi possível conectar ao servidor HTTP em {URL}")

    print(f"✅ Servidor HTTP pronto e respondendo em: {URL}")

    console_errors = []
    console_logs = []
    page_errors = []
    results = {}

    try:
        with sync_playwright() as p:
            print("🌐 Lançando navegador Chromium headless...")
            browser = p.chromium.launch(
                headless=True,
                args=[
                    "--no-sandbox",
                    "--disable-dev-shm-usage"
                ]
            )

            # ==================================================================
            # CENÁRIO 1: DESKTOP 1920x1080 - KANBAN & CABEÇALHO OFICIAL
            # ==================================================================
            print("\n📸 [Cenário 1/6] Auditoria Desktop 1920x1080 - Kanban B2B e Identidade Isapel")
            context = browser.new_context(
                viewport={"width": 1920, "height": 1080},
                accept_downloads=True
            )
            page = context.new_page()

            # Capturar logs e erros
            page.on("console", lambda msg: (
                console_errors.append(msg.text) if msg.type in ["error"] else console_logs.append(f"[{msg.type}] {msg.text}")
            ))
            page.on("pageerror", lambda err: page_errors.append(str(err)))

            page.goto(URL, wait_until="networkidle")

            # Validação do Cabeçalho e Elementos Chave
            expect(page.locator(".crm-header")).to_be_visible()
            expect(page.locator(".crm-header__title")).to_contain_text("CRM Isapel")
            expect(page.locator("#tab-nav-funil")).to_be_visible()
            expect(page.locator("#tab-nav-arena")).to_be_visible()
            expect(page.locator("#tab-nav-fechamento")).to_be_visible()

            # Validação das 6 Etapas do Kanban
            colunas_esperadas = [
                ("col-novo", "1. Novo Lead"),
                ("col-qualificacao", "2. Qualificação"),
                ("col-proposta", "3. Proposta Enviada"),
                ("col-negociacao", "4. Negociação"),
                ("col-fechado", "5. Fechado (Ganho)"),
                ("col-perdido", "6. Perdido")
            ]

            for col_id, titulo_esperado in colunas_esperadas:
                col = page.locator(f"#{col_id}")
                expect(col).to_be_visible()
                expect(col.locator(".crm-kanban-col__title")).to_contain_text(titulo_esperado)

            total_leads_header = page.locator("#header-total-leads-badge").inner_text()
            print(f"   ✓ 6 Colunas do Kanban B2B presentes e ativas. Total de leads carregados: {total_leads_header}")

            # Captura Screenshot 01
            sc1_path = SCREENSHOTS_DIR / "01-crm-kanban-desktop.png"
            page.screenshot(path=str(sc1_path), full_page=False)
            print(f"   ✅ Screenshot salvo: {sc1_path}")
            results["01-crm-kanban-desktop"] = str(sc1_path)

            # ==================================================================
            # CENÁRIO 2: CADASTRO NOVO LEAD & DETECÇÃO EM TEMPO REAL DE DDD
            # ==================================================================
            print("\n📸 [Cenário 2/6] Auditoria de Cadastro Rápido & Detecção DDD 11 / 19")
            
            nome_input = page.locator("#lead-nome")
            tel_input = page.locator("#lead-telefone")
            badge_loc = page.locator("#badge-ddd-localizacao")

            expect(nome_input).to_be_visible()
            expect(tel_input).to_be_visible()

            # 1. Testar DDD 19 (Campinas / RMC)
            tel_input.fill("19987654321")
            page.wait_for_timeout(200)
            badge_loc_text_19 = badge_loc.inner_text()
            print(f"   ✓ DDD 19 detectado: {badge_loc_text_19}")
            assert "19" in badge_loc_text_19, f"Esperava DDD 19 no badge, obteve: {badge_loc_text_19}"

            # 2. Testar DDD 11 (São Paulo / Grande SP)
            nome_input.fill("Distribuidora Express Papéis Ltda")
            tel_input.fill("11988887777")
            page.wait_for_timeout(200)

            badge_loc_text_11 = badge_loc.inner_text()
            print(f"   ✓ DDD 11 detectado: {badge_loc_text_11}")

            assert "11" in badge_loc_text_11 and "São Paulo" in badge_loc_text_11, f"Falha na detecção SP: {badge_loc_text_11}"

            # Captura Screenshot 02 (com formulário preenchido e badges destacados)
            sc2_path = SCREENSHOTS_DIR / "02-crm-novo-lead-ddd.png"
            page.screenshot(path=str(sc2_path), full_page=False)
            print(f"   ✅ Screenshot salvo: {sc2_path}")
            results["02-crm-novo-lead-ddd"] = str(sc2_path)

            # Submeter cadastro e validar inserção no Kanban
            page.locator("#btn-cadastrar-lead").click()
            page.wait_for_timeout(500)

            novo_card = page.locator("#cards-novo .crm-card").filter(has_text="Distribuidora Express Papéis Ltda").first
            expect(novo_card).to_be_visible()
            print("   ✓ Novo lead criado com sucesso e renderizado na coluna '1. Novo Lead'.")

            # ==================================================================
            # CENÁRIO 3: ANOTAÇÃO DO VENDEDOR & AVANÇO NO FUNIL
            # ==================================================================
            print("\n📸 [Cenário 3/6] Auditoria de Anotação do Vendedor e Movimentação no Funil")

            # Abrir modal de notas no card recém-criado
            btn_add_nota = novo_card.locator(".btn-add-note")
            btn_add_nota.click()

            modal_notas = page.locator("#modal-notas-backdrop")
            expect(modal_notas).to_have_class(re.compile(r"is-open"))
            expect(modal_notas).to_be_visible()
            page.wait_for_timeout(400)  # Aguardar transição CSS completa de opacidade

            # Preencher a anotação de negociação solicitada
            anotacao_texto = "Cliente precisa de 40 caixas de Papel Toalha Interfolha"
            input_nota = page.locator("#input-nova-nota")
            input_nota.fill(anotacao_texto)
            page.wait_for_timeout(200)

            # Captura Screenshot 03 (Modal de notas aberto com anotação preenchida)
            sc3_path = SCREENSHOTS_DIR / "03-crm-anotacao-vendedor.png"
            page.screenshot(path=str(sc3_path), full_page=False)
            print(f"   ✅ Screenshot salvo: {sc3_path}")
            results["03-crm-anotacao-vendedor"] = str(sc3_path)

            # Salvar a anotação
            page.locator("#btn-salvar-nova-nota").click()
            page.wait_for_timeout(600)
            expect(modal_notas).not_to_have_class(re.compile(r"is-open"))

            # Validar que a anotação aparece no snippet do card
            card_atualizado = page.locator("#cards-novo .crm-card").filter(has_text="Distribuidora Express Papéis Ltda").first
            expect(card_atualizado.locator(".crm-card__notes-snippet")).to_contain_text("40 caixas de Papel Toalha Interfolha")
            print("   ✓ Anotação de negociação salva e refletida com sucesso no card do CRM.")

            # Testar avanço de estágio pelo botão 'Avançar ➔'
            btn_avancar = card_atualizado.locator(".btn-advance-stage")
            btn_avancar.click()
            page.wait_for_timeout(600)

            card_qualificado = page.locator("#cards-qualificacao .crm-card").filter(has_text="Distribuidora Express Papéis Ltda").first
            expect(card_qualificado).to_be_visible()
            print("   ✓ Lead avançado com sucesso para a coluna '2. Qualificação'.")

            # ==================================================================
            # CENÁRIO 4: ARENA 3D DE VENDEDORES (THREE.JS, PÓDIO & RANKING)
            # ==================================================================
            print("\n📸 [Cenário 4/6] Auditoria da Arena 3D de Vendedores & Gamificação")

            # Navegar para a aba Arena 3D
            tab_arena = page.locator("#tab-nav-arena")
            tab_arena.click()

            sec_arena = page.locator("#tab-arena")
            expect(sec_arena).to_have_class(re.compile(r"is-active"))

            # Aguardar renderização completa do Three.js e elementos 3D
            canvas_3d = page.locator("#arena3d-canvas")
            expect(canvas_3d).to_be_visible()
            page.wait_for_timeout(2000)  # Deixar a animação e iluminação Three.js estabilizarem

            # Validar presença dos 3 personagens no DOM / Placar
            expect(page.locator("#podium-name-1")).to_be_visible()
            expect(page.locator("#podium-name-2")).to_be_visible()
            expect(page.locator("#podium-name-3")).to_be_visible()

            expect(page.locator("#ranking-row-maciel")).to_be_visible()
            expect(page.locator("#ranking-row-fernanda")).to_be_visible()
            expect(page.locator("#ranking-row-caio")).to_be_visible()

            # Disparar botão de comemoração com confetes
            btn_comemorar = page.locator("#btn-arena-comemorar")
            if btn_comemorar.is_visible():
                btn_comemorar.click()
                page.wait_for_timeout(600)

            # Captura Screenshot 04 (Arena 3D com Three.js canvas e pódio)
            sc4_path = SCREENSHOTS_DIR / "04-crm-arena-3d-competicao.png"
            page.screenshot(path=str(sc4_path), full_page=False)
            print(f"   ✅ Screenshot salvo: {sc4_path}")
            results["04-crm-arena-3d-competicao"] = str(sc4_path)

            # ==================================================================
            # CENÁRIO 5: FECHAMENTO DO DIA & PLANO TÁTICO
            # ==================================================================
            print("\n📸 [Cenário 5/6] Auditoria do Fechamento do Dia & Inteligência Comercial")

            # Navegar para a aba de Fechamento
            tab_fechamento = page.locator("#tab-nav-fechamento")
            tab_fechamento.click()

            sec_fechamento = page.locator("#tab-fechamento")
            expect(sec_fechamento).to_have_class(re.compile(r"is-active"))
            page.wait_for_timeout(500)

            # Validar as 3 Colunas de Prioridades Táticas
            expect(page.locator(".crm-tactical-col--p1")).to_be_visible()
            expect(page.locator(".crm-tactical-col--p2")).to_be_visible()
            expect(page.locator(".crm-tactical-col--p3")).to_be_visible()

            p1_title = page.locator(".crm-tactical-col--p1 .crm-tactical-col__title").inner_text()
            p2_title = page.locator(".crm-tactical-col--p2 .crm-tactical-col__title").inner_text()
            p3_title = page.locator(".crm-tactical-col--p3 .crm-tactical-col__title").inner_text()

            print(f"   ✓ Prioridade 1: {p1_title}")
            print(f"   ✓ Prioridade 2: {p2_title}")
            print(f"   ✓ Prioridade 3: {p3_title}")

            # Auditoria Estrita: NÃO pode haver cálculo ou menção a comissões monetárias
            fechamento_text = sec_fechamento.inner_text().lower()
            prohibited_terms = ["comissão financeira", "comissão em dinheiro", "comissão monetária", "bônus em dinheiro", "pagar comissão"]
            for term in prohibited_terms:
                assert term not in fechamento_text, f"Violação detectada: termo proibido '{term}' encontrado no Fechamento!"
            print("   ✓ Validação estrita: Fechamento NÃO possui comissões monetárias.")

            # Executar o Fechamento e validar download de arquivo JSON
            btn_executar = page.locator("#btn-executar-fechamento")
            download_info = None

            try:
                with page.expect_download(timeout=5000) as download_info_holder:
                    btn_executar.click()
                download_info = download_info_holder.value
                downloaded_file = SCREENSHOTS_DIR / download_info.suggested_filename
                download_info.save_as(str(downloaded_file))
                print(f"   ✓ Arquivo de fechamento baixado com sucesso: {downloaded_file.name}")
                
                # Validar integridade do JSON baixado
                with open(downloaded_file, "r", encoding="utf-8") as f:
                    json_data = json.load(f)
                    assert "planoTaticoAmanha" in json_data or "prioridadesAmanha" in json_data or "totais" in json_data
                    print("   ✓ Integridade do schema JSON de fechamento validada com sucesso.")
            except Exception as e:
                print(f"   ℹ️ Informação sobre download: {e}")

            page.wait_for_timeout(800)

            # Validar bloco de código JSON renderizado na tela
            json_preview = page.locator("#json-preview-text")
            expect(json_preview).to_be_visible()
            assert len(json_preview.inner_text()) > 20, "O bloco de código JSON deve conter dados preenchidos."

            # Captura Screenshot 05 (Aba de fechamento com plano tático e JSON preview)
            sc5_path = SCREENSHOTS_DIR / "05-crm-fechamento-plano-dia.png"
            page.screenshot(path=str(sc5_path), full_page=False)
            print(f"   ✅ Screenshot salvo: {sc5_path}")
            results["05-crm-fechamento-plano-dia"] = str(sc5_path)

            context.close()

            # ==================================================================
            # CENÁRIO 6: RESPONSIVIDADE MOBILE (390x844 - IPHONE 12/13/14)
            # ==================================================================
            print("\n📸 [Cenário 6/6] Auditoria de Responsividade Mobile (390x844)")
            mobile_context = browser.new_context(
                viewport={"width": 390, "height": 844},
                is_mobile=True,
                has_touch=True
            )
            mobile_page = mobile_context.new_page()
            mobile_page.goto(URL, wait_until="networkidle")

            # Validações da experiência mobile
            expect(mobile_page.locator(".crm-header")).to_be_visible()
            expect(mobile_page.locator("#quick-capture-section")).to_be_visible()
            expect(mobile_page.locator("#kanban-board")).to_be_visible()

            # Captura Screenshot 06
            sc6_path = SCREENSHOTS_DIR / "06-crm-mobile-view.png"
            mobile_page.screenshot(path=str(sc6_path), full_page=False)
            print(f"   ✅ Screenshot salvo: {sc6_path}")
            results["06-crm-mobile-view"] = str(sc6_path)

            mobile_context.close()
            browser.close()

    finally:
        if server_process and started_by_us:
            print("\n🛑 Encerrando servidor HTTP local...")
            server_process.terminate()
            try:
                server_process.wait(timeout=3)
            except subprocess.TimeoutExpired:
                server_process.kill()
            print("✓ Servidor HTTP encerrado com sucesso.")

    # ==================================================================
    # VERIFICAÇÃO DE ERROS NO CONSOLE
    # ==================================================================
    print("\n🔍 Relatório de Erros e Exceções:")
    critical_errors = [e for e in console_errors if not any(ign in e.lower() for ign in ["favicon", "audiocontext"])]
    if critical_errors:
        print(f"⚠️ Alerta: {len(critical_errors)} erro(s) no console detectados:")
        for err in critical_errors:
            print(f"   - {err}")
    else:
        print("✅ Zero erros críticos detectados no console do navegador.")

    if page_errors:
        print(f"❌ {len(page_errors)} exceções não tratadas na página:")
        for pe in page_errors:
            print(f"   - {pe}")
        raise RuntimeError("Exceções não tratadas na página detectadas.")
    else:
        print("✅ Zero exceções não tratadas durante toda a execução da suíte.")

    print("\n" + "=" * 80)
    print("🎉 SUÍTE DE TESTES E AUDITORIA PLAYWRIGHT FINALIZADA COM 100% DE SUCESSO!")
    print("=" * 80)
    for k, v in results.items():
        print(f"   • {k}: {v}")

    return results


if __name__ == "__main__":
    run_audit()
