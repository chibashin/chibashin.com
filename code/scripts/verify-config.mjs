import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

const app = read("app.js");
const server = read("server.js");
const htaccess = read(".htaccess");
const index = read("index.html");
const cron = read("cron/fetch.php");
const api = read("api/articles.php");
const sitemap = read("sitemap.xml");
const readme = read("README.md");
const architectureDoc = read("docs/ARCHITECTURE.md");
const pkg = JSON.parse(read("package.json"));

const failures = [];
const fail = (message) => failures.push(message);

function extractQuotedStrings(value) {
  return [...value.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
}

function extractKeywordCandidates() {
  const candidates = [];
  const pattern = /\{\s*label:\s*"([^"]+)",\s*slug:\s*"([^"]+)"/g;
  for (const match of app.matchAll(pattern)) {
    candidates.push({ label: match[1], slug: match[2] });
  }
  return candidates;
}

function extractFeaturedLabels() {
  const match = /const featuredKeywordLabels = \[([\s\S]*?)\];/.exec(app);
  return match ? extractQuotedStrings(match[1]) : [];
}

function extractCleanRoutes() {
  const match = /const CLEAN_ROUTES = new Set\(\[([\s\S]*?)\]\);/.exec(server);
  return new Set(match ? extractQuotedStrings(match[1]) : []);
}

function extractHtaccessSlugs() {
  const match = /RewriteRule \^\(([^)]+)\)\/\?\$ \/index\.html \[L\]/.exec(htaccess);
  return new Set(match ? match[1].split("|") : []);
}

function extractAppStaticRoutes() {
  const routes = new Set();
  for (const blockName of ["serviceRoutes", "sourceRoutes"]) {
    const match = new RegExp(`const ${blockName} = \\[([\\s\\S]*?)\\];`).exec(app);
    if (!match) continue;
    for (const path of match[1].matchAll(/path:\s*"([^"]+)"/g)) {
      routes.add(path[1]);
    }
  }
  return routes;
}

const keywordCandidates = extractKeywordCandidates();
const keywordSlugs = new Set(keywordCandidates.map((candidate) => candidate.slug));
const featuredLabels = extractFeaturedLabels();
const keywordLabels = new Set(keywordCandidates.map((candidate) => candidate.label));
const cleanRoutes = extractCleanRoutes();
const htaccessSlugs = extractHtaccessSlugs();
const sitemapUrls = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]));
const appRoutes = new Set([
  ...extractAppStaticRoutes(),
  ...keywordCandidates.map((candidate) => `/${candidate.slug}/`),
]);
const sitemapOptionalRoutePattern = /^\/(saved|claude-topic|chatgpt-topic|openai-topic|gemini-topic|openclaw-topic)\/$/;

for (const label of featuredLabels) {
  if (!keywordLabels.has(label)) {
    fail(`featuredKeywordLabels has "${label}", but keywordCandidates does not.`);
  }
}

for (const route of appRoutes) {
  if (route === "/") continue;
  const slug = route.replace(/^\/|\/$/g, "");
  if (!cleanRoutes.has(route)) {
    fail(`server.js CLEAN_ROUTES is missing ${route}`);
  }
  if (!htaccessSlugs.has(slug)) {
    fail(`.htaccess RewriteRule is missing ${slug}`);
  }
  if (!sitemapOptionalRoutePattern.test(route) && !sitemapUrls.has(`https://chibashin.com${route}`)) {
    fail(`sitemap.xml is missing https://chibashin.com${route}`);
  }
}

for (const slug of keywordSlugs) {
  if (!app.includes(`slug: "${slug}"`)) {
    fail(`keywordCandidates slug check failed for ${slug}`);
  }
}

if (!readme.includes("## サイトの特徴") || !readme.includes("## どのように作られているか")) {
  fail("README.md must describe the site's features and architecture.");
}

for (const pattern of [
  /xserver/i,
  /ssh/i,
  /scp/i,
  /秘密鍵/,
  /\/home\//,
  /\/var\/www\//,
  /deploy@/,
  /本番/,
]) {
  if (pattern.test(readme)) {
    fail(`README.md must not contain private or deployment information matching ${pattern}.`);
  }
}

if (!architectureDoc.includes("変更時の同期箇所")) {
  fail("docs/ARCHITECTURE.md must document synchronized files for changes.");
}

if (!pkg.siteVersion) {
  fail("package.json must define siteVersion for cache-busted frontend assets.");
}

if (pkg.siteVersion && !index.includes(`/app.js?v=${pkg.siteVersion}`)) {
  fail(`index.html must load /app.js?v=${pkg.siteVersion}.`);
}

if (pkg.siteVersion && !index.includes(`/styles.css?v=${pkg.siteVersion}`)) {
  fail(`index.html must load /styles.css?v=${pkg.siteVersion}.`);
}

if (!index.includes("<title>AI Daily News | 生成AIニュース・AIツール情報</title>")) {
  fail("index.html title must use AI Daily News SEO wording.");
}

if (!index.includes('property="og:title" content="AI Daily News | 生成AIニュース・AIツール情報"')) {
  fail("index.html og:title must use AI Daily News SEO wording.");
}

if (!app.includes("AI Daily News |")) {
  fail("app.js dynamic route titles must use AI Daily News.");
}

if (index.includes("AI Daily Paper")) {
  fail("index.html must not contain the old AI Daily Paper name.");
}

if (readme.includes("AI Daily Paper")) {
  fail("README.md must not contain the old AI Daily Paper name.");
}

if (architectureDoc.includes("AI Daily Paper")) {
  fail("docs must not contain the old AI Daily Paper name.");
}

if (server.includes("AI Daily Paper") || cron.includes("AI Daily Paper")) {
  fail("server.js and cron/fetch.php user agents must use AI Daily News.");
}

if (htaccess.includes('SetEnvIf Request_URI ".*" Ngx_Cache_AllCacheMode')) {
  fail(".htaccess must not enable global Xserver cache for all requests.");
}

if (!htaccess.includes("Ngx_Cache_NoCacheMode")) {
  fail(".htaccess must disable Xserver cache for HTML/API/sitemap routes.");
}

if (!htaccess.includes('Cache-Control "no-store, no-cache, must-revalidate, max-age=0"')) {
  fail(".htaccess must send no-store headers for HTML/API/sitemap routes.");
}

if (!api.includes("Cache-Control: no-store")) {
  fail("api/articles.php must send Cache-Control: no-store.");
}

if (!app.includes("function normalizedImagePath")) {
  fail("app.js must normalize cached image paths before rendering images.");
}

if (!app.includes('node.querySelector(".article-thumb").remove();')) {
  fail("app.js must remove thumbnails from news article cards.");
}

if (!cron.includes("ainews_strip_news_images")) {
  fail("cron/fetch.php must strip images from non-webinar news articles.");
}

if (cron.includes("return './assets/cache/images/'")) {
  fail("cron/fetch.php must return root-relative cached image paths.");
}

if (!cron.includes("function ainews_normalize_cached_image_path")) {
  fail("cron/fetch.php must normalize cached image paths.");
}

if (/function ainews_prune_image_cache\(array \$articles,\s*int \$maxAgeDays/.test(cron)) {
  fail("cron/fetch.php must prune unreferenced image cache files immediately.");
}

if (failures.length) {
  console.error("Configuration verification failed:");
  for (const message of failures) {
    console.error(`- ${message}`);
  }
  process.exit(1);
}

console.log("Configuration verification passed.");
