import fs from "node:fs";
import path from "node:path";

/**
 * Launch gate. Task (e) can push more checks onto `LaunchCheck.checks`.
 * Task (d) fails while an unfinished legal marker remains in src/ or out/.
 * The marker is escaped here so this file is not itself a hit.
 */
export class LaunchCheck {
  static marker = "[\u00c0 COMPL\u00c9TER";

  static text = new Set([".md", ".html", ".txt", ".css", ".json", ".js", ".mjs", ".ts", ".tsx"]);

  static walk(dir, found = []) {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        if (name === "node_modules" || name === ".next" || name === ".git") continue;
        LaunchCheck.walk(full, found);
        continue;
      }
      if (LaunchCheck.text.has(path.extname(name))) found.push(full);
    }
    return found;
  }

  static markers(root) {
    if (!fs.existsSync(root)) return [];
    const hits = [];
    for (const file of LaunchCheck.walk(root)) {
      const text = fs.readFileSync(file, "utf8");
      if (text.includes(LaunchCheck.marker)) hits.push(file);
    }
    return hits;
  }

  static markerCheck(roots) {
    return roots.flatMap((root) => LaunchCheck.markers(root));
  }

  static checks = [LaunchCheck.markerCheck];

  static defaultRoots() {
    const src = path.resolve("src");
    const out = path.resolve("out");
    if (!fs.existsSync(src)) {
      console.error("check:launch: missing src/");
      return null;
    }
    return fs.existsSync(out) ? [src, out] : [src];
  }

  static run(roots) {
    const problems = [];
    for (const check of LaunchCheck.checks) {
      problems.push(...check(roots));
    }
    if (problems.length > 0) {
      console.error(`check:launch: ${problems.length} problem(s)`);
      for (const problem of problems) console.error(`  ${problem}`);
      return 1;
    }
    console.log("check:launch: ok");
    return 0;
  }
}

function rootsFromArgv(argv) {
  const flag = argv.indexOf("--root");
  if (flag === -1) return LaunchCheck.defaultRoots();
  const root = argv[flag + 1];
  if (!root || !fs.existsSync(root)) {
    console.error(`check:launch: missing ${root ?? "--root"}`);
    return null;
  }
  return [path.resolve(root)];
}

const roots = rootsFromArgv(process.argv.slice(2));
if (!roots) process.exit(1);
process.exit(LaunchCheck.run(roots));
