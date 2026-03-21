## akari-beads-ui

イベント当日スタッフ向けの、ビーズ作品登録用モバイルUIです。写真撮影、プレビュー、作品情報入力、Stripe Payment Link自動生成、商品URLの共有までを 1 画面で行えます。

## 機能

- 写真撮影（モバイルカメラ対応）
- 作品タイトル・作者名・説明文の入力
- 価格プリセット（¥300 / ¥500 / ¥1,000 / 投げ銭）
- Stripe Payment Link 自動生成（Keymaster経由）
- Notion DB への商品データ保存（オプション）
- SNS共有・URL コピー
- `/products` ページで登録済み商品一覧表示

## Environment Variables

`.env.example` を `.env.local` にコピーして設定してください。

```bash
cp .env.example .env.local
```

| 変数名 | 必須 | 説明 |
|--------|------|------|
| `AKARI_KEYMASTER_URL` | ✅ | Keymaster (Vault proxy) URL |
| `AKARI_KEYMASTER_TOKEN` | ✅ | Keymaster認証トークン |
| `NOTION_BEADS_DB_ID` | - | Notion DB ID（/productsページ＆自動保存用） |

## Local Development

```bash
npm install
npm run dev
```

## Deployment

Vercel にデプロイする場合は、プロジェクト設定で上記の環境変数を設定してください。
