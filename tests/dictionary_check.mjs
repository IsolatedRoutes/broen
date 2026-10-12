// Where entries are filed in the Dictionary. Run: node tests/dictionary_check.mjs
import { dictionaryKey } from "../src/lib/dictionarySort.js";
let bad = 0;
const t = (text, letter, opts = {}) => {
  const got = dictionaryKey(text, opts)[0].toUpperCase();
  console.log((got === letter ? "PASS  " : "FAIL  ") + text + " -> " + got + (got === letter ? "" : " (wanted " + letter + ")"));
  if (got !== letter) bad++;
};
t("at gå", "G"); t("en hund", "H"); t("et hus", "H");
t("i dag", "D"); t("i går", "G"); t("på grund af", "G"); t("for eksempel", "E"); t("med hensyn til", "H");
t("til sidst", "S"); t("i det mindste", "M"); t("ved siden af", "S"); t("fra tid til anden", "T");
t("i", "I"); t("på", "P"); t("til", "T");                       // the little word alone keeps its place
t("I går var jeg hjemme.", "I", { sentence: true });             // sentences keep their first letter
t("i stedet for", "S"); t("om morgenen", "M");
t("a dog", "D", { englishFirst: true }); t("to go", "G", { englishFirst: true }); t("for example", "F", { englishFirst: true });
t("Aarhus", "A");
console.log(bad ? "\nFAILED" : "\nALL PASSED"); process.exit(bad ? 1 : 0);
