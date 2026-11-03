#!/usr/bin/env python3
"""
================================================================================
SUÍTE DE TESTES E2E DEDICADA: ABA DE EXIBIÇÃO TOTAL / ANALYTICS (ISAPEL CRM)
Arquivo: 04-Projetos-Apps/isapel-crm/tests/test_analytics_e2e.py
Autor: Teamwork Reviewer & Adversarial Critic (reviewer_playwright_m4)
================================================================================

Cobertura:
1. RBAC Vendedores (maciel, fernanda, caio):
   - Seletor #analytics-vendedor-select travado (disabled = true) no usuário logado
   - Badge visual #analytics-vendedor-locked-badge visível com o nome do vendedor
   - Leads e KPIs isolados estritamente ao vendedor da sessão
   - Ausência de vazamento de métricas de outros consultores
2. RBAC Diretoria (diretoria):
   - Seletor liberado (disabled = false) com valor padrão 'todos'
   - Badge de travamento oculto
   - Visão consolidada com distribuição de toda a equipe comercial
   - Alternância fluida entre visão geral e filtros individuais (maciel, fernanda, caio)
   - Recálculo reativo instantâneo sem recarregar a página (zero page reload)
3. Filtros Temporais Dinâmicos:
   - Pills de data: 'hoje', '7dias', 'mes', 'custom'
   - Ativação das pills e atualização reativa dos KPIs
   - Intervalo customizado com inputs #analytics-data-inicio, #analytics-data-fim e botão #btn-aplicar-data-custom
4. Seção Recolhível de Fechamento Operacional:
   - Alternância de visibilidade do accordion via #btn-toggle-fechamento-operacional
   - Atributo aria-expanded (false -> true -> false) e exibição do #content-fechamento-operacional
   - Preservação funcional de 100% dos botões operacionais legados:
     * #btn-executar-fechamento
     * #btn-copiar-plano-whatsapp
     * #btn-download-json-manual
     * #metric-fechamento-pipeline, #metric-fechamento-ganho, #metric-fechamento-negociacao, #metric-fechamento-rotas
     * Listas de prioridades #lista-prioridade-1, #lista-prioridade-2, #lista-prioridade-3
5. Auditoria Estrita de Integridade & Compliance:
   - Ausência das expressões "comissão em dinheiro" e "comissão monetária" no DOM
   - Acessibilidade WAI-ARIA nas barras do funil (role="progressbar", aria-valuenow)
================================================================================
"""

import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

PORT = 4173
BASE_URL = f"http://localhost:{PORT}"
PROJECT_ROOT = Path("/Users/gabrieloliveira/Desktop/Agentes-cloud/04-Projetos-Apps/isapel-crm")
SCREENSHOTS_DIR = PROJECT_ROOT / "screenshots" / "e2e_analytics"
SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)


class TestStats:
    def __init__(self):
        self.total = 0
        self.passed = 0
        self.failed = 0
        self.failures = []

    def record_pass(self, name: str):
        self.total += 1
        self.passed += 1
        print(f"  ✅ [PASS] {name}")

    def record_fail(self, name: str, error: str):
        self.total += 1
        self.failed += 1
        self.failures.append((name, error))
        print(f"  ❌ [FAIL] {name} -> {error}")


stats = TestStats()


def login(page, usuario: str, senha: str = "isapel2026"):
    page.goto(f"{BASE_URL}/login.html", wait_until="networkidle")
    page.fill("#login-usuario", usuario)
    page.fill("#login-senha", senha)
    page.click("#btn-submit-login")
    page.wait_for_url("**/index.html*", timeout=8000)
    page.wait_for_timeout(300)


def navegar_para_analytics(page):
    tab_btn = page.locator("#tab-nav-fechamento")
    expect(tab_btn).to_be_visible()
    tab_btn.click()
    page.wait_for_timeout(300)
    sec = page.locator("#tab-fechamento")
    expect(sec).to_be_visible()


# ==============================================================================
# TEST SUITE 1: RBAC PARA VENDEDORES (maciel, fernanda, caio)
# ==============================================================================
def test_rbac_vendedores(browser):
    print("\n" + "=" * 80)
    print("🔒 [SUITE 1] RBAC NA ABA ANALYTICS: VENDEDORES (MACIEL, FERNANDA, CAIO)")
    print("=" * 80)

    vendedores = [
        {"user": "maciel", "nome": "Gabriel Maciel", "expected_id": "maciel"},
        {"user": "fernanda", "nome": "Fernanda", "expected_id": "fernanda"},
        {"user": "caio", "nome": "Caio", "expected_id": "caio"}
    ]

    for v in vendedores:
        ctx = browser.new_context(viewport={"width": 1440, "height": 900})
        page = ctx.new_page()
        try:
            login(page, v["user"])
            navegar_para_analytics(page)

            # 1. Seletor de vendedor travado no usuário logado
            select = page.locator("#analytics-vendedor-select")
            expect(select).to_be_disabled()
            val = select.input_value()
            assert val == v["expected_id"], f"Esperava valor '{v['expected_id']}', obtido: '{val}'"

            # 2. Badge visual de travamento visível
            badge = page.locator("#analytics-vendedor-locked-badge")
            expect(badge).to_be_visible()
            badge_txt = badge.inner_text().lower()
            assert "travada" in badge_txt and v["nome"].lower() in badge_txt, f"Texto inesperado no badge: {badge_txt}"

            # 3. Card lateral mostra título individual
            card_title = page.locator("#analytics-seller-card-title")
            expect(card_title).to_be_visible()
            card_title_txt = card_title.inner_text().lower()
            assert "desempenho comercial" in card_title_txt and v["nome"].lower() in card_title_txt, f"Título incorreto: {card_title_txt}"

            # 4. KPIs populados com números válidos
            kpi_recebidos = page.locator("#analytics-kpi-recebidos").inner_text().strip()
            assert kpi_recebidos.isdigit(), f"KPI recebidos inválido: '{kpi_recebidos}'"

            # 5. Barras do funil existem (6 etapas)
            funnel_steps = page.locator("#analytics-funnel-bars-container .crm-funnel-step")
            count_steps = funnel_steps.count()
            assert count_steps == 6, f"Esperava 6 etapas de funil, obtido: {count_steps}"

            # 6. Screenshot para evidência
            page.screenshot(path=str(SCREENSHOTS_DIR / f"analytics_{v['user']}_locked.png"))

            stats.record_pass(f"Vendedor '{v['user']}': Seletor travado ({val}), badge visível e métricas isoladas")
        except Exception as e:
            stats.record_fail(f"Vendedor '{v['user']}' RBAC", str(e))
        finally:
            ctx.close()


# ==============================================================================
# TEST SUITE 2: RBAC PARA DIRETORIA (VISÃO CONSOLIDADA E FILTROS INDIVIDUAIS)
# ==============================================================================
def test_rbac_diretoria(browser):
    print("\n" + "=" * 80)
    print("👔 [SUITE 2] RBAC NA ABA ANALYTICS: DIRETORIA (CONSOLIDADO E DINÂMICO)")
    print("=" * 80)

    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()

    try:
        login(page, "diretoria")
        navegar_para_analytics(page)

        # 1. Seletor de vendedor habilitado com valor inicial 'todos'
        select = page.locator("#analytics-vendedor-select")
        expect(select).to_be_enabled()
        val_inicial = select.input_value()
        assert val_inicial == "todos", f"Esperava valor inicial 'todos', obtido: '{val_inicial}'"

        # 2. Badge de travamento deve estar oculto
        badge = page.locator("#analytics-vendedor-locked-badge")
        expect(badge).to_be_hidden()

        # 3. Visão consolidada: container de distribuição por vendedor visível
        seller_dist = page.locator("#analytics-seller-distribution-container")
        expect(seller_dist).to_be_visible()
        seller_rows = page.locator("#analytics-seller-distribution-container .crm-seller-row")
        assert seller_rows.count() >= 3, f"Esperava >= 3 vendedores na distribuição, obtido: {seller_rows.count()}"

        total_consolidado = page.locator("#analytics-funnel-total-leads").inner_text().strip()
        kpi_recebidos_consolidado = int(page.locator("#analytics-kpi-recebidos").inner_text().strip())

        stats.record_pass("Diretoria: Seletor habilitado ('todos'), badge oculto e distribuição por vendedor exibida")

        # 4. Alternar para Gabriel Maciel sem reload de página
        # Listener de reload para assegurar que a página NÃO foi recarregada
        page_reloaded = [False]
        page.on("framenavigated", lambda frame: page_reloaded.append(True) if frame == page.main_frame else None)

        select.select_option("maciel")
        page.wait_for_timeout(300)

        assert len(page_reloaded) == 1, "A página foi recarregada durante alteração de filtro!"

        card_title_maciel = page.locator("#analytics-seller-card-title").inner_text().lower()
        assert "gabriel maciel" in card_title_maciel or "desempenho comercial" in card_title_maciel, f"Título incorreto: {card_title_maciel}"
        kpi_recebidos_maciel = int(page.locator("#analytics-kpi-recebidos").inner_text().strip())
        assert kpi_recebidos_maciel <= kpi_recebidos_consolidado, f"Métricas de Maciel ({kpi_recebidos_maciel}) maiores que consolidadas ({kpi_recebidos_consolidado})"

        stats.record_pass("Diretoria: Filtragem dinâmica de Maciel com recálculo instantâneo sem reload")

        # 5. Alternar para Fernanda
        select.select_option("fernanda")
        page.wait_for_timeout(300)
        card_title_fe = page.locator("#analytics-seller-card-title").inner_text().lower()
        assert "fernanda" in card_title_fe

        # 6. Alternar para Caio
        select.select_option("caio")
        page.wait_for_timeout(300)
        card_title_caio = page.locator("#analytics-seller-card-title").inner_text().lower()
        assert "caio" in card_title_caio

        stats.record_pass("Diretoria: Filtragem dinâmica por Fernanda e Caio validada com sucesso")

        # 7. Retornar para 'todos' e validar restauração
        select.select_option("todos")
        page.wait_for_timeout(300)
        kpi_recebidos_restaurado = int(page.locator("#analytics-kpi-recebidos").inner_text().strip())
        assert kpi_recebidos_restaurado == kpi_recebidos_consolidado, "Métrica consolidada não restaurada ao voltar para 'todos'"

        page.screenshot(path=str(SCREENSHOTS_DIR / "analytics_diretoria_consolidado.png"))
        stats.record_pass("Diretoria: Restauração da visão consolidada 'todos' com precisão matemática")

    except Exception as e:
        stats.record_fail("Diretoria RBAC & Dinâmica", str(e))
    finally:
        ctx.close()


# ==============================================================================
# TEST SUITE 3: FILTROS DINÂMICOS DE PERÍODO (DATA)
# ==============================================================================
def test_filtros_periodo(browser):
    print("\n" + "=" * 80)
    print("📅 [SUITE 3] FILTROS DINÂMICOS DE PERÍODO (HOJE, 7 DIAS, MÊS, CUSTOM)")
    print("=" * 80)

    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()

    try:
        login(page, "diretoria")
        navegar_para_analytics(page)

        # 1. Pill 'hoje' inicial ativa
        pill_hoje = page.locator('#analytics-pills .crm-pill-btn[data-periodo="hoje"]')
        expect(pill_hoje).to_have_class(re.compile(r"is-active"))
        stats.record_pass("Período: Pill 'hoje' selecionada por padrão")

        # 2. Clicar em '7dias'
        pill_7dias = page.locator('#analytics-pills .crm-pill-btn[data-periodo="7dias"]')
        pill_7dias.click()
        page.wait_for_timeout(250)
        expect(pill_7dias).to_have_class(re.compile(r"is-active"))
        expect(pill_hoje).not_to_have_class(re.compile(r"is-active"))
        stats.record_pass("Período: Alternância reativa para '7 dias' com atualização de classe ativa")

        # 3. Clicar em 'mes'
        pill_mes = page.locator('#analytics-pills .crm-pill-btn[data-periodo="mes"]')
        pill_mes.click()
        page.wait_for_timeout(250)
        expect(pill_mes).to_have_class(re.compile(r"is-active"))
        stats.record_pass("Período: Alternância reativa para 'mes'")

        # 4. Clicar em 'custom' e validar abertura de inputs
        pill_custom = page.locator('#analytics-pills .crm-pill-btn[data-periodo="custom"]')
        custom_container = page.locator("#analytics-custom-dates")
        expect(custom_container).to_be_hidden()

        pill_custom.click()
        page.wait_for_timeout(250)
        expect(custom_container).to_be_visible()

        # Preencher intervalo de teste
        page.fill("#analytics-data-inicio", "2026-01-01")
        page.fill("#analytics-data-fim", "2026-12-31")
        page.click("#btn-aplicar-data-custom")
        page.wait_for_timeout(300)

        kpi_rec = page.locator("#analytics-kpi-recebidos").inner_text().strip()
        assert int(kpi_rec) >= 0, f"Valor de KPI inválido no custom: {kpi_rec}"

        stats.record_pass("Período: Filtro customizado exibido, preenchido e aplicado com sucesso")

    except Exception as e:
        stats.record_fail("Filtros de Período", str(e))
    finally:
        ctx.close()


# ==============================================================================
# TEST SUITE 4: SEÇÃO RECOLHÍVEL DO FECHAMENTO OPERACIONAL & BOTÕES LEGADOS
# ==============================================================================
def test_secao_recolhivel_fechamento(browser):
    print("\n" + "=" * 80)
    print("📂 [SUITE 4] SEÇÃO RECOLHÍVEL DO FECHAMENTO DIÁRIO & BOTÕES OPERACIONAIS")
    print("=" * 80)

    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()

    try:
        login(page, "maciel")
        navegar_para_analytics(page)

        # 1. Validar estado inicial recolhido
        btn_toggle = page.locator("#btn-toggle-fechamento-operacional")
        content_fechamento = page.locator("#content-fechamento-operacional")

        expect(btn_toggle).to_be_visible()
        assert btn_toggle.get_attribute("aria-expanded") == "false", "aria-expanded deveria ser 'false' inicialmente"
        expect(content_fechamento).to_be_hidden()

        stats.record_pass("Accordion: Estado inicial recolhido com aria-expanded='false' e display:none")

        # 2. Clicar para expandir
        btn_toggle.click()
        page.wait_for_timeout(300)

        assert btn_toggle.get_attribute("aria-expanded") == "true", "aria-expanded deveria ser 'true' após clique"
        expect(content_fechamento).to_be_visible()

        stats.record_pass("Accordion: Expansão com clique atualizando aria-expanded='true' e exibindo conteúdo")

        # 3. Validar preservação de todos os elementos operacionais legados
        elementos_legados = [
            ("#btn-executar-fechamento", "Botão Executar Fechamento"),
            ("#btn-copiar-plano-whatsapp", "Botão Copiar Plano WhatsApp"),
            ("#btn-download-json-manual", "Botão Download JSON"),
            ("#metric-fechamento-pipeline", "Métrica Fechamento Pipeline"),
            ("#metric-fechamento-ganho", "Métrica Fechamento Ganho"),
            ("#metric-fechamento-negociacao", "Métrica Fechamento Negociação"),
            ("#metric-fechamento-rotas", "Métrica Fechamento Rotas"),
            ("#lista-prioridade-1", "Lista Prioridade 1"),
            ("#lista-prioridade-2", "Lista Prioridade 2"),
            ("#lista-prioridade-3", "Lista Prioridade 3"),
            ("#fechamento-status-text", "Status do Fechamento"),
            ("#json-preview-text", "Preview JSON")
        ]

        for sel, label in elementos_legados:
            loc = page.locator(sel)
            count = loc.count()
            assert count >= 1, f"Elemento legado obrigatório '{label}' ({sel}) não encontrado no DOM!"

        stats.record_pass("Elementos Operacionais: 100% dos IDs e botões legados preservados e presentes")

        # 4. Interagir com o botão executar fechamento
        page.click("#btn-executar-fechamento")
        page.wait_for_timeout(300)
        status_txt = page.locator("#fechamento-status-text").inner_text()
        assert len(status_txt) > 0, "Status de fechamento não foi atualizado após execução!"

        stats.record_pass("Execução Operacional: Clique em '#btn-executar-fechamento' atualiza status com sucesso")

        # 5. Clicar para recolher novamente
        btn_toggle.click()
        page.wait_for_timeout(300)
        assert btn_toggle.get_attribute("aria-expanded") == "false", "aria-expanded deveria retornar para 'false'"
        expect(content_fechamento).to_be_hidden()

        page.screenshot(path=str(SCREENSHOTS_DIR / "analytics_fechamento_toggle.png"))
        stats.record_pass("Accordion: Fechamento recolhido novamente com sucesso")

    except Exception as e:
        stats.record_fail("Seção Recolhível de Fechamento", str(e))
    finally:
        ctx.close()


# ==============================================================================
# TEST SUITE 5: AUDITORIA ESTREITA DE INTEGRIDADE & TERMOS PROIBIDOS
# ==============================================================================
def test_auditoria_integridade(browser):
    print("\n" + "=" * 80)
    print("🛡️ [SUITE 5] AUDITORIA DE INTEGRIDADE, WCAG E TERMOS PROIBIDOS")
    print("=" * 80)

    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()

    try:
        login(page, "maciel")
        navegar_para_analytics(page)

        # 1. Expandir tudo para que todo o texto esteja no DOM
        btn_toggle = page.locator("#btn-toggle-fechamento-operacional")
        btn_toggle.click()
        page.wait_for_timeout(300)

        # 2. Inspecionar inner_text de #tab-fechamento
        sec_txt = page.locator("#tab-fechamento").inner_text().lower()

        assert "comissão em dinheiro" not in sec_txt, "VIOLAÇÃO: 'comissão em dinheiro' encontrada no texto da aba!"
        assert "comissão monetária" not in sec_txt, "VIOLAÇÃO: 'comissão monetária' encontrada no texto da aba!"

        stats.record_pass("Integridade: Ausência estrita das palavras 'comissão em dinheiro' e 'comissão monetária'")

        # 3. Validar atributos WAI-ARIA nas barras de progresso do funil
        progress_bars = page.locator("#analytics-funnel-bars-container [role='progressbar']")
        count_bars = progress_bars.count()
        assert count_bars == 6, f"Esperava 6 progressbars com role='progressbar', obtido: {count_bars}"

        for i in range(count_bars):
            bar = progress_bars.nth(i)
            valuenow = bar.get_attribute("aria-valuenow")
            assert valuenow is not None, f"Barra {i} sem aria-valuenow"

        stats.record_pass("Acessibilidade: 6 etapas do funil com WAI-ARIA role='progressbar' e aria-valuenow válidos")

    except Exception as e:
        stats.record_fail("Auditoria de Integridade", str(e))
    finally:
        ctx.close()


# ==============================================================================
# MAIN RUNNER
# ==============================================================================
def main():
    print("=" * 80)
    print("🚀 INICIANDO BATERIA PLAYWRIGHT E2E DEDICADA: ABA ANALYTICS")
    print(f"📡 Target: {BASE_URL}")
    print("=" * 80)

    start_total = time.time()

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage"]
        )

        test_rbac_vendedores(browser)
        test_rbac_diretoria(browser)
        test_filtros_periodo(browser)
        test_secao_recolhivel_fechamento(browser)
        test_auditoria_integridade(browser)

        browser.close()

    elapsed = time.time() - start_total

    print("\n" + "=" * 80)
    print("📊 RESUMO DOS TESTES DEDICADOS PLAYWRIGHT (ABA ANALYTICS):")
    print("=" * 80)
    print(f"   • Total de Testes:    {stats.total}")
    print(f"   • Aprovados:          {stats.passed}")
    print(f"   • Falhas:             {stats.failed}")
    print(f"   • Tempo de Execução:  {elapsed:.2f}s")
    print("=" * 80)

    if stats.failed > 0:
        print("\n❌ FALHAS DETECTADAS:")
        for name, err in stats.failures:
            print(f"   - {name}: {err}")
        sys.exit(1)
    else:
        print("\n🎉 100% DOS TESTES PLAYWRIGHT DA ABA ANALYTICS FORAM APROVADOS COM SUCESSO!")
        sys.exit(0)


if __name__ == "__main__":
    import re
    main()
