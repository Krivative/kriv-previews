// One-time Gmail sign-in for reply handling (docs/REPLIES.md).
//   node scripts/gmail-setup.mjs
// Needs kriv-leads\secrets\gmail-client.json (the OAuth "Desktop app" client from Google Cloud).
// Opens Google's sign-in page in the browser, receives the answer on 127.0.0.1 only, and saves
// the refresh token to kriv-leads\secrets\gmail-token.json. Never prints the token.
import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { exec } from "node:child_process";
import { gmailFiles, clientInfo, authUrl, exchangeCode, saveToken, gmailClient } from "../lead-desk/lib/gmail.mjs";

const leadsDir = process.env.KRIV_LEADS_DIR || join(homedir(), "kriv-leads");
const f = gmailFiles(leadsDir);
if (!existsSync(f.client)) {
  console.error(`Missing ${f.client}\nDownload the OAuth client (type "Desktop app") from Google Cloud and save it there. Steps: docs/REPLIES.md`);
  process.exit(1);
}
const client = clientInfo(f.client);
const state = randomBytes(16).toString("hex");

const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  if (url.pathname !== "/") { res.writeHead(404).end(); return; }
  const done = (msg, ok) => { res.writeHead(ok ? 200 : 400, { "content-type": "text/html; charset=utf-8" }).end(`<!doctype html><title>KRIV Gmail</title><p style="font:16px system-ui;padding:40px">${msg}</p>`); };
  try {
    if (url.searchParams.get("state") !== state) return done("This sign-in link is not from this setup run. Close this tab and run the setup again.", false);
    if (url.searchParams.get("error")) throw new Error(url.searchParams.get("error"));
    const redirectUri = `http://127.0.0.1:${server.address().port}/`;
    saveToken(leadsDir, await exchangeCode({ client, code: url.searchParams.get("code"), redirectUri }));
    const profile = await gmailClient({ leadsDir }).profile();
    done(`Connected: ${profile.emailAddress}. You can close this tab; the Desk checks replies every 30 minutes.`, true);
    console.log(`Connected Gmail for ${profile.emailAddress}. Sign-in saved in ${f.dir} (never in Git).`);
  } catch (e) {
    done(`Sign-in failed: ${String(e.message).replace(/</g, "&lt;")}. Close this tab and run the setup again.`, false);
    console.error(`Sign-in failed: ${e.message}`);
    process.exitCode = 1;
  }
  setTimeout(() => server.close(() => process.exit()), 500);
});
server.listen(0, "127.0.0.1", () => {
  const link = authUrl(client, `http://127.0.0.1:${server.address().port}/`, state);
  console.log("Opening Google sign-in. Sign in with the account that receives hello@kriv.agency and allow access.");
  console.log("If the browser does not open, paste this link into it:\n" + link);
  exec(`start "" "${link}"`, { shell: "cmd.exe" });
});
setTimeout(() => { console.error("Timed out after 10 minutes. Run the setup again."); process.exit(1); }, 600000).unref();
