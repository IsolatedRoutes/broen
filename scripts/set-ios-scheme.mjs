// Adds Google's sign-in return address (the "reverse" form of the iOS client ID) to the
// iPhone app's Info.plist, so Google can send the person back to Broen after signing in.
// Run automatically by `npm run cap:sync`. Does nothing until the client ID is filled in.
import { readFileSync, writeFileSync } from "node:fs";

const config = readFileSync("src/data/cloudConfig.js", "utf8");
const m = config.match(/googleIosClientId:\s*"([^"]+)"/);
if (!m) {
  console.log("Google iPhone sign-in: no client ID yet, nothing to add.");
  process.exit(0);
}
const scheme = "com.googleusercontent.apps." + m[1].replace(".apps.googleusercontent.com", "");
const path = "ios/App/App/Info.plist";
let plist = readFileSync(path, "utf8");
if (plist.includes("<string>" + scheme + "</string>")) {
  console.log("Google iPhone sign-in: already set up.");
  process.exit(0);
}
const marker = "<string>broen</string>";
if (!plist.includes(marker)) {
  console.error("Couldn't find the broen:// address in Info.plist; add " + scheme + " in Xcode (URL Types).");
  process.exit(1);
}
plist = plist.replace(marker, marker + "\n\t\t\t\t<string>" + scheme + "</string>");
writeFileSync(path, plist);
console.log("Google iPhone sign-in: added " + scheme + " to Info.plist.");
