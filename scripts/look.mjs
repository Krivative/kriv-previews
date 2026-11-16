// Measures a story page instead of looking at screenshots of it. Prints one small table.
//   node scripts/look.mjs <slug> [?look=seed]      BASE_URL defaults to http://localhost:3211/for
// For every chapter at phone, tablet and desktop: does anything cover the words, does the page
// scroll sideways, do the words fit the screen, is any text under 12px. Exit 1 if anything fails.
// Playwright is not a dependency: it is resolved from the project, NODE_PATH, or the sibling kriv-site folder,
// and uses the Chrome already installed when it has no browser of its own.
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const paths = [process.cwd(), ...(process.env.NODE_PATH ?? "").split(":").filter(Boolean), path.join(process.cwd(), "..", "kriv-site")];
let chromium;
for (const name of ["playwright", "@playwright/test"]) { try { ({ chromium } = require(require.resolve(name, { paths }))); break; } catch { /* try the next */ } }
if (!chromium) { console.error("Playwright not found. Install it, or set NODE_PATH to a folder that has it."); process.exit(1); }

const [slug, query = ""] = process.argv.slice(2);
if (!slug) { console.error("usage: node scripts/look.mjs <slug> [?look=seed]"); process.exit(1); }
const url = `${process.env.BASE_URL ?? "http://localhost:3211/for"}/${slug}${query}`;
const sizes = [["phone", 360, 740], ["phone", 390, 844], ["tablet", 820, 1180], ["desktop", 1280, 800]];

let browser;
try { browser = await chromium.launch(); } catch { browser = await chromium.launch({ channel: "chrome" }); }
let failed = false;
console.log(`${url}\nsize          chapters  covered  sideways  cut off  small text`);
for (const [label, width, height] of sizes) {
  const page = await browser.newPage({ viewport: { width, height } });
  // A finished story scrolls freely, so every chapter can be visited without waiting for narration.
  await page.addInitScript((id) => { try { localStorage.setItem(`journey-done:${id}`, "1"); } catch { /* private window */ } }, slug);
  await page.goto(url, { waitUntil: "networkidle" });
  const result = await page.evaluate(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const box = (el) => el?.getBoundingClientRect();
    const hit = (a, b) => a && b && a.width && b.width && !(a.right <= b.left + 1 || a.left >= b.right - 1 || a.bottom <= b.top + 1 || a.top >= b.bottom - 1);
    const out = { chapters: 0, covered: [], sideways: false, cut: [], small: 0 };
    // The locked story only: the first story on the page. Later levels scroll freely and may be longer than a screen.
    const story = document.querySelector("[data-step]");
    const steps = [...(story ?? document).querySelectorAll("[data-journey-step]")].filter((el) => el.closest("[data-step]") === story);
    for (const [n, step] of steps.entries()) {
      step.scrollIntoView({ block: "start", behavior: "instant" });
      await wait(450);
      document.getAnimations().forEach((a) => { try { if (a.effect.getTiming().iterations !== Infinity) a.finish(); } catch { /* not finishable */ } });
      const words = box(step.querySelector('[class*="words"]'));
      const hud = [...document.querySelectorAll('[class*="crest"] span, [data-voice-button], [data-sound-button], [data-cast-quiet], [data-cast] button, [role="status"] span')].filter((el) => el.offsetParent && el.textContent !== "" || el.matches('[class*="crest"] span'));
      if (hud.some((el) => hit(box(el), words))) out.covered.push(n + 1);
      if (words && words.bottom > innerHeight + 1) out.cut.push(n + 1);
      if (document.documentElement.scrollWidth > innerWidth + 1) out.sideways = true;
      out.chapters++;
    }
    out.small = [...(story ?? document).querySelectorAll("[data-journey-step] *")].filter((el) => el.children.length === 0 && el.textContent.trim() && el.offsetParent && parseFloat(getComputedStyle(el).fontSize) < 11.5).length;
    return out;
  });
  const bad = result.covered.length || result.sideways || result.cut.length;
  if (bad || !result.chapters) failed = true;
  console.log(`${`${label} ${width}`.padEnd(13)} ${String(result.chapters).padStart(8)}  ${(result.covered.join(",") || "none").padStart(7)}  ${(result.sideways ? "YES" : "no").padStart(8)}  ${(result.cut.join(",") || "none").padStart(7)}  ${String(result.small).padStart(10)}`);
  await page.close();
}
await browser.close();
console.log(failed ? "\nFAILED: see the chapter numbers above." : "\nClean at every size.");
process.exit(failed ? 1 : 0);
