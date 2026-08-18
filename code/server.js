import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const DEFAULT_PORT = 5179;
const START_PORT = Number(process.env.PORT || DEFAULT_PORT);
const PORT_WAS_SET = Boolean(process.env.PORT);
const MAX_AUTO_PORT = START_PORT + 20;
const HOST = process.env.HOST || "127.0.0.1";
const ROOT = new URL(".", import.meta.url).pathname;
const CACHE_FILE = join(ROOT, "data/articles.json");
const PRODUCTION_API_URL = "https://chibashin.com/api/articles.php?v=local-cache";
const PRODUCTION_ORIGIN = "https://chibashin.com";
const CLEAN_ROUTES = new Set([
  "/chatgpt/",
  "/openai/",
  "/claude/",
  "/gemini/",
  "/openclaw/",
  "/saved/",
  "/generative-ai/",
  "/ai-agent/",
  "/llm/",
  "/claude-topic/",
  "/chatgpt-topic/",
  "/openai-topic/",
  "/gemini-topic/",
  "/openclaw-topic/",
  "/rag/",
  "/multimodal/",
  "/reasoning-model/",
  "/physical-ai/",
  "/security/",
  "/foundation-model/",
  "/figma/",
  "/adobe/",
  "/pencil/",
  "/codex/",
  "/canva/",
  "/vscode/",
  "/cursor/",
  "/antigravity/",
  "/design/",
  "/development/",
  "/microsoft/",
  "/google/",
  "/nvidia/",
  "/medical-ai/",
  "/education-ai/",
  "/copyright/",
  "/ai-regulation/",
  "/qiita/",
  "/zenn/",
  "/aismiley/",
  "/ledge-ai/",
  "/web-designing/",
  "/bing-ai-news/",
  "/not-design-school/",
  "/doorkeeper/",
  "/born-digital/",
]);

const SOURCES = [
  { name: "Qiita", url: "https://qiita.com/", type: "qiita" },
  { name: "Zenn", url: "https://zenn.dev/", type: "zenn" },
  { name: "AIsmiley", url: "https://aismiley.co.jp/ai_news/", type: "aismiley" },
  { name: "Ledge.ai", url: "https://ledge.ai/", type: "ledge" },
  { name: "Web Designing", url: "https://webdesigning.book.mynavi.jp/", type: "webdesigning" },
  { name: "Bing AI News", url: "https://www.bing.com/news/", type: "bingAiNews" },
  { name: "NOT DESIGN SCHOOL", url: "https://not-design-school.connpass.com/event/", type: "notDesignSchool" },
  { name: "Doorkeeper", url: "https://cssnite.doorkeeper.jp/", type: "doorkeeper" },
  { name: "Born Digital", url: "https://www.borndigital.co.jp/seminar/seminar/", type: "bornDigital" },
];

const BING_NEWS_FEEDS = [
  "https://www.bing.com/news/search?q=OpenClaw&format=rss",
  "https://www.bing.com/news/search?q=AI&format=rss",
  "https://www.bing.com/news/search?q=ChatGPT&format=rss",
  "https://www.bing.com/news/search?q=Claude&format=rss",
  "https://www.bing.com/news/search?q=Gemini&format=rss",
  "https://www.bing.com/news/search?q=Figma%20AI&format=rss",
  "https://www.bing.com/news/search?q=Adobe%20AI&format=rss",
  "https://www.bing.com/news/search?q=Adobe%20Firefly&format=rss",
  "https://www.bing.com/news/search?q=Pencil%20AI%20design&format=rss",
  "https://www.bing.com/news/search?q=Codex%20AI&format=rss",
  "https://www.bing.com/news/search?q=Canva%20AI&format=rss",
  "https://www.bing.com/news/search?q=VS%20Code%20AI&format=rss",
  "https://www.bing.com/news/search?q=Cursor%20AI&format=rss",
  "https://www.bing.com/news/search?q=Google%20Antigravity&format=rss",
];

const QIITA_TAGS = [
  "ai",
  "claudecode",
  "claude",
  "llm",
  "aiエージェント",
  "codex",
  "openai",
  "chatgpt",
  "gemini",
  "figma",
  "adobe",
  "canva",
  "pencil",
  "vscode",
  "visualstudiocode",
  "cursor",
];

const ZENN_TOPICS = [
  "ai",
  "claude",
  "agent",
  "codex",
  "openai",
  "gemini",
  "figma",
  "adobe",
  "canva",
  "vscode",
  "visualstudiocode",
  "cursor",
];

const DOORKEEPER_GROUPS = [
  { url: "https://cssnite.doorkeeper.jp/", baseUrl: "https://cssnite.doorkeeper.jp" },
  { url: "https://dtptransit.doorkeeper.jp/", baseUrl: "https://dtptransit.doorkeeper.jp" },
];

const KEYWORDS = [
  "AI",
  "生成AI",
  "人工知能",
  "LLM",
  "ChatGPT",
  "Claude",
  "Gemini",
  "OpenAI",
  "Openclaw",
  "OpenClaw",
  "Anthropic",
  "エージェント",
  "AIエージェント",
  "フィジカルAI",
  "Physical AI",
  "機械学習",
  "ディープラーニング",
  "RAG",
  "マルチモーダル",
  "推論モデル",
  "Figma",
  "Adobe",
  "Adobe Firefly",
  "Photoshop",
  "Illustrator",
  "Canva",
  "Pencil",
  "Codex",
  "VSCode",
  "VS Code",
  "Visual Studio Code",
  "Cursor",
  "Cursor AI",
  "Anysphere",
  "Antigravity",
  "Google Antigravity",
  "Notion AI",
];

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${HOST}:${currentPort}`);

  if (url.pathname === "/api/articles" || url.pathname === "/api/articles.php") {
    const payload = await localArticlesPayload(url.searchParams);
    response.writeHead(200, {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    });
    response.end(JSON.stringify(payload));
    return;
  }

  const routePath = normalizeRoutePath(url.pathname);
  const filePath = safeFilePath(routePath === "/" || CLEAN_ROUTES.has(routePath) ? "/index.html" : url.pathname);
  if (!filePath) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const body = await readFile(filePath);
    response.writeHead(200, {
      "content-type": mimeTypes[extname(filePath)] || "application/octet-stream",
      ...cacheHeaders(filePath),
    });
    response.end(body);
  } catch {
    if (url.pathname.startsWith("/assets/cache/images/")) {
      const synced = await syncProductionAsset(url.pathname, filePath);
      if (synced) {
        response.writeHead(200, { "content-type": mimeTypes[extname(filePath)] || synced.contentType });
        response.end(synced.body);
        return;
      }
    }

    response.writeHead(404);
    response.end("Not found");
  }
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    if (!PORT_WAS_SET && currentPort < MAX_AUTO_PORT) {
      const blockedPort = currentPort;
      currentPort += 1;
      console.warn(`Port ${blockedPort} is already in use. Trying ${currentPort}...`);
      startServer();
      return;
    }

    console.error(`Port ${currentPort} is already in use.`);
    console.error("Stop the existing process or start this server with another port, for example: PORT=5180 npm start");
    process.exit(1);
  }

  throw error;
});

let currentPort = START_PORT;

server.on("listening", () => {
  console.log(`AI Daily News running at http://${HOST}:${currentPort}/`);
});

function startServer() {
  server.listen(currentPort, HOST);
}

function cacheHeaders(filePath) {
  const extension = extname(filePath);
  if ([".html", ".xml", ".txt", ".php", ".json"].includes(extension)) {
    return {
      "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
      pragma: "no-cache",
      expires: "0",
    };
  }
  if ([".css", ".js", ".webp", ".jpg", ".jpeg", ".png", ".gif", ".svg"].includes(extension)) {
    return { "cache-control": "public, max-age=604800" };
  }
  return {};
}

startServer();

async function localArticlesPayload(searchParams) {
  if (searchParams.get("refresh") === "live") {
    return collectArticles();
  }

  const cachedPayload = await readCachedPayload();
  if (hasArticles(cachedPayload)) {
    return cachedPayload;
  }

  try {
    const productionPayload = await fetchProductionPayload();
    if (hasArticles(productionPayload)) {
      await writeCachedPayload(productionPayload);
      return productionPayload;
    }
  } catch (error) {
    console.warn(`Production cache sync failed: ${error.message}`);
  }

  return collectArticles();
}

async function readCachedPayload() {
  try {
    return JSON.parse(await readFile(CACHE_FILE, "utf8"));
  } catch {
    return null;
  }
}

async function writeCachedPayload(payload) {
  await mkdir(join(ROOT, "data"), { recursive: true });
  await writeFile(CACHE_FILE, `${JSON.stringify(payload, null, 2)}\n`);
}

async function syncProductionAsset(pathname, filePath) {
  const response = await fetch(`${PRODUCTION_ORIGIN}${pathname}`, {
    headers: {
      accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      "user-agent": "Mozilla/5.0 (compatible; AI Daily News local asset cache; +http://localhost)",
    },
  });
  if (!response.ok) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "application/octet-stream";
  if (!contentType.toLowerCase().startsWith("image/")) {
    return null;
  }

  const body = Buffer.from(await response.arrayBuffer());
  await mkdir(join(ROOT, "assets/cache/images"), { recursive: true });
  await writeFile(filePath, body);
  return { body, contentType };
}

async function fetchProductionPayload() {
  const response = await fetch(PRODUCTION_API_URL, {
    headers: {
      accept: "application/json",
      "user-agent": "Mozilla/5.0 (compatible; AI Daily News local cache; +http://localhost)",
    },
  });
  if (!response.ok) {
    throw new Error(`Production API returned ${response.status}`);
  }
  return response.json();
}

function hasArticles(payload) {
  return Array.isArray(payload?.articles) && payload.articles.length > 0;
}

function safeFilePath(pathname) {
  const decoded = decodeURIComponent(pathname);
  const filePath = normalize(join(ROOT, decoded));
  return filePath.startsWith(ROOT) ? filePath : "";
}

function normalizeRoutePath(pathname) {
  if (!pathname || pathname === "/") return "/";
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

async function collectArticles() {
  const results = await Promise.allSettled([
    fetchQiita(),
    fetchZenn(),
    fetchAismiley(),
    fetchLedge(),
    fetchWebDesigning(),
    fetchBingAiNews(),
    fetchNotDesignSchoolEvents(),
    fetchDoorkeeperEvents(),
    fetchBornDigitalEvents(),
  ]);

  const articles = [];
  const errors = [];
  results.forEach((result, index) => {
    const source = SOURCES[index];
    if (result.status === "fulfilled") {
      articles.push(...result.value);
    } else {
      errors.push({ source: source.name, message: result.reason.message });
    }
  });

  const sortedArticles = dedupe(articles)
    .filter((article) => {
      if (article.category === "webinar") return isActiveWebinar(article);
      return article.forceInclude || isRelevant(article.title, article.detail);
    })
    .map((article) => {
      const { forceInclude, ...publicArticle } = article;
      return publicArticle;
    })
    .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));

  return {
    fetchedAt: new Date().toISOString(),
    sources: SOURCES.map(({ name, url }) => ({ name, url })),
    errors,
    articles: await enrichArticleImages(sortedArticles),
  };
}

async function fetchQiita() {
  const tagItems = await Promise.all(QIITA_TAGS.map(async (tag) => {
    const query = encodeURIComponent(`tag:${tag}`);
    return fetchJson(`https://qiita.com/api/v2/items?query=${query}&per_page=20&page=1`);
  }));

  const tagArticles = tagItems.flat().map((item) => ({
    id: `qiita:${item.id}`,
    title: item.title,
    url: item.url,
    source: "Qiita",
    detail: [item.user?.id, item.tags?.map((tag) => tag.name).join(", ")].filter(Boolean).join(" / "),
    publishedAt: item.created_at,
    image: "",
    category: categoryFor(`${item.title} ${item.tags?.map((tag) => tag.name).join(" ") || ""}`),
    likesCount: Number(item.likes_count || 0),
    stocksCount: Number(item.stocks_count || 0),
  }));

  return dedupe(tagArticles).slice(0, 120);
}

async function fetchZenn() {
  const topicItems = await Promise.all(ZENN_TOPICS.map(async (topic) => {
    const payload = await fetchJson(`https://zenn.dev/api/articles?topicname=${encodeURIComponent(topic)}&order=latest&count=20`);
    return (payload.articles || []).slice(0, 20);
  }));

  const articles = dedupe(topicItems.flat().map((item) => ({
    id: `zenn:${item.id || item.path}`,
    title: item.title,
    url: `https://zenn.dev${item.path || ""}`,
    source: "Zenn",
    detail: item.user?.username || item.user?.name || "",
    publishedAt: item.published_at,
    image: "",
    category: categoryFor(item.title || ""),
    likesCount: Number(item.liked_count || 0),
    stocksCount: Number(item.bookmarked_count || 0),
  }))).slice(0, 120);

  return articles;
}

async function fetchAismiley() {
  const html = await fetchText("https://aismiley.co.jp/ai_news/");
  return extractHtmlArticles(html, {
    source: "AIsmiley",
    baseUrl: "https://aismiley.co.jp",
    include: (url) => url.includes("/ai_news/"),
  }).slice(0, 24);
}

async function fetchLedge() {
  const html = await fetchText("https://ledge.ai/");
  return extractHtmlArticles(html, {
    source: "Ledge.ai",
    baseUrl: "https://ledge.ai",
    detail: "AI特化ニュース",
    include: (url) => url.startsWith("https://ledge.ai/articles/"),
  }).slice(0, 24);
}

async function fetchWebDesigning() {
  const html = await fetchText("https://webdesigning.book.mynavi.jp/");
  return extractHtmlArticles(html, {
    source: "Web Designing",
    baseUrl: "https://webdesigning.book.mynavi.jp",
    include: (url) => url.startsWith("https://webdesigning.book.mynavi.jp/") && !url.endsWith(".jpg"),
  }).slice(0, 24);
}

async function fetchBingAiNews() {
  const feedItems = await Promise.all(BING_NEWS_FEEDS.map(async (feedUrl) => parseRss(await fetchText(feedUrl)).slice(0, 12)));
  return dedupe(feedItems.flat().map((item) => ({
    id: `bing-ai-news:${item.url}`,
    title: item.title,
    url: item.url,
    source: "Bing AI News",
    detail: stripTags(item.description).slice(0, 120) || "Bing News RSS",
    publishedAt: item.publishedAt,
    image: item.image,
    category: categoryFor(`${item.title} ${item.description}`),
  }))).slice(0, 96);
}

async function fetchNotDesignSchoolEvents() {
  const html = await fetchText("https://not-design-school.connpass.com/event/");
  return extractConnpassEvents(html, {
    source: "NOT DESIGN SCHOOL",
    baseUrl: "https://not-design-school.connpass.com",
  }).slice(0, 12);
}

async function fetchDoorkeeperEvents() {
  const groupEvents = await Promise.all(DOORKEEPER_GROUPS.map(async (group) => {
    const html = await fetchText(group.url);
    return extractDoorkeeperEvents(html, {
      source: "Doorkeeper",
      baseUrl: group.baseUrl,
    });
  }));

  return dedupe(groupEvents.flat()).slice(0, 18);
}

async function fetchBornDigitalEvents() {
  const html = await fetchText("https://www.borndigital.co.jp/seminar/seminar/");
  const blocks = [...html.matchAll(/<li class="c-squareCards__item"[\s\S]*?<\/li>/g)].slice(0, 24).map((match) => match[0]);
  const events = [];
  const seen = new Set();

  for (const block of blocks) {
    if (!block.includes('data-category="seminar"')) continue;

    const href = /<a class="c-squareCards__item-wrapper" href="([^"]+)"/i.exec(block);
    const title = cleanTitle(stripTags(/<h3 class="c-squareCards__item-title">([\s\S]*?)<\/h3>/i.exec(block)?.[1] || ""));
    if (!href || !title) continue;

    const url = absoluteUrl(decode(href[1]), "https://www.borndigital.co.jp");
    if (!url || seen.has(url)) continue;
    seen.add(url);

    let detail = cleanTitle(stripTags(/<span class="c-squareCards__item-text">([\s\S]*?)<\/span>/i.exec(block)?.[1] || ""));
    if (!detail.includes("SEMINAR")) continue;

    let publishedAt = parseBornDigitalDate(title, url);
    let image = /<img[^>]+src="([^"]+)"/i.exec(block)?.[1] || "";

    if (new URL(url).hostname.includes("borndigital.co.jp")) {
      try {
        const detailHtml = await fetchText(url);
        const status = cleanTitle(stripTags(/<ul class="c-article__tag">([\s\S]*?)<\/ul>/i.exec(detailHtml)?.[1] || ""));
        if (/受付終了|募集終了|申込終了|終了しました|開催終了|イベント終了/.test(status)) continue;
        const dateCell = tableValue(detailHtml, "開催日時");
        const methodCell = tableValue(detailHtml, "開催方法");
        const deadlineCell = tableValue(detailHtml, "申込期限");
        publishedAt = parseBornDigitalDate(dateCell || title, url) || publishedAt;
        detail = ["ウェビナー", status, methodCell, dateCell, deadlineCell ? `申込期限 ${deadlineCell}` : ""].filter(Boolean).join(" / ");
        image = /<meta property="og:image" content="([^"]+)"/i.exec(detailHtml)?.[1] || image;
      } catch {
        // Keep the listing item when the detail page is temporarily unavailable.
      }
    }

    events.push({
      id: `Born Digital:${url}`,
      title,
      url,
      source: "Born Digital",
      detail,
      publishedAt,
      image,
      category: "webinar",
    });
  }

  return events;
}

async function fetchText(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; AI Daily News local reader; +http://localhost)",
        "accept": "text/html,application/rss+xml,application/json;q=0.9,*/*;q=0.8",
      },
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return await response.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchJson(url) {
  return JSON.parse(await fetchText(url));
}

async function fetchTextWithTimeout(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; AI Daily News image reader; +http://localhost)",
        "accept": "text/html,*/*;q=0.8",
      },
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return await response.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function enrichArticleImages(articles) {
  const enriched = articles.map((article) => (
    article.category === "webinar"
      ? { ...article, image: normalizeCachedImagePath(article.image || "") }
      : { ...article, image: "" }
  ));
  const missingImageIndexes = enriched
    .map((article, index) => ({ article, index }))
    .filter(({ article }) => article.category === "webinar" && !article.image && article.url)
    .slice(0, 80);

  for (const { article, index } of missingImageIndexes) {
    try {
      const html = await fetchTextWithTimeout(article.url, 8000);
      const image = extractMetaImage(html, article.url);
      if (image) {
        enriched[index] = { ...article, image };
      }
    } catch {
      // Image metadata is optional; keep the article even when a page blocks scraping.
    }
  }

  return enriched;
}

function normalizeCachedImagePath(image) {
  return image ? String(image).replace(/^\.\/assets\//, "/assets/") : "";
}

function extractMetaImage(html, pageUrl) {
  const image = getMetaContent(html, "property", "og:image")
    || getMetaContent(html, "property", "og:image:secure_url")
    || getMetaContent(html, "name", "twitter:image")
    || getMetaContent(html, "property", "twitter:image");
  return image ? absoluteUrl(decode(image), pageUrl) : "";
}

function getMetaContent(html, keyName, keyValue) {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    const key = getAttribute(tag, keyName);
    if (key?.toLowerCase() === keyValue.toLowerCase()) {
      return getAttribute(tag, "content") || "";
    }
  }
  return "";
}

function getAttribute(tag, name) {
  const match = new RegExp(`${name}=["']([^"']+)["']`, "i").exec(tag);
  return match?.[1] || "";
}

function parseRss(xml) {
  return [...xml.matchAll(/<item\b[\s\S]*?<\/item>/g)].map((match) => {
    const item = match[0];
    return {
      title: getXmlValue(item, "title"),
      url: getXmlValue(item, "link"),
      description: getXmlValue(item, "description"),
      publishedAt: getXmlValue(item, "pubDate"),
      creator: getXmlValue(item, "dc:creator"),
      image: /<enclosure[^>]+url="([^"]+)"/.exec(item)?.[1] || "",
    };
  }).filter((item) => item.title && item.url);
}

function getXmlValue(xml, tag) {
  const match = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`).exec(xml);
  return decode(match?.[1] || "").trim();
}

function extractHtmlArticles(html, options) {
  const articles = [];
  const seen = new Set();

  for (const match of html.matchAll(/<a\b([^>]*href=["'][^"']+["'][^>]*)>([\s\S]*?)<\/a>/gi)) {
    const attrs = match[1];
    const href = /href=["']([^"']+)["']/i.exec(attrs)?.[1];
    if (!href) continue;

    const url = absoluteUrl(decode(href), options.baseUrl);
    const title = cleanTitle(stripTags(match[2]));
    if (!url || !title || title.length < 12 || seen.has(url) || !options.include(url)) continue;

    seen.add(url);
    articles.push({
      id: `${options.source}:${url}`,
      title,
      url,
      source: options.source,
      detail: options.detail || (options.source === "AIsmiley" ? "AIニュース" : "Web制作・デザイン"),
      publishedAt: extractDate(title) || extractDateNear(html, match.index) || "",
      image: "",
      category: categoryFor(title),
    });
  }

  return articles;
}

function extractConnpassEvents(html, options) {
  return [...html.matchAll(/<div class="group_event_list vevent">([\s\S]*?)(?=<div class="group_event_list vevent">|<div class="paging_area">)/g)]
    .map((match) => {
      const block = match[1];
      const href = /<a class="url summary" href="([^"]+)">([\s\S]*?)<\/a>/i.exec(block);
      if (!href) return null;
      const startsAt = /class="value-title" title="([^"]+)"/i.exec(block)?.[1] || "";
      const status = cleanTitle(stripTags(/label_status_event[^>]*>([\s\S]*?)<\/span>/i.exec(block)?.[1] || ""));
      const place = cleanTitle(stripTags(/<p class="event_place location">([\s\S]*?)<\/p>/i.exec(block)?.[1] || "オンライン開催"));
      const participants = cleanTitle(stripTags(/<p class="event_participants">([\s\S]*?)<\/p>/i.exec(block)?.[1] || ""));
      const url = absoluteUrl(href[1], options.baseUrl);
      return {
        id: `${options.source}:${url}`,
        title: cleanTitle(stripTags(href[2])),
        url,
        source: options.source,
        detail: ["ウェビナー", status, place, participants].filter(Boolean).join(" / "),
        publishedAt: startsAt,
        image: /<img[^>]+src="([^"]+)"/i.exec(block)?.[1] || "",
        category: "webinar",
      };
    })
    .filter(Boolean);
}

function extractDoorkeeperEvents(html, options) {
  return [...html.matchAll(/<div class='global-event events-list'>([\s\S]*?)(?=<div class='global-event events-list'>|<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>)/g)]
    .map((match) => {
      const block = match[1];
      const href = /<a href="([^"]+)"><span>([\s\S]*?)<\/span>\s*<\/a>/i.exec(block);
      if (!href || !href[1].includes("/events/")) return null;
      const date = cleanTitle(stripTags(/events-list-item-time-date'>([\s\S]*?)<\/span>/i.exec(block)?.[1] || ""));
      const time = cleanTitle(stripTags(/<time class='events-list-item-time'>[\s\S]*?<\/span>\s*([^<]+)<\/time>/i.exec(block)?.[1] || ""));
      const status = cleanTitle(stripTags(/label label-[^']+'>([\s\S]*?)<\/label>/i.exec(block)?.[1] || ""));
      const venue = cleanTitle(stripTags(/events-list-item-venue'>([\s\S]*?)<\/div>/i.exec(block)?.[1] || "オンライン"));
      const url = absoluteUrl(href[1], options.baseUrl);
      return {
        id: `${options.source}:${url}`,
        title: cleanTitle(stripTags(href[2])),
        url,
        source: options.source,
        detail: ["ウェビナー", status, venue, [date, time].filter(Boolean).join(" ")].filter(Boolean).join(" / "),
        publishedAt: parseJapaneseEventDate(date, time),
        image: "",
        category: "webinar",
      };
    })
    .filter(Boolean);
}

function extractDateNear(html, index = 0) {
  const snippet = html.slice(Math.max(0, index - 240), index + 360);
  return extractDate(snippet);
}

function extractDate(text) {
  const jpDate = /20\d{2}\s*[/-]\s*\d{1,2}\s*[/-]\s*\d{1,2}/.exec(text)?.[0];
  if (!jpDate) return "";
  const [year, month, day] = jpDate.split(/[/-]/).map((part) => Number(part.trim()));
  const date = new Date(Date.UTC(year, month - 1, day));
  if (!Number.isNaN(date.getTime())) return date.toISOString();
  return "";
}

function parseJapaneseEventDate(dateText, timeText = "") {
  const dateMatch = /(\d{4})年(\d{1,2})月(\d{1,2})日/.exec(dateText || "");
  if (!dateMatch) return "";
  const timeMatch = /(\d{1,2}):(\d{2})/.exec(timeText || "");
  const [, year, month, day] = dateMatch.map(Number);
  const hour = timeMatch ? Number(timeMatch[1]) : 0;
  const minute = timeMatch ? Number(timeMatch[2]) : 0;
  const date = new Date(Date.UTC(year, month - 1, day, hour - 9, minute));
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function tableValue(html, label) {
  const match = new RegExp(`<th[^>]*>\\s*${label}\\s*<\\/th>\\s*<td[^>]*>([\\s\\S]*?)<\\/td>`, "i").exec(html);
  return match ? cleanTitle(stripTags(match[1])) : "";
}

function parseBornDigitalDate(text, url = "") {
  const dateMatch = /(20\d{2})年\s*(\d{1,2})月\s*(\d{1,2})日/.exec(text || "");
  if (dateMatch) {
    const time = /(\d{1,2}):(\d{2})/.exec(text || "")?.[0] || "";
    return parseJapaneseEventDate(`${dateMatch[1]}年${dateMatch[2]}月${dateMatch[3]}日`, time);
  }

  const urlMatch = /\/(\d{2})(\d{2})(\d{2})[_-]/.exec(url || "");
  if (!urlMatch) return "";
  return new Date(Date.UTC(2000 + Number(urlMatch[1]), Number(urlMatch[2]) - 1, Number(urlMatch[3]))).toISOString();
}

function isActiveWebinar(article) {
  if (/受付終了|募集終了|申込終了|終了しました|開催終了|イベント終了/.test(article.detail || "")) {
    return false;
  }

  const time = new Date(article.publishedAt || "").getTime();
  return Number.isNaN(time) || time >= Date.now();
}

function absoluteUrl(href, baseUrl) {
  try {
    return new URL(href, baseUrl).toString().split("#")[0];
  } catch {
    return "";
  }
}

function dedupe(articles) {
  const seenUrls = new Set();
  const seenTitles = new Set();
  return articles.filter((article) => {
    const urlKey = canonicalArticleUrl(article.url).replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
    const titleKey = canonicalTitle(article.title);
    if (urlKey && seenUrls.has(urlKey)) return false;
    if (titleKey.length >= 16 && seenTitles.has(titleKey)) return false;
    if (urlKey) seenUrls.add(urlKey);
    if (titleKey.length >= 16) seenTitles.add(titleKey);
    return true;
  });
}

function canonicalArticleUrl(value) {
  try {
    const url = new URL(value);
    const linkedUrl = url.searchParams.get("url");
    if (url.hostname.includes("bing.com") && linkedUrl) return decode(linkedUrl);
  } catch {
    return value || "";
  }
  return value || "";
}

function canonicalTitle(value) {
  return decode(value)
    .toLowerCase()
    .replace(/[\s"'“”‘’「」『』【】\[\]（）(),.、。!?！？:：;；|｜\-〜~…・/／]/g, "")
    .trim();
}

function isRelevant(...values) {
  const text = values.join(" ");
  return KEYWORDS.some((keyword) => text.toLowerCase().includes(keyword.toLowerCase()));
}

function categoryFor(text) {
  const haystack = text.toLowerCase();
  if (/(ウェビナー|セミナー|講座|勉強会|開催|受付中|オンライン開催)/.test(haystack)) {
    return "webinar";
  }
  if (/(研究|論文|モデル|llm|deepmind|openai|anthropic|benchmark|ベンチマーク|gpt|claude|gemini)/.test(haystack)) {
    return "research";
  }
  if (/(企業|投資|資金調達|株|決算|ビジネス|nvidia|半導体|チップ|スタートアップ|サービス|導入|製品)/.test(haystack)) {
    return "business";
  }
  if (/(政策|規制|安全|法律|著作権|政府|省|庁|eu|ai法|セキュリティ|脆弱性)/.test(haystack)) {
    return "policy";
  }
  return "news";
}

function stripTags(value) {
  return decode(String(value || "").replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

function cleanTitle(value) {
  return decode(value)
    .replace(/\bNEW\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function decode(value) {
  return String(value || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}
