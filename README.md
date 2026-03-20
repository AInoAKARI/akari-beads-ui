## akari-beads-ui

イベント当日スタッフ向けの、ビーズ作品登録用モバイルUIです。写真撮影、プレビュー、作品情報入力、`multipart/form-data` での API 登録、商品URLの共有までを 1 画面で行えます。

## Environment Variables

`NEXT_PUBLIC_API_URL`

例:

```bash
NEXT_PUBLIC_API_URL=https://example.com
```

送信先は `${NEXT_PUBLIC_API_URL}/products/create` です。

## Local Development

```bash
npm install
npm run dev
```

## Deployment

Vercel にデプロイする場合は、プロジェクト設定で `NEXT_PUBLIC_API_URL` を本番 API の URL に設定してください。
