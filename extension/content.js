/**
 * WordSnap content script: floating trigger + shadow-DOM popup.
 * All UI lives inside a shadow root so host page styles can never leak in
 * (and WordSnap styles never affect the page).
 */
(() => {
  if (window.__wordsnapLoaded) return;
  window.__wordsnapLoaded = true;

  const SIZES = { small: 300, medium: 360, large: 420 };
  let settings = { floatingIcon: true, doubleClickLookup: false, pronunciation: true, theme: "dark", popupSize: "medium" };
  let host = null;
  let root = null;
  let trigger = null;
  let currentWord = "";

  chrome.runtime.sendMessage({ type: "GET_STATE" }, (res) => {
    if (chrome.runtime.lastError) return;
    if (res?.settings) settings = { ...settings, ...res.settings };
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes.settings?.newValue) {
      settings = { ...settings, ...changes.settings.newValue };
    }
  });

  function ensureRoot() {
    if (root) return root;
    host = document.createElement("div");
    host.id = "wordsnap-root";
    root = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = STYLES;
    root.appendChild(style);
    document.documentElement.appendChild(host);
    return root;
  }

  const isSingleWord = (t) => /^[A-Za-z][A-Za-z'-]{1,29}$/.test(t);

  function removeTrigger() {
    trigger?.remove();
    trigger = null;
  }

  function closePopup() {
    root?.querySelector(".ws-popup")?.remove();
  }

  function showTrigger(word, rect) {
    removeTrigger();
    const r = ensureRoot();
    trigger = document.createElement("button");
    trigger.className = "ws-trigger";
    trigger.type = "button";
    trigger.title = `Explain "${word}" with WordSnap`;
    trigger.innerHTML = `<img alt="" src="${chrome.runtime.getURL("icons/icon-192.png")}" />`;
    position(trigger, rect.left + window.scrollX, rect.bottom + window.scrollY + 8);
    trigger.addEventListener("mousedown", (e) => e.preventDefault());
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      openPopup(word, rect);
    });
    r.appendChild(trigger);
  }

  function position(el, x, y) {
    const width = SIZES[settings.popupSize] || 360;
    const maxX = window.innerWidth + window.scrollX - width - 16;
    el.style.left = `${Math.max(8 + window.scrollX, Math.min(x, maxX))}px`;
    el.style.top = `${y}px`;
  }

  function openPopup(word, rect) {
    removeTrigger();
    closePopup();
    currentWord = word;
    const r = ensureRoot();
    const el = document.createElement("div");
    el.className = `ws-popup ws-${settings.theme === "light" ? "light" : "dark"}`;
    el.style.width = `${SIZES[settings.popupSize] || 360}px`;
    const anchor = rect || { left: window.innerWidth / 2 - 180, bottom: 80 };
    position(el, anchor.left + window.scrollX, anchor.bottom + window.scrollY + 10);
    el.innerHTML = skeleton(word);
    el.addEventListener("mousedown", (e) => e.stopPropagation());
    r.appendChild(el);
    el.querySelector(".ws-close")?.addEventListener("click", closePopup);

    chrome.runtime.sendMessage({ type: "LOOKUP", word }, (res) => {
      if (chrome.runtime.lastError) return;
      if (!res?.ok) {
        el.innerHTML = errorView(word, res?.error || "Lookup failed");
        wireShell(el, word);
        el.querySelector(".ws-retry")?.addEventListener("click", () => openPopup(word, rect));
        return;
      }
      el.innerHTML = resultView(res.data);
      wireShell(el, word);
      wireActions(el, res.data);
    });
  }

  function wireShell(el, word) {
    el.querySelector(".ws-close")?.addEventListener("click", closePopup);
    el.querySelector(".ws-open-app")?.addEventListener("click", () =>
      chrome.runtime.sendMessage({ type: "OPEN_APP", path: `/search?q=${encodeURIComponent(word)}` }),
    );
  }

  function speak(data) {
    if (data.audio) {
      new Audio(data.audio).play().catch(() => fallbackSpeak(data.word));
    } else fallbackSpeak(data.word);
  }

  function fallbackSpeak(word) {
    try {
      const u = new SpeechSynthesisUtterance(word);
      u.lang = "en-US";
      speechSynthesis.speak(u);
    } catch {
      /* speech unavailable */
    }
  }

  function wireActions(el, data) {
    el.querySelector(".ws-speak")?.addEventListener("click", () => speak(data));
    if (settings.pronunciation === false) el.querySelector(".ws-speak")?.setAttribute("hidden", "");

    const save = (favourite) => {
      const btn = el.querySelector(favourite ? ".ws-fav" : ".ws-save");
      if (btn) btn.disabled = true;
      chrome.runtime.sendMessage(
        {
          type: "SAVE_WORD",
          payload: {
            word: data.word,
            definition: data.definition,
            partOfSpeech: data.partOfSpeech,
            phonetic: data.phonetic,
            audio: data.audio,
            favourite,
          },
        },
        (res) => {
          const status = el.querySelector(".ws-status");
          if (!status) return;
          if (res?.ok) {
            status.textContent = favourite ? "Saved to favourites ✓" : "Saved to your vocabulary ✓";
            status.className = "ws-status ws-ok";
          } else if (res?.error === "NOT_SIGNED_IN") {
            status.innerHTML = `<button class="ws-signin">Sign in to WordSnap</button>`;
            status.className = "ws-status";
            status
              .querySelector(".ws-signin")
              ?.addEventListener("click", () =>
                chrome.runtime.sendMessage({ type: "OPEN_APP", path: "/login" }),
              );
            if (btn) btn.disabled = false;
          } else {
            status.textContent = res?.error || "Could not save.";
            status.className = "ws-status ws-err";
            if (btn) btn.disabled = false;
          }
        },
      );
    };
    el.querySelector(".ws-save")?.addEventListener("click", () => save(false));
    el.querySelector(".ws-fav")?.addEventListener("click", () => save(true));
  }

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  const header = (title, sub = "") =>
    `<div class="ws-head"><div><div class="ws-word">${esc(title)}</div>${sub ? `<div class="ws-sub">${sub}</div>` : ""}</div>
     <button class="ws-close" aria-label="Close">×</button></div>`;

  const skeleton = (word) =>
    `${header(word)}<div class="ws-body"><div class="ws-sk"></div><div class="ws-sk"></div><div class="ws-sk short"></div></div>`;

  const errorView = (word, message) =>
    `${header(word)}<div class="ws-body"><p class="ws-err">${esc(message)}</p>
      <div class="ws-actions"><button class="ws-retry">Retry</button><button class="ws-open-app ghost">Open WordSnap</button></div></div>`;

  const chips = (label, items) =>
    items?.length
      ? `<div class="ws-row"><span class="ws-label">${label}</span><div class="ws-chips">${items
          .slice(0, 6)
          .map((s) => `<span class="ws-chip">${esc(s)}</span>`)
          .join("")}</div></div>`
      : "";

  function resultView(d) {
    const ai = d.ai || {};
    const meta = [d.partOfSpeech, d.phonetic].filter(Boolean).map(esc).join(" · ");
    const levels = [ai.difficulty, ai.cefr && `CEFR ${ai.cefr}`, ai.ielts && `IELTS ${ai.ielts}`]
      .filter(Boolean)
      .map((t) => `<span class="ws-badge">${esc(t)}</span>`)
      .join("");
    return `${header(d.word, meta)}
      <div class="ws-body">
        <div class="ws-badges"><button class="ws-speak" title="Pronounce">🔊</button>${levels}</div>
        ${d.definition ? `<p class="ws-def">${esc(d.definition)}</p>` : ""}
        ${ai.advanced ? `<div class="ws-row"><span class="ws-label">Advanced</span><p>${esc(ai.advanced)}</p></div>` : ""}
        ${ai.explanation ? `<div class="ws-ai"><span class="ws-label">AI explanation</span><p>${esc(ai.explanation)}</p></div>` : ""}
        ${ai.memoryTrick ? `<div class="ws-row"><span class="ws-label">Memory trick</span><p>${esc(ai.memoryTrick)}</p></div>` : ""}
        ${(d.examples?.[0] || ai.example) ? `<div class="ws-row"><span class="ws-label">Example</span><p class="ws-ex">“${esc(d.examples?.[0] || ai.example)}”</p></div>` : ""}
        ${chips("Synonyms", d.synonyms)}
        ${chips("Antonyms", d.antonyms)}
        <div class="ws-actions">
          <button class="ws-save">Save word</button>
          <button class="ws-fav ghost">★ Favourite</button>
          <button class="ws-open-app ghost">Open</button>
        </div>
        <div class="ws-status"></div>
      </div>`;
  }

  function selectionInfo() {
    const sel = window.getSelection();
    const text = sel?.toString().trim() || "";
    if (!sel || sel.rangeCount === 0 || !isSingleWord(text)) return null;
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    if (!rect || (!rect.width && !rect.height)) return null;
    return { text, rect };
  }

  document.addEventListener("mouseup", (e) => {
    if (host && e.composedPath().includes(host)) return;
    setTimeout(() => {
      const info = selectionInfo();
      if (!info) return removeTrigger();
      if (settings.floatingIcon === false) return;
      showTrigger(info.text, info.rect);
    }, 10);
  });

  document.addEventListener("dblclick", () => {
    if (!settings.doubleClickLookup) return;
    const info = selectionInfo();
    if (info) openPopup(info.text, info.rect);
  });

  document.addEventListener("mousedown", (e) => {
    if (host && e.composedPath().includes(host)) return;
    removeTrigger();
    closePopup();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      removeTrigger();
      closePopup();
    }
  });

  document.addEventListener("selectionchange", () => {
    if (!window.getSelection()?.toString().trim()) removeTrigger();
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === "WORDSNAP_SHOW" && msg.word) {
      const info = selectionInfo();
      openPopup(msg.word.split(/\s+/)[0], info?.rect);
    }
  });

  const STYLES = `
  :host { all: initial; }
  .ws-trigger, .ws-popup { position: absolute; z-index: 2147483647; font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
  .ws-trigger { width: 30px; height: 30px; border-radius: 10px; border: none; cursor: pointer;
    background: linear-gradient(135deg, #7C3AED, #EC4899); box-shadow: 0 6px 20px rgba(124,58,237,.45);
    display: flex; align-items: center; justify-content: center; padding: 0; animation: ws-pop .14s ease-out; }
  .ws-trigger img { width: 20px; height: 20px; border-radius: 6px; }
  @keyframes ws-pop { from { transform: scale(.7); opacity: 0 } to { transform: scale(1); opacity: 1 } }
  .ws-popup { border-radius: 20px; overflow: hidden; backdrop-filter: blur(18px); animation: ws-pop .16s ease-out;
    box-shadow: 0 24px 60px rgba(0,0,0,.45); font-size: 13.5px; line-height: 1.5; max-height: 70vh; overflow-y: auto; }
  .ws-dark { background: rgba(15,23,42,.92); color: #E2E8F0; border: 1px solid rgba(148,163,184,.18); }
  .ws-light { background: rgba(255,255,255,.96); color: #0F172A; border: 1px solid rgba(15,23,42,.1); }
  .ws-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; padding: 14px 16px 10px;
    background: linear-gradient(135deg, rgba(124,58,237,.28), rgba(236,72,153,.18)); }
  .ws-word { font-size: 17px; font-weight: 700; letter-spacing: -.01em; }
  .ws-sub { font-size: 11.5px; opacity: .75; margin-top: 2px; }
  .ws-close { background: transparent; border: none; color: inherit; font-size: 20px; line-height: 1; cursor: pointer; opacity: .7; }
  .ws-body { padding: 12px 16px 16px; display: flex; flex-direction: column; gap: 10px; }
  .ws-badges { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
  .ws-badge { font-size: 10.5px; padding: 3px 8px; border-radius: 999px; background: rgba(124,58,237,.22); border: 1px solid rgba(124,58,237,.35); }
  .ws-speak { border: none; border-radius: 10px; cursor: pointer; padding: 3px 8px; background: rgba(148,163,184,.18); color: inherit; }
  .ws-def { margin: 0; }
  .ws-label { display: block; font-size: 10.5px; text-transform: uppercase; letter-spacing: .08em; opacity: .6; margin-bottom: 2px; }
  .ws-row p, .ws-ai p { margin: 0; }
  .ws-ai { padding: 10px 12px; border-radius: 14px; background: linear-gradient(135deg, rgba(124,58,237,.16), rgba(236,72,153,.12)); }
  .ws-ex { font-style: italic; opacity: .9; }
  .ws-chips { display: flex; flex-wrap: wrap; gap: 5px; }
  .ws-chip { font-size: 11.5px; padding: 3px 9px; border-radius: 999px; background: rgba(148,163,184,.16); }
  .ws-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 2px; }
  .ws-actions button, .ws-signin { border: none; cursor: pointer; border-radius: 12px; padding: 8px 12px; font-size: 12.5px; font-weight: 600;
    background: linear-gradient(135deg, #7C3AED, #EC4899); color: #fff; }
  .ws-actions button.ghost { background: rgba(148,163,184,.18); color: inherit; }
  .ws-actions button:disabled { opacity: .6; cursor: default; }
  .ws-status { font-size: 12px; min-height: 14px; }
  .ws-ok { color: #34D399; } .ws-err { color: #F87171; }
  .ws-sk { height: 12px; border-radius: 8px; background: linear-gradient(90deg, rgba(148,163,184,.18), rgba(148,163,184,.32), rgba(148,163,184,.18));
    background-size: 200% 100%; animation: ws-shimmer 1.1s linear infinite; }
  .ws-sk.short { width: 60%; }
  @keyframes ws-shimmer { to { background-position: -200% 0 } }
  @media (prefers-reduced-motion: reduce) { .ws-trigger, .ws-popup, .ws-sk { animation: none } }
  `;
})();
