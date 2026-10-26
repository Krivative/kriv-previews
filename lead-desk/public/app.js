// Hash router: #screen or #screen/<lead id>. Each screen module exports render(view, id).
import { $, $$, setOnChange, toast } from "./ui.js";

const SCREENS = ["dashboard", "find", "check", "review", "build", "approve", "email", "linkedin"];
const loaded = {};

async function route() {
  const [name = "dashboard", id] = location.hash.slice(1).split("/").map(decodeURIComponent);
  const screen = SCREENS.includes(name) ? name : "dashboard";
  $$(".tabs a").forEach((a) => a.setAttribute("aria-current", a.getAttribute("href") === `#${screen}` ? "page" : "false"));
  const view = $("#view");
  if ($("#leadDialog").open) $("#leadDialog").close();
  try {
    loaded[screen] ??= await import(`./screens/${screen}.js`);
    view.innerHTML = '<p class="muted">Loading…</p>';
    setOnChange(() => loaded[screen].render(view, id));
    await loaded[screen].render(view, id);
  } catch (e) {
    console.error(e);
    view.innerHTML = /Failed to fetch dynamically imported module/.test(e.message)
      ? `<div class="panel banner"><h2>${screen}</h2><p>This screen is not built yet.</p></div>`
      : `<div class="panel banner"><b>Something went wrong:</b> ${e.message}</div>`;
    if (!/dynamically imported/.test(e.message)) toast(e.message);
  }
}
addEventListener("hashchange", route);
route();
