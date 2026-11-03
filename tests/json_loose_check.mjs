// parseJSONLoose must survive an AI answer that was cut off part-way.
import { parseJSONLoose } from "../src/lib/text.js";
let ok = true;
const check = (c, m) => { console.log((c ? "PASS  " : "FAIL  ") + m); if (!c) ok = false; };

const full = '{"grammarNotes": "Nice \\"quote\\" here", "items": [{"danish": "hus", "english": "house", "type": "word", "category": "Home", "forms": []}, {"danish": "en bil", "english": "a car", "type": "word", "category": "Travel", "forms": [{"da": "biler", "en": "cars"}]}]}';
check(parseJSONLoose(full).items.length === 2, "a complete answer still parses");
check(parseJSONLoose("```json\n" + full + "\n```").items.length === 2, "a fenced answer still parses");

// cut off inside the second item
const cutMid = full.slice(0, full.indexOf('"en bil"') + 12);
let r = parseJSONLoose(cutMid);
check(r.items.length === 1 && r.items[0].danish === "hus" && r.grammarNotes.includes("quote"), "cut off mid-item: the finished item is kept");

// cut off right after the first item's closing brace
const cutAfter = full.slice(0, full.indexOf("}, {") + 1);
r = parseJSONLoose(cutAfter);
check(r.items.length === 1, "cut off between items: the finished item is kept");

// cut off inside a string with an escaped quote
const cutStr = full.slice(0, full.indexOf("Nice") + 12);
let threw = false;
try { parseJSONLoose(cutStr); } catch { threw = true; }
check(threw, "nothing usable at all still reports an error");

check((() => { try { parseJSONLoose("not json"); return false; } catch { return true; } })(), "plain text still reports an error");
console.log(ok ? "ALL PASSED" : "FAILED");
process.exit(ok ? 0 : 1);
