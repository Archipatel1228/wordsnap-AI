# WordSnap AI — Browser Extension (Chrome & Edge)

A Manifest V3 extension that adds instant word lookups to any website, powered by the
existing WordSnap backend. The web app is untouched — the extension only calls a new
public endpoint (`/api/public/lookup`) and the existing Lovable Cloud database.

## Install (unpacked)

1. Download / unzip `wordsnap-extension.zip`.
2. Open `chrome://extensions` (or `edge://extensions`).
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the unzipped folder.

## How it works

| Piece | File | Role |
| --- | --- | --- |
| Floating icon + popup | `content.js` / `content.css` | Shadow-DOM UI injected on every page; never leaks styles into the host page. |
| Service worker | `background.js` | Lookups (12h in-memory cache), saving, streaks, context menu, message router. |
| Auth bridge | `auth-bridge.js` | Runs only on `wordsnap.lovable.app`; mirrors the signed-in Supabase session into the extension. |
| Toolbar popup | `popup.html/js/css` | Streak, saved count, recent words, manual lookup, dashboard link. |
| Settings | `options.html/js` | Floating icon, double-click lookup, pronunciation, theme, popup size, explanation level. |

## Privacy notice

- Sent to the backend: **only the selected word** and the explanation level, to
  `POST /api/public/lookup`. Never the page content, URL, title or surrounding text.
- Sent to your account database: **words you explicitly save** (word, definition, phonetic,
  audio URL), plus a `search_history` row and today's date for the streak.
- Stored on your device only: extension settings (`chrome.storage.local`, not synced).
- Stored in memory only: your Supabase session (`chrome.storage.session`, wiped on browser exit).
- No analytics, telemetry, tracking pixels or page scraping.

## Security

- No AI keys in the extension: explanations come from the server route, which holds
  `LOVABLE_API_KEY`.
- Only the Supabase **publishable** key ships in the client; row-level security scopes every
  read/write to the signed-in user.
- The session is stored in `chrome.storage.session` (in-memory, cleared when the browser
  closes) — never in `localStorage` or `storage.local`.
- Minimal permissions: `storage`, `contextMenus`, `alarms` only — no `activeTab`, no
  `scripting`, no `tabs`. Host permissions are narrowed to the lookup endpoint and the
  Supabase REST/token paths; content scripts run on `https://` pages only.
- The session refreshes automatically every 30 minutes (and 5 minutes before expiry), so
  saving and streaks keep working during long sessions; a rejected refresh clears the session.
- Saves are idempotent (`on_conflict=user_id,word_key`), so duplicates are impossible.

## Firefox / Brave later

Brave works as-is. Firefox needs only a `browser_specific_settings` block plus swapping the
`chrome.*` calls for the `browser.*` promise API — all of which are already funnelled through
`lib/shared.js` and the message router, so no UI code changes.

## End-to-end tests

```bash
bun run test:extension   # Playwright, loads the unpacked extension in Chromium
```

Covers selection lookup, popup rendering, context-menu lookup, save-to-account and
duplicate-save prevention. Save tests need `EXT_TEST_EMAIL` / `EXT_TEST_PASSWORD`; without
them they are skipped and the signed-out path is asserted instead.

## Repackage

```bash
rm -f public/wordsnap-extension.zip &&
  cd extension && nix run nixpkgs#zip -- -r ../public/wordsnap-extension.zip .
```
