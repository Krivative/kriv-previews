// Hash router: #screen or #screen/<lead id>. Each screen module exports render(view, id).
import { $, $$, setOnChange, toast, esc, setNavigationSignal } from "./ui.js";

const SCREENS = ["inbox", "sales", "focus", "dashboard", "find", "check", "review", "build", "approve", "email", "replies", "linkedin"];
const loaded = {};
let active = null;
let activeHash = location.hash;
let navigation = 0;
let controller;

async function route() {
  const ticket = ++navigation;
  const nextHash = location.hash;
  try { await active?.beforeLeave?.(); }
  catch (e) { history.replaceState(null, "", activeHash || "#inbox"); toast(e.message); return; }
  if (ticket !== navigation) return;
  active?.dispose?.(); active = null;
  controller?.abort(); controller = new AbortController(); setNavigationSignal(controller.signal);
  const [name = "inbox", id, step] = (location.hash.slice(1) || "inbox").split("/").map(decodeURIComponent);
  const screen = SCREENS.includes(name) ? name : "inbox";
  $$(".tabs a").forEach((a) => a.setAttribute("aria-current", a.getAttribute("href") === `#${screen}` ? "page" : "false"));
  const view = $("#view");
  if ($("#leadDialog").open) $("#leadDialog").close();
  try {
    loaded[screen] ??= await import(`./screens/${screen}.js`);
    view.innerHTML = '<p class="muted">Loading…</p>';
    if (ticket !== navigation) return;
    setOnChange(route);
    active = await loaded[screen].render(view, id, step);
    activeHash = nextHash;
    document.body.dataset.screen = screen;
  } catch (e) {
    if (ticket !== navigation || e.name === "AbortError") return;
    console.error(e);
    view.innerHTML = /Failed to fetch dynamically imported module/.test(e.message)
      ? `<div class="panel banner"><h2>${screen}</h2><p>This screen is not built yet.</p></div>`
      : `<div class="panel banner"><b>Something went wrong:</b> ${esc(e.message)} <a href="#inbox">Return to inbox</a></div>`;
    if (!/dynamically imported/.test(e.message)) toast(e.message);
  }
}
addEventListener("hashchange", route);
route();
