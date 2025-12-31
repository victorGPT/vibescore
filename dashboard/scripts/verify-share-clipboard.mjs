import { chromium } from "playwright";

const urlArg = process.argv[2] || process.env.DASHBOARD_URL;
const url = urlArg || "http://localhost:5173/?screenshot=1";

const browser = await chromium.launch();
const context = await browser.newContext({
  permissions: ["clipboard-read", "clipboard-write"],
});

await context.addInitScript(() => {
  class ClipboardItemMock {
    constructor(items) {
      this.items = items;
    }
  }

  Object.defineProperty(window, "ClipboardItem", {
    value: ClipboardItemMock,
    configurable: true,
  });

  Object.defineProperty(navigator, "clipboard", {
    value: {
      write: async () => {
        window.__clipboardWrites = (window.__clipboardWrites || 0) + 1;
        return Promise.resolve();
      },
      writeText: async () => Promise.resolve(),
    },
    configurable: true,
  });
});

const page = await context.newPage();
let twitterIntentHit = false;

await page.route("https://twitter.com/intent/tweet**", async (route) => {
  twitterIntentHit = true;
  await route.abort();
});

await page.goto(url, { waitUntil: "domcontentloaded" });
await page.getByRole("button", { name: /share on x/i }).click();

await page.waitForFunction(() => window.__clipboardWrites >= 1, {
  timeout: 5000,
});

if (!twitterIntentHit) {
  await browser.close();
  throw new Error("Expected navigation to X intent after clipboard write.");
}

await browser.close();
console.log("OK: clipboard write + X intent navigation verified.");
