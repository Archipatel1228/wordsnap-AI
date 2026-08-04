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

## Security

- No AI keys in the extension: explanations come from the server route, which holds
  `LOVABLE_API_KEY`.
- Only the Supabase **publishable** key ships in the client; row-level security scopes every
  read/write to the signed-in user.
- The session is stored in `chrome.storage.session` (in-memory, cleared when the browser
  closes) — never in `localStorage` or `storage.local`.
- Saves are idempotent (`on_conflict=user_id,word_key`), so duplicates are impossible.

## Firefox / Brave later

Brave works as-is. Firefox needs only a `browser_specific_settings` block plus swapping the
`chrome.*` calls for the `browser.*` promise API — all of which are already funnelled through
`lib/shared.js` and the message router, so no UI code changes.

## Repackage

```bash
rm -f public/wordsnap-extension.zip &&
  cd extension && nix run nixpkgs#zip -- -r ../public/wordsnap-extension.zip .
```
