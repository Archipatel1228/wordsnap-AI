const send = (msg) =>
  new Promise((resolve) => chrome.runtime.sendMessage(msg, (res) => resolve(res || { ok: false })));

const $ = (id) => document.getElementById(id);
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

async function refresh() {
  const res = await send({ type: "STATS" });
  const data = res.ok ? res.data : { signedIn: false };
  if (!data.signedIn) {
    $("signed-out").hidden = false;
    $("signed-in").hidden = true;
    $("account").textContent = "Not signed in";
    return;
  }
  $("signed-out").hidden = true;
  $("signed-in").hidden = false;
  $("account").textContent = data.email || "Signed in";
  $("streak").textContent = data.streak;
  $("total").textContent = data.total;
  $("recent").innerHTML =
    data.recent.length > 0
      ? data.recent.map((w) => `<li>${esc(w)}</li>`).join("")
      : `<li>No saved words yet</li>`;
}

$("signin").addEventListener("click", () => send({ type: "OPEN_APP", path: "/login" }));
$("dashboard").addEventListener("click", () => send({ type: "OPEN_APP", path: "/home" }));
$("settings").addEventListener("click", () => chrome.runtime.openOptionsPage());

$("search").addEventListener("submit", async (e) => {
  e.preventDefault();
  const word = $("query").value.trim();
  if (!word) return;
  const out = $("result");
  out.textContent = "Looking up…";
  const res = await send({ type: "LOOKUP", word });
  if (!res.ok) {
    out.innerHTML = `<p class="err">${esc(res.error || "Lookup failed")}</p>`;
    return;
  }
  const d = res.data;
  const ai = d.ai || {};
  out.innerHTML = `
    <div class="word">${esc(d.word)} <small>${esc([d.partOfSpeech, d.phonetic].filter(Boolean).join(" · "))}</small></div>
    ${d.definition ? `<div class="row">${esc(d.definition)}</div>` : ""}
    ${ai.explanation ? `<div class="ai">${esc(ai.explanation)}</div>` : ""}
    <div class="row"><button class="primary" id="save">Save word</button></div>
    <div class="row" id="save-status"></div>`;
  $("save").addEventListener("click", async () => {
    const saved = await send({
      type: "SAVE_WORD",
      payload: {
        word: d.word,
        definition: d.definition,
        partOfSpeech: d.partOfSpeech,
        phonetic: d.phonetic,
        audio: d.audio,
      },
    });
    $("save-status").innerHTML = saved.ok
      ? "Saved ✓"
      : saved.error === "NOT_SIGNED_IN"
        ? `<span class="err">Sign in first</span>`
        : `<span class="err">${esc(saved.error)}</span>`;
    if (saved.ok) refresh();
  });
});

refresh();
