"""Playwright check: SearchBar voice control across SSR and client rendering.

Runs the home screen twice — once with SpeechRecognition removed (unsupported
browser) and once with it stubbed in (supported browser) — and asserts:
  * the server-rendered HTML always ships the neutral placeholder (no guess),
  * after hydration the mic icon matches actual browser support,
  * no hydration-mismatch errors are logged and the page is never blank,
  * the button is interactive when supported.

Usage: python3 scripts/voice-search-test.py [base_url]
"""

import asyncio
import sys

from playwright.async_api import async_playwright

BASE_URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8080"

REMOVE_SPEECH = """
delete window.SpeechRecognition;
delete window.webkitSpeechRecognition;
"""

ADD_SPEECH = """
class FakeSpeechRecognition {
  constructor() { this.lang = 'en-US'; this.interimResults = false; }
  start() {
    setTimeout(() => {
      this.onresult && this.onresult({ results: [[{ transcript: 'serendipity' }]] });
      this.onend && this.onend();
    }, 50);
  }
  stop() { this.onend && this.onend(); }
}
window.SpeechRecognition = FakeSpeechRecognition;
window.webkitSpeechRecognition = FakeSpeechRecognition;
"""

failures = []


def check(name, condition, detail=""):
    status = "PASS" if condition else "FAIL"
    print(f"[{status}] {name}{(' — ' + detail) if detail else ''}")
    if not condition:
        failures.append(name)


async def run_case(browser, *, supported):
    label = "supported" if supported else "unsupported"
    context = await browser.new_context(viewport={"width": 390, "height": 844})
    await context.add_init_script(ADD_SPEECH if supported else REMOVE_SPEECH)
    page = await context.new_page()

    errors = []
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: errors.append(str(e)))

    response = await page.goto(f"{BASE_URL}/home", wait_until="domcontentloaded")
    ssr_html = await response.text()
    check(
        f"{label}: SSR ships neutral voice placeholder",
        "voice-search-placeholder" in ssr_html,
    )
    check(
        f"{label}: SSR does not guess support",
        "voice-search-button" not in ssr_html,
    )

    await page.wait_for_selector('[data-testid="voice-search-button"]', timeout=15000)
    button = page.get_by_test_id("voice-search-button")
    reported = await button.get_attribute("data-voice-supported")
    check(f"{label}: hydrated button reports support={supported}", reported == str(supported).lower(), reported)

    on_icon = await page.get_by_test_id("voice-icon-on").count()
    off_icon = await page.get_by_test_id("voice-icon-off").count()
    check(f"{label}: correct mic icon", (on_icon == 1) if supported else (off_icon == 1), f"on={on_icon} off={off_icon}")

    check(f"{label}: search bar rendered (not blank / not fallback)",
          await page.get_by_test_id("searchbar").count() == 1)
    check(f"{label}: body has visible content",
          len((await page.inner_text("body")).strip()) > 40)

    hydration_errors = [e for e in errors if "Hydration" in e or "hydrat" in e or "#418" in e or "#423" in e]
    check(f"{label}: no hydration mismatch errors", not hydration_errors, "; ".join(hydration_errors)[:300])

    if supported:
        await button.click()
        await page.wait_for_url("**/search?q=serendipity", timeout=10000)
        check("supported: dictation triggers instant search", "q=serendipity" in page.url, page.url)
    else:
        await button.click()
        await page.wait_for_timeout(500)
        check("unsupported: click stays on home with graceful notice", "/home" in page.url, page.url)

    await context.close()


async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        await run_case(browser, supported=False)
        await run_case(browser, supported=True)
        await browser.close()
    print()
    if failures:
        print(f"{len(failures)} check(s) failed: {failures}")
        sys.exit(1)
    print("All voice-search SSR/client checks passed.")


asyncio.run(main())
