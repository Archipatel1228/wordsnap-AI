import { getSettings, setSettings } from "./lib/shared.js";

const fields = [...document.querySelectorAll("[data-key]")];
const settings = await getSettings();

for (const el of fields) {
  const key = el.dataset.key;
  if (el.type === "checkbox") el.checked = Boolean(settings[key]);
  else el.value = settings[key];
  el.addEventListener("change", async () => {
    await setSettings({ [key]: el.type === "checkbox" ? el.checked : el.value });
    const note = document.getElementById("saved-note");
    note.textContent = "Saved ✓";
    setTimeout(() => (note.textContent = "Changes save automatically"), 1200);
  });
}
