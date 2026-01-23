const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function read(rel) {
  return fs.readFileSync(path.join(__dirname, "..", rel), "utf8");
}

function sliceBetween(source, startToken, endToken) {
  const start = source.indexOf(startToken);
  if (start === -1) return "";
  const end = source.indexOf(endToken, start + startToken.length);
  if (end === -1) return source.slice(start);
  return source.slice(start, end);
}

test("App routes /share/:token to DashboardPage public mode", () => {
  const src = read("dashboard/src/App.jsx");
  assert.match(src, /share/i);
  assert.match(src, /publicMode/);
  assert.match(src, /publicToken/);
});

test("public mode requires a share token", () => {
  const src = read("dashboard/src/App.jsx");
  assert.match(src, /publicMode\s*=\s*Boolean\(publicToken\)\s*;/);
  assert.doesNotMatch(src, /publicToken\)\s*\|\|\s*pathname\.startsWith/);
});

test("DashboardPage disables auth gate in public mode", () => {
  const src = read("dashboard/src/pages/DashboardPage.jsx");
  assert.match(src, /publicMode/);
  assert.match(src, /requireAuthGate/);
});

test("copy registry includes public view copy keys", () => {
  const src = read("dashboard/src/content/copy.csv");
  assert.ok(src.includes("dashboard.public_view.title"));
  assert.ok(src.includes("dashboard.public_view.status.enabled"));
  assert.ok(src.includes("dashboard.public_view.status.disabled"));
  assert.ok(src.includes("dashboard.public_view.action.copy"));
  assert.ok(src.includes("dashboard.public_view.action.enable"));
  assert.ok(src.includes("dashboard.public_view.action.disable"));
  assert.ok(src.includes("dashboard.public_view.invalid.title"));
  assert.ok(src.includes("dashboard.public_view.invalid.body"));
  assert.doesNotMatch(src, /Shareable dashboard link/);
  assert.ok(!src.includes("dashboard.public_view.subtitle"));
});

test("share routes rewrite to share.html", () => {
  const raw = read("dashboard/vercel.json");
  const parsed = JSON.parse(raw);
  const rewrites = Array.isArray(parsed.rewrites) ? parsed.rewrites : [];
  const hasShare = rewrites.some((rule) =>
    String(rule.source || "").includes("/share")
  );
  assert.ok(hasShare);
});

test("share html includes app entry script", () => {
  const src = read("dashboard/share.html");
  assert.match(src, /<script\s+type="module"\s+src="\/src\/main\.jsx"><\/script>/);
});

test("public view edge functions are defined", () => {
  const issueSrc = read("insforge-src/functions/vibeusage-public-view-issue.js");
  const revokeSrc = read("insforge-src/functions/vibeusage-public-view-revoke.js");
  assert.match(issueSrc, /public view/i);
  assert.match(revokeSrc, /public view/i);
});

test("public view profile edge function is defined", () => {
  const profileSrc = read(
    "insforge-src/functions/vibeusage-public-view-profile.js"
  );
  assert.match(profileSrc, /public[- ]view[- ]profile/i);
});

test("public view profile returns avatar url", () => {
  const profileSrc = read(
    "insforge-src/functions/vibeusage-public-view-profile.js"
  );
  assert.match(profileSrc, /avatar_url/);
});

test("public view profile does not select user_metadata", () => {
  const profileSrc = read(
    "insforge-src/functions/vibeusage-public-view-profile.js"
  );
  assert.doesNotMatch(profileSrc, /user_metadata/);
});

test("public view profile selects public users fields", () => {
  const profileSrc = read(
    "insforge-src/functions/vibeusage-public-view-profile.js"
  );
  assert.match(profileSrc, /select\(['"]nickname,avatar_url,profile,metadata['"]\)/);
});

test("public view panel does not render share link text", () => {
  const src = read("dashboard/src/pages/DashboardPage.jsx");
  assert.doesNotMatch(
    src,
    /publicViewUrl\s*\|\|\s*copy\("shared\.placeholder\.short"\)/
  );
  assert.doesNotMatch(src, /publicViewSubtitle/);
});

test("public view hides upgrade banner", () => {
  const src = read("dashboard/src/App.jsx");
  assert.match(src, /!\s*publicMode\s*\?\s*<UpgradeAlertModal/);
});

test("public share header shows login entry", () => {
  const src = read("dashboard/src/pages/DashboardPage.jsx");
  assert.match(src, /landing\.nav\.login/);
});

test("backend status does not expose refresh click", () => {
  const src = read("dashboard/src/components/BackendStatus.jsx");
  assert.doesNotMatch(src, /onClick=/);
  assert.doesNotMatch(src, /backend\.meta\.click_refresh/);
});

test("connection status renders bracket indicator only", () => {
  const src = read("dashboard/src/ui/matrix-a/components/ConnectionStatus.jsx");
  assert.doesNotMatch(src, /onClick/);
  assert.doesNotMatch(src, /status\.link\./);
  assert.doesNotMatch(src, /rounded-full/);
  assert.match(src, /matrix-header-chip--bare/);
});

test("public view invalid check handles string errors", () => {
  const src = read("dashboard/src/pages/DashboardPage.jsx");
  assert.match(src, /usageError\?\.message\s*\|\|\s*usageError/);
});

test("public view uses raw identity name", () => {
  const src = read("dashboard/src/pages/DashboardPage.jsx");
  const block = sliceBetween(
    src,
    "const identityRawName",
    "const identityStartDate"
  );
  assert.ok(block, "identity display block not found");
  assert.match(block, /publicMode/);
  assert.match(block, /publicProfileName/);
});

test("public view fetches profile display name", () => {
  const src = read("dashboard/src/pages/DashboardPage.jsx");
  assert.match(src, /getPublicViewProfile/);
  assert.match(src, /publicProfileName/);
});

test("public view fetches profile avatar url", () => {
  const src = read("dashboard/src/pages/DashboardPage.jsx");
  assert.match(src, /publicProfileAvatarUrl/);
  assert.match(src, /avatar_url/);
});

test("public view identity card uses pixel avatar", () => {
  const src = read("dashboard/src/pages/DashboardPage.jsx");
  assert.match(src, /<IdentityCard[\s\S]*avatarUrl=\{null\}/);
});

test("public view clears profile state before fetching new token", () => {
  const src = read("dashboard/src/pages/DashboardPage.jsx");
  assert.match(
    src,
    /if\s*\(!publicToken\)\s*\{[\s\S]*?\}\s*setPublicProfileName\(null\);\s*setPublicProfileAvatarUrl\(null\);\s*let active = true;\s*getPublicViewProfile/s
  );
});

test("identity card supports avatar fallback", () => {
  const src = read("dashboard/src/ui/matrix-a/components/IdentityCard.jsx");
  assert.match(src, /avatarUrl/);
  assert.match(src, /onError/);
});

test("public view copy issues a token when missing", () => {
  const src = read("dashboard/src/pages/DashboardPage.jsx");
  const block = sliceBetween(
    src,
    "const handleCopyPublicView",
    "const handleTogglePublicView"
  );
  assert.ok(block, "handleCopyPublicView block not found");
  assert.match(block, /issuePublicViewToken/);
});

test("public view copy is not gated on existing url", () => {
  const src = read("dashboard/src/pages/DashboardPage.jsx");
  assert.doesNotMatch(
    src,
    /onClick=\{handleCopyPublicView\}[\s\S]*disabled=\{[^}]*publicViewUrl/
  );
});
