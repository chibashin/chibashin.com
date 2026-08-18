# AI Daily News

`AI Daily News` は、生成AIに関するニュースとAIウェビナー情報を、日本語で確認できる新聞風のWebサイトです。

公開URL: <https://chibashin.com/>

## サイトの特徴

- 生成AIに関するニュースとイベント情報をまとめて表示
- 新着情報を日付、カテゴリ、キーワードで探しやすい画面構成
- 新聞のように見出しを一覧できる、軽量でシンプルなデザイン
- 保存機能とクリーンなURLに対応
- スマートフォン、タブレット、デスクトップに対応したレスポンシブ表示
- 記事の見出し、日時、リンクは公開されている取得元の情報を使用

## どのように作られているか

フロントエンドはHTML、CSS、JavaScriptで構成し、記事データの取得とキャッシュにはPHPを使用しています。
取得した記事データをJSONとして保存し、画面側のJavaScriptがAPI経由で読み込んで一覧表示します。

```text
公開API・RSS・公開ページ
          ↓
     cron/fetch.php
          ↓
   data/articles.json
          ↓
    api/articles.php
          ↓
       app.js
          ↓
       Web画面
```

## 主なファイル

```text
index.html                 画面構造、SEOメタ、JSON-LD
styles.css                 レイアウト、新聞風デザイン、レスポンシブ対応
app.js                     フィルター、ソート、保存、記事の描画
api/articles.php           記事データを返すAPI
cron/fetch.php             ニュースとウェビナー情報の取得・更新
server.js                  ローカル確認用のNode.jsサーバー
data/articles.json         取得済み記事データのキャッシュ
assets/cache/images/       ウェビナー画像のキャッシュ
scripts/verify-config.mjs  設定整合性チェック
.htaccess                  URL制御、HTTPS、キャッシュ設定
robots.txt                 クローラー向け設定
sitemap.xml                サイトマップ
```
