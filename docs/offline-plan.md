# Offline Support — Plan A (Perform-view first)

## Scope

A 案：Perform ビューを起点に、読み取り専用でオフライン参照可能にする。

- 対象：`/songs/$id/perform`、`/songs/$id`、`/setlists/$id`、各種一覧
- 非対象：オフライン編集／書き込みキュー／競合解決（B 案以降で扱う）
- 認証：Google OAuth セッション Cookie が有効な間のみオフライン可。OAuth 自体はオフライン完結不能

## Library Choices

| 用途 | 採用 | 理由 |
|---|---|---|
| PWA / Service Worker | `vite-plugin-pwa` (Workbox) | manifest 統合、precache/runtime caching が宣言的に書ける |
| IndexedDB ラッパー | `idb` | Promise 化された薄いラッパー、Struq の規模に過不足なし |
| オンライン検出 | 自前 hook | `navigator.onLine` + `online`/`offline` イベントで十分 |

## Cache Strategy

| 軸 | 採用 |
|---|---|
| シェル(HTML/JS/CSS/icons) | SW + Cache API（Workbox の `precacheAndRoute`） |
| データ | IndexedDB |
| データ戦略 | stale-while-revalidate（IDB 即返し → server fetch → 差分更新） |
| 演奏中の挙動 | revalidate 抑止（`isRunningMode` の間は再描画しない） |
| トリガー | 暗黙キャッシュ（visited = cached）＋ セトリ詳細に一括DLボタン |
| 一括DLスコープ | セットリスト1件 + 含まれる全曲・全セクション |
| 失効 | TTL なし。書き込み時 invalidate、ログアウト時 clearAll |
| ユーザー切替検知 | `meta.userId` 不一致で全消去 |

## IndexedDB Schema (v1)

DB 名：`struq-offline`、バージョン：1

```
songs (key: songId)
  value: { song: SongRow, sections: SectionRow[], cachedAt: number, schemaVersion: 1 }

setlists (key: setlistId)
  value: { setlist: SetlistRow, songIds: string[], cachedAt: number, schemaVersion: 1 }

meta (key: 'current')
  value: { userId: string, lastFlushedAt: number }
```

設計判断:

- denormalized：A 案は読み取り専用なので loader 戻り値をそのまま埋め込む
- 結合表 `setlist_songs` は IDB に持ち込まず、setlist 内 `songIds` で並び順を保持
- 重複保存を避けるため、setlist は songIds 参照、曲本体は `songs` ストアに集約
- インデックス無し（id キー以外で検索しない、`getAll()` で全件読みは数百件想定で十分軽量）
- stale 判定：サーバ `updatedAt` !== IDB `song.updatedAt` で判定（曲単位、セクションだけ stale という表現はしない）
- マイグレーション：スキーマ変更時は `version` を上げて全消去 → 再キャッシュ（A 案では失う情報なし）

## UX Indicators

| 表示 | 配置 | 状態 |
|---|---|---|
| OFFLINE バッジ | 画面隅（small） | ネット切断時のみ |
| DL 状態ドット | `/songs`・`/setlists` 一覧の行末、セトリ詳細の各曲行 | 未DL（無表示）／DL済（青ドット）／古い可能性（黄ドット） |
| 進捗パルス | 一括DL押下時、対象セトリ行 | 既存 `led-pulse` 流用 |
| N/M 曲 DL済 | セトリ詳細ヘッダ | 進行状況と確認用 |

## Implementation Steps

- [x] **Step 1**：`vite-plugin-pwa` 導入と最小 SW（precache のみ）
- [x] **Step 2**：`idb` 導入と `src/offline/db.ts`（read/write/clearAll）
- [x] **Step 3**：Perform ルート loader を SWR 化（IDB 即返し → server fetch → 差分）
- [ ] **Step 4**：online/offline フックと OFFLINE バッジ
- [ ] **Step 5**：リスト画面の DL 状態ドット
- [ ] **Step 6**：セトリ詳細の一括DLボタン
- [ ] **Step 7**：ログアウト・ユーザー切替時の `clearAll()` 結線

各ステップは独立 PR を想定。完了時はチェックを付けてコミット。
