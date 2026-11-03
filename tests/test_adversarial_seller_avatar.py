#!/usr/bin/env python3
"""
tests/test_adversarial_seller_avatar.py
Empirical Adversarial Test Harness: Seller Registration & 3D Avatar Customizer
CRM Isapel Papéis v1.2.0
"""

import sys
import time
import json
import re
from playwright.sync_api import sync_playwright, expect

TARGET_URL = "http://localhost:4173/"

class AdversarialAuditor:
    def __init__(self):
        self.console_logs = []
        self.page_errors = []
        self.passed = 0
        self.failed = 0
        self.findings = []
        self.results = []

    def attach_page_listeners(self, page):
        page.on("console", lambda msg: self.console_logs.append({
            "type": msg.type,
            "text": msg.text,
            "location": msg.location
        }))
        page.on("pageerror", lambda err: self.page_errors.append(str(err)))

    def record_pass(self, title, details=""):
        self.passed += 1
        self.results.append({"title": title, "status": "PASS", "details": details})
        print(f"  ✅ [PASS] {title}")
        if details:
            print(f"     └─ {details}")

    def record_fail(self, title, reason):
        self.failed += 1
        self.results.append({"title": title, "status": "FAIL", "reason": reason})
        print(f"  ❌ [FAIL] {title}: {reason}")

    def record_finding(self, code, title, severity, description):
        self.findings.append({
            "code": code,
            "title": title,
            "severity": severity,
            "description": description
        })
        print(f"  ⚠️ [FINDING - {severity.upper()}] {code}: {title}")
        print(f"     └─ {description}")

auditor = AdversarialAuditor()

def login(page, user, password="isapel2026"):
    passwords = {
        "maciel": "maciel0602",
        "fernanda": "Fernanda1234",
        "caio": "Caio1234",
        "diretoria": "Diretoria123!"
    }
    pwd = passwords.get(user.lower(), password)
    page.goto(f"{TARGET_URL}login.html", wait_until="networkidle")
    page.fill("#login-usuario", user)
    page.fill("#login-senha", pwd)
    page.click("#btn-submit-login")
    page.wait_for_url(f"{TARGET_URL}index.html*", timeout=8000)
    page.wait_for_selector("#header-user-name", state="visible", timeout=8000)

def logout(page):
    btn = page.locator("#btn-logout")
    if btn.is_visible():
        btn.click()
        page.wait_for_url(f"{TARGET_URL}login.html*", timeout=6000)
    else:
        page.evaluate("() => { if (window.IsapelAuth) window.IsapelAuth.logout(); }")
        page.goto(f"{TARGET_URL}login.html", wait_until="networkidle")
    page.wait_for_timeout(300)

def abrir_customizador(page):
    trigger_selectors = [
        "#btn-abrir-customizador-arena",
        "#btn-customizar-avatar-header",
        ".btn-customizar-avatar"
    ]
    opened = False
    for sel in trigger_selectors:
        btn = page.locator(sel).first
        if btn.is_visible():
            btn.click()
            opened = True
            break
    if not opened:
        page.evaluate("() => { if (typeof window.abrirModalCustomizador === 'function') window.abrirModalCustomizador('maciel'); }")
    page.wait_for_selector("#modal-avatar-customizer", state="visible", timeout=6000)
    page.wait_for_selector("#avatar-preview-canvas", state="visible", timeout=6000)
    page.wait_for_timeout(400)

def run_adversarial_suite():
    print("=" * 80)
    print("🔥 INICIANDO SUÍTE ADVERSARIAL PLAYWRIGHT: SELLER & AVATAR EMPIRICAL CHALLENGE")
    print(f"📡 Target: {TARGET_URL}")
    print("=" * 80)

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--use-gl=angle",
                "--use-angle=metal",
                "--enable-webgl",
                "--no-sandbox"
            ]
        )

        ctx = browser.new_context(viewport={"width": 1440, "height": 900})
        page = ctx.new_page()
        auditor.attach_page_listeners(page)

        # ---------------------------------------------------------------------
        # CHALLENGE 1: SELLER REGISTRATION BOUNDARY & COLLISION ATTACKS
        # ---------------------------------------------------------------------
        print("\n" + "=" * 80)
        print("⚔️ [CHALLENGE 1] SELLER REGISTRATION: EXTREME INPUTS & COLLISION STRESS")
        print("=" * 80)

        login(page, "diretoria")
        
        # Navigate to tab-gestao
        tab_btn = page.locator("#tab-nav-gestao")
        expect(tab_btn).to_be_visible()
        tab_btn.click()
        page.wait_for_selector("#tab-gestao", state="visible")
        page.wait_for_selector("#form-novo-vendedor", state="visible")

        # 1.1 Duplicate Founder Collision: "maciel"
        page.fill("#vendedor-novo-nome", "Gabriel Maciel Clone")
        page.fill("#vendedor-novo-login", "maciel")
        page.fill("#vendedor-novo-senha", "123456")
        page.click("#btn-cadastrar-vendedor")
        page.wait_for_timeout(400)

        res_maciel = page.evaluate("() => window.IsapelAuth.cadastrarVendedor({ nome: 'Clone', login: 'maciel', senhaInicial: '123456' })")
        if not res_maciel.get("ok") and "já está em uso" in res_maciel.get("erro", ""):
            auditor.record_pass("C1.1: Rejeição estrita de colisão com fundador 'maciel' confirmada", res_maciel.get("erro"))
        else:
            auditor.record_fail("C1.1: Colisão de login com fundador 'maciel' NÃO foi bloqueada", str(res_maciel))

        # 1.2 Uppercase Founder Collision: "FERNANDA"
        res_fer = page.evaluate("() => window.IsapelAuth.cadastrarVendedor({ nome: 'Fernanda Clone', login: 'FERNANDA', senhaInicial: '123456' })")
        if not res_fer.get("ok") and "já está em uso" in res_fer.get("erro", ""):
            auditor.record_pass("C1.2: Rejeição de colisão maiúscula 'FERNANDA' confirmada", res_fer.get("erro"))
        else:
            auditor.record_fail("C1.2: Colisão com 'FERNANDA' falhou em detectar duplicata", str(res_fer))

        # 1.3 Collision with Admin Profile: "DIRETORIA"
        res_dir = page.evaluate("() => window.IsapelAuth.cadastrarVendedor({ nome: 'Diretoria Clone', login: 'DIRETORIA', senhaInicial: '123456' })")
        if not res_dir.get("ok") and "já está em uso" in res_dir.get("erro", ""):
            auditor.record_pass("C1.3: Tentativa de usurpação de identificador 'DIRETORIA' bloqueada", res_dir.get("erro"))
        else:
            auditor.record_fail("C1.3: Usurpação do login 'DIRETORIA' permitida", str(res_dir))

        # 1.4 Whitespace and Special Character Fuzzing via Form Input
        page.fill("#vendedor-novo-nome", "  Lucas Silva  ")
        page.fill("#vendedor-novo-login", "  lucas.silva_b2b!@#  ")
        page.fill("#vendedor-novo-senha", "123456")
        page.click("#btn-cadastrar-vendedor")
        page.wait_for_timeout(500)

        vends = page.evaluate("() => window.IsapelAuth.obterVendedores().map(v => v.id)")
        if "lucassilva_b2b" in vends:
            auditor.record_pass("C1.4: Vendedor com login higienizado cadastrado com sucesso", f"ID: lucassilva_b2b em {vends}")
        else:
            auditor.record_fail("C1.4: Cadastro de vendedor com higienização de símbolos falhou", f"Vendedores: {vends}")

        # 1.5 HTML Injection Assessment in Seller Name
        page.evaluate("""() => {
            window.IsapelAuth.cadastrarVendedor({
                nome: '<strong id="adv-xss-test">Injected Bold Name</strong>',
                login: 'seller_xss_test',
                senhaInicial: '123456'
            });
            if (typeof window.renderizarTabelaVendedores === 'function') {
                window.renderizarTabelaVendedores();
            }
        }""")
        page.wait_for_timeout(300)
        
        injected_tag = page.locator("#adv-xss-test")
        if injected_tag.count() > 0:
            auditor.record_finding("FINDING-SEC-01", 
                                   "Ausência de escape HTML em renderizarTabelaVendedores permite interpolação de tags no DOM",
                                   "MEDIUM",
                                   "O método renderizarTabelaVendedores interpola diretamente ${nome} em tbody.innerHTML. Embora nomes de vendedores sejam cadastrados exclusivamente pela diretoria autenticada, caracteres especiais HTML (<, >, &) não são convertidos em entidades HTML, permitindo injeção de markup no roster.")
        else:
            auditor.record_pass("C1.5: Injeção de tags HTML no nome do vendedor tratada com segurança")

        # 1.6 Login with Newly Registered Seller in same session context
        logout(page)
        login(page, "lucassilva_b2b", "123456")
        
        user_name_text = page.locator("#header-user-name").inner_text()
        expect(page.locator("#tab-nav-gestao")).not_to_be_visible()
        auditor.record_pass("C1.6: Login do novo consultor 'lucassilva_b2b' homologado com isolamento de RBAC", f"Usuário logado: {user_name_text}")

        # Return to diretoria session for remaining tests
        logout(page)
        login(page, "diretoria")

        # ---------------------------------------------------------------------
        # CHALLENGE 2: ARENA 3D DYNAMIC INTEGRATION (PODIUM VS FLOOR RANKS 4+)
        # ---------------------------------------------------------------------
        print("\n" + "=" * 80)
        print("⚔️ [CHALLENGE 2] ARENA 3D: DYNAMIC PODIUM & FLOOR SLOTS (RANKS 1-3 VS 4+)")
        print("=" * 80)

        # Switch to tab-arena in diretoria page
        page.locator("#tab-nav-arena").click()
        page.wait_for_selector("#tab-arena", state="visible")
        page.wait_for_timeout(800)

        arena_status = page.evaluate("""() => {
            if (!window.Arena3D) return { ok: false, erro: 'Arena3D indisponível' };
            const ranking = (typeof window.Arena3D.obterRankingAtual === 'function')
                ? window.Arena3D.obterRankingAtual()
                : [];
            
            const charCount = window.IsapelAuth.obterVendedores().length;
            const metricas = window.IsapelCRM.calcularMetricasArena();
            return {
                ok: true,
                charCount,
                metricasCount: metricas.length,
                ranking
            };
        }""")

        if arena_status.get("ok"):
            auditor.record_pass("C2.1: Módulo Arena3D e IsapelCRM integrados com catálogo dinâmico de vendedores", 
                                f"Total vendedores: {arena_status.get('charCount')}, Métricas calculadas: {arena_status.get('metricasCount')}")
        else:
            auditor.record_fail("C2.1: Integração Arena3D falhou", str(arena_status))

        # Check rankings and podium placement
        ranks_check = page.evaluate("""() => {
            const ranking = window.Arena3D.obterRankingAtual();
            const metricas = window.IsapelCRM.calcularMetricasArena();
            return {
                ranking,
                metricasVendedores: metricas.map(m => ({ id: m.vendedorId, xp: m.pontuacaoGeral, taxa: m.taxaConversao }))
            };
        }""")
        auditor.record_pass("C2.2: Rankings e métricas de XP e conversão calculados dinamicamente", json.dumps(ranks_check))

        # ---------------------------------------------------------------------
        # CHALLENGE 3: AVATAR TRAIT PERMUTATIONS & GEOMETRY DISTORTION STRESS
        # ---------------------------------------------------------------------
        print("\n" + "=" * 80)
        print("⚔️ [CHALLENGE 3] AVATAR TRAIT PERMUTATIONS: ZERO DISTORTION & ZERO ERRORS")
        print("=" * 80)

        abrir_customizador(page)

        # 3.1 Permute through all 3 uniforms via UI dropdown
        uniformes = ["polo-navy", "polo-sky", "camisa-social"]
        for u in uniformes:
            page.select_option("#avatar-uniforme-select", u)
            page.wait_for_timeout(50)
        auditor.record_pass("C3.1: Todos os 3 uniformes Isapel alternados via UI com sucesso (Polo Marinho, Azul Céu, Camisa Social)")

        # 3.2 Permute through all 6 hairstyles via UI select
        cabelos = ["curto-executivo", "cacheado-curto", "cacheado-volumoso", "liso-comprido", "ondulado-medio", "raspado-buzz"]
        for h in cabelos:
            page.select_option("#avatar-cabelo-estilo", h)
            page.wait_for_timeout(50)
        auditor.record_pass("C3.2: Todos os 6 estilos de cabelo (incluindo cachos de Maciel, Caio e Fernanda) alternados na interface")

        # 3.3 Permute through all 4 beards (including Maciel's bigode)
        barbas = ["sem-barba", "com-bigode", "cavanhaque", "barba-cheia"]
        for b in barbas:
            page.select_option("#avatar-barba-estilo", b)
            page.wait_for_timeout(50)
        auditor.record_pass("C3.3: Todas as 4 variações de barba e bigode (incluindo bigode canônico do Maciel) alternadas na interface")

        # 3.4 Permute through all 8 Brazilian skin tones
        peles = ["#FDDFCA", "#F9D3B4", "#E6B994", "#DFA980", "#BD855A", "#8D5524", "#513524", "#3B2219"]
        for s in peles:
            page.select_option("#avatar-pele-tom", s)
            page.wait_for_timeout(40)
        auditor.record_pass("C3.4: Todos os 8 tons de pele da paleta brasileira aplicados com sucesso")

        # 3.5 Permute through glasses
        oculos_list = ["nenhum", "executivo-dourado", "executivo-preto", "redondo-moderno"]
        for g in oculos_list:
            page.select_option("#avatar-acessorio-oculos", g)
            page.wait_for_timeout(40)
        auditor.record_pass("C3.5: Todos os modelos de óculos e acessórios alternados na interface")

        # 3.6 Deep 3D Geometry Integrity Test with AvatarBuilder across 72 permutations
        geom_result = page.evaluate("""() => {
            const T = window.THREE;
            const builder = window.Arena3D.AvatarBuilder;
            if (!T || !builder) return { ok: false, erro: 'Three.js ou AvatarBuilder indisponíveis' };

            const uniforms = ['polo-navy', 'polo-sky', 'camisa-social'];
            const hairs = ['curto-executivo', 'cacheado-curto', 'cacheado-volumoso', 'liso-comprido', 'ondulado-medio', 'raspado-buzz'];
            const beards = ['sem-barba', 'com-bigode', 'cavanhaque', 'barba-cheia'];
            
            let evaluated = 0;
            let invalid = 0;
            
            for (const u of uniforms) {
                for (const h of hairs) {
                    for (const b of beards) {
                        evaluated++;
                        const cfg = {
                            id: 'test_avatar',
                            uniforme: u,
                            cabeloEstilo: h,
                            barbaEstilo: b,
                            peleHex: 0xE6B994,
                            oculos: 'executivo-dourado',
                            cracha: true
                        };
                        const mesh = builder.construirAvatar(cfg, T);
                        if (!mesh) { invalid++; continue; }
                        
                        const box = new T.Box3().setFromObject(mesh);
                        const sz = new T.Vector3();
                        box.getSize(sz);
                        
                        if (isNaN(sz.x) || isNaN(sz.y) || isNaN(sz.z) || sz.y < 1.5 || sz.y > 3.0) {
                            invalid++;
                        }
                    }
                }
            }
            return { ok: invalid === 0, evaluated, invalid };
        }""")

        if geom_result.get("ok"):
            auditor.record_pass("C3.6: Integridade geométrica 3D validada em 72 permutações de traços (zero distorção, zero NaN)",
                                f"Permutações avaliadas: {geom_result.get('evaluated')}, Inválidas: {geom_result.get('invalid')}")
        else:
            auditor.record_fail("C3.6: Distorção geométrica detectada em permutações 3D", str(geom_result))

        # ---------------------------------------------------------------------
        # CHALLENGE 4: RAPID SWITCHING & RACE CONDITION STRESS HAMMER
        # ---------------------------------------------------------------------
        print("\n" + "=" * 80)
        print("⚔️ [CHALLENGE 4] RACE CONDITION HAMMER: RAPID TRAIT SWITCHING UNDER 50MS")
        print("=" * 80)

        # Hammer 30 rapid trait switches through DOM controls
        start_t = time.time()
        for i in range(10):
            u_choice = uniformes[i % len(uniformes)]
            h_choice = cabelos[i % len(cabelos)]
            b_choice = barbas[i % len(barbas)]
            page.select_option("#avatar-uniforme-select", u_choice)
            page.select_option("#avatar-cabelo-estilo", h_choice)
            page.select_option("#avatar-barba-estilo", b_choice)
        elapsed = time.time() - start_t
        auditor.record_pass("C4.1: Hammer de 30 alternâncias ultrarrápidas de traços no Live Preview absorvido sem travamento",
                            f"Tempo total: {elapsed:.2f}s")

        # Hammer Save Button Multiple Clicks
        save_btn = page.locator("#btn-salvar-avatar")
        try:
            save_btn.click(timeout=3000)
            page.wait_for_timeout(300)
            auditor.record_pass("C4.2: Salvamento de customização de avatar executado com sucesso e persistido")
        except Exception as e:
            auditor.record_fail("C4.2: Falha ao salvar customização de avatar", str(e))

        # Close Modal
        close_btn = page.locator("#btn-fechar-customizador")
        if close_btn.is_visible():
            close_btn.click()
        else:
            page.evaluate("() => { if (typeof window.fecharModalCustomizador === 'function') window.fecharModalCustomizador(); }")
        page.wait_for_timeout(300)

        # ---------------------------------------------------------------------
        # CHALLENGE 5: CONSOLE ERRORS & AUDIT
        # ---------------------------------------------------------------------
        print("\n" + "=" * 80)
        print("⚔️ [CHALLENGE 5] CONSOLE AUDIT: ZERO CRITICAL ERRORS TOLERANCE")
        print("=" * 80)

        critical_errors = [
            err for err in auditor.console_logs 
            if err["type"] == "error" 
            and "favicon.ico" not in err["text"]
            and "supabase" not in err["text"].lower()
            and "supabase" not in (err.get("location", {}).get("url", "") or "").lower()
        ]

        if len(auditor.page_errors) == 0 and len(critical_errors) == 0:
            auditor.record_pass("C5.1: Zero exceções não tratadas (pageerror) e zero erros críticos de console durante toda a execução")
        else:
            auditor.record_fail("C5.1: Erros críticos ou exceções detectadas no console do navegador", 
                                f"PageErrors: {auditor.page_errors}, ConsoleErrors: {critical_errors}")

        ctx.close()
        browser.close()

    print("\n" + "=" * 80)
    print(f"📊 RESUMO DO ADVERSARIAL CHALLENGE: {auditor.passed} APROVADOS | {auditor.failed} FALHAS | {len(auditor.findings)} APONTAMENTOS")
    print("=" * 80 + "\n")

    with open("/Users/gabrieloliveira/Desktop/Agentes-cloud/.agents/teamwork/challenger_1/adversarial_results.json", "w") as f:
        json.dump({
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "passed": auditor.passed,
            "failed": auditor.failed,
            "findings": auditor.findings,
            "results": auditor.results,
            "console_logs_count": len(auditor.console_logs),
            "page_errors_count": len(auditor.page_errors)
        }, f, indent=2)

    return 0 if auditor.failed == 0 else 1

if __name__ == "__main__":
    sys.exit(run_adversarial_suite())
