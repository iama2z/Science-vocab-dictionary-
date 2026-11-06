#!/usr/bin/env node
/*
 * Checks every vocabulary data file in data/ for common mistakes.
 * Usage: node scripts/validate-data.js
 */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const dataDir = path.join(root, "data");
const RELATIONSHIPS = ["causes", "caused-by", "part-of", "has-part", "related"];

const errors = [];
const warnings = [];

const files = fs.readdirSync(dataDir).filter((f) => f.endsWith(".js") && f !== "TEMPLATE.js").sort();
const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");

const sandbox = { window: {} };
vm.createContext(sandbox);

files.forEach((file) => {
  if (!indexHtml.includes(`src="data/${file}"`)) {
    errors.push(`${file}: not loaded in index.html (add <script src="data/${file}"></script>)`);
  }
  try {
    vm.runInContext(fs.readFileSync(path.join(dataDir, file), "utf8"), sandbox, { filename: file });
  } catch (e) {
    errors.push(`${file}: could not be read — ${e.message}`);
  }
});

const units = (sandbox.window.VOCAB_DATA && sandbox.window.VOCAB_DATA.units) || [];
const norm = (w) => String(w || "").trim().toLowerCase();
const isNonEmptyString = (v) => typeof v === "string" && v.trim() !== "";

const allWords = new Map();
const unitIds = new Set();

units.forEach((unit) => {
  const u = `Unit ${unit.id}`;
  if (!isNonEmptyString(String(unit.id || ""))) errors.push("A unit is missing an id");
  if (unitIds.has(String(unit.id))) errors.push(`${u}: duplicate unit id`);
  unitIds.add(String(unit.id));
  if (!isNonEmptyString(unit.title)) errors.push(`${u}: missing title`);
  if (!Array.isArray(unit.lessons)) {
    errors.push(`${u}: "lessons" must be a list`);
    return;
  }
  const lessonNumbers = new Set();
  unit.lessons.forEach((lesson) => {
    const l = `${u} Lesson ${lesson.number}`;
    if (typeof lesson.number !== "number") errors.push(`${l}: "number" must be a number`);
    if (lessonNumbers.has(lesson.number)) errors.push(`${l}: duplicate lesson number`);
    lessonNumbers.add(lesson.number);
    ["officialVocabulary", "trickyWords", "terms"].forEach((key) => {
      if (lesson[key] !== undefined && !Array.isArray(lesson[key])) errors.push(`${l}: "${key}" must be a list`);
    });
    (lesson.terms || []).forEach((term) => {
      const t = `${l} "${term.word}"`;
      if (!isNonEmptyString(term.word)) {
        errors.push(`${l}: a term is missing "word"`);
        return;
      }
      if (allWords.has(norm(term.word))) errors.push(`${t}: duplicate word (also in ${allWords.get(norm(term.word))})`);
      allWords.set(norm(term.word), l);
      if (!isNonEmptyString(term.definition)) errors.push(`${t}: missing definition`);
      ["characteristics", "examples", "nonExamples", "related"].forEach((key) => {
        if (term[key] !== undefined && !Array.isArray(term[key])) errors.push(`${t}: "${key}" must be a list`);
      });
      if (term.check) {
        const c = term.check;
        if (!isNonEmptyString(c.question)) errors.push(`${t}: check is missing "question"`);
        if (!Array.isArray(c.choices) || c.choices.length < 2) errors.push(`${t}: check needs at least 2 choices`);
        else if (c.answer !== undefined && (!Number.isInteger(c.answer) || c.answer < 0 || c.answer >= c.choices.length)) {
          errors.push(`${t}: check "answer" must be 0 to ${c.choices.length - 1} (0 = A, 1 = B, ...)`);
        }
      }
      (term.related || []).forEach((rel) => {
        if (!isNonEmptyString(rel.word)) errors.push(`${t}: a related word is missing "word"`);
        if (!RELATIONSHIPS.includes(rel.relationship)) {
          errors.push(`${t}: related word "${rel.word}" has unknown relationship "${rel.relationship}" (use ${RELATIONSHIPS.join(", ")})`);
        }
      });
    });
  });
});

// Related words that don't have their own entry yet (informational only).
units.forEach((unit) =>
  (unit.lessons || []).forEach((lesson) =>
    (lesson.terms || []).forEach((term) =>
      (term.related || []).forEach((rel) => {
        if (rel.word && !allWords.has(norm(rel.word))) {
          warnings.push(`"${term.word}" links to "${rel.word}", which has no entry yet`);
        }
      })
    )
  )
);

warnings.forEach((w) => console.log(`note: ${w}`));
errors.forEach((e) => console.error(`ERROR: ${e}`));
console.log(`\nChecked ${files.length} file(s), ${units.length} unit(s), ${allWords.size} word(s).`);
if (errors.length) {
  console.error(`${errors.length} error(s) found.`);
  process.exit(1);
}
console.log("All good! ✅");
