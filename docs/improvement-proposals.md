# Struq 改善提案

作成日: 2026-04-17
対象コミット: `bf3465c` 時点

コードベース全体をレビューし、優先度順に改善案をまとめた。

---

## 🎯 演奏体験（perform view）の強化

### 1. BPM 連動の自動進行モード

- **現状**: `src/routes/songs/$id/perform.tsx` は完全手動タップ／キー操作のみ。
- **提案**: `bars × beats/BPM` で次セクションまでの秒数を計算し、進行バーをアニメーション。手動/自動の切替トグルを追加。
- **トレードオフ**: 手動は確実だが片手が塞がる。自動は便利だが転んだら戻せない。自動時もタップで即戻しできるUIが必須。

### 2. 簡易メトロノーム / カウントイン

- 曲頭の4カウントだけでも演奏開始のストレスが激減。
- `Web Audio API` で十分軽量に実装可能（外部ライブラリ不要）。

### 3. 経過時間 / 残り時間表示

- `currentIndex` と各 `bars` から推定残り秒を表示。
- セトリ全体の残り時間も出せる（演奏中の進行管理に有効）。

---

## 🔍 曲数が増えた時のスケール対策

### 4. 検索・フィルタ

- **現状**: `listSongs` は `updatedAt` DESC の30件ページネーションのみ（`src/songs/server-fns.ts`）。
- **問題**: 曲数が50を超えると Load More を繰り返さないと目的の曲に辿り着けない。
- **提案**: タイトル / アーティスト / Key でのフィルタ。`listInputSchema` に `query` パラメータを追加し、SQL `LIKE` で絞り込み。

### 5. タグ / ジャンル

- `songs` テーブルに `tags` 列（JSON text）を追加。
- `tags LIKE '%rock%'` で簡易フィルタ可能。
- マイグレーション: `pnpm db:generate` で生成。

---

## 💾 データ保護・移行

### 6. ソフト削除の復元UI

- **現状**: `deletedAt` は付与されるが、ユーザーが誤削除を戻す画面が存在しない。
- **提案**: `/settings` に「ゴミ箱」ビューを追加。一定期間（例: 30日）経過後に物理削除する cron も検討。

### 7. Export / Import (JSON)

- バンド間でのセトリ共有、ユーザーバックアップ用途に有効。
- `setlists/:id/export` エンドポイント程度で十分。将来的に共有URL方式にも拡張可能。

---

## ⚙️ コード品質・設計の改善余地

### 8. `routes/setlists/$id.tsx` の `handleSave`

- **問題**: `updateSetlist` と `reorderSetlistSongs` を `Promise.all` で並列実行しているため、片方失敗時に部分更新が残る。
- **提案**: サーバー側で `db.batch` にまとめる（`deleteSong` や `saveSongWithSections` は既にbatch化済みで方針と一貫していない）。
- **参考**: `src/songs/server-fns.ts:171` の `deleteSong` が参考実装。

### 9. `SongPickerModal` の取得がuseEffect即実行

- **現状**: モーダルを開くたびに `listSongsForPicker` を fetch。
- **提案**: ローダーデータに含めるか、`TanStack Query` 的なキャッシュ層の導入を検討。

### 10. ネイティブ `confirm()` の混在

- **混在箇所**:
  - `src/routes/songs/index.tsx:28`（曲削除）
  - `src/routes/songs/$id/index.tsx:261`（曲削除）
  - `src/routes/setlists/$id.tsx:153`（セトリ削除）
- **提案**: 他は自作 `ConfirmModal` に統一されているため揃えると一貫性が出る（AI再生成確認は既に `ConfirmModal` を使用）。

---

## 🎨 小粒だが効く改善

### 11. オフライン対応

- Service Worker で演奏ビューだけでも動くように。
- ライブ会場のWiFiは信用できない → 失敗時の救済策として価値が高い。

### 12. 転調 / カポ表示

- **現状**: `songs.key` 列はあるが、移調表示機能なし。
- **提案**: 演奏ビューで±半音ずつ移調できるトグル。歌い手との合わせで需要高い。

### 13. グローバルキーボードショートカット

- 保存 `⌘S`、セクション追加 `A` などのショートカット追加。
- 現状は perform view のキー操作のみ。

---

## 💡 優先度の所感

投資対効果が高いと考える2つ:

1. **BPM自動進行** — アプリの核である演奏体験を1段引き上げる
2. **検索機能** — 曲数増加時の致命的な使いづらさを解消する

いずれも既存の構造（`perform.tsx` の state設計、`listSongs` の pagination）に自然に組み込める。
