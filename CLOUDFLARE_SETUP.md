# Broen AI relay: one-time setup

The relay (`server/worker.js`) lets people use AI in Broen with no key of their own.
It holds YOUR Anthropic key as a secret, gives each install a small free allowance,
and stops at daily limits. Until step 5 is done the app does not show "Broen AI".

## What you need
1. A free Cloudflare account (cloudflare.com).
2. An Anthropic account with a **monthly spending limit** set in the Console
   (Settings → Limits). This is the hard ceiling on your cost. Create an API key
   just for Broen (name it "broen-relay") so you can delete it any time.

## Deploy (Terminal; type `cd ` then drag the project folder in)
```
cd server
npx wrangler login
npx wrangler deploy
npx wrangler secret put ANTHROPIC_API_KEY
```
- `wrangler login` opens a browser to sign in to Cloudflare.
- `wrangler deploy` prints the relay address, like `https://broen-ai.YOURNAME.workers.dev`.
  The first time it may ask you to pick a free `workers.dev` name.
- `wrangler secret put` asks you to paste the Anthropic key. Paste it there only.

## Check it
Open `https://broen-ai.YOURNAME.workers.dev/health` in a browser. It should show `{"ok":true}`.

## Switch it on in the app
Tell Claude the address. It goes into `src/data/aiConfig.js` (`proxyUrl`). Then the
app shows "Broen AI · No key needed" in AI settings, and the Privacy and FAQ pages
gain the matching text. (`privacy.html` must get the same paragraph; see the
`BROEN_AI_PRIVACY` text in `src/data/infoPages.js`.)

## Limits (edit `server/wrangler.toml`, then run `npx wrangler deploy` again)
- `TRIAL_USES`: free uses per install, ever (25).
- `IP_DAILY`: uses per network address per day (60). Stops one person farming new installs.
- `GLOBAL_DAILY`: uses for everyone per day (400). The daily ceiling for the free trial.
- `MODEL`: which Claude model answers. The default is the small, cheap one.
- Pause everything at once: `npx wrangler secret put ENABLED` and type `0`
  (type `1` or delete it to resume). Or just delete the Anthropic key in the Console.
- Using your own website address later: add it to `ALLOWED_ORIGINS` (comma list) in `server/wrangler.toml`.

## Cost
The free Cloudflare plan covers this at small size. Before real launch, move to the
$5/month Workers plan so a free-tier limit never silently stops the relay.
Your worst case per day is `GLOBAL_DAILY` uses (about half a cent to two cents each).

## Not done yet (later steps)
- Proving a request comes from the real iPhone app (Apple App Attest).
- Paid plans and top-ups. Allowances are per install; a reinstall starts a new trial,
  so paid credits must be tied to an Apple ID or email.
- Tests: `node tests/worker_check.mjs` (pretend Anthropic) and `python3 tests/broen_ai_test.py`.
  The real deploy could not be run where this was written; try the `/health` check first.
