#!/usr/bin/env python3
"""
Captura de Screenshots Baseline ("Antes") para Auditoria de Design Visual
Salva em isapel-crm/test-results/baseline/
"""
import os
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE_DIR = Path("/Users/gabrieloliveira/Desktop/Agentes-cloud/isapel-crm")
OUTPUT_DIR = BASE_DIR / "test-results" / "baseline"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
URL = "http://localhost:4173/index.html"

def capture():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        # 1. Desktop 1920x1080
        page = browser.new_page(viewport={"width": 1920, "height": 1080})
        page.goto(URL, wait_until="networkidle")
        time.sleep(2) # wait for Three.js and dynamic elements to mount
        
        print("Capturing Desktop Kanban...")
        page.screenshot(path=str(OUTPUT_DIR / "desktop-kanban-1920x1080.png"), full_page=True)
        
        # Tab Novo Lead / Modal if exists
        try:
            # Let's see what tabs exist
            tabs = page.query_selector_all(".tab-btn, button[data-tab], .nav-item, nav button")
            print(f"Found {len(tabs)} navigation/tab buttons")
            for t in tabs:
                text = t.inner_text().strip()
                print(f"Tab text: {text}")
        except Exception as e:
            print("Error querying tabs:", e)
            
        # Try clicking Arena tab
        arena_btn = page.query_selector("button:has-text('Arena'), [data-tab='arena'], #tab-arena")
        if arena_btn:
            print("Clicking Arena 3D tab...")
            arena_btn.click()
            time.sleep(2)
            page.screenshot(path=str(OUTPUT_DIR / "desktop-arena3d-1920x1080.png"), full_page=True)
            
        # Try clicking Fechamento tab
        fechamento_btn = page.query_selector("button:has-text('Fechamento'), button:has-text('Plano'), [data-tab='fechamento'], #tab-fechamento")
        if fechamento_btn:
            print("Clicking Fechamento tab...")
            fechamento_btn.click()
            time.sleep(1)
            page.screenshot(path=str(OUTPUT_DIR / "desktop-fechamento-1920x1080.png"), full_page=True)

        # Return to Kanban
        kanban_btn = page.query_selector("button:has-text('Kanban'), button:has-text('Funil'), [data-tab='kanban'], #tab-kanban")
        if kanban_btn:
            kanban_btn.click()
            time.sleep(1)

        page.close()
        
        # 2. Mobile 390x844
        mobile_page = browser.new_page(viewport={"width": 390, "height": 844})
        mobile_page.goto(URL, wait_until="networkidle")
        time.sleep(2)
        
        print("Capturing Mobile Kanban...")
        mobile_page.screenshot(path=str(OUTPUT_DIR / "mobile-kanban-390x844.png"), full_page=True)
        
        # Arena mobile
        arena_btn_m = mobile_page.query_selector("button:has-text('Arena'), [data-tab='arena'], #tab-arena")
        if arena_btn_m:
            arena_btn_m.click()
            time.sleep(2)
            mobile_page.screenshot(path=str(OUTPUT_DIR / "mobile-arena3d-390x844.png"), full_page=True)
            
        # Fechamento mobile
        fechamento_btn_m = mobile_page.query_selector("button:has-text('Fechamento'), button:has-text('Plano'), [data-tab='fechamento'], #tab-fechamento")
        if fechamento_btn_m:
            fechamento_btn_m.click()
            time.sleep(1)
            mobile_page.screenshot(path=str(OUTPUT_DIR / "mobile-fechamento-390x844.png"), full_page=True)
            
        mobile_page.close()
        browser.close()
        print(f"Screenshots saved successfully to {OUTPUT_DIR}")

if __name__ == "__main__":
    capture()
