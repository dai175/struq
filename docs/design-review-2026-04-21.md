# Struq デザインレビュー

**レビュー日**: 2026-04-21
**対象**: iPhone ポートレート画面（10枚のスクリーンショット）
**未カバー**: Performance View (`/songs/:id/perform`) — iPad landscape の本丸画面

---

## サマリー

全体的に「清潔で機能的」だが、**ミュージシャン向けアプリとしての個性**が薄い。
また、体験を損なう軽微なバグも複数確認できた。

優先度の高い順に、以下の3カテゴリで整理する。

---

## 🔴 致命度の高い問題

### 1. Setlist詳細画面のタイトルがバグ

**対象画面**: Setlist詳細（編集画面）、Add Song モーダル表示時

**問題**:
ヘッダーに `Setlists`（複数形）と表示されているが、これは詳細画面。
ユーザーは常に「自分が今何を編集しているか」をタイトルで確認する。

**改善案**:
編集中のセットリスト名（例: "テストセッション"）を表示する。

---

### 2. "No songs yet" の文言矛盾

**対象画面**: Add Song モーダル

**問題**:
モーダルで `No songs yet` と表示されるが、Songs一覧には "Love Me Do" が存在する。
おそらく **すでにセットリストに追加済みの曲を除外した結果、候補が0件** になっている。
メッセージが状況を正確に反映していない。

**改善案**:
- 全体で曲が0件 → `No songs yet. Create your first song →`
- 追加済みで候補なし → `All your songs are already in this setlist`
- 検索結果なし → `No matches for "..."`

文言を状況ごとに分岐させる。

---

### 3. 破壊的操作の保護が弱い

**対象画面**: Setlists一覧、Setlist詳細（曲の削除）

**問題**:
- Setlists一覧で **各行に常時ゴミ箱アイコン**が表示されている
- 曲の削除「×」も各行に常時表示
- iPhoneの親指操作で誤タップしやすい

**現状**:
直近コミット `4b16d5e feat(ui): replace confirm() with ConfirmModal` で
確認モーダル化されている。

**改善案**:
さらに以下のいずれかを検討：
- アイコンを初期状態で隠し、スワイプで表出（iOS標準のパターン）
- 長押しでアクション表示
- 編集モードトグル（一覧の上部に「Edit」ボタンを置き、タップで削除ボタン群を表示）

---

## 🟡 デザインアイデンティティの問題

### 4. 音楽アプリらしさがゼロ

**対象画面**: 全画面（特にログイン画面）

**問題**:
ログイン画面を見ると、**Struqロゴ以外に音楽的な要素が皆無**。
ミュージシャン向けアプリなのに、SaaSダッシュボードと同じ佇まい。

**改善案**:

| 要素 | 現状 | 改善案 |
|------|------|--------|
| タイポグラフィ | `Inter`/`system-ui` 系の汎用書体 | 楽譜・印刷物を思わせる書体（`Fraunces`, `Recoleta`, `Instrument Serif` など）をタイトルに |
| 背景 | 真っ白 | 薄い譜面罫線パターン、微かなノイズテクスチャ |
| アクセント | モノトーン中心 | セクションカラー（青・オレンジ・緑・赤）を全体で活用 |

---

### 5. カラーバーの意味が伝わらない

**対象画面**: Songs一覧

**問題**:
Songs一覧のカードに色付きバーが並んでいるが、**これが曲構造のプレビュー**だと
初見で理解できない。

**改善案**:
- 初回訪問時に凡例を表示（`Intro → A → B → Chorus...`）
- hover / tap でラベルを表示
- **Setlists一覧のカードにも同じプレビューを出す** → セットリストが
  視覚的に「演奏の流れ」として読めるようになる（これは差別化要素になる）

---

## 🟢 細部の改善案

### 6. iPhone 2カラム配置の窮屈さ

**対象画面**: New Setlist、New Song

**問題**:
`Date/Venue`、`BPM/Key` が横並びで、iPhone SE級の狭い画面だとタップターゲットが窮屈。

**改善案**:
Tailwind v4 で以下のようにブレークポイント切り替え：

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <Field label="Date" />
  <Field label="Venue" />
</div>
```

CLAUDE.md に `Touch-first design (large tap targets)` とある以上、
モバイルは縦積みを徹底する方がブランドメッセージと一致する。

---

### 7. その他の細かい改善ポイント

| 画面 | 問題 | 改善案 |
|------|------|--------|
| New Setlist | 日付入力が OS デフォルト `yyyy/mm/dd` | カスタム日付ピッカーで統一感を |
| New Song | AI Generate ボタンがない（Song編集画面にはある） | 新規作成時にも使えると価値UP |
| Song編集（上部） | セクションチップ9種が一列に押し込まれている | 使用頻度でグルーピング or カテゴリ分け |
| Song編集（下部） | コード進行が平坦なテキスト `G C G C G D G` | モノスペース＋コード単位でハイライト |
| Settings | 設定項目が少ない | メトロノーム音量、デフォルトBPM、セクション配色カスタマイズなど |

---

## 📌 未確認の重要画面

**Performance View (`/songs/:id/perform`)** のスクリーンショットは含まれていない。

CLAUDE.md に `Performance view optimized for iPad landscape (fullscreen, dark)` とあり、
**このアプリの核心機能**。直近のコミットでビートLEDや横画面対応が入っている：

- `4b16d5e feat(ui): replace confirm() with ConfirmModal and cache SongPicker state`
- `fa90daa refactor(perform): increase section name, bar count, and indicator sizes on mobile`
- `08a2d67 refactor(perform): use touch-landscape variant so desktop stays single-column`
- `23f8146 refactor(perform): tidy beat LED hook and component`
- `3a87833 feat(perform): add beat LED and host prev/next in landscape details column`

デザインレビューの本丸として別途スクリーンショットを取り、追加レビューを実施したい。

---

## 🎯 推奨される進め方

改善には方向性の選択が必要。優先順位の推奨：

1. **バグ修正優先**（問題 1, 2, 3） — 体験を損なっている実害 → すぐ直す価値あり
2. **アイデンティティ強化**（問題 4, 5） — Struqを「記憶に残るアプリ」にする抜本改革
3. **細部の磨き込み**（問題 6, 7） — 既存の骨格を保ちつつ精度を上げる

バグは放置するとユーザーの信頼を削る。アイデンティティ強化は時間がかかるため
後回しにしても価値が残る。
