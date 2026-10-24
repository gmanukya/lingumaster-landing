import assert from "node:assert/strict";
import test from "node:test";
import { Copy } from "./Copy";
import { Draft } from "./Draft";

test("approved copy does not show the BROUILLON chip", () => {
  assert.equal(Copy.status(), "approved");
  assert.equal(Copy.isDraft("approved"), false);
  assert.equal(Copy.isDraft(), false);
});

test("a draft status still shows the BROUILLON chip", () => {
  assert.equal(Copy.isDraft("draft:copy-new-v1"), true);
  assert.equal(Draft.label, "BROUILLON");
});
