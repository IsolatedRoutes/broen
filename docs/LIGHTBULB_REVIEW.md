# Lightbulb card review (principle only, no phrase lists)

Use this for every sweep of the ready-made lightbulb answers (`lightbulb/*.json`) and as the self-check for live AI answers. There is no human reader: this checklist IS the review.

## The principle
Read each card as a patient teacher speaking directly to ONE beginner who knows no Danish grammar and cannot ask a question. Every sentence after the opening `"X" means "..."` must let that beginner DO something: say it, write it, recognize it, or avoid a real mistake. If they would have to guess anything, rewrite or delete the sentence.

## Ask of EVERY sentence
1. Who or what? Does every "it", "one", "they", "that", "the thing", "who", "what", "which" point at something the reader can name without guessing? Name the noun (the text, the person who receives it, the place you are going to).
2. Which verb? Is each verb exact for this situation (receives, indicates, names, goes before, uses, means) and not loose ("gets", "has", "does", "shows", "fits", "goes with", "covers")?
3. Can the beginner act on it? A usage claim needs a quoted Danish example with English in (brackets). A sentence that describes what a word "does" in the abstract is replaced by when you would say it, or deleted if the meaning already says it.
4. Correct and natural English (American spelling, correct terms such as lowercase letter, no clumsy word order); is it TRUE for real Danish? Soften or cut what you are not sure of.
5. Quotes and glosses: every Danish word, phrase, sentence in quotes with English right beside it.
6. Nothing repeated: not the meaning in other words, not the forms list, not the related list, not the "In a sentence" box. Related words must not appear in the explanation.
7. Level of detail: short is fine ("hvad" is the model card). Delete filler, trivia, vague warnings between look-alikes (a warning must say what each word means with its own example).

Return only cards you changed. Never change keys, `forms`, `sentence`.

## The final card rules (Nov 14, owner's wording; the AI prompt carries the same list as `CARD_RULES` in `src/lib/ai/prompts.js`)
"Translation" = the English meaning after "means". "The card" = sentence box, forms list, explanation, related words. When a card breaks one of these, fix the idea, never only the phrase, and keep every existing deck check.

1. OPENING. The first sentence gives only the Danish word and its English meaning: "X" means "Y".
2. ALLOWED ADDITIONS. After the opening, every sentence is exactly one of: how the word is built, or which word it comes from (once; vækst = the noun for the verb at vokse); a fact about the thing that is specific to Denmark and helps the learner understand the word in Danish daily life (how an institution, custom, rule or habit the word names works; never trivia such as famous landmarks, brands, records, dates or history); a mix-up with ONE named similar word (what each means, each with its own example); a different meaning or use of this same word (own example); a spelling or form English speakers get wrong; the politeness level if the word is blunt, rude or formal; the moment you use it (a short quoted exchange); a literal translation after the real meaning; the small word it must be used with (with an example); a very common phrase or word partner the learner will meet (own example); what a part of the word means in other words it appears in (lige → lige nu, lige meget). Anything else is deleted. THE OPENING ALONE IS NOT ENOUGH: every explanation has at least one addition, the most useful one available, because a bare translation teaches nothing the forms list does not show.
3. DO NOT REPEAT THE TRANSLATION. Never describe the thing in English words the translation already gives ("a gift you give at Christmas"). Exception: a thing specific to Denmark may be described.
4. SAY WHICH MEANING ONLY WHEN ENGLISH HAS SEVERAL. Then name the sense in a few words ("as in the body part"). One English meaning: add nothing ("the one in your mouth" for tongue is cut).
5. NO REPETITION. Every sentence states an idea nothing else on the card says. A sentence repeating the meaning, a form, a use already given, or an example with the same sentence pattern as another on the card is cut, even when its type is allowed by rule 2. Each type of addition appears once, except different uses, which each get their own example. Exception: two examples that differ in one word on purpose to show a difference (Hvem kender dig? / Hvem kender du?) count as one.
6. NO CONTRADICTIONS. The explanation agrees with the card. A different, more common form than the card shows gets its own example and "when to use which", or is left out.
7. ONE ENGLISH WORDING. The opening translation and the first line of the forms list are the same English.
8. STAY ON THE CARD'S WORD. Another Danish word appears only for a mix-up or to show how the word is built.
9. THE CARD IS THE GENERAL WORD (deck-level). A free combination such as "en tid hos lægen" should be "en tid", with "hos lægen" as the example. Deck cards are only FLAGGED for the owner (`docs/FREE_COMBINATION_CARDS.md`); the card list is never changed without the owner's go-ahead.
10. LEAD-IN FOR EVERY EXAMPLE. An example after the opening starts with a lead-in saying what it shows. No bare example after a colon.
11. NATURAL LANGUAGE. Danish a Dane would really say; English an English speaker would really say, not word for word. When an example shows a difference English has too (who / whom), use the English that people really say there ("To whom are you speaking?"), not a stiff form ("Whom do you know?").
12. EXACT NOUNS. Never "it", "one", "its name" where the reader cannot tell what it points at ("say the type of toy").
13. EN AND ET. A word with no article still has a gender, shown by its "the" form (legetøjet = et-word). Name only the matching article, never "en and et": "This word has no article, so leave out "et"" plus an example whose meaning matches the statement. To point to one thing of that kind: "When you talk about one specific kind of toy, use its name".
13b. EXAMPLE MATCHES THE STATEMENT. An example shows exactly what the sentence before it says: same article, same number (singular or plural), same use. A statement about one article is not followed by an example that only works because it is plural, and "one toy" is not followed by an example about a kind of toy. If the gender is not certain, say "without an article" and name neither en nor et.
13c. CLEAR LANGUAGE (positive rule). Write every sentence for a reader who has only this card and cannot ask anyone.
   (1) Introduce each meaning or use with a full sentence (subject + verb) that names the situation the learner is in, using actions they can picture: count, point to, ask, say, write, buy, describe. Example: "When you count in order (first, second, third), it means "second"." / "When you point to the other one of two things, it means "other"."
   (2) Put one tiny example right after the situation, with its English in brackets.
   (3) When you refer back to a meaning, repeat it in quotes ("the second car" or "the other car"); do not point at it with either, both, this, that, the latter, the former.
   (4) Choose the simplest correct word; a plain grammar word from rule 15 is fine when it is clearer than a description.
   (5) Read each sentence as someone who has never seen the card. If they would ask "what do you mean?", add the missing noun, action or example.
   Why this rule exists: the older instructions modeled uses as clipped labels ("For a place: ... For an amount: ..."), asked the writer to "name the use", banned grammar words, capped sentence length and said to delete anything not useful. Together these produce telegraphic labels such as "For order" and "For the remaining one of two", and the stock phrase for ambiguity plus a pointer word produced "can mean either". The labels in the prompt were changed to "When you mean a place: ..." so the model copies a full sentence.
14. SHORT SENTENCES. One idea, about 20 words at most.
15. GRAMMAR WORDS. Allowed: verb, noun, adjective, adverb, pronoun, preposition, article, singular, plural, past tense. Two limits: use one only when it is shorter and clearer than describing the idea, and give a tiny example in the same sentence ("på" is a preposition: "på bordet" (on the table)). Never technical terms (participle, infinitive, conjugation, declension, definite/indefinite, common/neuter gender, subject, object, clause, stem, auxiliary, inflection, case and mood names); the forms list already shows those through examples.
16. CERTAIN CLAIMS ONLY. Usage or culture claims only if certainly true; "often / usually / more often" only if sure, else cut.
17. RELATED WORDS. Exactly 3 or 4: same word family, a real mix-up, a true opposite or synonym, or a member of a small set. Not just the same topic; not in the explanation; not part of the card's own phrase.

Checks: `node tests/lightbulb_check.mjs` enforces what a script can see (failing). `node tests/card_rules_report.mjs` lists cards that probably break a rule a script can only guess at (opening vs forms wording, repeated example frames, bare example after a colon, long sentences, "often/usually", more than 4 sentences); every listed card is read and fixed or cleared, and the independent re-read above is what judges meaning.

## How to apply the rules (process, learned in the Nov 15 pilot)
1. Check the WHOLE card, not only the explanation: the sentence box, forms list, explanation and related words (related words still broke rule 17 on cards whose explanation was already fixed).
2. Before a sweep, run the rules on a pilot of about 10 cards and show the owner each FULL card as it reads (sentence box, forms, explanation, related), never only what was cut. The owner cannot judge a change without the whole card.
3. A pilot is a test of the RULES. Every problem it shows is written back into the rules (here: no "en and et" for a word with a gender, the example must match the statement, the opening alone is not enough, natural English for who/whom, a contrast pair is one example) before the rules are used on the deck.
4. When a rule is added, also add a script check for what a script can see and run it on the whole deck (the "en and et" check found 34 more cards), and fix the class, not the one card.
5. Do not name a gender or article unless it is certain (read the "the" form); otherwise say "without an article".
6. After any batch, list every register or usage claim that was ADDED ("sounds formal", "people say X in everyday speech", "use Y when ...") so the owner can verify it; the writer is not a native speaker and must not present a guess as fact.
7. When removing a restating description leaves a card with one thin sentence, add the most useful allowed addition (common phrase, word family, register) instead of leaving it bare.
8. When a card reads unclearly, find which INSTRUCTION modeled or caused that wording (an example label, a ban, a length limit) and change the instruction, not only the card. `node tests/card_rules_report.mjs` lists "clipped-label" and "pointer-word" candidates for the rule above.
