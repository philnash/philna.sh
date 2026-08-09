import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("built feed contains Astro-rendered images and absolute content URLs in CDATA", async () => {
  const feed = await readFile("dist/client/feed.xml", "utf8");
  const item = feed.match(
    /<item><title>5 quick tips for giving better presentations<\/title>.*?<\/item>/s,
  )?.[0];

  assert.ok(item, "expected the talking tips post in the built feed");
  assert.match(item, /<description><!\[CDATA\[/);
  assert.match(
    item,
    /<img [^>]*src="https:\/\/philna\.sh\/_astro\/zooming-vscode\.[^"]+\.gif"/,
  );
  assert.match(
    item,
    /<a href="https:\/\/philna\.sh\/speaking">speaking publicly<\/a>/,
  );
  assert.doesNotMatch(item, /\b(?:href|src)="(?:\/|\.\.?\/)/);
  assert.match(item, /\]\]><\/description>/);
});
