const ARTICLE_INITIAL_LIMIT = 31;
const ARTICLE_LOAD_INCREMENT = 30;

const state = {
  view: "all",
  navQuery: "",
  keywordQuery: "",
  sourceFilter: "",
  sortMode: "latest",
  articleLimit: ARTICLE_INITIAL_LIMIT,
  menuOpen: false,
  loadingTimer: null,
  loadingStartedAt: 0,
  articles: [],
  sources: [],
  errors: [],
  saved: new Set(JSON.parse(localStorage.getItem("ai-daily-saved") || "[]")),
};

const defaultState = {
  view: "all",
  navQuery: "",
  keywordQuery: "",
  sourceFilter: "",
  sortMode: "latest",
};

const elements = {
  editionDate: document.querySelector("#editionDate"),
  homeButton: document.querySelector("#homeButton"),
  menuButton: document.querySelector("#menuButton"),
  siteMenu: document.querySelector("#siteMenu"),
  leadStory: document.querySelector("#leadStory"),
  articlesGrid: document.querySelector("#articlesGrid"),
  loadMoreButton: document.querySelector("#loadMoreButton"),
  webinarGrid: document.querySelector("#webinarGrid"),
  sourceLists: [...document.querySelectorAll("#sourceList, #sourceListMenu")],
  sourceCounts: [...document.querySelectorAll("#sourceCount, #sourceCountMenu")],
  statusText: document.querySelector("#statusText"),
  webinarStatusText: document.querySelector("#webinarStatusText"),
  keywordSearchForm: document.querySelector("#keywordSearchForm"),
  keywordSearchInput: document.querySelector("#keywordSearchInput"),
  featuredChips: document.querySelector("#featuredChips"),
  topicChips: document.querySelector("#topicChips"),
  sortFilters: document.querySelector("#sortFilters"),
  sortFilterGroups: [...document.querySelectorAll("[data-sort-filters], .mobile-sort-bar")],
  loadingPanel: document.querySelector("#loadingPanel"),
  loadingTitle: document.querySelector("#loadingTitle"),
  loadingDetail: document.querySelector("#loadingDetail"),
  loadingBar: document.querySelector("#loadingBar"),
  loadingSteps: [...document.querySelectorAll(".loading-steps li")],
};

const formatter = new Intl.DateTimeFormat("ja-JP", {
  dateStyle: "full",
  timeZone: "Asia/Tokyo",
});

const keywordCandidates = [
  { label: "生成AI", slug: "generative-ai", terms: ["生成AI", "Generative AI", "GenAI"] },
  { label: "AIエージェント", slug: "ai-agent", terms: ["AIエージェント", "エージェントAI", "AI agent", "AI agents", "agentic"] },
  { label: "LLM", slug: "llm", terms: ["LLM", "大規模言語モデル"] },
  { label: "Claude", slug: "claude-topic", terms: ["Claude", "Anthropic"] },
  { label: "ChatGPT", slug: "chatgpt-topic", terms: ["ChatGPT", "GPT"] },
  { label: "OpenAI", slug: "openai-topic", terms: ["OpenAI"] },
  { label: "Gemini", slug: "gemini-topic", terms: ["Gemini", "Google DeepMind"] },
  { label: "OpenClaw", slug: "openclaw-topic", terms: ["OpenClaw", "Openclaw"] },
  { label: "RAG", slug: "rag", terms: ["RAG", "検索拡張生成"] },
  { label: "マルチモーダル", slug: "multimodal", terms: ["マルチモーダル", "multimodal", "画像生成", "動画生成", "音声AI"] },
  { label: "推論モデル", slug: "reasoning-model", terms: ["推論モデル", "reasoning", "推論"] },
  { label: "フィジカルAI", slug: "physical-ai", terms: ["フィジカルAI", "Physical AI", "ロボット", "robotics"] },
  { label: "セキュリティ", slug: "security", terms: ["セキュリティ", "脆弱性", "サイバーセキュリティ", "security"] },
  { label: "基盤モデル", slug: "foundation-model", terms: ["基盤モデル", "foundation model", "モデル"] },
  { label: "Figma", slug: "figma", terms: ["Figma"] },
  { label: "Adobe", slug: "adobe", terms: ["Adobe", "Photoshop", "Illustrator", "Adobe Express"] },
  { label: "Pencil", slug: "pencil", terms: ["Pencil"] },
  { label: "Codex", slug: "codex", terms: ["Codex", "OpenAI Codex"] },
  { label: "Canva", slug: "canva", terms: ["Canva"] },
  { label: "VSCode", slug: "vscode", terms: ["VSCode", "VS Code", "Visual Studio Code"] },
  { label: "Cursor", slug: "cursor", terms: ["Cursor AI", "Cursor", "Anysphere"] },
  { label: "Antigravity", slug: "antigravity", terms: ["Antigravity", "Google Antigravity"] },
  { label: "デザイン", slug: "design", terms: ["デザイン", "UI", "UX", "Webデザイン"] },
  { label: "開発", slug: "development", terms: ["開発", "プログラミング", "API", "コード"] },
  { label: "Microsoft", slug: "microsoft", terms: ["Microsoft", "Azure"] },
  { label: "Google", slug: "google", terms: ["Google"] },
  { label: "NVIDIA", slug: "nvidia", terms: ["NVIDIA", "GPU", "半導体"] },
  { label: "医療AI", slug: "medical-ai", terms: ["医療AI", "ヘルスケア", "医療"] },
  { label: "教育AI", slug: "education-ai", terms: ["教育AI", "ラーニング", "学習"] },
  { label: "著作権", slug: "copyright", terms: ["著作権", "ライセンス"] },
  { label: "規制", slug: "ai-regulation", terms: ["規制", "政策", "法律", "AI法"] },
];

const serviceRoutes = [
  { path: "/", view: "all", query: "" },
  { path: "/chatgpt/", view: "service", query: "ChatGPT,GPT" },
  { path: "/openai/", view: "service", query: "OpenAI" },
  { path: "/claude/", view: "service", query: "Claude,Anthropic" },
  { path: "/gemini/", view: "service", query: "Gemini,Google,DeepMind" },
  { path: "/openclaw/", view: "service", query: "Openclaw,OpenClaw" },
  { path: "/saved/", view: "saved", query: "" },
];

const sourceRoutes = [
  { path: "/qiita/", source: "Qiita" },
  { path: "/zenn/", source: "Zenn" },
  { path: "/aismiley/", source: "AIsmiley" },
  { path: "/ledge-ai/", source: "Ledge.ai" },
  { path: "/web-designing/", source: "Web Designing" },
  { path: "/bing-ai-news/", source: "Bing AI News" },
  { path: "/not-design-school/", source: "NOT DESIGN SCHOOL" },
  { path: "/doorkeeper/", source: "Doorkeeper" },
  { path: "/born-digital/", source: "Born Digital" },
];

const keywordRoutes = keywordCandidates.map((candidate) => ({
  path: `/${candidate.slug}/`,
  keyword: candidate.terms.join(","),
}));

const featuredKeywordLabels = ["Figma", "Adobe", "Pencil", "Codex", "Canva", "VSCode", "Cursor", "Antigravity"];

elements.editionDate.textContent = formatter.format(new Date());

function visibleArticles() {
  const keywordQuery = state.keywordQuery.trim().toLowerCase();
  const navTerms = splitTerms(state.navQuery);
  const articles = state.articles.filter((article) => {
    if (article.category === "webinar") return false;
    const inSaved = state.saved.has(article.id);
    const searchableText = `${article.title} ${article.source} ${article.detail}`.toLowerCase();
    const matchesView = state.view === "all" || state.view === "service" || (state.view === "saved" ? inSaved : article.category === state.view);
    const matchesNav = !navTerms.length || navTerms.some((term) => searchableText.includes(term));
    const matchesKeyword = !keywordQuery || splitTerms(keywordQuery).some((term) => searchableText.includes(term));
    const matchesSource = !state.sourceFilter || article.source === state.sourceFilter;
    return matchesView && matchesNav && matchesKeyword && matchesSource;
  });
  return sortArticles(articles);
}

function sortArticles(articles) {
  if (state.sortMode === "popular") {
    return [...articles].sort((a, b) => engagementScore(b) - engagementScore(a) || timestamp(b) - timestamp(a));
  }
  return [...articles].sort((a, b) => timestamp(b) - timestamp(a));
}

function timestamp(article) {
  const value = new Date(article.publishedAt || 0).getTime();
  return Number.isNaN(value) ? 0 : value;
}

function engagementScore(article) {
  return Number(article.likesCount || 0) + Number(article.stocksCount || 0);
}

function visibleWebinars() {
  const today = dateKeyToUtcMs(dateKeyInTokyo(new Date().toISOString()));
  return state.articles
    .filter((article) => article.category === "webinar")
    .sort((a, b) => {
      const aTime = dateKeyToUtcMs(dateKeyInTokyo(a.publishedAt)) || 0;
      const bTime = dateKeyToUtcMs(dateKeyInTokyo(b.publishedAt)) || 0;
      const aFuture = aTime >= today;
      const bFuture = bTime >= today;
      if (aFuture !== bFuture) return aFuture ? -1 : 1;
      return aFuture ? aTime - bTime : bTime - aTime;
    });
}

function renderLead(articles) {
  const lead = articles[0];
  if (!lead) {
    elements.leadStory.className = "lead-story";
    elements.leadStory.innerHTML = '<p class="empty-state">表示できる記事がありません。検索条件を変更するか、再取得してください。</p>';
    return;
  }

  elements.leadStory.className = "lead-story text-lead-story";
  elements.leadStory.innerHTML = `
    <div>
      <div class="section-label">${escapeHtml(lead.source)}</div>
      <h2>${escapeHtml(lead.title)}</h2>
      <p>${escapeHtml(lead.detail || "取得元が追加説明を返していません。リンク先で本文を確認してください。")}</p>
      <div class="lead-actions">
        <a class="read-link" href="${lead.url}" target="_blank" rel="noreferrer">記事を開く</a>
        <button class="save-button lead-save-button" type="button">${state.saved.has(lead.id) ? "保存済" : "保存"}</button>
        ${engagementLabel(lead) ? `<span class="article-score">${escapeHtml(engagementLabel(lead))}</span>` : ""}
        <span class="article-time">${formatTime(lead.publishedAt)}</span>
      </div>
    </div>
  `;

  const saveButton = elements.leadStory.querySelector(".lead-save-button");
  saveButton.classList.toggle("saved", state.saved.has(lead.id));
  saveButton.addEventListener("click", () => toggleSaved(lead.id));
}

function renderArticles(articles) {
  elements.articlesGrid.innerHTML = "";
  elements.loadMoreButton.hidden = true;

  if (!articles.length) {
    elements.articlesGrid.innerHTML = '<p class="empty-state">条件に一致する記事はありません。</p>';
    return;
  }

  const template = document.querySelector("#articleTemplate");
  articles.slice(1, state.articleLimit).forEach((article) => {
    const node = template.content.cloneNode(true);
    node.querySelector(".article-card").classList.add("news-list-card");
    node.querySelector(".article-source").textContent = article.source;
    node.querySelector(".article-thumb").remove();
    const link = node.querySelector("h3 a");
    link.href = article.url;
    link.textContent = article.title;
    node.querySelector(".article-detail").textContent = article.detail || "リンク先で本文を確認してください。";
    node.querySelector(".article-time").textContent = formatTime(article.publishedAt);
    node.querySelector(".article-tag").textContent = engagementLabel(article) || labelForCategory(article.category);
    const saveButton = node.querySelector(".save-button");
    saveButton.textContent = state.saved.has(article.id) ? "保存済" : "保存";
    saveButton.classList.toggle("saved", state.saved.has(article.id));
    saveButton.addEventListener("click", () => toggleSaved(article.id));
    elements.articlesGrid.append(node);
  });

  const remaining = Math.max(articles.length - state.articleLimit, 0);
  elements.loadMoreButton.hidden = remaining === 0;
  elements.loadMoreButton.textContent = `もっと見る（残り${remaining}件）`;
}

function renderWebinars(webinars) {
  elements.webinarGrid.innerHTML = "";
  elements.webinarStatusText.textContent = `${webinars.length}件`;

  if (!webinars.length) {
    elements.webinarGrid.innerHTML = '<p class="empty-state">掲載できるウェビナー情報はありません。</p>';
    return;
  }

  const template = document.querySelector("#articleTemplate");
  webinars.forEach((article) => {
    const node = template.content.cloneNode(true);
    node.querySelector(".article-card").classList.add("webinar-card");
    node.querySelector(".article-source").textContent = article.source;
    const thumb = node.querySelector(".article-thumb");
    const image = normalizedImagePath(article.image);
    if (image) {
      thumb.href = article.url;
      thumb.innerHTML = `<img src="${escapeHtml(image)}" alt="" loading="lazy" />`;
    } else {
      thumb.remove();
    }
    const link = node.querySelector("h3 a");
    link.href = article.url;
    link.textContent = article.title;
    node.querySelector(".article-detail").textContent = article.detail || "リンク先で詳細を確認してください。";
    node.querySelector(".article-time").textContent = formatTime(article.publishedAt);
    node.querySelector(".article-tag").textContent = "ウェビナー";
    const saveButton = node.querySelector(".save-button");
    saveButton.textContent = state.saved.has(article.id) ? "保存済" : "保存";
    saveButton.classList.toggle("saved", state.saved.has(article.id));
    saveButton.addEventListener("click", () => toggleSaved(article.id));
    elements.webinarGrid.append(node);
  });
}

function renderSources(articles) {
  const newsCounts = new Map();
  const webinarCounts = new Map();
  articles
    .filter((article) => article.category !== "webinar")
    .forEach((article) => newsCounts.set(article.source, (newsCounts.get(article.source) || 0) + 1));
  articles
    .filter((article) => article.category === "webinar")
    .forEach((article) => webinarCounts.set(article.source, (webinarCounts.get(article.source) || 0) + 1));

  const newsSources = state.sources.filter((source) => newsCounts.has(source.name) || state.errors.some((item) => item.source === source.name));
  const webinarSources = state.sources.filter((source) => webinarCounts.has(source.name));

  const newsItems = newsSources
    .map((source) => {
      const count = newsCounts.get(source.name) || 0;
      const error = state.errors.find((item) => item.source === source.name);
      const active = state.sourceFilter === source.name ? "active" : "";
      const route = sourceRoutes.find((item) => item.source === source.name)?.path || "/";
      return `
        <div class="source-item ${active}">
          <a class="source-filter-button" href="${escapeHtml(route)}" data-source-filter="${escapeHtml(source.name)}" aria-current="${active ? "page" : "false"}">
            <span class="source-state-icon" aria-hidden="true"></span>
            <span class="source-filter-content">
              <strong>${escapeHtml(source.name)} <span>${count}件</span></strong>
              <span class="source-url-text">${escapeHtml(error ? `取得エラー: ${error.message}` : source.url)}</span>
            </span>
          </a>
        </div>
      `;
    })
    .join("");

  const webinarItems = webinarSources
    .map((source) => {
      const count = webinarCounts.get(source.name) || 0;
      const route = sourceRoutes.find((item) => item.source === source.name)?.path || "/";
      const active = state.sourceFilter === source.name ? "active" : "";
      return `
        <div class="source-item source-item-link ${active}">
          <a class="source-filter-button" href="${escapeHtml(route)}" data-source-filter="${escapeHtml(source.name)}" aria-current="${active ? "page" : "false"}">
            <span class="source-state-icon" aria-hidden="true"></span>
            <span class="source-filter-content">
              <strong>${escapeHtml(source.name)} <span>${count}件</span></strong>
              <span class="source-url-text">${escapeHtml(source.url)}</span>
            </span>
          </a>
        </div>
      `;
    })
    .join("");

  const sourceHtml = `
    <section class="source-group" aria-label="News sources">
      <h3>News</h3>
      ${newsItems || '<p class="source-empty">表示できるニュース媒体はありません。</p>'}
      ${state.sourceFilter ? '<button class="source-clear-button" type="button" data-clear-source>フィルタ解除</button>' : ""}
    </section>
    <section class="source-group" aria-label="Webinar sources">
      <h3>Webinar</h3>
      ${webinarItems || '<p class="source-empty">表示できるウェビナー媒体はありません。</p>'}
    </section>
  `;
  elements.sourceLists.forEach((list) => {
    list.innerHTML = sourceHtml;
  });

  return { newsCount: newsSources.length, webinarCount: webinarSources.length };
}

function keywordCount(candidate) {
  const terms = candidate.terms.map((term) => term.toLowerCase());
  return state.articles.filter((article) => {
    if (article.category === "webinar") return false;
    const text = `${article.title} ${article.detail} ${article.source}`.toLowerCase();
    return terms.some((term) => text.includes(term));
  }).length;
}

function renderFeaturedKeywords() {
  const featured = featuredKeywordLabels
    .map((label) => keywordCandidates.find((candidate) => candidate.label === label))
    .filter(Boolean)
    .map((candidate) => ({ ...candidate, count: keywordCount(candidate) }));

  elements.featuredChips.innerHTML = featured
    .map((candidate) => {
      const topic = candidate.terms.join(",");
      const active = state.keywordQuery === topic || state.keywordQuery.toLowerCase() === candidate.label.toLowerCase() ? "active" : "";
      return `<a class="chip ${active}" href="/${escapeHtml(candidate.slug)}/" data-topic="${escapeHtml(topic)}">${escapeHtml(candidate.label)} ${candidate.count}</a>`;
    })
    .join("");
}

function renderKeywordFilters() {
  const featuredLabels = new Set(featuredKeywordLabels);
  const ranked = keywordCandidates
    .map((candidate) => {
      const count = keywordCount(candidate);
      return { ...candidate, count };
    })
    .filter((candidate) => !featuredLabels.has(candidate.label))
    .filter((candidate) => candidate.count > 0)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "ja-JP"))
    .slice(0, 15);

  elements.topicChips.innerHTML = [
    `<a class="chip ${state.keywordQuery ? "" : "active"}" href="/" data-topic="">すべて</a>`,
    ...ranked.map((candidate) => {
      const topic = candidate.terms.join(",");
      const active = state.keywordQuery === topic ? "active" : "";
      return `<a class="chip ${active}" href="/${escapeHtml(candidate.slug)}/" data-topic="${escapeHtml(topic)}">${escapeHtml(candidate.label)} ${candidate.count}</a>`;
    }),
  ].join("");

  elements.topicChips.querySelector(".chip")?.classList.toggle("active", !state.keywordQuery);
}

function render() {
  syncControls();
  syncKeywordSearch();
  renderFeaturedKeywords();
  renderKeywordFilters();
  updateDocumentMeta();
  const articles = visibleArticles();
  const webinars = visibleWebinars();
  renderLead(articles);
  renderArticles(articles);
  renderWebinars(webinars);
  const sourceCounts = renderSources(state.articles);
  const errorText = state.errors.length ? ` / ${state.errors.length}件の取得エラー` : "";
  const shownCount = Math.min(articles.length, state.articleLimit);
  elements.statusText.textContent = `${shownCount}件表示 / ${articles.length}件中 / ${state.articles.length}件取得${errorText}`;
  const selectedSource = state.sources.find((source) => source.name === state.sourceFilter);
  const sourceCountHtml = selectedSource
    ? `<a class="selected-source-link" href="${escapeHtml(selectedSource.url)}" target="_blank" rel="noreferrer">${escapeHtml(selectedSource.name)} <span class="external-link-icon" aria-hidden="true">↗</span></a>`
    : `News ${sourceCounts.newsCount} / Webinar ${sourceCounts.webinarCount}`;
  elements.sourceCounts.forEach((count) => {
    count.innerHTML = sourceCountHtml;
  });
}

function updateDocumentMeta() {
  const route = currentRouteMeta();
  document.title = route.title;
  setMetaContent("description", route.description);
  setMetaContent("twitter:title", route.title);
  setMetaContent("twitter:description", route.description);
  setMetaContent("og:title", route.title, "property");
  setMetaContent("og:description", route.description, "property");
  setMetaContent("og:url", route.url, "property");
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.href = route.url;
}

function currentRouteMeta() {
  const baseUrl = "https://chibashin.com";
  const path = routePathFromState();
  const label = currentRouteLabel();
  const suffix = label ? `${label}の生成AIニュース・AIツール情報` : "生成AIニュース・AIツール情報";
  return {
    title: `AI Daily News | ${suffix}`,
    description: label
      ? `${label}に関連する生成AIニュース、AIツール情報、ウェビナー情報を毎日チェックできる日本語AIニュースサイトです。`
      : "ChatGPT、Claude、Gemini、Figma、Cursor、Codexなど、生成AIニュースとAIツール情報を毎日チェックできる日本語AIニュースサイトです。",
    url: `${baseUrl}${path}`,
  };
}

function currentRouteLabel() {
  if (state.sourceFilter) return state.sourceFilter;
  if (state.keywordQuery) {
    return keywordCandidates.find((candidate) => candidate.terms.join(",") === state.keywordQuery)?.label || state.keywordQuery;
  }
  if (state.view === "service") {
    return document.querySelector(`.nav-tab[data-view="service"][data-query="${CSS.escape(state.navQuery)}"]`)?.textContent || "";
  }
  return "";
}

function setMetaContent(name, content, attribute = "name") {
  const meta = document.querySelector(`meta[${attribute}="${CSS.escape(name)}"]`);
  if (meta) meta.content = content;
}

function resetFilters() {
  Object.assign(state, defaultState);
  state.articleLimit = ARTICLE_INITIAL_LIMIT;
  closeMenu();
  updateUrlFromState();
  render();
}

function resetArticleLimit() {
  state.articleLimit = ARTICLE_INITIAL_LIMIT;
}

function isKeywordTopicSelected(topic) {
  if (!topic) return !state.keywordQuery;
  const candidate = keywordCandidates.find((item) => item.terms.join(",") === topic);
  return (
    state.keywordQuery === topic ||
    (candidate && state.keywordQuery.toLowerCase() === candidate.label.toLowerCase())
  );
}

function applyKeywordTopic(topic) {
  state.view = defaultState.view;
  state.navQuery = defaultState.navQuery;
  state.keywordQuery = isKeywordTopicSelected(topic) ? "" : topic;
  state.sourceFilter = "";
  resetArticleLimit();
  closeMenu();
  updateUrlFromState();
  render();
}

function syncControls() {
  document.querySelectorAll(".nav-tab").forEach((tab) => {
    const isActive = tab.dataset.view === state.view && (tab.dataset.query || "") === state.navQuery;
    tab.classList.toggle("active", isActive);
  });

  elements.sortFilterGroups.forEach((group) => {
    group.querySelectorAll("[data-sort]").forEach((chip) => {
      chip.classList.toggle("active", (chip.dataset.sort || "latest") === state.sortMode);
    });
  });
}

function syncKeywordSearch() {
  if (!elements.keywordSearchInput) return;
  const candidate = keywordCandidates.find((item) => item.terms.join(",") === state.keywordQuery);
  elements.keywordSearchInput.value = candidate ? candidate.label : state.keywordQuery;
}

function updateUrlFromState({ replace = false } = {}) {
  const url = new URL(window.location.href);
  const params = new URLSearchParams();
  const path = routePathFromState();

  if (state.keywordQuery && !keywordRoutes.some((route) => route.keyword === state.keywordQuery)) {
    params.set("keyword", state.keywordQuery);
  }
  setOptionalParam(params, "source", state.sourceFilter, defaultState.sourceFilter);
  setOptionalParam(params, "sort", state.sortMode, defaultState.sortMode);

  if (path !== "/" && state.sourceFilter) params.delete("source");

  const nextUrl = `${path}${params.toString() ? `?${params.toString()}` : ""}${url.hash}`;
  if (nextUrl === `${window.location.pathname}${window.location.search}${window.location.hash}`) return;
  window.history[replace ? "replaceState" : "pushState"]({}, "", nextUrl);
}

function routePathFromState() {
  if (state.sourceFilter) {
    return sourceRoutes.find((route) => route.source === state.sourceFilter)?.path || "/";
  }

  if (state.keywordQuery) {
    return keywordRoutes.find((route) => route.keyword === state.keywordQuery)?.path || "/";
  }

  return serviceRoutes.find((route) => route.view === state.view && route.query === state.navQuery)?.path || "/";
}

function setOptionalParam(params, key, value, defaultValue) {
  if (!value || value === defaultValue) {
    params.delete(key);
  } else {
    params.set(key, value);
  }
}

function applyStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  Object.assign(state, defaultState);

  const path = normalizePath(window.location.pathname);
  const serviceRoute = serviceRoutes.find((route) => route.path === path);
  const keywordRoute = keywordRoutes.find((route) => route.path === path);
  const sourceRoute = sourceRoutes.find((route) => route.path === path);

  if (sourceRoute) {
    state.sourceFilter = sourceRoute.source;
  } else if (keywordRoute) {
    state.keywordQuery = keywordRoute.keyword;
  } else if (serviceRoute) {
    state.view = serviceRoute.view;
    state.navQuery = serviceRoute.query;
  }

  state.keywordQuery = params.get("keyword") || state.keywordQuery;
  state.sourceFilter = params.get("source") || state.sourceFilter;
  state.sortMode = params.get("sort") || defaultState.sortMode;
  if (!elements.sortFilters.querySelector(`[data-sort="${CSS.escape(state.sortMode)}"]`)) {
    state.sortMode = defaultState.sortMode;
  }
  if (!document.querySelector(`.nav-tab[data-view="${CSS.escape(state.view)}"][data-query="${CSS.escape(state.navQuery)}"]`)) {
    state.view = defaultState.view;
    state.navQuery = defaultState.navQuery;
  }
}

function normalizePath(pathname) {
  if (!pathname || pathname === "/") return "/";
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

function toggleMenu() {
  state.menuOpen = !state.menuOpen;
  elements.siteMenu.classList.toggle("is-open", state.menuOpen);
  elements.menuButton.classList.toggle("is-open", state.menuOpen);
  elements.menuButton.setAttribute("aria-expanded", String(state.menuOpen));
}

function closeMenu() {
  state.menuOpen = false;
  elements.siteMenu.classList.remove("is-open");
  elements.menuButton.classList.remove("is-open");
  elements.menuButton.setAttribute("aria-expanded", "false");
}

function labelForCategory(category) {
  return {
    news: "ニュース",
    research: "研究",
    business: "ビジネス",
    policy: "政策",
    webinar: "ウェビナー",
  }[category] || "ニュース";
}

function normalizedImagePath(image) {
  if (!image) return "";
  return String(image).replace(/^\.\/assets\//, "/assets/");
}

function engagementLabel(article) {
  const likes = Number(article.likesCount || 0);
  const stocks = Number(article.stocksCount || 0);
  if (!likes && !stocks) return "";
  if (article.source === "Qiita" && stocks) {
    return `${likes}いいね / ${stocks}ストック`;
  }
  return `${likes}いいね`;
}

function formatTime(value) {
  if (!value) return "日時不明";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  }).format(date);
}

function dateKeyInTokyo(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Tokyo",
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function dateKeyToUtcMs(key) {
  const [year, month, day] = key.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function toggleSaved(id) {
  if (state.saved.has(id)) {
    state.saved.delete(id);
  } else {
    state.saved.add(id);
  }
  localStorage.setItem("ai-daily-saved", JSON.stringify([...state.saved]));
  render();
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}

function splitTerms(value) {
  const normalized = String(value || "").toLowerCase();
  const separator = /[,、]/.test(normalized) ? /[,、]+/ : /\s+/;
  return normalized
    .split(separator)
    .map((term) => term.trim())
    .filter(Boolean);
}

function updateLoadingPanel(forceProgress = null) {
  const elapsed = Math.max(0, Math.floor((Date.now() - state.loadingStartedAt) / 1000));
  const progress = forceProgress ?? Math.min(94, 12 + elapsed * 3);
  const stepIndex = elapsed < 4 ? 0 : elapsed < 12 ? 1 : elapsed < 24 ? 2 : 3;
  const messages = [
    "公開キャッシュを確認中...",
    "ニュースと技術記事を整理しています...",
    "ウェビナー情報と重複記事を確認しています...",
    "表示用に並び替えています。もう少しです...",
  ];

  elements.loadingBar.style.width = `${progress}%`;
  elements.loadingDetail.textContent = `${messages[stepIndex]} ${elapsed}秒経過`;
  elements.loadingSteps.forEach((step, index) => {
    step.classList.toggle("active", index === stepIndex);
    step.classList.toggle("done", index < stepIndex);
  });
}

function startLoadingPanel() {
  state.loadingStartedAt = Date.now();
  elements.loadingPanel.classList.remove("is-complete");
  elements.loadingPanel.hidden = false;
  elements.loadingTitle.textContent = "記事データを読み込んでいます";
  updateLoadingPanel(8);
  clearInterval(state.loadingTimer);
  state.loadingTimer = setInterval(updateLoadingPanel, 1000);
}

function finishLoadingPanel() {
  clearInterval(state.loadingTimer);
  state.loadingTimer = null;
  elements.loadingTitle.textContent = "読み込み完了";
  elements.loadingDetail.textContent = "最新のキャッシュを表示しました";
  updateLoadingPanel(100);
  elements.loadingPanel.classList.add("is-complete");
  setTimeout(() => {
    elements.loadingPanel.hidden = true;
  }, 900);
}

function failLoadingPanel(message) {
  clearInterval(state.loadingTimer);
  state.loadingTimer = null;
  elements.loadingTitle.textContent = "読み込みに失敗しました";
  elements.loadingDetail.textContent = message;
  elements.loadingPanel.classList.add("is-error");
}

async function load() {
  startLoadingPanel();
  elements.statusText.textContent = "読み込み中...";
  elements.webinarStatusText.textContent = "読み込み中...";

  try {
    const response = await fetch("/api/articles.php");
    if (!response.ok) throw new Error(`API ${response.status}`);
    const data = await response.json();
    state.articles = data.articles || [];
    state.sources = data.sources || [];
    state.errors = data.errors || [];
    finishLoadingPanel();
  } catch (error) {
    state.articles = [];
    state.errors = [{ source: "Local API", message: error.message }];
    failLoadingPanel(`APIエラー: ${error.message}`);
  } finally {
    render();
  }
}

document.querySelectorAll(".nav-tab").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    state.view = button.dataset.view;
    state.navQuery = button.dataset.query || "";
    state.keywordQuery = "";
    state.sourceFilter = "";
    resetArticleLimit();
    closeMenu();
    updateUrlFromState();
    render();
  });
});

elements.homeButton.addEventListener("click", (event) => {
  event.preventDefault();
  resetFilters();
});
elements.menuButton.addEventListener("click", toggleMenu);

elements.keywordSearchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const keyword = elements.keywordSearchInput.value.trim();
  state.view = defaultState.view;
  state.navQuery = defaultState.navQuery;
  state.keywordQuery = keyword;
  state.sourceFilter = "";
  resetArticleLimit();
  closeMenu();
  updateUrlFromState();
  render();
});

document.addEventListener("click", (event) => {
  if (!state.menuOpen) return;
  const target = event.target;
  if (elements.siteMenu.contains(target) || elements.menuButton.contains(target)) return;
  closeMenu();
});

elements.topicChips.addEventListener("click", (event) => {
  const button = event.target.closest(".chip");
  if (!button) return;
  event.preventDefault();
  applyKeywordTopic(button.dataset.topic || "");
});

elements.featuredChips.addEventListener("click", (event) => {
  const button = event.target.closest(".chip");
  if (!button) return;
  event.preventDefault();
  applyKeywordTopic(button.dataset.topic || "");
});

elements.sortFilterGroups.forEach((group) => {
  group.addEventListener("click", (event) => {
    const button = event.target.closest("[data-sort]");
    if (!button) return;
    state.sortMode = button.dataset.sort || "latest";
    resetArticleLimit();
    closeMenu();
    updateUrlFromState();
    render();
  });
});

function handleSourceListClick(event) {
  if (event.target.closest("[data-clear-source]")) {
    state.sourceFilter = "";
    resetArticleLimit();
    closeMenu();
    updateUrlFromState();
    render();
    return;
  }

  const button = event.target.closest("[data-source-filter]");
  if (!button) return;
  event.preventDefault();
  const source = button.dataset.sourceFilter || "";
  state.view = defaultState.view;
  state.navQuery = defaultState.navQuery;
  state.keywordQuery = "";
  state.sourceFilter = state.sourceFilter === source ? "" : source;
  resetArticleLimit();
  closeMenu();
  updateUrlFromState();
  render();
}

elements.sourceLists.forEach((list) => {
  list.addEventListener("click", handleSourceListClick);
});

elements.loadMoreButton.addEventListener("click", () => {
  state.articleLimit += ARTICLE_LOAD_INCREMENT;
  render();
});

window.addEventListener("popstate", () => {
  applyStateFromUrl();
  render();
});

applyStateFromUrl();
updateUrlFromState({ replace: true });
load();
