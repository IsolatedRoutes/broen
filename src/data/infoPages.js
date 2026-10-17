// ---------- about, privacy, terms, FAQ ----------

import { broenAIEnabled } from "./aiConfig";

// Shown as "Contact" in the menu once set; hidden while empty.
export const CONTACT_EMAIL = "isolatedroutes@gmail.com";

const BASE_INFO_PAGES = [
  {
    id: "about",
    title: "About",
    paragraphs: [
      "Broen is a powerful Danish learning tool that uses your natural curiosity about language and the world around you to build a deeper understanding.",
      "Built on a deck of 8,000 words, phrases and grammar notes, Broen\u2019s AI interface lets you dive deep into the areas that interest you, ask questions, and preserve the words and concepts you meet in daily life for later review.",
      "It takes the flashcard into the AI era, doesn\u2019t force you into a fixed study program, and makes sure the Danish you meet in daily life becomes part of your learning.",
      "Broen uses progressive learning while giving you the flexibility to shape your study around your needs, areas of focus and knowledge gaps.",
    ],
    sections: [
      [
        "The deck",
        "8,000 words, phrases and grammar concepts that you can filter for focused study by word type (nouns, verbs, prepositions and more), topic (Food & Drink, Travel & Transport and more), level (from Basic, A1, up to Fluent, C2), or any combination of these. The deck uses a smart learning algorithm and spaced repetition to reinforce what you know.",
      ],
      [
        "Star and check",
        "Star a card you want to focus on. Starred cards come up more often.\n\nCheck a card to mark it as known. Known cards are not shown again as themselves, but they are tracked so you can see your progress. They come back later in more advanced forms (for example, at g\u00e5 (to go) later appears as gik (went) and er g\u00e5et (has gone)) to move your learning forward.",
      ],
      [
        "Lightbulb",
        "Tap the lightbulb on any card to go deeper. It builds the connections that help you pick up the language naturally. For example, the lightbulb on \u201cdansk\u201d (Danish) shows how it differs from Danmark (Denmark) and en dansker (a Dane), and how other country words like svensk (Swedish) follow the same pattern.",
      ],
      [
        "Question mark",
        "Tap the question mark on a card to ask follow-up questions about it.",
      ],
      [
        "Assistant",
        "When you meet Danish in daily life, whether you are reading signs, watching the news or messaging with friends, take a photo or paste the text into the Assistant tab. Broen translates it. Then you can analyze the sentence to understand how it is built and why, and to spot mistakes in Danish you wrote. Then use Extract text to pull out the key words and add them to your deck for later review.\n\nThis matters because it focuses you on the words you actually need, and they do not disappear from your memory.",
      ],
    ],
  },
  {
    id: "how",
    title: "How it works",
    sections: [
      [
        "What Broen is for",
        "Broen helps you learn the Danish you actually come across. You take a photo of a sign or paste a text, Broen translates it and explains how it is built, you pick the words you want, and they become cards. Then Broen shows each card again at a good time, so you remember it.\n\nYou don’t make a schedule. The app works out when each card should come back, based on how easy or hard you found it.\n\nIt also starts you off with about 8,000 words and phrases and around a hundred grammar lessons, so you have something to study on day one.",
      ],
      [
        "Study",
        "The Study tab shows one card at a time. Tap the card to turn it over. Tap Next, or swipe left, for the next card, and Back, or swipe right, to go back. On a computer you can use the arrow keys. The button on the right (Dansk → English) swaps which side you see first.\n\nBroen watches how you do and decides when to show a card again: a card you got quickly comes back later, and a card you found hard comes back sooner. About one card in three is a new word. If you take a few days off, you get a short set to start, not a big pile.\n\nEach card has small icons:",
        [
          ["tap", "Flip", "Tap anywhere on the card to turn it over."],
          ["speaker", "Speaker (next to the Danish)", "Reads the Danish aloud. The voice comes from your phone or computer, so it works without internet."],
          ["star", "Star (top left)", "Tap it on a card you want to see more often. Tap again to remove it."],
          ["check", "Check (top right)", "Tap it when you know the word. It leaves your study cards and comes back later in a new form (see below)."],
          ["bulb", "Lightbulb (bottom left)", "Explains the word: its forms, how it is used, related words and an example sentence."],
          ["question", "Question mark (bottom right)", "Ask your own question about the card, or ask for a change such as “make this plural”. This uses AI."],
        ],
      ],
      [
        "Known words come back in a new form",
        "When you mark a word as known, you won’t see the same card again. A few days later it comes back as a different form of the word.\n\nA verb returns in the past tense (jeg gik), then the perfect (jeg er gået). A noun returns as “the …” and then in the plural. An adjective returns compared (større, størst).\n\nThe second form comes about a week after the first. On these cards the check starts empty. Tap it if you know that form too.\n\nWords that have no other forms, like phrases, are finished once you mark them known. You only see forms from the levels you chose.",
      ],
      [
        "Assistant: turn real Danish into cards",
        "In the Assistant tab, tap Enter text to type or paste Danish, or Add photo to take or pick a picture of a sign, a menu, packaging or a page.\n\nThen choose what you want. Translate gives the English translation (and turns English into Danish). Analyze sentence explains how the Danish sentence is built and points out mistakes in Danish you wrote. Extract text lists the useful words, and you tick the ones to keep as cards.\n\nIn the iPhone app you can also send text or a picture to Broen from another app: select Danish text in Safari or Notes, or open a picture in Photos, tap Share and choose Broen. If Broen isn’t in the row, scroll to the end, tap More and switch it on once.\n\nThis needs AI to be set up (see Set up AI below).",
      ],
      [
        "Assistant: ask questions",
        "The Chat in the Assistant tab answers any question about Danish: grammar, what a phrase means, how to say something, where a word comes from.\n\nYou can also ask for cards, for example “make 10 cards with vocabulary about travel”, and tick the ones you want. Under any answer, Save as flashcard keeps it as a card.\n\nYour recent chat is kept on your device, and Clear chat removes it.",
      ],
      [
        "Choose what you study",
        "Two menus at the top of Study decide which cards you see. The first picks the kind of card: all cards or only your own, a word type (verbs, nouns, adjectives and more), grammar lessons, sentences and phrases, or a topic such as Food & Drink. You can also make your own topics.\n\nTap the small arrow beside Verbs to choose which form to show, or beside Nouns to hide en/et and guess it before you flip.\n\nThe second menu picks levels: Basic, Intermediate, Advanced and Fluent. With none ticked, you see every level. “Unknown” hides words you have marked as known, and “Starred” shows only starred cards.\n\nYour choices are remembered when you close the app.",
      ],
      [
        "Add your own cards",
        "The Add tab has one screen for a word or a sentence, with a Dansk box and an English box. You can fill in both yourself.\n\nOr type one side, in Danish or English, and tap Look up, and the AI fills in the other side and picks the word type, level and topic. Tap Categorize to change any of it or add a note, then tap Add card.\n\nCards made without AI work in Study, but they don’t come back in new forms.\n\nThe first menu also switches to Grammar lesson: write the lesson name and the rule yourself, or type what you want to learn (for example “ikke”), tap Generate lesson and edit what the AI writes, then tap Add lesson.\n\nThe Dictionary tab lists every card. You can filter and search in either language, edit a card, hide it from Study, or delete it.",
      ],
      [
        "The starter deck and grammar lessons",
        "The starter deck has about 8,000 words and phrases, sorted by level and topic and based on the Danish levels A1 to C2. Everyday words and words you need for forms, travel, health, shopping and ordering food are Basic. More specific and abstract words are higher.\n\nThere are also around a hundred short grammar lessons, from en and et to the passive.\n\nEach lesson gives the rule in a sentence or two, a pattern with the changing part in bold, and three examples. Find them by choosing Grammar Lessons in the first Study menu, or in the Dictionary.",
      ],
      [
        "Set up AI",
        "Studying, the Dictionary, grammar lessons, the lightbulb on starter words, adding cards by hand and backups all work without AI.\n\nAI is used for the Assistant, the question mark, Look up, Generate lesson, explanations on cards you made yourself, and reading text from photos. It runs through your own account with Anthropic (Claude, recommended, paid by use) or Google (Gemini, free up to a daily limit). What you send goes straight to that company, never through us.\n\nTap AI settings at the top and follow the steps: sign in on the company’s site, create a key (a long password that lets Broen use your account), copy it, paste it into Broen and tap Save. Your key stays on your device.\n\nOn the website you can also choose a model that runs on your own device, or Chrome’s built-in translator.",
      ],
      [
        "Backup and sync",
        "Your cards and progress are saved on your device. There is no account.\n\nTap Backup at the top and choose Export to save everything to a file, or Import to load one back in. The file does not include your AI key or your chat. Weekly reminder offers a backup once a week, if something has changed.\n\nTo keep your devices matching automatically, tap Backup, then Sync, and pick where to keep your progress: iCloud (the Broen app on iPhone and iPad only), or your own Google Drive or Dropbox, which also work on the website.\n\nBroen keeps one small file in a private folder in your account. If you change the same thing on two devices, the later change is kept. Your AI key is never synced.\n\nYou can turn sync off or sign out at any time.",
      ],
    ],
  },
  {
    id: "privacy",
    title: "Privacy",
    sections: [
      ["What stays on your device", "Your cards, notes, progress, settings and recent Assistant chat are stored on your device. There is no account, no advertising and no analytics. We do not collect your data."],
      ["iCloud sync (optional)", "If you turn on Sync with iCloud in the iPhone app, your progress, notes, card edits, your own cards and topics, your settings and AI choices, and your Assistant chat are kept in your own iCloud, so your devices signed in to the same Apple ID stay in step. This is Apple’s iCloud under your Apple ID: we never receive it and cannot see it. It is off until you turn it on, and your AI key is never included."],
      ["Google Drive and Dropbox sync (optional)", "If you turn on Sync and choose Google Drive or Dropbox, the same things (your progress, notes, card edits, your own cards and topics, your settings and AI choices, and your Assistant chat) are saved as one small file in a private app folder in your own account.\n\nOnly Broen can see that folder, and Broen can reach nothing else in your Drive or Dropbox. You sign in on Google’s or Dropbox’s own page; we never see your password or your files.\n\nIt is off until you turn it on, you can sign out at any time, and your AI key is never included. Google’s and Dropbox’s privacy policies apply to what is stored with them."],
      ["What leaves your device", "Only the AI features send anything out, and only when you tap them (for example Look up in Add, Translate, the question mark or Chat). The text or photo you submit goes to the provider you chose in AI settings: Anthropic (Claude), Google (Gemini), or a server of your own. Their privacy policies apply to what you send. Broen asks you to agree before the first use. If you use Google’s free Gemini tier, Google may use what you send to improve its products."],
      ["Your API key", "Your API key is stored on your device and is sent only to the company that issued it. In the iPhone app it is kept in the iOS Keychain, the phone’s encrypted store. Only your phone can unlock it, and we never see it. On the website it is kept in this site’s own browser storage. It is not included in backups, and you can remove it any time in AI settings. Deleting the app removes it too."],
      ["On-device options", "In the web version, you can choose an AI model that runs on your device. It downloads its model files once, from Hugging Face and GitHub, which can see your IP address but not your text. After that, your text is processed on your device. Chrome’s built-in translator also keeps your text on your device."],
      ["Camera and photos", "The app asks your device for the camera or photos only when you choose to take or pick a picture. In the iPhone app, text or a picture you send to Broen with Share stays on your device until you use an AI feature on it. It never uses your microphone or location."],
      ["Backups and deleting", "Backups are files you save yourself. Removing the app, or clearing the site’s data in your browser, deletes everything it stores."],
      ["Questions", "For any question about privacy, write to isolatedroutes@gmail.com."],
    ],
  },
  {
    id: "terms",
    title: "Terms",
    sections: [
      ["A learning aid", "Broen is a learning aid, provided as it is. The word list, translations and grammar lessons have been checked with care, but they can contain mistakes. For anything important, check with a native speaker or a dictionary. You can correct any card yourself in the Dictionary."],
      ["AI features", "AI answers can be wrong, especially on tricky grammar. AI features run through the provider you choose, under that provider’s own terms. If you use your own API key, any charges are between you and the provider."],
      ["Your data", "Your data lives on your device. Updates are built to keep your progress, but keep a backup if it matters to you, because removing the app or clearing a browser’s site data deletes it."],
      ["Credits", "Word frequency data comes from FrequencyWords by Hermit Dave (CC BY-SA 4.0), based on OpenSubtitles. It was used only to help choose which words to include. All translations are our own."],
      ["Built with", "Broen was made by Isolated Routes, with help from AI tools including Claude, ChatGPT and Gemini."],
      ["Open-source software", "Broen includes software released under the MIT License: React (Copyright Facebook, Inc. and its affiliates), Capacitor (Copyright 2017-present Drifty Co.), Capacitor Haptics (Copyright 2020-present Ionic), Capacitor Secure Storage (Copyright 2019 martinkasa) and Capacitor In-App Review (Copyright 2022 Daniel Suchy). Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the \u201cSoftware\u201d), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \u201cAS IS\u201d, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n\nThe website\u2019s optional on-device model uses web-llm by MLC AI, under the Apache License 2.0."],
    ],
  },
  {
    id: "faq",
    title: "FAQ",
    questions: [
      ["What is Broen, and who is it for?", "Broen (Danish for “the bridge”) helps you learn the Danish you come across in daily life. You turn signs, menus and texts into cards, and the app shows each card again at a good time so you remember it. It suits anyone past the very first steps, up to advanced learners. It is not a course: you choose what to study. How it works in this menu has the full tour."],
      ["Is it free? Do I need an account?", "The app is free, with no account and no sign-in. Your cards and progress stay on your device. Only the optional AI features can cost money, and only if you choose a paid provider."],
      ["Do I need AI to use it?", "No. Studying, the Dictionary, grammar lessons, the lightbulb on starter words, adding cards by hand and backups all work without it, and offline. AI powers the Assistant, the question mark, Look up, Generate lesson, explanations on cards you made yourself, and reading photos."],
      ["What does AI cost?", "The AI company bills you directly, only for what you use. With Claude, a question costs roughly half a cent and a photo a cent or two.\n\nGemini has a free tier with daily limits, and on that tier Google may use what you send to improve its products. Prices are set by the companies and can change."],
      ["Can I use AI without sending my text to a company?", "On the website only, with trade-offs. A local model runs in your browser after a one-time download of several hundred MB, but it is weaker at Danish and cannot read photos.\n\nOllama connects the app to a model on your own computer. Chrome’s built-in translator can handle Translate on your device. Find these under More options in AI settings."],
      ["Why are there no streaks, scores or timers?", "So there is nothing to keep going and nothing to fail. If you miss a day, the app just picks up where you left off."],
      ["What happens when I mark a word as known?", "It leaves your study cards, then returns about three days later in a form one step harder, and about a week after that in one more. Then it is finished. To see known words again, untick Unknown at the top of Study."],
      ["Will I see words or forms that are too advanced?", "No. Study stays inside the levels you choose. A returning form counts as one level above its word, so the past tense of a Basic verb only appears once Intermediate is included."],
      ["How are the levels decided?", "There are four: Basic (A1–A2), Intermediate (B1), Advanced (B2–C1) and Fluent (C1–C2). A word’s level follows what it is for, not only how rare it is."],
      ["Can I practise verb tenses, or guess en and et?", "Yes. In the first Study menu, tap the small arrow beside Verbs to choose the forms to show, or beside Nouns to hide en/et and guess it before you flip."],
      ["Can I hear how a word is pronounced?", "Yes. Tap the speaker next to the Danish. Your device reads it aloud, so how natural it sounds depends on the Danish voice installed, and it normally works without internet. If your browser has no speech support, the speaker does not appear."],
      ["Can I use Broen on an iPad or a computer?", "Yes. The iPhone app is the full experience. The website works in any current browser, including on iPad. To keep the website and your phone in step, turn on Sync (tap Backup, then Sync) and choose Google Drive or Dropbox. iCloud sync works between Apple devices running the app."],
      ["Is the content always right?", "No. The word list and grammar lessons were checked with care but can still contain mistakes, and AI answers can be wrong, especially on tricky grammar. For anything important, check a dictionary or a native speaker. You can correct any card yourself in the Dictionary."],
      ["Is my information private?", "Yes. There is no account, no advertising and no analytics, and nothing is collected. Your cards, notes, progress and settings stay on your device.\n\nOnly the text or photos you send to an AI feature leave it, and only when you tap it. They go straight to the company you chose, never through us. See Privacy in this menu."],
      ["What permissions does the app ask for?", "Camera and photos, only when you choose to take or pick a picture. It never uses your microphone or your location."],
      ["Where is my progress saved, and will updates erase it?", "On your device, in the app’s own storage. Updates are built to keep your marks, notes, your own cards and topics, and your study choices. If your saved deck ever cannot be opened, the app tells you and changes nothing. Deleting the app, or clearing the site’s data in your browser, does erase it, so keep a backup."],
      ["How do I move to a new device?", "The easiest way is Sync: tap Backup, then Sync, choose where to keep your progress, and sign in to the same place on the new device.\n\nOr tap Backup and choose Export, then open Backup on the new device and choose Import (Import replaces the whole deck after you confirm). The backup file does not include your AI key or your chat, so enter the key again."],
      ["Where do the words come from?", "The 8,000 words were chosen with help from a Danish word-frequency list based on film and TV subtitles (FrequencyWords by Hermit Dave, CC BY-SA 4.0), plus common course vocabulary. All translations are our own."],
      ["How do I contact you?", "Open the menu at the top right and tap Contact, or write to isolatedroutes@gmail.com."],
    ],
  },
];

// Wording that only applies once Broen's own AI is switched on (data/aiConfig.js).
const BROEN_AI_PRIVACY = [
  "Broen AI (optional)",
  "If you choose Broen AI in AI settings, the text or photo you submit goes to Broen\u2019s relay server, which passes it to Anthropic (Claude) to write the answer, then returns the answer to you. We do not store or log what you send or what comes back. Anthropic\u2019s privacy policy applies to what it receives. To count your free tries, your install has a random anonymous id that is sent with each request; it is not linked to your name or account. Your network address is used only to limit abuse and is not stored in readable form. It is off until you choose it, and you can switch to your own key at any time.",
];
const BROEN_AI_FAQ = ["What is Broen AI?", "An option in AI settings that works right away, with no key to set up, and a few free tries. When the free tries are used, you can add your own key (see What does AI cost?) and keep going."];

export const INFO_PAGES = BASE_INFO_PAGES.map((page) => {
  if (!broenAIEnabled()) return page;
  if (page.id === "privacy") return { ...page, sections: [...page.sections.slice(0, 4), BROEN_AI_PRIVACY, ...page.sections.slice(4)] };
  if (page.id === "faq") return { ...page, questions: [...page.questions.slice(0, 3), BROEN_AI_FAQ, ...page.questions.slice(3)] };
  return page;
});
