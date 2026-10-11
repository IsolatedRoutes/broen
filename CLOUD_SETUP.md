# Cloud sync: one-time setup (you do this once; users just tap "Sign in")

Broen keeps one small file (`broen-sync.json`) in a **private app folder** in the user's own
Google Drive or Dropbox. Only Broen can see that folder. Nothing goes through any server of ours.
Until the IDs below are filled in, Google Drive / Dropbox are simply not offered in the app.

The website address used below is `https://isolatedroutes.github.io/broen/` — change it if the live
address changes. Use the same address in every place below.

## Dropbox (about 5 minutes)
1. Go to https://www.dropbox.com/developers/apps and tap **Create app**.
2. Choose **Scoped access**, then **App folder**, name it **Broen**, tap **Create app**.
3. **Permissions** tab: tick `files.content.write` and `files.content.read`, then tap **Submit**.
4. **Settings** tab → **Redirect URIs**: add `https://isolatedroutes.github.io/broen/` and also
   `broen://oauth` (tap Add after each).
5. Copy the **App key** from the Settings tab.
6. (Later) Dropbox lets about 50 people use a new app; when you are ready for more, tap
   **Apply for production** on the Settings tab. It is a short form.

## Google Drive (about 10 minutes)
1. Go to https://console.cloud.google.com, create a project called **Broen**.
2. **APIs & Services → Library** → search **Google Drive API** → **Enable**.
3. **APIs & Services → OAuth consent screen** → **External** → app name **Broen**, your support email →
   **Scopes**: add `.../auth/drive.appdata` (shown as "See, create and delete its own configuration data in your Google Drive").
   Add yourself under **Test users** while testing. (Later, tap **Publish app**; this scope is low-risk
   and needs no long review.)
4. **APIs & Services → Credentials → Create credentials → OAuth client ID**, twice:
   - **Web application**: Authorized JavaScript origins = `https://isolatedroutes.github.io`.
     Copy the **Client ID** (looks like `123-abc.apps.googleusercontent.com`).
   - **iOS**: Bundle ID = `com.isolatedroutes.broen`. Copy its **Client ID**.

## Then
Send the three values to Claude (or paste them into `src/data/cloudConfig.js`):
`googleWebClientId`, `googleIosClientId`, `dropboxAppKey`.
Then `npm run cap:sync` (it also adds Google's return address to the iPhone app's Info.plist).
