import { test } from "node:test";
import assert from "node:assert/strict";
import { paginate } from "./pdf-generator";

test("fills a single page when labels fit", () => {
  const pages = paginate(10, 21, 1);
  assert.equal(pages.length, 1);
  assert.equal(pages[0].length, 10);
  assert.equal(pages[0][0].position, 0);
  assert.equal(pages[0][9].position, 9);
});

test("overflows onto a second page (25 labels on 21-per-sheet)", () => {
  const pages = paginate(25, 21, 1);
  assert.equal(pages.length, 2);
  assert.equal(pages[0].length, 21);
  assert.equal(pages[1].length, 4);
  assert.equal(pages[1][0].position, 0); // new sheet starts at slot 0
});

test("startAtPosition offsets the first sheet only", () => {
  // start at position 20 of a 21-slot sheet: 1 label on sheet one, rest flow on
  const pages = paginate(5, 21, 20);
  assert.equal(pages.length, 2);
  assert.equal(pages[0].length, 2); // slots 19 (index) and 20
  assert.equal(pages[0][0].position, 19);
  assert.equal(pages[1][0].position, 0);
});

test("exact fit produces no empty trailing page", () => {
  const pages = paginate(21, 21, 1);
  assert.equal(pages.length, 1);
});

test("zero labels produces zero pages", () => {
  assert.equal(paginate(0, 21, 1).length, 0);
});

test("out-of-range start position clamps to last slot instead of crashing", () => {
  const pages = paginate(2, 21, 99);
  assert.equal(pages[0][0].position, 20);
  assert.equal(pages.length, 2);
});
