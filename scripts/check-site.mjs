// NODE_PATH=$(npm root -g) node scripts/check-site.mjs <url> [url...]  > out.json
// Checks a business's own website the way a visitor on a phone sees it and
// reports objective facts only: reachable, HTTPS, mobile layout, newest
// copyright year, load time, site builder, public email addresses, booking
// links. The lead finder uses `weak` and `flags` to qualify leads; see
// docs/LEAD-FINDER.md. Reads the home page and at most one contact page.
import { createRequire } from "node:module";
import { flagsFor, emailsIn, isRoleEmail, BOOKING_HOSTS } from "./site-flags.mjs";

// Playwright is not a project dependency; resolve it from the project or NODE_PATH.
const require = createRequire(import.meta.url);
const searchPaths = [process.cwd(), ...(process.env.NODE_PATH ?? "").split(":").filter(Boolean)];
const { chromium, devices } = require(require.resolve("playwright", { paths: searchPaths }));

const urls = process.argv.slice(2);
if (!urls.length) {
  console.error("usage: node scripts/check-site.mjs <url> [url...]");
  process.exit(1);
}

const browser = await chromium.launch();
const results = [];
for (const raw of urls) {
  const url = /^https?:\/\//.test(raw) ? raw : `https://${raw}`;
  // A real phone profile: builders like Wix serve a separate mobile site by user agent.
  const context = await browser.newContext({ ...devices["iPhone 13"] });
  const page = await context.newPage();
  const r = { url, checkedAt: new Date().toISOString() };
  try {
    const start = Date.now();
    const res = await page.goto(url, { waitUntil: "load", timeout: 30000 });
    r.loadMs = Date.now() - start;
    r.status = res?.status() ?? null;
    // Script-rendered sites (React, Wix) fill the page after "load", and some redirect
    // again; read the page once the network settles, as a visitor would.
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(1000);
    r.finalUrl = page.url();
    r.https = r.finalUrl.startsWith("https://");
    const facts = await page.evaluate(() => {
      const text = document.body?.innerText ?? "";
      const years = [...text.matchAll(/(?:©|&copy;|copyright)\s*(?:\d{4}\s*[-–]\s*)?(\d{4})/gi)].map((m) => Number(m[1]));
      return {
        title: document.title,
        viewportMeta: !!document.querySelector('meta[name="viewport"]'),
        // How far a visitor can actually scroll sideways (hidden overflow does not count).
        overflowPx: (window.scrollTo(5000, window.scrollY), Math.round(window.scrollX)),
        copyrightYear: years.length ? Math.max(...years) : null,
        generator: document.querySelector('meta[name="generator"]')?.getAttribute("content") ?? null,
        links: [...document.querySelectorAll("a[href]")].map((a) => ({ href: a.href, text: (a.textContent ?? "").trim().toLowerCase() })),
        text: text.slice(0, 200000),
        textLength: text.length,
      };
    });
    let { links, text } = facts;
    // One contact page, same site only.
    const contact = links.find((l) => /contact/.test(l.text + " " + l.href) && sameSite(l.href, r.finalUrl));
    if (contact) {
      try {
        await page.goto(contact.href, { waitUntil: "load", timeout: 20000 });
        r.contactUrl = page.url();
        const more = await page.evaluate(() => ({
          links: [...document.querySelectorAll("a[href]")].map((a) => ({ href: a.href, text: "" })),
          text: (document.body?.innerText ?? "").slice(0, 200000),
        }));
        links = links.concat(more.links);
        text += "\n" + more.text;
      } catch {
        r.contactUrl = null;
      }
    }
    const emails = emailsIn(text, links);
    Object.assign(r, {
      title: facts.title,
      viewportMeta: facts.viewportMeta,
      overflowPx: facts.overflowPx,
      copyrightYear: facts.copyrightYear,
      generator: facts.generator,
      textLength: facts.textLength,
      roleEmails: emails.filter(isRoleEmail),
      otherEmailCount: emails.filter((e) => !isRoleEmail(e)).length,
      bookingLinks: [...new Set(links.map((l) => hostOf(l.href)).filter((h) => h && BOOKING_HOSTS.some((b) => h.endsWith(b))))],
    });
  } catch (e) {
    r.error = String(e.message ?? e).split("\n")[0];
  }
  Object.assign(r, flagsFor(r));
  results.push(r);
  console.error(`${r.weak ? "WEAK" : r.flags.includes("not-checked") ? "SKIP" : r.error ? "ERR " : "ok  "} ${url}  ${r.flags.join(", ")}`);
  await context.close();
}
await browser.close();
console.log(JSON.stringify(results, null, 2));

function hostOf(href) {
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}
function sameSite(a, b) {
  return hostOf(a) === hostOf(b);
}
