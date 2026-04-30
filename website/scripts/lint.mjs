import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const checkedExtensions = new Set([".html", ".js", ".css", ".json"]);
const ignoredDirectories = new Set(["node_modules", "dist", "playwright-report", "test-results"]);
const failures = [];

function extensionFor(path) {
  const index = path.lastIndexOf(".");
  return index === -1 ? "" : path.slice(index);
}

function walk(directory) {
  for (const entry of readdirSync(directory)) {
    if (ignoredDirectories.has(entry)) {
      continue;
    }

    const path = join(directory, entry);
    const stat = statSync(path);

    if (stat.isDirectory()) {
      walk(path);
      continue;
    }

    if (!checkedExtensions.has(extensionFor(path))) {
      continue;
    }

    const content = readFileSync(path, "utf8");
    if (/[ \t]+$/m.test(content)) {
      failures.push(`${path}: trailing whitespace`);
    }
    if (!content.endsWith("\n")) {
      failures.push(`${path}: missing final newline`);
    }
  }
}

walk(process.cwd());

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}
