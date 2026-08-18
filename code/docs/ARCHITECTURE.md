# AI Daily News Architecture

最終更新: 2026-06-26

このドキュメントは、初めて引き継ぐ人がファイル構成と処理の流れを把握するための設計メモです。

## 全体像

```text
取得元の公開API/RSS/HTML
  -> cron/fetch.php
  -> data/articles.json
  -> api/articles.php
  -> app.js
  -> index.html
```

ローカル確認では `server.js` が `api/articles.php` 相当のJSONを返します。本番では `api/articles.php` が `data/articles.json` を返します。

## ファイル構成

```text
.
├── index.html
├── styles.css
├── app.js
├── server.js
├── package.json
├── .htaccess
├── api/
│   └── articles.php
├── cron/
│   └── fetch.php
├── data/
│   └── articles.json
├── assets/
│   └── cache/images/
├── scripts/
│   └── verify-config.mjs
├── sitemap.xml
├── robots.txt
├── README.md
└── docs/
    └── ARCHITECTURE.md
```

## フロントエンド

`index.html`:

- SEOメタ、canonical、OGP、Twitter card、JSON-LDを定義します。
- 画面の静的な骨組み、テンプレート、フィルター領域、記事表示領域を持ちます。
- `styles.css` と `app.js` は `?v=` 付きで読み込みます。

`styles.css`:

- 新聞風レイアウト、カード、チップ、ソース一覧、ローディング表示、レスポンシブを担当します。
- 静的資産として `.htaccess` により7日キャッシュされます。

`app.js`:

- 記事取得、描画、検索、キーワードチップ、ソースフィルター、ソート、保存済み管理を担当します。
- `state` が画面状態の中心です。
- `keywordCandidates` からキーワードチップとクリーンURLを作ります。
- `serviceRoutes`、`sourceRoutes`、`keywordRoutes` でURLと画面状態を対応させます。
- `updateUrlFromState()` と `applyStateFromUrl()` でブラウザURLと状態を同期します。
- 保存済み記事は `localStorage` の `ai-daily-saved` に保存します。

## 現在の画面仕様

- ニュースとウェビナーを別枠で表示します。
- ニュースは1記事目を大きく表示し、2記事目以降はカードで表示します。
- 「もっと見る」で30件ずつ追加表示します。
- ソートは `新着順` / `人気順` です。
- サービス別メニューは `トップ`、`ChatGPT`、`OpenAI`、`Claude`、`Gemini`、`Openclaw`、`保存` です。
- PCでは `Live Sources` を右カラムに表示します。
- スマホではハンバーガーメニューを右下固定にし、メニュー内に `Live Sources` を表示します。
- ニュース記事カードには画像を表示しません。画像はウェビナー枠のみ表示します。
- グロナビ、キーワード、Live Sources は `/chatgpt/`、`/llm/`、`/qiita/` のようなクリーンURLで表示できます。
- 気になるワード、トピックは同じチップをもう一度クリックするとリセットされます。
- キーワード検索欄で任意語句を検索できます。
- Figma、Adobe、Pencil、Codex、Canva、VSCode、Cursor、Antigravity は固定チップから検索できます。

## データ取得

`cron/fetch.php` は本番の取得処理です。

- 各取得元から記事とウェビナーを集めます。
- 重複排除、関連度フィルタ、ウェビナーの有効期限判定、画像情報の整理を行います。
- 結果を `data/articles.json` に保存します。
- ニュース記事の画像は削除します。
- ウェビナー画像は `assets/cache/images/` にキャッシュします。
- 使われなくなった画像キャッシュは削除します。

`api/articles.php` は公開APIです。

- `data/articles.json` があればその内容を即返します。
- キャッシュがない場合は `cron/fetch.php` の `ainews_refresh_cache()` を呼びます。
- `Cache-Control: no-store` を返します。

`server.js` はローカル確認用です。

- 静的ファイルを配信します。
- クリーンURLを `index.html` に向けます。
- `/api/articles` と `/api/articles.php` をローカルAPIとして返します。
- `data/articles.json` がなければ本番APIからキャッシュを取得し、さらに失敗した場合はライブ取得を試します。

## 取得元

ニュース:

- Qiita API v2: https://qiita.com/api/v2/docs
- Zenn: https://zenn.dev/api/articles
- AIsmiley AIニュース: https://aismiley.co.jp/ai_news/
- Ledge.ai: https://ledge.ai/
- Web Designing: https://webdesigning.book.mynavi.jp/
- Bing AI News: https://www.bing.com/news/

ウェビナー:

- NOT DESIGN SCHOOL connpass: https://not-design-school.connpass.com/event/
- Doorkeeper:
  - https://cssnite.doorkeeper.jp/
  - https://dtptransit.doorkeeper.jp/
- Born Digital セミナー: https://www.borndigital.co.jp/seminar/seminar/

終了済み、または受付終了と判定できるウェビナーは表示しない方針です。

## 変更時の同期箇所

キーワードやクリーンURLを追加する場合:

- `app.js`: `keywordCandidates`、必要に応じて固定チップ
- `server.js`: `CLEAN_ROUTES`
- `.htaccess`: `SetEnvIf Request_URI` と `RewriteRule`
- `sitemap.xml`: 公開したいURL
- `README.md` または `docs/ARCHITECTURE.md`: 仕様説明

フロント資産を更新して即時反映したい場合:

- `package.json`: `siteVersion`
- `index.html`: `styles.css?v=` と `app.js?v=`
- 本番転送: `index.html` と更新した資産

取得元を追加する場合:

- `cron/fetch.php`: 本番取得処理
- `server.js`: ローカル取得処理
- `README.md` または `docs/ARCHITECTURE.md`: 取得元リスト
- 必要に応じて `scripts/verify-config.mjs`: 整合性チェック

## 設定整合性チェック

`scripts/verify-config.mjs` は以下を確認します。

- `siteVersion` と `index.html` のCSS/JSクエリが一致していること
- クリーンURLが `app.js`、`server.js`、`.htaccess`、`sitemap.xml` で同期していること
- 公開READMEに個別の接続情報やデプロイ手順が含まれていないこと
- 古いサイト名の表記が残っていないこと
- HTML/API/sitemap系ルートが `no-store` になること
- ニュース画像を表示しない方針が保たれていること

本番に上げる前に必ず `npm run check` を実行します。

## 事実性の方針

このサイトは取得元が返す、または公開HTMLに掲載している見出し、日時、リンクを表示します。
独自の本文要約、未確認情報の断定、推測による記事生成は行いません。

サイトや取得処理を変更するときは、以下を確認します。

- 表示内容が取得元の公開情報に基づいていること
- 取得元URLを画面またはドキュメントで確認できること
- Qiitaトークンなどの秘密情報を公開ディレクトリやチャットに出していないこと
- 本番APIの `errors` が空、またはエラー内容を把握できていること
