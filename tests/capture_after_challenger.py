#!/usr/bin/env python3
"""
================================================================================
CHALLENGER 1 — CAPTURA EMPÍRICA DE SCREENSHOTS PÓS-IMPLEMENTAÇÃO & AUDITORIA DE CONSOLE
Isapel CRM — Validação Visual e Testes de Regressão
================================================================================
"""
import os
import sys
import time
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE_DIR = Path("/Users/gabrieloliveira/Desktop/Agentes-cloud/isapel-crm")
OUTPUT_DIR = BASE_DIR / "test-results" / "after"
LOGS_DIR = Path("/Users/gabrieloliveira/Desktop/Agentes-cloud/.agents/teamwork/challenger_1")
URL = "http://localhost:4173/index.html"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
LOGS_DIR.mkdir(parents=True, exist_ok=True)

def run_challenger_capture():
    print("=" * 80)
    print("🚀 INICIANDO CAPTURA PLAYWRIGHT PÓS-IMPLEMENTAÇÃO (CHALLENGER 1)")
    print(f"Diretório de saída: {OUTPUT_DIR}")
    print(f"URL Alvo: {URL}")
    print("=" * 80)

    console_records = []
    page_errors = []

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage"]
        )

        def attach_listeners(target_page, context_name):
            def handle_console(msg):
                record = {
                    "context": context_name,
                    "type": msg.type,
                    "text": msg.text,
                    "location": msg.location
                }
                console_records.append(record)
                if msg.type == "error":
                    print(f"❌ [CONSOLE ERROR - {context_name}] {msg.text}")
                elif msg.type == "warning":
                    print(f"⚠️ [CONSOLE WARN - {context_name}] {msg.text}")
                else:
                    print(f"ℹ️ [CONSOLE {msg.type.upper()} - {context_name}] {msg.text}")

            def handle_pageerror(err):
                err_msg = str(err)
                page_errors.append({"context": context_name, "error": err_msg})
                print(f"🚨 [PAGE ERROR - {context_name}] {err_msg}")

            target_page.on("console", handle_console)
            target_page.on("pageerror", handle_pageerror)

        # ----------------------------------------------------------------------
        # 1. DESKTOP VIEWPORT (1920x1080)
        # ----------------------------------------------------------------------
        print("\n🖥️ [1/2] Iniciando Contexto Desktop (1920x1080)...")
        desktop_ctx = browser.new_context(
            viewport={"width": 1920, "height": 1080},
            device_scale_factor=1
        )
        desktop_page = desktop_ctx.new_page()
        attach_listeners(desktop_page, "desktop-1920x1080")

        desktop_page.goto(URL, wait_until="networkidle")
        desktop_page.wait_for_timeout(2000)

        # 1.1 Desktop Kanban
        sc_kanban_desktop = OUTPUT_DIR / "desktop-kanban-1920x1080.png"
        desktop_page.screenshot(path=str(sc_kanban_desktop), full_page=True)
        print(f"✅ [Desktop 1/3] Kanban capturado: {sc_kanban_desktop.name} ({sc_kanban_desktop.stat().st_size} bytes)")

        # 1.2 Desktop Arena 3D
        btn_arena = desktop_page.locator("#tab-nav-arena")
        btn_arena.click()
        desktop_page.wait_for_selector("#tab-arena.is-active", state="attached", timeout=5000)
        print("   Aguardando 2.5s para estabilização dos avatares 3D Three.js...")
        desktop_page.wait_for_timeout(2500)
        sc_arena_desktop = OUTPUT_DIR / "desktop-arena3d-1920x1080.png"
        desktop_page.screenshot(path=str(sc_arena_desktop), full_page=True)
        print(f"✅ [Desktop 2/3] Arena 3D capturada: {sc_arena_desktop.name} ({sc_arena_desktop.stat().st_size} bytes)")

        # 1.3 Desktop Fechamento Tático
        btn_fechamento = desktop_page.locator("#tab-nav-fechamento")
        btn_fechamento.click()
        desktop_page.wait_for_selector("#tab-fechamento.is-active", state="attached", timeout=5000)
        desktop_page.wait_for_timeout(1500)
        sc_fechamento_desktop = OUTPUT_DIR / "desktop-fechamento-1920x1080.png"
        desktop_page.screenshot(path=str(sc_fechamento_desktop), full_page=True)
        print(f"✅ [Desktop 3/3] Fechamento Tático capturado: {sc_fechamento_desktop.name} ({sc_fechamento_desktop.stat().st_size} bytes)")

        desktop_ctx.close()

        # ----------------------------------------------------------------------
        # 2. MOBILE VIEWPORT (390x844 - iPhone standard)
        # ----------------------------------------------------------------------
        print("\n📱 [2/2] Iniciando Contexto Mobile (390x844)...")
        mobile_ctx = browser.new_context(
            viewport={"width": 390, "height": 844},
            is_mobile=True,
            has_touch=True,
            device_scale_factor=2
        )
        mobile_page = mobile_ctx.new_page()
        attach_listeners(mobile_page, "mobile-390x844")

        mobile_page.goto(URL, wait_until="networkidle")
        mobile_page.wait_for_timeout(2000)

        # 2.1 Mobile Kanban
        sc_kanban_mobile = OUTPUT_DIR / "mobile-kanban-390x844.png"
        mobile_page.screenshot(path=str(sc_kanban_mobile), full_page=True)
        print(f"✅ [Mobile 1/3] Kanban capturado: {sc_kanban_mobile.name} ({sc_kanban_mobile.stat().st_size} bytes)")

        # 2.2 Mobile Arena 3D
        btn_arena_m = mobile_page.locator("#tab-nav-arena")
        btn_arena_m.click()
        mobile_page.wait_for_selector("#tab-arena.is-active", state="attached", timeout=5000)
        print("   Aguardando 2.5s para estabilização dos avatares 3D Three.js mobile...")
        mobile_page.wait_for_timeout(2500)
        sc_arena_mobile = OUTPUT_DIR / "mobile-arena3d-390x844.png"
        mobile_page.screenshot(path=str(sc_arena_mobile), full_page=True)
        print(f"✅ [Mobile 2/3] Arena 3D capturada: {sc_arena_mobile.name} ({sc_arena_mobile.stat().st_size} bytes)")

        # 2.3 Mobile Fechamento Tático
        btn_fechamento_m = mobile_page.locator("#tab-nav-fechamento")
        btn_fechamento_m.click()
        mobile_page.wait_for_selector("#tab-fechamento.is-active", state="attached", timeout=5000)
        mobile_page.wait_for_timeout(1500)
        sc_fechamento_mobile = OUTPUT_DIR / "mobile-fechamento-390x844.png"
        mobile_page.screenshot(path=str(sc_fechamento_mobile), full_page=True)
        print(f"✅ [Mobile 3/3] Fechamento Tático capturado: {sc_fechamento_mobile.name} ({sc_fechamento_mobile.stat().st_size} bytes)")

        mobile_ctx.close()
        browser.close()

    # Salvar logs coletados
    errors = [r for r in console_records if r["type"] == "error"]
    warnings = [r for r in console_records if r["type"] == "warning"]

    log_summary = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "total_console_records": len(console_records),
        "total_errors": len(errors),
        "total_warnings": len(warnings),
        "total_page_errors": len(page_errors),
        "console_errors": errors,
        "page_errors": page_errors,
        "all_records": console_records
    }

    with open(LOGS_DIR / "console_logs.json", "w", encoding="utf-8") as f:
        json.dump(log_summary, f, indent=2, ensure_ascii=False)

    print("\n" + "=" * 80)
    print("📊 RESUMO DE EXECUÇÃO & CONSOLE DO NAVEGADOR:")
    print(f"Total de registros de console: {len(console_records)}")
    print(f"Erros críticos de console: {len(errors)}")
    print(f"Page errors / Unhandled exceptions: {len(page_errors)}")
    print(f"Avisos / Warnings: {len(warnings)}")
    print("=" * 80)

    # Asserção empírica de ausência de erros
    assert len(errors) == 0, f"Erros críticos encontrados no console: {errors}"
    assert len(page_errors) == 0, f"Page errors detectados: {page_errors}"
    print("🎉 SUCESSO EMPÍRICO: Zero erros de console ou de página detectados!")

if __name__ == "__main__":
    run_challenger_capture()
