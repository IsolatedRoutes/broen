// Checks the ready-made lightbulb files: every entry belongs to a built-in
// word, sits in the right file, and has everything the popup shows.
import { readFileSync, readdirSync } from "node:fs";
import { lightbulbBucket } from "../src/lib/lightbulb.js";
import { frontKey } from "../src/lib/text.js";
const levelOf = new Map();
for (const l of readFileSync("src/data/words.tsv", "utf8").split("\n")) { const c = l.split("\t"); if (c[0]) levelOf.set(frontKey(c[0]), Number(c[3])); }
const fronts = new Set(readFileSync("src/data/words.tsv", "utf8").split("\n").map((l) => frontKey(l.split("\t")[0])).filter(Boolean));
let bad = 0, n = 0;
// Reviewed: the example proves a usage claim made in the sentence before it (no article, reply, advice, two senses), so it stays.
const KEEP_EXAMPLE = new Set(["antibiotika", "at forbyde", "forhåbentlig", "forresten", "jaså", "nemlig", "hvis jeg var dig", "at jage", "at søge", "et spor", "sikke noget"]);
const fail = (m) => { bad++; console.log("  problem: " + m); };
for (const f of readdirSync("lightbulb").filter((x) => x.endsWith(".json"))) {
  const data = JSON.parse(readFileSync("lightbulb/" + f, "utf8"));
  for (const [k, e] of Object.entries(data)) {
    n++;
    if (!fronts.has(k)) fail(k + " is not a built-in word");
    if (lightbulbBucket(k) + ".json" !== f) fail(k + " is in the wrong file " + f);
    if (!Array.isArray(e.forms) || !e.forms.length || e.forms.some((x) => !x.da || !x.en)) fail(k + ": forms");
    if (!e.explanation || e.explanation.length < 15) fail(k + ": explanation too short");
    if (!/^"[^"]+"/.test(e.explanation)) fail(k + ": explanation must open with the quoted word'");
    const banned = /learn (it|them) as|fixed phrase|written as one word|usual pattern|participle|infinitive|conjugat|declen|definite|indefinite|neuter|\bis the (head|doll)\b|useful for text|\bit is an? (en|et)-word/i;
    if (banned.test(e.explanation)) fail(k + ": explanation has banned wording");
    // Owner's wording rules: vague phrases a beginner cannot picture.
    const vague = /\bon its own\b|even for a single pair/i;
    if (vague.test(e.explanation)) fail(k + ": explanation has a vague phrase");
    // Round 2 (owner): no "Compare X with Y", no vague wording, every Danish phrase or sentence in quotes.
    // Round 3 (owner): abstract labels and pointers that tell a learner nothing.
    const vague3 = /which is (for|used for) (choices|situations|things|cases|people)|\b(group word|collective(?! agreement)|countable|uncountable|all the pieces|as a whole)\b|\bthe (exact|right|proper|correct|appropriate) (item|word|one|form|term)\b|a more specific (word|one|term)|\bin (other|some|certain) (contexts|cases|situations)\b|you do not count it|\bhas no plural\b|which looks (similar|close)|\bit looks (similar|close) to|\b(small|big|large|capital) letters?\b/i;
    if (vague3.test(e.explanation)) fail(k + ": explanation has an abstract label or vague pointer (see round 3 rules)");
    const vague2 = /(^|[.!?]\s)(Compare|Contrast|Look at)\b|rest of the sentence shows|\ba rough (number|figure|amount|guess|idea)|shows up in phrases|\bCareful:/;
    if (vague2.test(e.explanation)) fail(k + ": explanation has wording the owner rejected (Compare / rough / rest of the sentence shows)");
    for (const m of e.explanation.matchAll(/(.)\s\(([A-Z][^()]*(?:\s[^()]*){2,}|[A-Z][^()]*[?!])\)/g)) {
      // an English gloss that starts with a capital belongs to a phrase or sentence, which must be in quotes
      if (m[1] !== '"' && m[1] !== '”') { fail(k + ": a Danish phrase or sentence is not in quotes before (" + m[2] + ")"); break; }
    }
    // A plain second example (a sentence that only shows the meaning again) does not belong in the
    // explanation: the "In a sentence" box already has one. Pattern: `"X" means "..." ...: Danish (English).`
    {
      const ex = e.explanation;
      const m = ex.match(/^"[^"]+" means (?:(?!\. )[^:])*?: ([^():]+?) \(([^()]+)\)[.!?](?: |$)/);
      const lead = ex.split(":")[0];
      const cue = /\b(compare|followed by|use |not |instead|unlike|versus| vs |while|whereas|To say|To ask|To mean|In a command|polite|formal|informal|also|other|different|opposite|contrast|but |only|never|always|cannot|another|second|first|before|after|plural|older|newer|spoken|written|slang|rude)\b/i;
      const leadCue = /\b(with|add|Add|say|Say|ask|takes|goes|after|used with)\b/;
      const core = k.replace(/^(en|et|at) /, "");
      const stem = core.includes(" ") ? core.split(" ")[0].slice(0, 4) : core.slice(0, Math.max(4, core.length - 2));
      const english = /\b(the|you|is|are|it|to|a|an|of|and|in|for|say|says|use|used|also|can|will|as|this|that|they|we|he|she|his|her|at|on|by|be|from|your|has|have)\b/;
      if (m && !KEEP_EXAMPLE.has(k) && !cue.test(ex) && !leadCue.test(lead) && (ex.match(/\(/g) || []).length <= 2 && m[1].trim().split(/\s+/).length >= 3 && m[1].toLowerCase().includes(stem.toLowerCase()) && !english.test(m[1].toLowerCase())) {
        fail(k + ": explanation repeats a plain example (the In a sentence box has one)");
      }
    }
    {
      const words = (x) => new Set((x.toLowerCase().replace(/^(at|en|et)\s+/, "").match(/[\p{L}\d]+/gu) || []));
      const parts = words(k);
      if (parts.size > 1 && Array.isArray(e.related))
        for (const r of e.related) {
          const rw = [...words(r.da || "")];
          if (rw.length && rw.every((w) => parts.has(w))) fail(k + ": related '" + r.da + "' is just part of the card itself");
        }
    }
    if (Array.isArray(e.related)) {
      const ex = " " + e.explanation.toLowerCase().replace(/[^\p{L}\d]+/gu, " ") + " ";
      for (const r of e.related) {
        const w = (r.da || "").toLowerCase().replace(/^(at|en|et)\s+/, "").replace(/[^\p{L}\d]+/gu, " ").trim();
        if (w && ex.includes(" " + w + " ")) fail(k + ": related '" + r.da + "' is already in the explanation");
      }
    }
    if (!Array.isArray(e.related) || e.related.length < 3 || e.related.length > 4) fail(k + ": related must have 3 or 4 words");
    if (!e.sentence || !e.sentence.da || !e.sentence.en) fail(k + ": sentence");
    else if (!/\*\*[^*]+\*\*/.test(e.sentence.da)) fail(k + ": sentence word not marked with **");
    else {
      // The marked word must be the card's own word (no en/et/at), not a "the" or plural form.
      const norm = (x) => x.toLowerCase().replace(/[^\p{L}\d ]/gu, "").trim();
      { const max = levelOf.get(k) === 1 ? 8 : 14; if (e.sentence.da.replace(/\*\*/g, "").trim().split(/\s+/).length > max) fail(k + ": sentence longer than " + max + " words for its level"); }
      const marked = e.sentence.da.match(/\*\*([^*]+)\*\*/)[1];
      const base = k.replace(/^(en|et|at) /, "");
      const loose = ["både…og", "enten…eller", "er det ...?", "en / et", "jo ... desto"]; // two-part phrases: the sentence marks both halves
      if (!loose.includes(k) && ![norm(base), norm(k)].includes(norm(marked))) fail(k + ": sentence marks '" + marked + "' instead of the card's word");
    }
  }
}
console.log(n + " ready-made entries checked");
process.exit(bad ? 1 : 0);
