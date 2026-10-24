import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

test("one leftover data-placeholder fails check:launch", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "launch-placeholder-"));
  fs.writeFileSync(
    path.join(dir, "index.html"),
    '<main><svg data-placeholder="true"></svg></main>',
  );
  const result = spawnSync(process.execPath, ["scripts/check-launch.mjs", "--root", dir], {
    encoding: "utf8",
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /data-placeholder="true"/);
  assert.match(result.stderr, /index\.html/);
});
