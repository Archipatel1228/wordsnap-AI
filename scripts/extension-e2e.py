"""End-to-end tests for the WordSnap browser extension.

Loads the unpacked extension into Chromium (the same engine Microsoft Edge uses,
so a pass here covers both Chrome and Edge) and drives real pages.

    bun run test:extension

Save/duplicate tests need real credentials:
    EXT_TEST_EMAIL=... EXT_TEST_PASSWORD=... bun run test:extension
Without them, the signed-out path is asserted instead.
"""

import asyncio
import json
import os
import sys
import tempfile
from pathlib import Path

from playwright.async_api import async_playwright

EXT = Path(__file__).resolve().parent.parent / "extension"
SUPABASE_URL = "https://dgdrrueqkyosmbwbtghe.supabase.co"
SUPABASE_KEY = "sb_publishable_5B9NMFbHMa8GULGYxAa8NA_1b6Nk_tB"

PAGE = """<!doctype html><html><body style="font:16px system-ui;padding:40px">
<p id="para">The <span id="word">serendipity</span> of the moment was <span id="phrase">quite remarkable indeed</span>.</p>
<div style="height:2500px"></div></body></html>"""

results = []


def check(name, ok, detail=""):
    results.append((name, ok, detail))
    print(f"{'PASS' if ok else 'FAIL'}  {name}{(' — ' + detail) if detail else ''}")


async def select(page, element_id):
    await page.evaluate(
        """(id) => {
            const sel = window.getSelection();
            sel.removeAllRanges();
            const range = document.createRange();
            range.selectNodeContents(document.getElementById(id));
            sel.addRange(range);
        }""",
        element_id,
    )
    box = await page.locator(f"#{element_id}").bounding_box()
    await page.mouse.move(box["x"] + 2, box["y"] + 2)
    await page.mouse.up()
    await page.wait_for_timeout(250)


async def trigger_count(page):
    return await page.evaluate(
        "document.getElementById('wordsnap-root')?.shadowRoot?.querySelectorAll('.ws-trigger').length ?? 0"
    )


async def popup_text(page):
    return await page.evaluate(
        "document.getElementById('wordsnap-root')?.shadowRoot?.querySelector('.ws-popup')?.textContent ?? ''"
    )


async def sw_eval(worker, expression):
    return await worker.evaluate(expression)


async def main():
    email = os.environ.get("EXT_TEST_EMAIL")
    password = os.environ.get("EXT_TEST_PASSWORD")

    async with async_playwright() as pw:
        user_dir = tempfile.mkdtemp(prefix="wordsnap-ext-")
        context = await pw.chromium.launch_persistent_context(
            user_dir,
            headless=False,  # extensions need the new headless mode, not the old one
            viewport={"width": 1280, "height": 900},
            args=[
                "--headless=new",
                f"--disable-extensions-except={EXT}",
                f"--load-extension={EXT}",
            ],
        )

        # Give the worker a chance to spin up (it registers lazily).
        boot = await context.new_page()
        await boot.goto("about:blank")
        await boot.wait_for_timeout(1500)

        worker = None
        for _ in range(40):
            if context.service_workers:
                worker = context.service_workers[0]
                break
            try:
                worker = await context.wait_for_event("serviceworker", timeout=1000)
                break
            except Exception:
                continue
        check("MV3 service worker registers (Chrome/Edge engine)", worker is not None)
        if worker is None:
            await context.close()
            return report()

        page = boot
        await page.route("https://example.test/**", lambda route: route.fulfill(content_type="text/html", body=PAGE))
        await page.goto("https://example.test/article")
        await page.wait_for_timeout(500)

        # 1. Selection of a valid single word shows the floating trigger.
        await select(page, "word")
        check("floating icon appears for a valid single word", await trigger_count(page) == 1)

        # 2. A phrase must not show the trigger.
        await select(page, "phrase")
        check("no floating icon for a multi-word phrase", await trigger_count(page) == 0)

        # 3. Scrolling dismisses stale UI.
        await select(page, "word")
        await page.mouse.wheel(0, 600)
        await page.wait_for_timeout(200)
        check("floating icon disappears on scroll", await trigger_count(page) == 0)

        # 4. Selection lookup renders the popup with real data.
        await page.mouse.wheel(0, -600)
        await select(page, "word")
        await page.evaluate(
            "document.getElementById('wordsnap-root').shadowRoot.querySelector('.ws-trigger').click()"
        )
        await page.wait_for_timeout(600)
        check("popup opens on trigger click", ".ws-popup" and await popup_text(page) != "")
        for _ in range(30):
            text = await popup_text(page)
            if "Loading" not in text and "…" not in text and len(text) > 60:
                break
            await page.wait_for_timeout(500)
        text = await popup_text(page)
        check("popup renders the looked-up word", "serendipity" in text.lower(), text[:80])
        check("popup renders meaning/AI content", len(text) > 120, f"{len(text)} chars")

        # 5. Right-click context-menu lookup path (the menu itself is native, so we
        #    exercise the exact message the menu handler sends).
        await page.evaluate(
            "document.getElementById('wordsnap-root').shadowRoot.querySelector('.ws-popup')?.remove()"
        )
        tab_id = await sw_eval(
            worker,
            "chrome.tabs.query({active:true,currentWindow:true}).then(t => t[0].id)",
        )
        await sw_eval(
            worker,
            f"chrome.tabs.sendMessage({tab_id}, {{type:'WORDSNAP_SHOW', word:'eloquent'}})",
        )
        for _ in range(30):
            text = await popup_text(page)
            if "eloquent" in text.lower() and len(text) > 100:
                break
            await page.wait_for_timeout(500)
        check("context-menu lookup opens a popup", "eloquent" in (await popup_text(page)).lower())

        # 6. Saving.
        if email and password:
            res = await page.request.post(
                f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
                headers={"apikey": SUPABASE_KEY, "content-type": "application/json"},
                data=json.dumps({"email": email, "password": password}),
            )
            session = await res.json()
            check("test account signs in", "access_token" in session)
            await sw_eval(
                worker,
                f"chrome.storage.session.set({{session: {json.dumps(session)}}})",
            )
            word = "serendipity"
            payload = json.dumps({"word": word, "definition": "e2e test", "favourite": False})
            first = await sw_eval(
                worker,
                f"new Promise(r => chrome.runtime.sendMessage({{type:'SAVE_WORD', payload:{payload}}}, r))",
            )
            check("saving a word succeeds", bool(first and first.get("ok")), str(first)[:120])

            def count_expr():
                return (
                    "fetch('%s/rest/v1/saved_words?select=id&word_key=eq.%s', {headers:{apikey:'%s', authorization:'Bearer '+ (await chrome.storage.session.get('session')).session.access_token}}).then(r=>r.json()).then(r=>r.length)"
                    % (SUPABASE_URL, word, SUPABASE_KEY)
                )

            after_first = await sw_eval(worker, f"(async () => {count_expr()})()")
            await sw_eval(
                worker,
                f"new Promise(r => chrome.runtime.sendMessage({{type:'SAVE_WORD', payload:{payload}}}, r))",
            )
            after_second = await sw_eval(worker, f"(async () => {count_expr()})()")
            check(
                "duplicate save does not create a second row",
                after_first == after_second == 1,
                f"{after_first} then {after_second}",
            )
            stats = await sw_eval(
                worker, "new Promise(r => chrome.runtime.sendMessage({type:'STATS'}, r))"
            )
            check("streak/stat sync after save", bool(stats and stats["data"]["signedIn"]))
        else:
            await sw_eval(worker, "chrome.storage.session.remove('session')")
            res = await sw_eval(
                worker,
                "new Promise(r => chrome.runtime.sendMessage({type:'SAVE_WORD', payload:{word:'test'}}, r))",
            )
            print("   signed-out save response:", res)
            check(
                "signed-out save is rejected",
                bool(res) and res.get("ok") is False and "NOT_SIGNED_IN" in str(res.get("error")),
                "set EXT_TEST_EMAIL/EXT_TEST_PASSWORD to run the save tests",
            )

        await context.close()
    report()


def report():
    failed = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(failed)}/{len(results)} checks passed")
    sys.exit(1 if failed else 0)


asyncio.run(main())
