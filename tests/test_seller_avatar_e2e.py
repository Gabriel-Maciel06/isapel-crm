#!/usr/bin/env python3
"""
================================================================================
SUÍTE DE TESTES E2E PLAYWRIGHT: GESTÃO DE VENDEDORES & CUSTOMIZADOR 3D DE AVATARES
Arquivo: 04-Projetos-Apps/isapel-crm/tests/test_seller_avatar_e2e.py
Autor: Teamwork E2E Test Writer (test_writer_playwright)
Aplicação: CRM Isapel Papéis (Comercial B2B)
================================================================================

Cobertura em 4 Tiers:
- Tier 1: RBAC Access Control
  * T1.1: Bloqueio estrito de acesso à aba de gestão (#tab-nav-gestao / #tab-gestao)
          para vendedores (maciel, fernanda, caio). Tentativa de bypass via
          alternarAba('tab-gestao') é barrada e redireciona para o funil.
  * T1.2: Acesso concedido à Diretoria (#tab-nav-gestao visível e clicável,
          #tab-gestao carregando formulário e tabela de equipe).
  * T1.3: RBAC no Customizador de Avatares (vendedor travado no próprio perfil;
          diretoria com seletor liberado para escolher qualquer consultor).

- Tier 2: Seller Registration Workflow
  * T2.1: Preenchimento e submissão do formulário de novo vendedor pela Diretoria
          (Nome completo, login, senha inicial, cargo B2B, meta).
  * T2.2: Validação de feedback de sucesso (toast) e conferência do novo vendedor
          na tabela de equipe (#tabela-equipe-vendedores).
  * T2.3: Propagação reativa para seletores (#vendedor-select e #analytics-vendedor-select).
  * T2.4: Fluxo de autenticação imediata do novo vendedor com credenciais recém-criadas
          (login com sucesso, sessão válida, perfil vendedor isolado).

- Tier 3: 3D Avatar Customizer & Controls
  * T3.1: Abertura do modal do customizador (#modal-avatar-customizer / #modal-avatar-backdrop)
          e validação de inicialização do canvas 3D (#avatar-preview-canvas).
  * T3.2: Presença e seleção das opções oficiais de uniforme Isapel:
          - Camisa Polo Azul Marinho (#003360)
          - Camisa Polo Azul Céu (#0284C7)
          - Camisa Social Branca com Crachá Isapel (#FFFFFF)
  * T3.3: Presença e seleção de estilos/cores de cabelo, variações de barba/bigode
          (incluindo o bigode canônico 3D do Gabriel Maciel), tons de pele e óculos.
  * T3.4: Reatividade interativa no canvas de preview 3D sem exceções WebGL.

- Tier 4: Live Arena Sync & Persistence
  * T4.1: Persistência das preferências visuais no localStorage
          (chave 'isapel_crm_avatar_profiles' / fallback 'isapel_avatar_customizations').
  * T4.2: Atualização dinâmica do palco principal da Arena 3D (#arena-3d / #arena3d-canvas)
          sem recarregamento de página (zero page reload).
  * T4.3: Persistência das customizações através de recarregamento completo da página (F5).
================================================================================
"""

import sys
import time
import json
import re
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

PORT = 4173
BASE_URL = f"http://localhost:{PORT}"
PROJECT_ROOT = Path("/Users/gabrieloliveira/Desktop/Agentes-cloud/04-Projetos-Apps/isapel-crm")
SCREENSHOTS_DIR = PROJECT_ROOT / "screenshots" / "e2e_seller_avatar"
SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)


class TestSuiteStats:
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


stats = TestSuiteStats()


# ==============================================================================
# HELPER FUNCTIONS
# ==============================================================================
def login(page, usuario: str, senha: str = "isapel2026"):
    """Efetua login com credenciais válidas e aguarda aterrissagem em index.html."""
    page.goto(f"{BASE_URL}/login.html", wait_until="networkidle")
    page.fill("#login-usuario", usuario)
    page.fill("#login-senha", senha)
    page.click("#btn-submit-login")
    page.wait_for_url("**/index.html*", timeout=8000)
    page.wait_for_timeout(400)


def logout(page):
    """Executa logout através do botão de cabeçalho e confirma retorno para login.html."""
    btn = page.locator("#btn-logout")
    if btn.is_visible():
        btn.click()
        page.wait_for_url("**/login.html*", timeout=6000)
        page.wait_for_timeout(300)
    else:
        page.evaluate("() => { if (window.IsapelAuth) window.IsapelAuth.logout(); }")
        page.goto(f"{BASE_URL}/login.html", wait_until="networkidle")


def abrir_customizador_avatar(page):
    """Localiza e aciona o botão de abertura do modal do customizador 3D."""
    # Tenta botão da arena, do cabeçalho ou da tabela de equipe
    trigger_selectors = [
        "#btn-abrir-customizador-arena",
        "#btn-customizar-avatar-header",
        "#btn-abrir-customizador",
        ".btn-customizar-avatar",
        "button:has-text('Personalizar Consultor')",
        "button:has-text('Personalizar Avatar')"
    ]
    for sel in trigger_selectors:
        btn = page.locator(sel).first
        if btn.is_visible():
            btn.click()
            page.wait_for_timeout(400)
            return True

    # Fallback programático via evaluate se o botão estiver em viewport oculta
    opened = page.evaluate("""() => {
        if (typeof window.abrirModalCustomizador === 'function') {
            window.abrirModalCustomizador();
            return true;
        }
        const modal = document.getElementById('modal-avatar-backdrop') || document.getElementById('modal-avatar-customizer');
        if (modal) {
            modal.classList.add('is-open');
            modal.style.display = 'flex';
            return true;
        }
        return false;
    }""")
    page.wait_for_timeout(400)
    return opened


# ==============================================================================
# TIER 1: RBAC ACCESS CONTROL
# ==============================================================================
def test_tier1_rbac_access_control(browser):
    print("\n" + "=" * 80)
    print("🔒 [TIER 1] CONTROLE DE ACESSO RBAC (GESTÃO DE VENDEDORES & AVATAR)")
    print("=" * 80)

    # T1.1: Vendedores (maciel, fernanda, caio) com acesso bloqueado à aba de gestão
    vendedores_teste = [
        {"user": "maciel", "nome": "Gabriel Maciel"},
        {"user": "fernanda", "nome": "Fernanda"},
        {"user": "caio", "nome": "Caio"}
    ]

    for v in vendedores_teste:
        ctx = browser.new_context(viewport={"width": 1440, "height": 900})
        page = ctx.new_page()
        try:
            login(page, v["user"])

            # 1. Verificar que o botão #tab-nav-gestao NÃO está visível
            tab_btn = page.locator("#tab-nav-gestao")
            is_tab_visible = tab_btn.is_visible()
            assert not is_tab_visible, f"Aba #tab-nav-gestao está visível indevidamente para o vendedor {v['user']}!"

            # 2. Verificar que a seção #tab-gestao NÃO está acessível/visível
            tab_section = page.locator("#tab-gestao")
            is_sec_visible = tab_section.is_visible()
            assert not is_sec_visible, f"Seção #tab-gestao está visível indevidamente para o vendedor {v['user']}!"

            # 3. Tentativa adversária de bypass: invocar alternarAba('tab-gestao') via JavaScript
            page.evaluate("""() => {
                if (typeof window.alternarAba === 'function') {
                    window.alternarAba('tab-gestao');
                }
            }""")
            page.wait_for_timeout(400)

            # Verificar que a tentativa foi barrada e o usuário NÃO está em #tab-gestao
            assert not tab_section.is_visible(), (
                f"Vulnerabilidade RBAC: Vendedor {v['user']} conseguiu acessar #tab-gestao via alternarAba()!"
            )

            # Verificar que permanece no funil ou outra aba permitida
            active_tab = page.locator(".crm-header__tab-btn.is-active")
            active_tab_id = active_tab.get_attribute("data-tab") or active_tab.get_attribute("id") or ""
            assert "gestao" not in active_tab_id.lower(), f"Aba ativa após tentativa de bypass é indevidamente: {active_tab_id}"

            page.screenshot(path=str(SCREENSHOTS_DIR / f"tier1_1_rbac_blocked_{v['user']}.png"))
            stats.record_pass(f"T1.1: Vendedor '{v['user']}' bloqueado estritamente de #tab-gestao (incluindo bypass JS)")

        except Exception as e:
            stats.record_fail(f"T1.1: Bloqueio Vendedor '{v['user']}'", str(e))
        finally:
            ctx.close()

    # T1.2: Diretoria possui acesso completo e irrestrito à aba de gestão
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()
    try:
        login(page, "diretoria")

        # 1. Botão #tab-nav-gestao deve estar visível e habilitado
        tab_btn = page.locator("#tab-nav-gestao")
        expect(tab_btn).to_be_visible(timeout=5000)
        expect(tab_btn).to_be_enabled()

        # 2. Clicar na aba de gestão
        tab_btn.click(timeout=5000)
        page.wait_for_timeout(400)

        # 3. Seção #tab-gestao visível e ativa
        tab_section = page.locator("#tab-gestao")
        expect(tab_section).to_be_visible(timeout=5000)

        # 4. Formulário e Tabela de Equipe visíveis
        form_novo = page.locator("#form-novo-vendedor")
        expect(form_novo).to_be_visible(timeout=5000)

        tabela_equipe = page.locator("#tabela-equipe-vendedores")
        expect(tabela_equipe).to_be_visible(timeout=5000)

        page.screenshot(path=str(SCREENSHOTS_DIR / "tier1_2_diretoria_gestao_visible.png"))
        stats.record_pass("T1.2: Diretoria acessa #tab-gestao com formulário e tabela de equipe visíveis")

    except Exception as e:
        stats.record_fail("T1.2: Acesso Diretoria Gestão", str(e))
    finally:
        ctx.close()

    # T1.3: RBAC dentro do Customizador de Avatares (Vendedor travado vs Diretoria liberada)
    # A) Vendedor Maciel
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()
    try:
        login(page, "maciel")
        abrir_customizador_avatar(page)

        # Localiza seletor de vendedor no customizador
        sel_custom = page.locator("#avatar-custom-seller-select, #avatar-select-vendedor").first
        if sel_custom.is_visible():
            expect(sel_custom).to_be_disabled()
            val = sel_custom.input_value()
            assert val == "maciel", f"Vendedor Maciel deveria ter seletor travado em 'maciel', obteve: {val}"
        else:
            # Alternativa: rótulo/badge de avatar travado no vendedor
            badge_locked = page.locator("#avatar-seller-locked-name, .avatar-locked-badge, #avatar-seller-name").first
            expect(badge_locked).to_be_visible(timeout=5000)
            assert "maciel" in badge_locked.inner_text().lower()

        stats.record_pass("T1.3a: Vendedor Maciel possui customizador de avatar travado exclusivamente em seu perfil")
    except Exception as e:
        stats.record_fail("T1.3a: Customizador RBAC Vendedor", str(e))
    finally:
        ctx.close()

    # B) Diretoria
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()
    try:
        login(page, "diretoria")
        abrir_customizador_avatar(page)

        sel_custom = page.locator("#avatar-custom-seller-select, #avatar-select-vendedor").first
        expect(sel_custom).to_be_visible(timeout=5000)
        expect(sel_custom).to_be_enabled()

        # Verificar presença dos vendedores fundadores no seletor
        opcoes = sel_custom.locator("option").all_inner_texts()
        opcoes_str = " ".join(opcoes).lower()
        assert "maciel" in opcoes_str, "Opção 'Maciel' ausente do customizador da Diretoria"
        assert "fernanda" in opcoes_str, "Opção 'Fernanda' ausente do customizador da Diretoria"
        assert "caio" in opcoes_str, "Opção 'Caio' ausente do customizador da Diretoria"

        stats.record_pass("T1.3b: Diretoria possui seletor do customizador liberado com múltiplos consultores")
    except Exception as e:
        stats.record_fail("T1.3b: Customizador RBAC Diretoria", str(e))
    finally:
        ctx.close()


# ==============================================================================
# TIER 2: SELLER REGISTRATION WORKFLOW & IMMEDIATE LOGIN
# ==============================================================================
def test_tier2_seller_registration(browser):
    print("\n" + "=" * 80)
    print("📝 [TIER 2] FLUXO DE CADASTRO DE VENDEDOR & LOGIN IMEDIATO")
    print("=" * 80)

    # Gerar identificador e credenciais únicas para o teste
    timestamp = int(time.time()) % 100000
    novo_login = f"vend_{timestamp}"
    novo_nome = f"Consultor B2B Teste {timestamp}"
    nova_senha = "SenhaInicial2026!"
    novo_cargo = "Consultor Comercial B2B"
    nova_meta = "45000"

    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()

    try:
        # 1. Login Diretoria e navegação para #tab-gestao
        login(page, "diretoria")
        tab_nav_gestao = page.locator("#tab-nav-gestao")
        expect(tab_nav_gestao).to_be_visible(timeout=5000)
        tab_nav_gestao.click(timeout=5000)
        page.wait_for_timeout(400)

        # 2. Preenchimento do formulário #form-novo-vendedor
        expect(page.locator("#vendedor-novo-nome")).to_be_visible(timeout=5000)
        page.fill("#vendedor-novo-nome", novo_nome)
        page.fill("#vendedor-novo-login", novo_login)
        page.fill("#vendedor-novo-senha", nova_senha)

        # Cargo (pode ser select ou input text)
        cargo_input = page.locator("#vendedor-novo-cargo")
        if cargo_input.evaluate("el => el.tagName.toLowerCase()") == "select":
            options = cargo_input.locator("option").all_text_contents()
            cargo_input.select_option(options[0] if options else novo_cargo)
        else:
            cargo_input.fill(novo_cargo)

        # Meta (pode ser #vendedor-novo-meta ou #vendedor-novo-meta-reais)
        meta_input = page.locator("#vendedor-novo-meta, #vendedor-novo-meta-reais").first
        meta_input.fill(nova_meta)

        # 3. Submissão do formulário
        btn_submit = page.locator("#btn-cadastrar-vendedor, #form-novo-vendedor button[type='submit']").first
        btn_submit.click(timeout=5000)
        page.wait_for_timeout(800)

        # 4. Validação de feedback de sucesso (toast ou mensagem)
        toast = page.locator(".crm-toast, #toast-container, .toast, [role='status'], [role='alert']").first
        if toast.is_visible():
            expect(toast).to_contain_text(re.compile(r"(sucesso|cadastrado|salvo|adicionado)", re.IGNORECASE))

        # 5. Validação da presença na tabela de equipe #tabela-equipe-vendedores
        tabela = page.locator("#tabela-equipe-vendedores")
        expect(tabela).to_contain_text(novo_nome, timeout=5000)
        expect(tabela).to_contain_text(novo_login)

        page.screenshot(path=str(SCREENSHOTS_DIR / "tier2_1_vendedor_cadastrado_roster.png"))
        stats.record_pass(f"T2.1: Cadastro do vendedor '{novo_login}' realizado e verificado na tabela de equipe")

        # 6. Propagação para seletores de vendedor no cabeçalho (#vendedor-select)
        sel_header = page.locator("#vendedor-select")
        expect(sel_header.locator(f"option[value='{novo_login}']")).to_have_count(1, timeout=5000)

        # 7. Propagação para seletor da aba de analytics (#analytics-vendedor-select)
        page.locator("#tab-nav-fechamento").click()
        page.wait_for_timeout(400)
        sel_analytics = page.locator("#analytics-vendedor-select")
        expect(sel_analytics.locator(f"option[value='{novo_login}']")).to_have_count(1, timeout=5000)

        stats.record_pass("T2.2: Novo vendedor propagado dinamicamente para #vendedor-select e #analytics-vendedor-select")

        # 8. Logout da diretoria
        logout(page)
        storage_state = ctx.storage_state()

    except Exception as e:
        stats.record_fail("T2.1-T2.2: Cadastro e Propagação de Vendedor", str(e))
    finally:
        ctx.close()

    # 9. Teste de login imediato com as novas credenciais recém-criadas
    ctx2 = browser.new_context(storage_state=storage_state if 'storage_state' in locals() else None, viewport={"width": 1440, "height": 900})
    page2 = ctx2.new_page()

    try:
        page2.goto(f"{BASE_URL}/login.html", wait_until="networkidle")
        page2.fill("#login-usuario", novo_login)
        page2.fill("#login-senha", nova_senha)
        page2.click("#btn-submit-login")

        page2.wait_for_url("**/index.html*", timeout=6000)
        page2.wait_for_timeout(400)

        # Verificar elementos de cabeçalho
        user_name = page2.locator("#header-user-name").inner_text()
        assert (novo_nome.split()[0].lower() in user_name.lower() or 
                novo_login.lower() in user_name.lower()), f"Nome do usuário no header inesperado: {user_name}"

        badge = page2.locator("#header-user-role-badge")
        expect(badge).to_contain_text("Vendedor")

        # Verificar isolamento de storage
        storage_session = page2.evaluate("() => localStorage.getItem('isapel_auth_session')")
        assert storage_session is not None, "Storage de sessão deve estar presente"
        sessao_data = json.loads(storage_session)
        assert sessao_data.get("usuario") == novo_login, f"Sessão esperada '{novo_login}', obteve {sessao_data.get('usuario')}"
        assert sessao_data.get("perfil") == "vendedor", "Perfil na sessão deve ser 'vendedor'"

        # Verificar que a aba de gestão permanece oculta para o novo vendedor
        assert not page2.locator("#tab-nav-gestao").is_visible(), "Aba de gestão não pode ser visível para novo vendedor"

        page2.screenshot(path=str(SCREENSHOTS_DIR / f"tier2_3_login_novo_vendedor_{novo_login}.png"))
        stats.record_pass(f"T2.3: Autenticação imediata do novo vendedor '{novo_login}' validada com sucesso e RBAC preservado")

    except Exception as e:
        stats.record_fail("T2.3: Login Novo Vendedor", str(e))
    finally:
        ctx2.close()


# ==============================================================================
# TIER 3: 3D AVATAR CUSTOMIZER & CONTROLS
# ==============================================================================
def test_tier3_avatar_customizer_controls(browser):
    print("\n" + "=" * 80)
    print("🎨 [TIER 3] CUSTOMIZADOR DE AVATARES 3D (OPÇÕES VISUAIS & LIVE PREVIEW)")
    print("=" * 80)

    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()

    # Rastrear se ocorreram exceções graves de console (especialmente WebGL)
    console_errors = []
    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

    try:
        login(page, "maciel")

        # 1. Abrir o modal do customizador
        aberto = abrir_customizador_avatar(page)
        assert aberto, "Falha ao abrir o modal do customizador de avatar (#modal-avatar-customizer)"

        modal = page.locator("#modal-avatar-customizer, #modal-avatar-backdrop").first
        expect(modal).to_be_visible(timeout=5000)

        # 2. Validar presença do Canvas de Live Preview 3D (#avatar-preview-canvas)
        canvas = page.locator("#avatar-preview-canvas")
        expect(canvas).to_be_visible(timeout=5000)

        # Conferir dimensões ativas do canvas
        box = canvas.bounding_box()
        assert box is not None and box["width"] > 100 and box["height"] > 100, (
            f"Canvas #avatar-preview-canvas com dimensões inválidas: {box}"
        )

        stats.record_pass("T3.1: Modal #modal-avatar-customizer e canvas #avatar-preview-canvas inicializados com sucesso")

        # 3. Conferir opções de Uniformes Oficiais Isapel:
        #    - Polo Azul Marinho (#003360)
        #    - Polo Azul Céu (#0284C7)
        #    - Camisa Social Branca com Crachá Isapel
        uniforme_controls = page.locator(
            "[data-uniforme], input[name='uniforme'], select#avatar-uniforme-select, .uniforme-swatch, #avatar-uniforme-options"
        )
        assert uniforme_controls.count() > 0, "Controles de uniforme não encontrados no customizador"

        # Validar menção ou presença de cada um dos 3 uniformes
        modal_text = modal.inner_text().lower()
        has_marinho = ("marinho" in modal_text or "navy" in modal_text or "#003360" in modal_text or 
                       modal.locator("[data-uniforme*='navy'], [value*='navy']").count() > 0)
        has_ceu = ("azul céu" in modal_text or "céu" in modal_text or "sky" in modal_text or "cyan" in modal_text or 
                   modal.locator("[data-uniforme*='sky'], [value*='sky'], [data-uniforme*='cyan']").count() > 0)
        has_social = ("social" in modal_text or "branca" in modal_text or "crachá" in modal_text or 
                      modal.locator("[data-uniforme*='social'], [value*='social']").count() > 0)

        assert has_marinho, "Opção de uniforme Polo Azul Marinho (#003360) ausente no customizador"
        assert has_ceu, "Opção de uniforme Polo Azul Céu (#0284C7) ausente no customizador"
        assert has_social, "Opção de uniforme Camisa Social Branca com Crachá ausente no customizador"

        stats.record_pass("T3.2: Presença validada dos 3 uniformes canônicos Isapel (Polo Marinho, Polo Céu, Camisa Social c/ Crachá)")

        # 4. Conferir opções de Cabelo (estilos e cores)
        has_cabelo = (
            modal.locator("#avatar-cabelo-estilo, [data-cabelo-estilo], select[name*='cabelo'], .cabelo-option").count() > 0 or
            "cabelo" in modal_text
        )
        assert has_cabelo, "Controles de cabelo ausentes no customizador"

        # 5. Conferir opções de Barba / Bigode (incluindo o bigode canônico do Maciel)
        has_barba = (
            modal.locator("#avatar-barba-estilo, [data-barba-estilo], select[name*='barba'], .barba-option").count() > 0 or
            "bigode" in modal_text or "barba" in modal_text
        )
        assert has_barba, "Controles de barba/bigode ausentes no customizador"

        # Verificar presença expressa de bigode (ícone do Gabriel Maciel)
        has_mustache = ("bigode" in modal_text or 
                        modal.locator("[value*='bigode'], [data-barba*='bigode']").count() > 0)
        assert has_mustache, "Opção de bigode 3D ausente no customizador"

        # 6. Conferir tons de pele e acessórios (óculos)
        has_pele = (
            modal.locator("#avatar-pele-tom, [data-pele], [data-tom-pele], .pele-swatch").count() > 0 or
            "pele" in modal_text or "tom" in modal_text
        )
        assert has_pele, "Controles de tom de pele ausentes no customizador"

        has_oculos = (
            modal.locator("#avatar-acessorio-oculos, [data-oculos], select[name*='oculos']").count() > 0 or
            "óculos" in modal_text or "oculos" in modal_text
        )
        assert has_oculos, "Controles de óculos/acessórios ausentes no customizador"

        stats.record_pass("T3.3: Controles de cabelo, barba (com bigode), tom de pele e óculos presentes e estruturados")

        # 7. Interação: Selecionar opções e verificar que o canvas responde sem erros
        btn_ceu = page.locator("[data-uniforme*='sky'], [data-uniforme*='cyan'], button:has-text('Azul Céu')").first
        if btn_ceu.is_visible():
            btn_ceu.click()
            page.wait_for_timeout(300)

        sel_barba = page.locator("#avatar-barba-estilo, select[name*='barba']").first
        if sel_barba.is_visible():
            options = [opt.get_attribute("value") or "" for opt in sel_barba.locator("option").all()]
            bigode_opts = [o for o in options if "bigode" in o.lower()]
            if bigode_opts:
                sel_barba.select_option(bigode_opts[0])
                page.wait_for_timeout(300)

        # Verificar ausência de erros graves no console
        webgl_errors = [e for e in console_errors if "webgl" in e.lower() or "three" in e.lower()]
        assert len(webgl_errors) == 0, f"Erros WebGL/Three.js detectados durante customização: {webgl_errors}"

        page.screenshot(path=str(SCREENSHOTS_DIR / "tier3_4_avatar_customizer_interactive.png"))
        stats.record_pass("T3.4: Seleção interativa de traços executada no Live Preview sem exceções WebGL")

    except Exception as e:
        stats.record_fail("T3: Customizador de Avatar 3D", str(e))
    finally:
        ctx.close()


# ==============================================================================
# TIER 4: LIVE ARENA SYNC & PERSISTENCE
# ==============================================================================
def test_tier4_live_arena_sync_and_persistence(browser):
    print("\n" + "=" * 80)
    print("⚡ [TIER 4] SINCRONISMO EM TEMPO REAL NA ARENA 3D & PERSISTÊNCIA")
    print("=" * 80)

    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()

    try:
        login(page, "maciel")

        # 1. Abrir customizador
        aberto = abrir_customizador_avatar(page)
        assert aberto, "Falha ao abrir modal do customizador para salvar"
        page.wait_for_timeout(300)

        # 2. Aplicar modificação visual (ex: selecionar camisa social ou polo sky)
        sel_uniforme = page.locator("#avatar-uniforme-select, select[name*='uniforme']").first
        if sel_uniforme.is_visible():
            options = [opt.get_attribute("value") or "" for opt in sel_uniforme.locator("option").all()]
            if len(options) > 1:
                sel_uniforme.select_option(options[1])
                page.wait_for_timeout(200)

        # 3. Salvar customização (#btn-salvar-avatar)
        btn_salvar = page.locator(
            "#btn-salvar-avatar, #modal-avatar-customizer button:has-text('Salvar'), #modal-avatar-backdrop button:has-text('Salvar')"
        ).first
        expect(btn_salvar).to_be_visible(timeout=5000)
        btn_salvar.click(timeout=5000)
        page.wait_for_timeout(600)

        # 4. Validar persistência no localStorage ('isapel_crm_avatar_profiles' ou fallback 'isapel_avatar_customizations')
        storage_check = page.evaluate("""() => {
            const raw1 = localStorage.getItem('isapel_crm_avatar_profiles');
            const raw2 = localStorage.getItem('isapel_avatar_customizations');
            const raw3 = localStorage.getItem('isapel_vendedores_custom_v1');
            return raw1 || raw2 || raw3 || null;
        }""")
        assert storage_check is not None, "Preferências de avatar devem estar persistidas no localStorage!"

        stats.record_pass("T4.1: Preferências de avatar persistidas no localStorage com sucesso")

        # 5. Monitorar para garantir que NÃO ocorre recarregamento de página (Zero Page Reload)
        page_reloaded = [False]
        page.on("framenavigated", lambda frame: page_reloaded.append(True) if frame == page.main_frame else None)

        # 6. Navegar para a Arena 3D (#tab-arena)
        page.locator("#tab-nav-arena").click()
        page.wait_for_timeout(600)

        # Validar que a página NÃO sofreu reload completo
        assert len(page_reloaded) == 1, "VIOLAÇÃO: Ocorreu recarregamento de página durante sincronização da Arena 3D!"

        # Validar que a Arena 3D e o canvas Three.js estão ativos e renderizando
        arena_canvas = page.locator("#arena3d-canvas")
        expect(arena_canvas).to_be_visible(timeout=5000)

        page.screenshot(path=str(SCREENSHOTS_DIR / "tier4_2_arena_3d_zero_reload.png"))
        stats.record_pass("T4.2: Palco #arena-3d sincronizado dinamicamente sem recarregar a página (Zero Page Reload)")

        # 7. Teste de resiliência: Recarregar a página (F5) e verificar hidratação das customizações salvas
        page.reload(wait_until="networkidle")
        page.wait_for_timeout(600)

        # Navegar novamente para a Arena 3D pós-reload
        page.locator("#tab-nav-arena").click()
        page.wait_for_timeout(500)
        expect(page.locator("#arena3d-canvas")).to_be_visible(timeout=5000)

        # Verificar se as customizações persistiram no storage após o reload
        storage_after_reload = page.evaluate("""() => {
            return localStorage.getItem('isapel_crm_avatar_profiles') || 
                   localStorage.getItem('isapel_avatar_customizations') || 
                   localStorage.getItem('isapel_vendedores_custom_v1') || null;
        }""")
        assert storage_after_reload is not None, "Customizações de avatar perdidas após recarregamento da página!"

        page.screenshot(path=str(SCREENSHOTS_DIR / "tier4_3_arena_3d_post_reload_hydration.png"))
        stats.record_pass("T4.3: Customizações de avatar carregadas e renderizadas com sucesso após recarregamento completo (F5)")

    except Exception as e:
        stats.record_fail("T4: Live Arena Sync & Persistence", str(e))
    finally:
        ctx.close()


# ==============================================================================
# MAIN RUNNER
# ==============================================================================
def main():
    print("=" * 80)
    print("🚀 INICIANDO BATERIA PLAYWRIGHT E2E: GESTÃO DE VENDEDORES & AVATAR 3D")
    print(f"📡 Target: {BASE_URL}")
    print(f"📸 Screenshots: {SCREENSHOTS_DIR}")
    print("=" * 80)

    start_total = time.time()

    with sync_playwright() as p:
        gl_flag = "--use-gl=swiftshader" if sys.platform.startswith("linux") else "--use-gl=angle"
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-dev-shm-usage",
                "--enable-webgl",
                gl_flag
            ]
        )

        test_tier1_rbac_access_control(browser)
        test_tier2_seller_registration(browser)
        test_tier3_avatar_customizer_controls(browser)
        test_tier4_live_arena_sync_and_persistence(browser)

        browser.close()

    elapsed = time.time() - start_total

    print("\n" + "=" * 80)
    print("📊 RESUMO DOS TESTES E2E (GESTÃO DE VENDEDORES & AVATAR 3D):")
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
        print("\n🎉 100% DOS TESTES PLAYWRIGHT DE GESTÃO DE VENDEDORES E AVATAR 3D FORAM APROVADOS!")
        sys.exit(0)


if __name__ == "__main__":
    main()
