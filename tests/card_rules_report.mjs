// Lists built-in lightbulb cards that probably break one of the owner's final card rules
// (docs/LIGHTBULB_REVIEW.md). A script cannot judge meaning, so this is a candidate list:
// every card it prints is read and fixed or cleared. Usage: node tests/card_rules_report.mjs [--rule NAME]
import { readFileSync, readdirSync } from "node:fs";
const only = process.argv.includes("--rule") ? process.argv[process.argv.indexOf("--rule") + 1] : null;
const out = {}; // rule -> [ [key, detail] ]
const add = (rule, k, d) => { (out[rule] ||= []).push([k, d]); };
const strip = (x) => x.toLowerCase().replace(/[^\p{L}\d ]/gu, " ").replace(/\s+/g, " ").trim();
let n = 0;
for (const f of readdirSync("lightbulb").filter((x) => x.endsWith(".json"))) {
  const data = JSON.parse(readFileSync("lightbulb/" + f, "utf8"));
  for (const [k, e] of Object.entries(data)) {
    n++;
    const ex = e.explanation;
    // OPENING + ONE ENGLISH WORDING
    const op = ex.match(/^"([^"]+)" (?:means|can mean|is) "([^"]+)"/);
    if (!op) add("opening", k, ex.slice(0, 80));
    else {
      const first = strip((e.forms[0].en || "").replace(/\([^)]*\)/g, ""));
      const meaning = strip(op[2]);
      if (first !== meaning && !meaning.includes(first) && !first.includes(meaning)) add("wording-differs", k, `opening "${op[2]}" vs forms "${e.forms[0].en}"`);
      else if (/\(/.test(e.forms[0].en) && !/\(/.test(op[2])) add("wording-differs", k, `forms "${e.forms[0].en}" vs opening "${op[2]}"`);
      // DO NOT REPEAT THE TRANSLATION: a description clause hangs right after the meaning
      const rest = ex.slice(op[0].length);
      if (/^,\s+(a |an |the |where |which |what |something |someone |used |it is |it's |one |that |to )/i.test(rest) || /^ (and|or) is (a|an|the|used|where)/i.test(rest)) add("describes-the-meaning", k, rest.slice(0, 90));
    }
    // sentences (split outside brackets/quotes is hard; split on '. ' followed by capital or quote)
    const sentences = ex.split(/(?<=[.!?])\s+(?=["A-ZÆØÅ])/);
    // SHORT SENTENCES / NO REPETITION (size)
    for (const s of sentences) { const w = s.replace(/\([^)]*\)/g, "").trim().split(/\s+/).length; if (w > 24) { add("long-sentence", k, w + " words: " + s.slice(0, 100)); break; } }
    if (sentences.length > 4) add("many-sentences", k, sentences.length + " sentences");
    // CERTAIN CLAIMS ONLY
    const hedge = ex.match(/\b(often|usually|more often|typically|generally|commonly|mostly|normally|sometimes|rarely|most Danes|many Danes|Danes (?:often|usually|say|eat|use|prefer))\b/i);
    if (hedge) add("hedge-or-claim", k, hedge[0] + " :: " + ex.slice(Math.max(0, hedge.index - 40), hedge.index + 60));
    // LEAD-IN FOR EVERY EXAMPLE: "... also ...: "Danish"" / short lead with no purpose
    for (const m of ex.matchAll(/([^.:]*?)\b(also|too)\b([^.:]*):\s+"([^"]+)"/g)) { add("bare-example-after-also", k, m[0].slice(-110)); break; }
    for (const m of ex.matchAll(/(?:^|[.!?]\s)([^.:"]{0,60}):\s+"[^"]+"\s*\([^)]*\)/g)) {
      const lead = m[1].trim();
      if (lead && !/\b(say|says|ask|use|used|write|add|means?|for|to|if|when|not|do not|never|include|put|with|after|before|from|like|such as|example|instead|compare|differs?|difference)\b/i.test(lead)) { add("colon-lead-weak", k, lead + ": ..."); break; }
    }
    // NO REPETITION: Danish quoted examples (3+ words) that share a frame
    const dk = [...ex.matchAll(/"([^"]{8,}?)"\s*\(/g)].map((m) => m[1]).filter((s) => s.trim().split(/\s+/).length >= 3);
    const boxes = [e.sentence.da.replace(/\*\*/g, ""), ...e.forms.map((x) => x.da)].filter((s) => s.trim().split(/\s+/).length >= 3);
    const sets = [...dk, ...boxes].map((s) => new Set(strip(s).split(" ")));
    outer: for (let i = 0; i < dk.length; i++) for (let j = 0; j < sets.length; j++) {
      if (j === i) continue;
      const a = sets[i], b = sets[j]; const inter = [...a].filter((w) => b.has(w)).length;
      if (inter / Math.min(a.size, b.size) >= 0.75 && inter >= 3) { add("repeated-example", k, dk[i] + "  ~  " + (j < dk.length ? dk[j] : [...boxes][j - dk.length])); break outer; }
    }
    // CLEAR LANGUAGE: a use introduced by a clipped label ("For order, it means ..."), and pointer words instead of repeating the meaning
    for (const sn of sentences) { const m = sn.match(/^For (?:a |an |the )?[^,:.()"]{1,45}[,:]/); if (m) { add("clipped-label", k, m[0]); break; } }
    {
      const body = ex.replace(/\bmeans both\b/gi, "");
      const m = body.match(/\b(either|both|the latter|the former|the other one)\b/i);
      if (m) add("pointer-word", k, m[0] + " :: " + body.slice(Math.max(0, m.index - 40), m.index + 50));
    }
    // EN AND ET
    if (/\b(no|without|leave out|omit|drop|skip)\b[^.]{0,30}"(en|et)"|"(en|et)" (or|and) "(et|en)"/i.test(ex) && !/article/i.test(ex)) add("en-et-without-article", k, ex.match(/[^.]*"(en|et)"[^.]*\./)?.[0]?.slice(0, 110));
    // EXACT NOUNS
    const vague = ex.match(/\bits name\b|\bthe thing\b|\bsomething specific\b|\b(this|that) one\b|\bwhat (it|they) (is|are)\b/i);
    if (vague) add("vague-noun", k, vague[0] + " :: " + ex.slice(Math.max(0, vague.index - 40), vague.index + 50));
    // GRAMMAR WORDS (technical only)
    const tech = ex.match(/\b(participle|infinitive|conjugat\w*|declen\w*|definite|indefinite|neuter|common gender|clause|auxiliary|inflect\w*|subject|object|genitive|dative|accusative|nominative|imperative|subjunctive|gerund|particle|conjunction|suffix|prefix)\b/i);
    if (tech) add("technical-grammar-word", k, tech[0]);
    // CONTRADICTION (candidate): says Danes more commonly use another form
    if (/\b(more|most) (common|commonly|often)\b|\binstead of\b.*\bDanes\b|\bin everyday (talk|speech)\b/i.test(ex)) add("other-form-claim", k, ex.slice(0, 120));
    // TOPIC-ONLY RELATED words are for the AI read; list cards whose related repeats the card's first 4 letters (ok) – skipped
    // english description tail e.g. "the one in your mouth"
    if (/\b(the one|the kind|the type|the part|the thing) (in|of|on|that|you|which)\b/i.test(ex.split(/\.\s/)[0])) add("describes-the-meaning", k, ex.split(/\.\s/)[0].slice(0, 100));
  }
}
console.log(n + " cards read");
for (const [r, l] of Object.entries(out)) if (!only || only === r) console.log(String(l.length).padStart(5) + "  " + r);
if (only) for (const [k, d] of out[only] || []) console.log(k + " :: " + d);
