// Adds the KRIV Sales connector to the Claude desktop app's config (merging, with a
// backup of any existing file). Restart the Claude app afterwards. Remove the
// "kriv-sales" entry from the same file to uninstall.
//   node scripts/install-sales-connector.mjs [--print]
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, readdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const entry = {
  command: process.execPath,
  args: ["--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", join(root, "lead-desk", "mcp", "sales-mcp.mjs")],
};

// Where the Claude desktop app reads its config, newest layout first:
// 1. Microsoft Store builds since 4.x: %LOCALAPPDATA%\Claude-Data\claude_<publisher id>
//    (the folder with the app's lockfile and settings; checked 2026-11-01 on 4.4212).
// 2. Older Store builds: %LOCALAPPDATA%\Packages\Claude_*\LocalCache\Roaming\Claude.
// 3. The classic installer: %APPDATA%\Claude.
export function configPath(env = process.env) {
  const local = env.LOCALAPPDATA ?? "";
  const packages = join(local, "Packages");
  const pkg = existsSync(packages) ? readdirSync(packages).find((d) => /^Claude_/.test(d)) : null;
  const dataRoot = join(local, "Claude-Data");
  const dataDirs = existsSync(dataRoot) ? readdirSync(dataRoot).filter((d) => /^claude_/i.test(d)) : [];
  const own = pkg ? dataDirs.find((d) => d.toLowerCase() === `claude_${pkg.split("_").pop()}`.toLowerCase()) : null;
  const data = own ?? (dataDirs.length === 1 ? dataDirs[0] : null);
  const candidates = [
    data && join(dataRoot, data),
    pkg && join(packages, pkg, "LocalCache", "Roaming", "Claude"),
  ].filter(Boolean);
  const dir = candidates.find((d) => existsSync(join(d, "lockfile")) || existsSync(join(d, "config.json"))) ?? join(env.APPDATA ?? "", "Claude");
  return join(dir, "claude_desktop_config.json");
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const file = configPath();
  if (process.argv.includes("--print")) { console.log(JSON.stringify({ file, mcpServers: { "kriv-sales": entry } }, null, 2)); process.exit(0); }
  let config = {};
  if (existsSync(file)) {
    copyFileSync(file, `${file}.bak-${Date.now()}`);
    config = JSON.parse(readFileSync(file, "utf8"));
  }
  config.mcpServers = { ...(config.mcpServers ?? {}), "kriv-sales": entry };
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(config, null, 2) + "\n");
  console.log(`KRIV Sales connector added to ${file}. Restart the Claude app to load it.`);
}
