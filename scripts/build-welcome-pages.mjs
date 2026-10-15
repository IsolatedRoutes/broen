// Builds the website pages that hold the app's own About / How it works / FAQ / Terms text:
//   welcome/about/  welcome/how-it-works/  welcome/faq/  welcome/terms/
// The words come straight from src/data/infoPages.js, so the website and the app never drift apart.
// Run:  node scripts/build-welcome-pages.mjs   (the output is committed)
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://isolatedroutes.github.io/broen";

// ---- load INFO_PAGES (the file is app code, so strip its import and exports first) ----
const cfg = readFileSync(join(ROOT, "src/data/aiConfig.js"), "utf8");
const proxyOn = /proxyUrl:\s*"[^"]+"/.test(cfg);
let src = readFileSync(join(ROOT, "src/data/infoPages.js"), "utf8")
  .replace(/^import .*$/m, `const broenAIEnabled = () => ${proxyOn};`)
  .replace(/^export const /gm, "const ") + "\nexport { INFO_PAGES, CONTACT_EMAIL };\n";
const tmp = mkdtempSync(join(tmpdir(), "welcome-"));
writeFileSync(join(tmp, "info.mjs"), src);
const { INFO_PAGES, CONTACT_EMAIL } = await import(pathToFileURL(join(tmp, "info.mjs")).href);
const page = (id) => INFO_PAGES.find((p) => p.id === id);

// ---- text helpers ----
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// The app's text says "in this menu" and "tap Contact"; on a web page those become real links.
const WEB_WORDING = [
  ["How it works in this menu has the full tour.", "The {how} page has the full tour."],
  ["See Privacy in this menu.", "See the {privacy}."],
  ["Open the menu at the top right and tap Contact, or write to", "Write to"],
];
const LINKS = {
  how: `<a href="../how-it-works/">How it works</a>`,
  privacy: `<a href="../../privacy.html">privacy policy</a>`,
};
function fix(text) {
  for (const [from, to] of WEB_WORDING) text = text.replace(from, to);
  return text;
}
function inline(text) {
  let h = esc(fix(text));
  h = h.replace(/\{(how|privacy)\}/g, (_, k) => LINKS[k]);
  h = h.replace(/\b([\w.+-]+@[\w-]+\.[\w.]+)\b/g, '<a href="mailto:$1">$1</a>');
  // "open Broen" / "use Broen" is a place to click: send it to the app
  h = h.replace(/\b(Open|open|Use|use|Visit|visit) (Broen)\b/g, '$1 <a class="applink" href="../../">$2</a>');
  return h;
}
const paras = (text) => fix(text).split(/\n\n+/).map((p) => `<p>${inline(p).replace(/\n/g, "<br>")}</p>`).join("\n");

// ---- page shell ----
const CSS = `
  :root { --ink:#23272A; --paper:#EFEEE8; --card:#FBFAF7; --line:#DCD8CD; --rust:#A1432E; --fjord:#4C6B65; --terracotta:#C1653F; --muted:#8A8577;
    --serif: Georgia,'Iowan Old Style','Palatino Linotype',serif; --sans:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; }
  * { box-sizing: border-box; }
  html { -webkit-text-size-adjust: 100%; scroll-behavior: smooth; }
  body { margin:0; background:var(--paper); color:var(--ink); font-family:var(--sans); font-size:17px; line-height:1.6; }
  a { color: var(--fjord); }
  a.applink { color: var(--rust); font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }
  a.applink:hover { color: var(--terracotta); }
  .wrap { width:100%; max-width:1040px; margin:0 auto; padding-inline:24px; }
  :focus-visible { outline:2px solid var(--fjord); outline-offset:3px; border-radius:6px; }
  header { padding-block:22px; }
  header .wrap { display:flex; align-items:center; justify-content:space-between; gap:16px; }
  .logo { font-family:var(--serif); font-size:28px; letter-spacing:.5px; text-decoration:none; color:var(--ink); }
  .logo span { color:var(--rust); }
  nav { display:flex; align-items:center; gap:22px; font-size:15px; }
  nav a.plain { color:var(--muted); text-decoration:none; }
  nav a.plain:hover, nav a.plain[aria-current] { color:var(--ink); }
  .pill { display:inline-flex; align-items:center; justify-content:center; border-radius:999px; padding:10px 20px; font:700 14.5px/1 var(--sans); text-decoration:none; white-space:nowrap; background:var(--terracotta); color:#fff; }
  .pill:hover { background:var(--rust); }
  main { padding-block: 24px 72px; }
  article { max-width: 720px; }
  h1 { font-family:var(--serif); font-weight:400; font-size:clamp(34px,5vw,48px); line-height:1.15; margin:0 0 14px; text-wrap:balance; }
  .lede { color:#4A4F52; margin:0 0 28px; }
  h2 { font-family:var(--serif); font-weight:400; font-size:clamp(24px,3vw,30px); line-height:1.25; margin:0 0 10px; text-wrap:balance; }
  section { border-top:1px solid var(--line); padding-block:28px 24px; }
  section p { margin:0 0 14px; color:#4A4F52; }
  .toc { display:flex; flex-wrap:wrap; gap:8px 10px; margin:0 0 30px; padding:0; list-style:none; }
  .toc a { display:inline-block; border:1px solid var(--line); background:var(--card); border-radius:999px; padding:6px 14px; font-size:14.5px; color:var(--ink); text-decoration:none; }
  .toc a:hover { border-color:var(--muted); }
  dl.icons { margin:4px 0 14px; display:grid; gap:10px; }
  dl.icons div { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:12px 16px; }
  dl.icons dt { font-weight:700; }
  dl.icons dd { margin:2px 0 0; color:#4A4F52; font-size:15.5px; }
  [id] { scroll-margin-top:16px; }
  footer { border-top:1px solid var(--line); padding-block:28px 40px; font-size:14.5px; color:var(--muted); }
  footer .wrap { display:flex; flex-wrap:wrap; gap:12px 28px; justify-content:space-between; }
  footer a { color:var(--muted); white-space:nowrap; }
  footer a:hover { color:var(--ink); }
  footer p { margin:0; }
  footer .links { display:flex; gap:12px 22px; flex-wrap:wrap; }
  @media (max-width:700px) { nav a.plain { display:none; } main { padding-top:8px; } }
`;

const NAV = [
  ["how-it-works", "How it works"],
  ["faq", "FAQ"],
  ["about", "About"],
];
function shell({ dir, title, description, heading, lede, body, extraHead = "" }) {
  const url = `${SITE}/welcome/${dir}/`;
  const nav = NAV.map(([d, l]) => `<a class="plain" href="../${d}/"${d === dir ? ' aria-current="page"' : ""}>${l}</a>`).join("\n      ");
  const foot = [...NAV, ["terms", "Terms"]].map(([d, l]) => `<a href="../${d}/">${l}</a>`).join("\n      ");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<meta name="theme-color" content="#EFEEE8">
<link rel="icon" href="../../icons/icon-192.png">
<link rel="apple-touch-icon" href="../../icons/apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Broen">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/welcome/og.png">
<meta name="twitter:card" content="summary_large_image">
${extraHead}<style>${CSS}</style>
</head>
<body>
<!-- Generated by scripts/build-welcome-pages.mjs from src/data/infoPages.js. Edit those, not this file. -->
<header>
  <div class="wrap">
    <a class="logo" href="../" aria-label="Broen, home">Broen<span>.</span></a>
    <nav aria-label="Main">
      ${nav}
      <a class="plain" href="../#get">On your phone</a>
      <a class="pill" href="../../">Open the app</a>
    </nav>
  </div>
</header>
<main>
  <div class="wrap">
    <article>
      <h1>${esc(heading)}</h1>
      <p class="lede">${lede}</p>
${body}
    </article>
  </div>
</main>
<footer>
  <div class="wrap">
    <p>Broen is Danish for &ldquo;the bridge.&rdquo; It is an independent app made by Isolated Routes.</p>
    <div class="links">
      ${foot}
      <a href="../../privacy.html">Privacy</a>
      <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>
    </div>
  </div>
</footer>
</body>
</html>
`;
}

const out = (dir, html) => {
  mkdirSync(join(ROOT, "welcome", dir), { recursive: true });
  writeFileSync(join(ROOT, "welcome", dir, "index.html"), html);
  console.log("wrote welcome/" + dir + "/index.html");
};

// ---- How it works ----
{
  const p = page("how");
  const toc = `<ul class="toc">${p.sections.map(([h]) => `<li><a href="#${slug(h)}">${esc(h)}</a></li>`).join("")}</ul>`;
  const secs = p.sections.map(([h, text, icons]) => {
    const dl = icons ? `<dl class="icons">${icons.map(([, name, what]) => `<div><dt>${esc(name)}</dt><dd>${inline(what)}</dd></div>`).join("")}</dl>` : "";
    // the icon list belongs after the last paragraph, which ends "Each card has small icons:"
    return `<section id="${slug(h)}"><h2>${esc(h)}</h2>\n${paras(text)}\n${dl}</section>`;
  }).join("\n");
  out("how-it-works", shell({
    dir: "how-it-works",
    title: "How Broen works: studying, asking, saving words",
    description: "A full tour of Broen: the Study cards, asking questions, turning photos and texts into flashcards, choosing levels and topics, setting up AI, backup and sync.",
    heading: "How Broen works",
    lede: `Everything the app does, in the order you will meet it. You can <a class="applink" href="../../">open Broen</a> in your browser and follow along.`,
    body: toc + "\n" + secs,
  }));
}

// ---- FAQ ----
{
  const p = page("faq");
  const toc = `<ul class="toc">${p.questions.map(([q]) => `<li><a href="#${slug(q)}">${esc(q)}</a></li>`).join("")}</ul>`;
  const secs = p.questions.map(([q, a]) => `<section id="${slug(q)}"><h2>${esc(q)}</h2>\n${paras(a)}</section>`).join("\n");
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: p.questions.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: fix(a).replace(/\n\n+/g, " ") } })),
  };
  out("faq", shell({
    dir: "faq",
    title: "Broen FAQ: cost, offline use, AI, privacy and sync",
    description: "Answers about Broen: what it costs, whether it works offline, how the AI is set up, where your progress is saved, privacy, levels and moving to a new device.",
    heading: "Frequently asked questions",
    lede: `Can&rsquo;t find your answer? Write to <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.`,
    body: toc + "\n" + secs,
    extraHead: `<script type="application/ld+json">\n${JSON.stringify(ld, null, 2)}\n</script>\n`,
  }));
}

// ---- About ----
{
  const p = page("about");
  out("about", shell({
    dir: "about",
    title: "About Broen, a Danish learning app",
    description: "Broen means the bridge. It is a Danish learning app built on about 8,000 words and phrases, with an optional AI companion, made by Isolated Routes.",
    heading: "About Broen",
    lede: `Made by Isolated Routes. <a class="applink" href="../../">Open Broen</a> in your browser, or <a href="../#get">add it to your phone</a>.`,
    body: `<section>${p.paragraphs.map((t) => `<p>${inline(t)}</p>`).join("\n")}</section>`,
  }));
}

// ---- Terms ----
{
  const p = page("terms");
  const secs = p.sections.map(([h, text]) => `<section id="${slug(h)}"><h2>${esc(h)}</h2>\n${paras(text)}</section>`).join("\n");
  out("terms", shell({
    dir: "terms",
    title: "Broen terms of use",
    description: "The terms for using Broen: it is a learning aid, how AI features work, your data, credits and open-source licences.",
    heading: "Terms",
    lede: `How Broen may be used. For what we do with your data, see the <a href="../../privacy.html">privacy policy</a>.`,
    body: secs,
  }));
}
