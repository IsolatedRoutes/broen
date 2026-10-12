// Where an entry is filed in the Dictionary (A–Z). The rule: a little "helper" word that only
// introduces the real word is skipped, so you look under the word that matters.
//  - en / et / at (gender words and the "to" of verbs): always skipped. "at gå" is filed under G.
//  - In a fixed expression (not a full sentence), small prepositions at the start are skipped too:
//    i, på, til, af, med, om, for, fra, ved, and det / den / de right after them.
//    "i dag" is filed under D, "på grund af" under G, "for eksempel" under E.
//  - The preposition on its own ("i", "på") and full sentences keep their real first letter.
// English side: a / an / the / to are skipped.
const ARTICLES = /^(en|et|at)\s+/i;
const PREPOSITIONS = new Set(["i", "på", "til", "af", "med", "om", "for", "fra", "ved"]);
const DET = new Set(["det", "den", "de"]);

function firstWord(s) {
  const m = s.match(/^(\S+)\s+/);
  return m ? m[1].toLowerCase() : "";
}

export function dictionaryKey(text, { englishFirst = false, sentence = false } = {}) {
  let s = (text || "").normalize("NFC").trim();
  if (englishFirst) {
    s = s.replace(/^(an?|the|to)\s+/i, "").trim();
  } else {
    s = s.replace(ARTICLES, "").trim();
    const isSentence = sentence || /[.?!]\s*$/.test(s);
    if (!isSentence) {
      if (PREPOSITIONS.has(firstWord(s))) {
        s = s.replace(/^\S+\s+/, "");
        while (DET.has(firstWord(s))) s = s.replace(/^\S+\s+/, "");
      }
    }
  }
  const match = s.match(/[a-zA-ZæøåÆØÅ].*/s);
  const key = match ? match[0] : s;
  // Danish collation files "aa" with å (Aarhus would land among the Å words);
  // an invisible break keeps it with the A words.
  return /^aa/i.test(key) ? key[0] + "​" + key.slice(1) : key;
}
