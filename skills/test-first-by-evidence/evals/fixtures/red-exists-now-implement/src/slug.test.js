import assert from "node:assert/strict";
import test from "node:test";

import { slugify } from "./slug.js";

test("lowercases and joins words with a single hyphen", () => {
  assert.equal(slugify("Hello  World"), "hello-world");
});

test("drops punctuation and trims the edges", () => {
  assert.equal(slugify("  Rock & Roll!  "), "rock-roll");
});
