# Struq

ミュージシャンがセッション中にさっと曲構成を確認するための Web アプリ。[focuswave](https://focuswave.cc) ブランドのプロダクト。

**URL:** https://struq.focuswave.cc

## 主な機能

- **曲構成マッピング** — イントロ / A / B / コーラス / ブリッジ / ソロ / アウトロ / カスタムのセクションを並べて曲の流れを可視化
- **AI 生成** — Google Gemini Flash API でタイトル・アーティスト名から曲構成を自動生成
- **パフォーマンスビュー** — iPad ランドスケープに最適化したフルスクリーン黒背景のライブ参照画面
- **セットリスト管理** — 日付・会場つきのセットリストに曲を並べて管理
- **ドラッグ&ドロップ並べ替え** — セクションとセットリスト内の曲を自由に並べ替え
- **日本語 / 英語** — ユーザー設定で切り替え可能な i18n

## Tech Stack

| 項目 | 技術 |
|---|---|
| Framework | TanStack Start (React 19) + Vite |
| Database | Cloudflare D1 (SQLite) + Drizzle ORM |
| Deployment | Cloudflare Workers |
| Auth | Google OAuth |
| AI | Google Gemini Flash API |
| Styling | Tailwind CSS v4 |
| Language | TypeScript |
| Linter / Formatter | Biome |
| Testing | Vitest (unit) + Playwright (E2E) |

## Getting Started

### 前提条件

- Node.js 20+
- pnpm
- Wrangler CLI (`pnpm add -g wrangler`)

### インストール

```bash
pnpm install
```

### 環境変数

プロジェクトルートに `.dev.vars` を作成（`.env` ではなく `.dev.vars`）:

```
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GEMINI_API_KEY=xxx
SESSION_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # 32文字以上
```

### ローカル DB の初期化

```bash
pnpm db:migrate
```

### 開発サーバー起動

```bash
pnpm dev   # http://localhost:3000
```

## Development Commands

| コマンド | 説明 |
|---|---|
| `pnpm dev` | 開発サーバー起動 (port 3000) |
| `pnpm build` | プロダクションビルド |
| `pnpm preview` | ビルド → ローカルプレビュー |
| `pnpm deploy` | ビルド → Cloudflare にデプロイ |
| `pnpm test` | ユニットテスト実行 (Vitest) |
| `pnpm test:e2e` | E2E テスト実行 (Playwright) |
| `pnpm typecheck` | TypeScript 型チェック |
| `pnpm lint` | Biome でリント |
| `pnpm lint:fix` | リント自動修正 |
| `pnpm format` | Biome でフォーマット |
| `pnpm db:generate` | Drizzle マイグレーションファイル生成 |
| `pnpm db:migrate` | マイグレーション適用 (ローカル) |
| `pnpm db:migrate:production` | マイグレーション適用 (本番 D1) |
| `pnpm cf-typegen` | Cloudflare Worker 型定義再生成 |

## Project Structure

```
src/
├── routes/          # ファイルベースルーティング (routeTree.gen.ts は自動生成 — 直接編集不可)
├── auth/            # セッション管理、Google OAuth、サーバー関数
├── db/              # Drizzle スキーマ + getDb() ファクトリー
├── songs/           # 曲 CRUD サーバー関数 + コンポーネント
├── setlists/        # セットリスト CRUD サーバー関数
├── i18n/            # 翻訳キー + I18nProvider (ja / en)
├── server/          # 共通サーバーヘルパー (requireUser, now)
└── lib/             # ユーティリティ (logger など)
```

## Routes

| パス | 説明 |
|---|---|
| `/` | ランディング → `/setlists` にリダイレクト |
| `/login` | Google OAuth ログイン |
| `/setlists` | セットリスト一覧 |
| `/setlists/:id` | セットリスト詳細（曲順） |
| `/setlists/new` | 新規セットリスト作成 |
| `/songs` | 曲一覧 |
| `/songs/new` | 新規曲作成（AI 生成オプションあり） |
| `/songs/:id` | 曲編集 |
| `/songs/:id/perform` | パフォーマンスビュー（フルスクリーン） |
| `/settings` | ユーザー設定（言語、アカウント） |

## Deployment

### 通常デプロイ（自動）

`main` ブランチへの push が GitHub Actions の `deploy.yml` を自動起動し、D1 マイグレーション → Worker デプロイの順で本番に反映される。

### 初回セットアップ（新規環境・1 回のみ）

CI が動作するには事前に以下の手作業が必要。

#### 1. D1 データベース確認

```bash
pnpm exec wrangler d1 list
# struq-db が存在しない場合
pnpm exec wrangler d1 create struq-db
# → 発行された UUID を wrangler.jsonc の database_id に書き換えてコミット
```

#### 2. Worker シークレット設定

```bash
pnpm exec wrangler secret put GOOGLE_CLIENT_ID
pnpm exec wrangler secret put GOOGLE_CLIENT_SECRET
pnpm exec wrangler secret put GEMINI_API_KEY
pnpm exec wrangler secret put SESSION_SECRET   # 32 文字以上の文字列
```

> `E2E_TEST` は本番に設定しない（認証バイパスが有効になるため）

#### 3. 本番 DB マイグレーション（初回）

```bash
pnpm db:migrate:production
```

#### 4. 初回デプロイ

```bash
pnpm run deploy
```

#### 5. GitHub Actions シークレット登録

GitHub リポジトリの Settings → Secrets and variables → Actions に以下を登録:

| シークレット名 | 値 |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token（Edit Cloudflare Workers + D1 権限） |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare アカウント ID |

### 緊急時の手動デプロイ

```bash
pnpm db:migrate:production
pnpm run deploy
```

D1 データベース名: `struq-db`（`wrangler.jsonc` の `DB` バインディング）
