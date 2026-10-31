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

// The Microsoft Store app keeps its data under Packages\Claude_*\LocalCache\Roaming\Claude.
function configPath() {
  const local = process.env.LOCALAPPDATA ?? "";
  const pkg = existsSync(join(local, "Packages")) ? readdirSync(join(local, "Packages")).find((d) => /^Claude_/.test(d)) : null;
  const store = pkg ? join(local, "Packages", pkg, "LocalCache", "Roaming", "Claude") : null;
  const classic = join(process.env.APPDATA ?? "", "Claude");
  return join(store && existsSync(store) ? store : classic, "claude_desktop_config.json");
}

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
