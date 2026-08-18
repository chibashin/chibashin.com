<?php
declare(strict_types=1);

require_once __DIR__ . '/../cron/fetch.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$cacheFile = __DIR__ . '/../data/articles.json';

if (is_file($cacheFile)) {
    echo file_get_contents($cacheFile);
    exit;
}

try {
    ainews_refresh_cache($cacheFile);
} catch (Throwable $error) {
    http_response_code(500);
    echo json_encode([
        'fetchedAt' => gmdate('c'),
        'sources' => ainews_sources(),
        'errors' => [[
            'source' => 'Local API',
            'message' => $error->getMessage(),
        ]],
        'articles' => [],
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

echo file_get_contents($cacheFile);
