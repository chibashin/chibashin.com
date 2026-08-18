<?php
declare(strict_types=1);

function ainews_sources(): array
{
    return [
        ['name' => 'Qiita', 'url' => 'https://qiita.com/', 'type' => 'qiita'],
        ['name' => 'Zenn', 'url' => 'https://zenn.dev/', 'type' => 'zenn'],
        ['name' => 'AIsmiley', 'url' => 'https://aismiley.co.jp/ai_news/', 'type' => 'aismiley'],
        ['name' => 'Ledge.ai', 'url' => 'https://ledge.ai/', 'type' => 'ledge'],
        ['name' => 'Web Designing', 'url' => 'https://webdesigning.book.mynavi.jp/', 'type' => 'webdesigning'],
        ['name' => 'Bing AI News', 'url' => 'https://www.bing.com/news/', 'type' => 'bingAiNews'],
        ['name' => 'NOT DESIGN SCHOOL', 'url' => 'https://not-design-school.connpass.com/event/', 'type' => 'notDesignSchool'],
        ['name' => 'Doorkeeper', 'url' => 'https://cssnite.doorkeeper.jp/', 'type' => 'doorkeeper'],
        ['name' => 'Born Digital', 'url' => 'https://www.borndigital.co.jp/seminar/seminar/', 'type' => 'bornDigital'],
    ];
}

function ainews_bing_news_feeds(): array
{
    return [
        'https://www.bing.com/news/search?q=OpenClaw&format=rss',
        'https://www.bing.com/news/search?q=AI&format=rss',
        'https://www.bing.com/news/search?q=ChatGPT&format=rss',
        'https://www.bing.com/news/search?q=Claude&format=rss',
        'https://www.bing.com/news/search?q=Gemini&format=rss',
        'https://www.bing.com/news/search?q=Figma%20AI&format=rss',
        'https://www.bing.com/news/search?q=Adobe%20AI&format=rss',
        'https://www.bing.com/news/search?q=Adobe%20Firefly&format=rss',
        'https://www.bing.com/news/search?q=Pencil%20AI%20design&format=rss',
        'https://www.bing.com/news/search?q=Codex%20AI&format=rss',
        'https://www.bing.com/news/search?q=Canva%20AI&format=rss',
        'https://www.bing.com/news/search?q=VS%20Code%20AI&format=rss',
        'https://www.bing.com/news/search?q=Cursor%20AI&format=rss',
        'https://www.bing.com/news/search?q=Google%20Antigravity&format=rss',
    ];
}

function ainews_qiita_tags(): array
{
    return [
        'ai',
        'claudecode',
        'claude',
        'llm',
        'aiエージェント',
        'codex',
        'openai',
        'chatgpt',
        'gemini',
        'figma',
        'adobe',
        'canva',
        'pencil',
        'vscode',
        'visualstudiocode',
        'cursor',
    ];
}

function ainews_zenn_topics(): array
{
    return [
        'ai',
        'claude',
        'agent',
        'codex',
        'openai',
        'gemini',
        'figma',
        'adobe',
        'canva',
        'vscode',
        'visualstudiocode',
        'cursor',
    ];
}

function ainews_doorkeeper_groups(): array
{
    return [
        ['url' => 'https://cssnite.doorkeeper.jp/', 'baseUrl' => 'https://cssnite.doorkeeper.jp'],
        ['url' => 'https://dtptransit.doorkeeper.jp/', 'baseUrl' => 'https://dtptransit.doorkeeper.jp'],
    ];
}

function ainews_keywords(): array
{
    return [
        'AI',
        '生成AI',
        '人工知能',
        'LLM',
        'ChatGPT',
        'Claude',
        'Gemini',
        'OpenAI',
        'Openclaw',
        'OpenClaw',
        'Anthropic',
        'エージェント',
        'AIエージェント',
        'フィジカルAI',
        'Physical AI',
        '機械学習',
        'ディープラーニング',
        'RAG',
        'マルチモーダル',
        '推論モデル',
        'Figma',
        'Adobe',
        'Adobe Firefly',
        'Photoshop',
        'Illustrator',
        'Canva',
        'Pencil',
        'Codex',
        'VSCode',
        'VS Code',
        'Visual Studio Code',
        'Cursor',
        'Cursor AI',
        'Anysphere',
        'Antigravity',
        'Google Antigravity',
        'Notion AI',
    ];
}

function ainews_refresh_cache(?string $cacheFile = null): array
{
    $cacheFile = $cacheFile ?: __DIR__ . '/../data/articles.json';
    $payload = ainews_collect_articles();
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    if ($json === false) {
        throw new RuntimeException('JSON encoding failed.');
    }

    $dir = dirname($cacheFile);
    if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
        throw new RuntimeException('Cache directory could not be created.');
    }

    file_put_contents($cacheFile, $json, LOCK_EX);
    return $payload;
}

function ainews_collect_articles(): array
{
    $jobs = [
        ['source' => 'Qiita', 'callback' => 'ainews_fetch_qiita'],
        ['source' => 'Zenn', 'callback' => 'ainews_fetch_zenn'],
        ['source' => 'AIsmiley', 'callback' => 'ainews_fetch_aismiley'],
        ['source' => 'Ledge.ai', 'callback' => 'ainews_fetch_ledge'],
        ['source' => 'Web Designing', 'callback' => 'ainews_fetch_web_designing'],
        ['source' => 'Bing AI News', 'callback' => 'ainews_fetch_bing_ai_news'],
        ['source' => 'NOT DESIGN SCHOOL', 'callback' => 'ainews_fetch_not_design_school_events'],
        ['source' => 'Doorkeeper', 'callback' => 'ainews_fetch_doorkeeper_events'],
        ['source' => 'Born Digital', 'callback' => 'ainews_fetch_borndigital_events'],
    ];

    $articles = [];
    $errors = [];
    $previousBySource = ainews_previous_articles_by_source();

    foreach ($jobs as $job) {
        try {
            $items = call_user_func($job['callback']);
            array_push($articles, ...$items);
        } catch (Throwable $error) {
            if (!empty($previousBySource[$job['source']])) {
                array_push($articles, ...$previousBySource[$job['source']]);
                continue;
            }
            $errors[] = [
                'source' => $job['source'],
                'message' => $error->getMessage(),
            ];
        }
    }

    $articles = array_values(array_filter(ainews_dedupe($articles), static function (array $article): bool {
        if (($article['category'] ?? '') === 'webinar') {
            return ainews_is_active_webinar($article);
        }
        if (!empty($article['forceInclude'])) {
            return true;
        }
        return ainews_is_relevant($article['title'] ?? '', $article['detail'] ?? '');
    }));

    $articles = array_map(static function (array $article): array {
        unset($article['forceInclude']);
        return $article;
    }, $articles);

    usort($articles, static function (array $a, array $b): int {
        return strtotime($b['publishedAt'] ?? '') <=> strtotime($a['publishedAt'] ?? '');
    });

    $articles = ainews_cache_article_images(ainews_enrich_article_images(ainews_strip_news_images($articles)));
    ainews_prune_image_cache($articles);

    return [
        'fetchedAt' => gmdate('c'),
        'sources' => array_map(static fn(array $source): array => [
            'name' => $source['name'],
            'url' => $source['url'],
        ], ainews_sources()),
        'errors' => $errors,
        'articles' => $articles,
    ];
}

function ainews_previous_articles_by_source(): array
{
    $cacheFile = __DIR__ . '/../data/articles.json';
    if (!is_file($cacheFile)) {
        return [];
    }

    $payload = json_decode((string) file_get_contents($cacheFile), true);
    if (!is_array($payload) || !is_array($payload['articles'] ?? null)) {
        return [];
    }

    $bySource = [];
    foreach ($payload['articles'] as $article) {
        if (!is_array($article) || empty($article['source'])) {
            continue;
        }
        $bySource[(string) $article['source']][] = $article;
    }

    return $bySource;
}

function ainews_fetch_qiita(): array
{
    $items = [];
    foreach (ainews_qiita_tags() as $tag) {
        $query = rawurlencode("tag:{$tag}");
        $tagItems = ainews_fetch_qiita_json("https://qiita.com/api/v2/items?query={$query}&per_page=20&page=1");
        if (is_array($tagItems)) {
            array_push($items, ...$tagItems);
        }
    }

    $articles = array_map(static function (array $item): array {
        $tags = array_map(static fn(array $tag): string => (string) ($tag['name'] ?? ''), $item['tags'] ?? []);
        $title = (string) ($item['title'] ?? '');

        return [
            'id' => 'qiita:' . ($item['id'] ?? md5($title)),
            'title' => $title,
            'url' => (string) ($item['url'] ?? ''),
            'source' => 'Qiita',
            'detail' => implode(' / ', array_filter([(string) ($item['user']['id'] ?? ''), implode(', ', array_filter($tags))])),
            'publishedAt' => (string) ($item['created_at'] ?? ''),
            'image' => '',
            'category' => ainews_category_for($title . ' ' . implode(' ', $tags)),
            'likesCount' => (int) ($item['likes_count'] ?? 0),
            'stocksCount' => (int) ($item['stocks_count'] ?? 0),
        ];
    }, $items);

    return array_slice(ainews_dedupe($articles), 0, 120);
}

function ainews_fetch_zenn(): array
{
    $items = [];
    foreach (ainews_zenn_topics() as $topic) {
        $payload = ainews_fetch_json('https://zenn.dev/api/articles?topicname=' . rawurlencode($topic) . '&order=latest&count=20');
        if (is_array($payload['articles'] ?? null)) {
            array_push($items, ...array_slice($payload['articles'], 0, 20));
        }
    }

    $articles = array_map(static function (array $item): array {
        $path = (string) ($item['path'] ?? '');
        $title = (string) ($item['title'] ?? '');
        $author = (string) ($item['user']['username'] ?? $item['user']['name'] ?? '');
        return [
            'id' => 'zenn:' . ($item['id'] ?? $path),
            'title' => $title,
            'url' => 'https://zenn.dev' . $path,
            'source' => 'Zenn',
            'detail' => $author,
            'publishedAt' => (string) ($item['published_at'] ?? ''),
            'image' => '',
            'category' => ainews_category_for($title),
            'likesCount' => (int) ($item['liked_count'] ?? 0),
            'stocksCount' => (int) ($item['bookmarked_count'] ?? 0),
        ];
    }, $items);

    return array_slice(ainews_dedupe($articles), 0, 120);
}

function ainews_fetch_aismiley(): array
{
    $html = ainews_fetch_text('https://aismiley.co.jp/ai_news/');
    return array_slice(ainews_extract_html_articles($html, [
        'source' => 'AIsmiley',
        'baseUrl' => 'https://aismiley.co.jp',
        'include' => static fn(string $url): bool => str_contains($url, '/ai_news/'),
    ]), 0, 24);
}

function ainews_fetch_ledge(): array
{
    $html = ainews_fetch_text('https://ledge.ai/');
    return array_slice(ainews_extract_html_articles($html, [
        'source' => 'Ledge.ai',
        'baseUrl' => 'https://ledge.ai',
        'detail' => 'AI特化ニュース',
        'include' => static fn(string $url): bool => str_starts_with($url, 'https://ledge.ai/articles/'),
    ]), 0, 24);
}

function ainews_fetch_web_designing(): array
{
    $html = ainews_fetch_text('https://webdesigning.book.mynavi.jp/');
    return array_slice(ainews_extract_html_articles($html, [
        'source' => 'Web Designing',
        'baseUrl' => 'https://webdesigning.book.mynavi.jp',
        'include' => static fn(string $url): bool => str_starts_with($url, 'https://webdesigning.book.mynavi.jp/') && !str_ends_with($url, '.jpg'),
    ]), 0, 24);
}

function ainews_fetch_bing_ai_news(): array
{
    $items = [];
    foreach (ainews_bing_news_feeds() as $feedUrl) {
        $xml = ainews_fetch_text($feedUrl);
        array_push($items, ...array_slice(ainews_parse_rss($xml), 0, 12));
    }

    $articles = array_map(static function (array $item): array {
        return [
            'id' => 'bing-ai-news:' . $item['url'],
            'title' => $item['title'],
            'url' => $item['url'],
            'source' => 'Bing AI News',
            'detail' => mb_substr(ainews_strip_tags($item['description']), 0, 120) ?: 'Bing News RSS',
            'publishedAt' => $item['publishedAt'],
            'image' => $item['image'],
            'category' => ainews_category_for($item['title'] . ' ' . $item['description']),
        ];
    }, $items);

    return array_slice(ainews_dedupe($articles), 0, 96);
}

function ainews_fetch_not_design_school_events(): array
{
    $html = ainews_fetch_text('https://not-design-school.connpass.com/event/');
    return array_slice(ainews_extract_connpass_events($html, [
        'source' => 'NOT DESIGN SCHOOL',
        'baseUrl' => 'https://not-design-school.connpass.com',
    ]), 0, 12);
}

function ainews_fetch_doorkeeper_events(): array
{
    $events = [];
    foreach (ainews_doorkeeper_groups() as $group) {
        $html = ainews_fetch_text($group['url']);
        array_push($events, ...ainews_extract_doorkeeper_events($html, [
            'source' => 'Doorkeeper',
            'baseUrl' => $group['baseUrl'],
        ]));
    }

    return array_slice(ainews_dedupe($events), 0, 18);
}

function ainews_fetch_text(string $url, array $headers = []): string
{
    return ainews_fetch_text_with_timeout($url, 15, $headers);
}

function ainews_fetch_text_with_timeout(string $url, int $timeout, array $headers = []): string
{
    $requestHeaders = array_merge([
        'User-Agent: Mozilla/5.0 (compatible; AI Daily News; +https://chibashin.com)',
        'Accept: text/html,application/rss+xml,application/json;q=0.9,*/*;q=0.8',
    ], $headers);

    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'timeout' => $timeout,
            'ignore_errors' => true,
            'header' => implode("\r\n", $requestHeaders),
        ],
    ]);

    $body = @file_get_contents($url, false, $context);
    $status = $http_response_header[0] ?? '';
    if ($body === false || !preg_match('/\s(2\d\d)\s/', $status)) {
        throw new RuntimeException(trim($status) ?: "Fetch failed: {$url}");
    }

    return $body;
}

function ainews_enrich_article_images(array $articles): array
{
    $enriched = $articles;
    $checked = 0;

    foreach ($enriched as $index => $article) {
        if ($checked >= 80) {
            break;
        }
        if (($article['category'] ?? '') !== 'webinar') {
            continue;
        }
        if (!empty($article['image'])) {
            $enriched[$index]['image'] = ainews_normalize_cached_image_path((string) $article['image']);
            continue;
        }
        if (empty($article['url'])) {
            continue;
        }

        $checked++;
        try {
            $html = ainews_fetch_text_with_timeout((string) $article['url'], 8);
            $image = ainews_extract_meta_image($html, (string) $article['url']);
            if ($image) {
                $enriched[$index]['image'] = $image;
            }
        } catch (Throwable) {
            // Image metadata is optional; keep the article even when a page blocks scraping.
        }
    }

    return $enriched;
}

function ainews_strip_news_images(array $articles): array
{
    return array_map(static function (array $article): array {
        if (($article['category'] ?? '') !== 'webinar') {
            $article['image'] = '';
        }
        return $article;
    }, $articles);
}

function ainews_normalize_cached_image_path(string $image): string
{
    return str_starts_with($image, './assets/') ? substr($image, 1) : $image;
}

function ainews_cache_article_images(array $articles): array
{
    if (!extension_loaded('gd')) {
        return $articles;
    }

    $cached = $articles;
    $processed = 0;

    foreach ($cached as $index => $article) {
        if ($processed >= 120) {
            break;
        }

        $image = (string) ($article['image'] ?? '');
        if ($image === '' || str_starts_with($image, './assets/cache/images/') || str_starts_with($image, '/assets/cache/images/')) {
            continue;
        }

        $processed++;
        $localImage = ainews_cache_remote_image($image);
        if ($localImage !== '') {
            $cached[$index]['image'] = $localImage;
        }
    }

    return $cached;
}

function ainews_cache_remote_image(string $url): string
{
    if (!preg_match('/^https?:\/\//i', $url)) {
        return '';
    }

    $cacheDir = dirname(__DIR__) . '/assets/cache/images';
    if (!is_dir($cacheDir) && !mkdir($cacheDir, 0755, true) && !is_dir($cacheDir)) {
        return '';
    }

    $extension = function_exists('imagewebp') ? 'webp' : 'jpg';
    $cacheFile = $cacheDir . '/' . sha1($url) . '.' . $extension;
    if (is_file($cacheFile) && filesize($cacheFile) > 0) {
        return '/assets/cache/images/' . basename($cacheFile);
    }

    $bytes = ainews_download_image($url);
    if ($bytes === '') {
        return '';
    }

    $source = @imagecreatefromstring($bytes);
    if (!$source) {
        return '';
    }

    $sourceWidth = imagesx($source);
    $sourceHeight = imagesy($source);
    if ($sourceWidth < 1 || $sourceHeight < 1) {
        imagedestroy($source);
        return '';
    }

    $targetWidth = 640;
    $targetHeight = 360;
    $sourceRatio = $sourceWidth / $sourceHeight;
    $targetRatio = $targetWidth / $targetHeight;

    if ($sourceRatio > $targetRatio) {
        $cropHeight = $sourceHeight;
        $cropWidth = (int) round($sourceHeight * $targetRatio);
        $cropX = (int) floor(($sourceWidth - $cropWidth) / 2);
        $cropY = 0;
    } else {
        $cropWidth = $sourceWidth;
        $cropHeight = (int) round($sourceWidth / $targetRatio);
        $cropX = 0;
        $cropY = (int) floor(($sourceHeight - $cropHeight) / 2);
    }

    $thumb = imagecreatetruecolor($targetWidth, $targetHeight);
    imagecopyresampled($thumb, $source, 0, 0, $cropX, $cropY, $targetWidth, $targetHeight, $cropWidth, $cropHeight);

    $saved = function_exists('imagewebp')
        ? imagewebp($thumb, $cacheFile, 78)
        : imagejpeg($thumb, $cacheFile, 82);

    imagedestroy($thumb);
    imagedestroy($source);

    if (!$saved || !is_file($cacheFile) || filesize($cacheFile) === 0) {
        @unlink($cacheFile);
        return '';
    }

    return '/assets/cache/images/' . basename($cacheFile);
}

function ainews_prune_image_cache(array $articles): void
{
    $cacheDir = dirname(__DIR__) . '/assets/cache/images';
    if (!is_dir($cacheDir)) {
        return;
    }

    $usedFiles = [];
    foreach ($articles as $article) {
        $image = (string) ($article['image'] ?? '');
        if (str_starts_with($image, './assets/cache/images/') || str_starts_with($image, '/assets/cache/images/')) {
            $usedFiles[basename($image)] = true;
        }
    }

    foreach (glob($cacheDir . '/*.{webp,jpg,jpeg,png}', GLOB_BRACE) ?: [] as $file) {
        if (!is_file($file) || isset($usedFiles[basename($file)])) {
            continue;
        }
        @unlink($file);
    }
}

function ainews_download_image(string $url): string
{
    if (function_exists('curl_init')) {
        $handle = curl_init($url);
        if (!$handle) {
            return '';
        }
        curl_setopt_array($handle, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 3,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_USERAGENT => 'Mozilla/5.0 (compatible; AI Daily News; +https://chibashin.com)',
            CURLOPT_HTTPHEADER => ['Accept: image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'],
        ]);
        $bytes = curl_exec($handle);
        $status = (int) curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
        $contentType = (string) curl_getinfo($handle, CURLINFO_CONTENT_TYPE);
        curl_close($handle);

        if (!is_string($bytes) || $status < 200 || $status >= 300 || strlen($bytes) > 4 * 1024 * 1024) {
            return '';
        }
        if ($contentType !== '' && !str_starts_with(strtolower($contentType), 'image/')) {
            return '';
        }
        return $bytes;
    }

    $bytes = @file_get_contents($url, false, stream_context_create([
        'http' => [
            'timeout' => 10,
            'ignore_errors' => true,
            'header' => "User-Agent: Mozilla/5.0 (compatible; AI Daily News; +https://chibashin.com)\r\nAccept: image/*,*/*;q=0.8",
        ],
    ]));

    return is_string($bytes) && strlen($bytes) <= 4 * 1024 * 1024 ? $bytes : '';
}

function ainews_extract_meta_image(string $html, string $pageUrl): string
{
    $image = ainews_meta_content($html, 'property', 'og:image')
        ?: ainews_meta_content($html, 'property', 'og:image:secure_url')
        ?: ainews_meta_content($html, 'name', 'twitter:image')
        ?: ainews_meta_content($html, 'property', 'twitter:image');

    return $image ? ainews_absolute_url(ainews_decode($image), $pageUrl) : '';
}

function ainews_meta_content(string $html, string $keyName, string $keyValue): string
{
    preg_match_all('/<meta\b[^>]*>/iu', $html, $matches);
    foreach ($matches[0] as $tag) {
        $key = ainews_attribute($tag, $keyName);
        if (mb_strtolower($key) === mb_strtolower($keyValue)) {
            return ainews_attribute($tag, 'content');
        }
    }
    return '';
}

function ainews_attribute(string $tag, string $name): string
{
    return preg_match('/' . preg_quote($name, '/') . '=["\']([^"\']+)["\']/iu', $tag, $match) ? $match[1] : '';
}

function ainews_fetch_json(string $url): mixed
{
    $json = json_decode(ainews_fetch_text($url), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new RuntimeException(json_last_error_msg());
    }
    return $json;
}

function ainews_fetch_qiita_json(string $url): mixed
{
    $json = json_decode(ainews_fetch_text($url, ainews_qiita_headers()), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new RuntimeException(json_last_error_msg());
    }
    return $json;
}

function ainews_qiita_headers(): array
{
    $token = ainews_qiita_token();
    return $token !== '' ? ['Authorization: Bearer ' . $token] : [];
}

function ainews_qiita_token(): string
{
    $token = trim((string) getenv('QIITA_ACCESS_TOKEN'));
    if ($token !== '') {
        return $token;
    }

    $tokenFile = dirname(__DIR__, 3) . '/.ainews_qiita_token';
    if (is_file($tokenFile)) {
        return trim((string) file_get_contents($tokenFile));
    }

    return '';
}

function ainews_parse_rss(string $xml): array
{
    preg_match_all('/<item\b[\s\S]*?<\/item>/u', $xml, $matches);
    $items = [];

    foreach ($matches[0] as $item) {
        $parsed = [
            'title' => ainews_xml_value($item, 'title'),
            'url' => ainews_xml_value($item, 'link'),
            'description' => ainews_xml_value($item, 'description'),
            'publishedAt' => ainews_xml_value($item, 'pubDate'),
            'creator' => ainews_xml_value($item, 'dc:creator'),
            'image' => preg_match('/<enclosure[^>]+url="([^"]+)"/u', $item, $image) ? $image[1] : '',
        ];
        if ($parsed['title'] && $parsed['url']) {
            $items[] = $parsed;
        }
    }

    return $items;
}

function ainews_xml_value(string $xml, string $tag): string
{
    return preg_match('/<' . preg_quote($tag, '/') . '[^>]*>([\s\S]*?)<\/' . preg_quote($tag, '/') . '>/u', $xml, $match)
        ? trim(ainews_decode($match[1]))
        : '';
}

function ainews_extract_html_articles(string $html, array $options): array
{
    preg_match_all('/<a\b([^>]*href=["\'][^"\']+["\'][^>]*)>([\s\S]*?)<\/a>/iu', $html, $matches, PREG_SET_ORDER | PREG_OFFSET_CAPTURE);
    $articles = [];
    $seen = [];

    foreach ($matches as $match) {
        $attrs = $match[1][0];
        if (!preg_match('/href=["\']([^"\']+)["\']/iu', $attrs, $href)) {
            continue;
        }

        $url = ainews_absolute_url(ainews_decode($href[1]), $options['baseUrl']);
        $title = ainews_clean_title(ainews_strip_tags($match[2][0]));
        $include = $options['include'];
        if (!$url || !$title || mb_strlen($title) < 12 || isset($seen[$url]) || !$include($url)) {
            continue;
        }

        $seen[$url] = true;
        $articles[] = [
            'id' => $options['source'] . ':' . $url,
            'title' => $title,
            'url' => $url,
            'source' => $options['source'],
            'detail' => $options['detail'] ?? ($options['source'] === 'AIsmiley' ? 'AIニュース' : 'Web制作・デザイン'),
            'publishedAt' => ainews_extract_date($title) ?: ainews_extract_date_near($html, $match[0][1]),
            'image' => '',
            'category' => ainews_category_for($title),
        ];
    }

    return $articles;
}

function ainews_extract_connpass_events(string $html, array $options): array
{
    preg_match_all('/<div class="group_event_list vevent">([\s\S]*?)(?=<div class="group_event_list vevent">|<div class="paging_area">)/u', $html, $matches);
    $events = [];

    foreach ($matches[1] as $block) {
        if (!preg_match('/<a class="url summary" href="([^"]+)">([\s\S]*?)<\/a>/iu', $block, $href)) {
            continue;
        }

        $url = ainews_absolute_url($href[1], $options['baseUrl']);
        $events[] = [
            'id' => $options['source'] . ':' . $url,
            'title' => ainews_clean_title(ainews_strip_tags($href[2])),
            'url' => $url,
            'source' => $options['source'],
            'detail' => implode(' / ', array_filter([
                'ウェビナー',
                ainews_match_text('/label_status_event[^>]*>([\s\S]*?)<\/span>/iu', $block),
                ainews_match_text('/<p class="event_place location">([\s\S]*?)<\/p>/iu', $block) ?: 'オンライン開催',
                ainews_match_text('/<p class="event_participants">([\s\S]*?)<\/p>/iu', $block),
            ])),
            'publishedAt' => ainews_match('/class="value-title" title="([^"]+)"/iu', $block),
            'image' => ainews_match('/<img[^>]+src="([^"]+)"/iu', $block),
            'category' => 'webinar',
        ];
    }

    return $events;
}

function ainews_fetch_borndigital_events(): array
{
    $html = ainews_fetch_text('https://www.borndigital.co.jp/seminar/seminar/');
    preg_match_all('/<li class="c-squareCards__item"[\s\S]*?<\/li>/iu', $html, $matches);
    $events = [];
    $seen = [];

    foreach (array_slice($matches[0], 0, 24) as $block) {
        if (!str_contains($block, 'data-category="seminar"')) {
            continue;
        }

        if (!preg_match('/<a class="c-squareCards__item-wrapper" href="([^"]+)"/iu', $block, $href)) {
            continue;
        }

        $url = ainews_absolute_url(ainews_decode($href[1]), 'https://www.borndigital.co.jp');
        $title = ainews_match_text('/<h3 class="c-squareCards__item-title">([\s\S]*?)<\/h3>/iu', $block);
        $detail = ainews_match_text('/<span class="c-squareCards__item-text">([\s\S]*?)<\/span>/iu', $block);
        if (!str_contains($detail, 'SEMINAR')) {
            continue;
        }

        if (!$url || !$title || isset($seen[$url])) {
            continue;
        }

        $seen[$url] = true;
        $date = ainews_parse_borndigital_date($title, $url);
        $image = ainews_match('/<img[^>]+src="([^"]+)"/iu', $block);

        if (str_contains(parse_url($url, PHP_URL_HOST) ?: '', 'borndigital.co.jp')) {
            try {
                $detailHtml = ainews_fetch_text($url);
                $status = ainews_match_text('/<ul class="c-article__tag">([\s\S]*?)<\/ul>/iu', $detailHtml);
                if (preg_match('/受付終了|募集終了|申込終了|終了しました|開催終了|イベント終了/u', $status)) {
                    continue;
                }

                $dateCell = ainews_table_value($detailHtml, '開催日時');
                $methodCell = ainews_table_value($detailHtml, '開催方法');
                $deadlineCell = ainews_table_value($detailHtml, '申込期限');
                $date = ainews_parse_borndigital_date($dateCell ?: $title, $url) ?: $date;
                $detail = implode(' / ', array_filter([
                    'ウェビナー',
                    $status,
                    $methodCell,
                    $dateCell,
                    $deadlineCell ? '申込期限 ' . $deadlineCell : '',
                ]));
                $image = ainews_match('/<meta property="og:image" content="([^"]+)"/iu', $detailHtml) ?: $image;
            } catch (Throwable) {
                // Keep the listing item when the detail page is temporarily unavailable.
            }
        }

        $events[] = [
            'id' => 'Born Digital:' . $url,
            'title' => $title,
            'url' => $url,
            'source' => 'Born Digital',
            'detail' => $detail,
            'publishedAt' => $date,
            'image' => $image,
            'category' => 'webinar',
        ];
    }

    return $events;
}

function ainews_extract_doorkeeper_events(string $html, array $options): array
{
    preg_match_all("/<div class='global-event events-list'>([\s\S]*?)(?=<div class='global-event events-list'>|<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>)/u", $html, $matches);
    $events = [];

    foreach ($matches[1] as $block) {
        if (!preg_match('/<a href="([^"]+)"><span>([\s\S]*?)<\/span>\s*<\/a>/iu', $block, $href) || !str_contains($href[1], '/events/')) {
            continue;
        }

        $date = ainews_match_text("/events-list-item-time-date'>([\s\S]*?)<\/span>/iu", $block);
        $time = ainews_match_text("/<time class='events-list-item-time'>[\s\S]*?<\/span>\s*([^<]+)<\/time>/iu", $block);
        $url = ainews_absolute_url($href[1], $options['baseUrl']);

        $events[] = [
            'id' => $options['source'] . ':' . $url,
            'title' => ainews_clean_title(ainews_strip_tags($href[2])),
            'url' => $url,
            'source' => $options['source'],
            'detail' => implode(' / ', array_filter([
                'ウェビナー',
                ainews_match_text("/label label-[^']+'>([\s\S]*?)<\/label>/iu", $block),
                ainews_match_text("/events-list-item-venue'>([\s\S]*?)<\/div>/iu", $block) ?: 'オンライン',
                trim($date . ' ' . $time),
            ])),
            'publishedAt' => ainews_parse_japanese_event_date($date, $time),
            'image' => '',
            'category' => 'webinar',
        ];
    }

    return $events;
}

function ainews_match(string $pattern, string $text): string
{
    return preg_match($pattern, $text, $match) ? trim($match[1]) : '';
}

function ainews_match_text(string $pattern, string $text): string
{
    return ainews_clean_title(ainews_strip_tags(ainews_match($pattern, $text)));
}

function ainews_table_value(string $html, string $label): string
{
    $quoted = preg_quote($label, '/');
    if (!preg_match('/<th[^>]*>\s*' . $quoted . '\s*<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/iu', $html, $match)) {
        return '';
    }

    return ainews_clean_title(ainews_strip_tags($match[1]));
}

function ainews_parse_borndigital_date(string $text, string $url = ''): string
{
    if (preg_match('/(20\d{2})年\s*(\d{1,2})月\s*(\d{1,2})日/u', $text, $dateMatch)) {
        $time = '';
        if (preg_match('/(\d{1,2}):(\d{2})/u', $text, $timeMatch)) {
            $time = $timeMatch[0];
        }
        return ainews_parse_japanese_event_date("{$dateMatch[1]}年{$dateMatch[2]}月{$dateMatch[3]}日", $time);
    }

    if (preg_match('/\/(\d{2})(\d{2})(\d{2})[_-]/u', $url, $urlMatch)) {
        return gmdate('c', gmmktime(0, 0, 0, (int) $urlMatch[2], (int) $urlMatch[3], 2000 + (int) $urlMatch[1]));
    }

    return '';
}

function ainews_extract_date_near(string $html, int $index = 0): string
{
    return ainews_extract_date(substr($html, max(0, $index - 240), 600));
}

function ainews_extract_date(string $text): string
{
    if (!preg_match('/20\d{2}\s*[\/-]\s*\d{1,2}\s*[\/-]\s*\d{1,2}/u', $text, $match)) {
        return '';
    }
    [$year, $month, $day] = array_map(static fn(string $part): int => (int) trim($part), preg_split('/[\/-]/', $match[0]));
    return gmdate('c', gmmktime(0, 0, 0, $month, $day, $year));
}

function ainews_parse_japanese_event_date(string $dateText, string $timeText = ''): string
{
    if (!preg_match('/(\d{4})年(\d{1,2})月(\d{1,2})日/u', $dateText, $dateMatch)) {
        return '';
    }
    $hour = 0;
    $minute = 0;
    if (preg_match('/(\d{1,2}):(\d{2})/u', $timeText, $timeMatch)) {
        $hour = (int) $timeMatch[1];
        $minute = (int) $timeMatch[2];
    }

    return gmdate('c', gmmktime($hour - 9, $minute, 0, (int) $dateMatch[2], (int) $dateMatch[3], (int) $dateMatch[1]));
}

function ainews_is_active_webinar(array $article): bool
{
    $detail = (string) ($article['detail'] ?? '');
    if (preg_match('/受付終了|募集終了|申込終了|終了しました|開催終了|イベント終了/u', $detail)) {
        return false;
    }

    $timestamp = strtotime((string) ($article['publishedAt'] ?? ''));
    if ($timestamp === false) {
        return true;
    }

    return $timestamp >= time();
}

function ainews_absolute_url(string $href, string $baseUrl): string
{
    if (preg_match('/^https?:\/\//i', $href)) {
        return strtok($href, '#') ?: $href;
    }
    $base = parse_url($baseUrl);
    if (!$base || empty($base['scheme']) || empty($base['host'])) {
        return '';
    }
    $path = str_starts_with($href, '/') ? $href : rtrim(dirname($base['path'] ?? '/'), '/') . '/' . $href;
    $segments = [];
    foreach (explode('/', $path) as $segment) {
        if ($segment === '' || $segment === '.') {
            continue;
        }
        if ($segment === '..') {
            array_pop($segments);
            continue;
        }
        $segments[] = $segment;
    }
    return $base['scheme'] . '://' . $base['host'] . '/' . implode('/', $segments);
}

function ainews_dedupe(array $articles): array
{
    $seenUrls = [];
    $seenTitles = [];
    $deduped = [];
    foreach ($articles as $article) {
        $urlKey = preg_replace('/^https?:\/\/(www\.)?/i', '', ainews_canonical_article_url((string) ($article['url'] ?? '')));
        $urlKey = rtrim($urlKey ?? '', '/');
        $titleKey = ainews_canonical_title((string) ($article['title'] ?? ''));

        if ($urlKey && isset($seenUrls[$urlKey])) {
            continue;
        }
        if (mb_strlen($titleKey) >= 16 && isset($seenTitles[$titleKey])) {
            continue;
        }
        if ($urlKey) {
            $seenUrls[$urlKey] = true;
        }
        if (mb_strlen($titleKey) >= 16) {
            $seenTitles[$titleKey] = true;
        }
        $deduped[] = $article;
    }
    return $deduped;
}

function ainews_canonical_article_url(string $value): string
{
    $parts = parse_url($value);
    if (!$parts || empty($parts['host'])) {
        return $value;
    }
    if (str_contains((string) $parts['host'], 'bing.com') && !empty($parts['query'])) {
        parse_str($parts['query'], $query);
        if (!empty($query['url']) && is_string($query['url'])) {
            return $query['url'];
        }
    }
    return $value;
}

function ainews_canonical_title(string $value): string
{
    $decoded = mb_strtolower(ainews_decode($value));
    return trim(preg_replace('/[\s"\'“”‘’「」『』【】\[\]（）(),.、。!?！？:：;；|｜\-〜~…・\/／]+/u', '', $decoded) ?? '');
}

function ainews_is_relevant(string ...$values): bool
{
    $text = mb_strtolower(implode(' ', $values));
    foreach (ainews_keywords() as $keyword) {
        if (str_contains($text, mb_strtolower($keyword))) {
            return true;
        }
    }
    return false;
}

function ainews_category_for(string $text): string
{
    $haystack = mb_strtolower($text);
    if (preg_match('/ウェビナー|セミナー|講座|勉強会|開催|受付中|オンライン開催/u', $haystack)) {
        return 'webinar';
    }
    if (preg_match('/研究|論文|モデル|llm|deepmind|openai|anthropic|benchmark|ベンチマーク|gpt|claude|gemini/u', $haystack)) {
        return 'research';
    }
    if (preg_match('/企業|投資|資金調達|株|決算|ビジネス|nvidia|半導体|チップ|スタートアップ|サービス|導入|製品/u', $haystack)) {
        return 'business';
    }
    if (preg_match('/政策|規制|安全|法律|著作権|政府|省|庁|eu|ai法|セキュリティ|脆弱性/u', $haystack)) {
        return 'policy';
    }
    return 'news';
}

function ainews_strip_tags(string $value): string
{
    $withoutTags = preg_replace('/<[^>]*>/u', ' ', $value) ?? $value;
    return trim(preg_replace('/\s+/u', ' ', html_entity_decode($withoutTags, ENT_QUOTES | ENT_HTML5, 'UTF-8')) ?? '');
}

function ainews_clean_title(string $value): string
{
    return trim(preg_replace('/\s+/u', ' ', preg_replace('/\bNEW\b/u', '', ainews_decode($value)) ?? '') ?? '');
}

function ainews_decode(string $value): string
{
    $value = preg_replace('/<!\[CDATA\[([\s\S]*?)\]\]>/u', '$1', $value) ?? $value;
    return html_entity_decode($value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
}

if (PHP_SAPI === 'cli' && realpath($argv[0] ?? '') === __FILE__) {
    $payload = ainews_refresh_cache();
    echo 'Fetched ' . count($payload['articles']) . ' articles with ' . count($payload['errors']) . " errors.\n";
}
