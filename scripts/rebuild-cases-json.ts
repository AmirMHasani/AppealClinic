#!/usr/bin/env bun
/** Rebuild golden-set/cases.json from golden-set/cases/*.json (PSO→AD→HS order). */
import fs from "node:fs";
import path from "node:path";
const dir = path.join("golden-set", "cases");
const order = [
  ...Array.from({ length: 15 }, (_, i) => `SYN-PSO-${String(i + 1).padStart(3, "0")}`),
  ...Array.from({ length: 15 }, (_, i) => `SYN-AD-${String(i + 1).padStart(3, "0")}`),
  ...Array.from({ length: 10 }, (_, i) => `SYN-HS-${String(i + 1).padStart(3, "0")}`),
];
const arr = order.map((id) =>
  JSON.parse(fs.readFileSync(path.join(dir, `${id}.json`), "utf8"))
);
fs.writeFileSync(path.join("golden-set", "cases.json"), JSON.stringify(arr));
console.log("wrote golden-set/cases.json", arr.length);
