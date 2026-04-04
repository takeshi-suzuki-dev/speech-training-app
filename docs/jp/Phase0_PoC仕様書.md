# Phase 0: PoC 仕様書（確定版）

---

## 目的

- 発音採点が技術的に成立するか確認
- 音声 → Azure AI → 評価取得 → 表示 の一連の流れを通す
- ElevenLabs API で見本音声を生成・再生できることを確認

---

## 全体構成

```
Frontend → Backend → Azure AI   → Backend → Frontend
Frontend → Backend → ElevenLabs → Backend → Frontend
```

---

## 1. Frontend

### 表示
- 定型文（固定）
- 音声入力ボタン（「開始」「終了」）

### 音声入力
- 開始ボタン押下 → 録音開始
- 終了ボタン押下 → 録音終了

### 音声送信形式
- 第一候補：`audio/wav; codecs=audio/pcm; samplerate=16000`（mono）
- 代替：`audio/ogg; codecs=opus`
- 最終決定：フロント録音方式に依存（後で調整OK）

### API送信
Backendに送る内容：
- 音声データ
- 定型文（text）
- 必要なら追加パラメータ

---

## 2. Backend

### 受け取り
- 音声データ
- 定型文

### Azure AI 呼び出し
- 音声 + 定型文を Azure に送信
- 発音評価レスポンスを取得

### レスポンス整形
Frontendに返す内容（例）：

```json
{
  "overallScore": 85,
  "categoryScores": {},
  "words": [],
  "phonemes": [],
  "rawResponse": {}
}
```

※ フィールド名・構造はAzureのレスポンスを確認後に確定する

| フィールド | 内容 |
|---|---|
| overallScore | 全体スコア |
| categoryScores | 各評価項目（fluencyなど） |
| words | 単語単位スコア |
| phonemes | 音素スコア・音素ごとの判定 |
| rawResponse | AzureのレスポンスJSON全文 |

---

## 3. Frontend 表示

### 表示項目
- 全体スコア
- 各評価項目
- 単語スコア
- 音素スコア・音素の判定

### rawレスポンス表示
- ① ベタ表示（最優先）
- ② 余裕あれば開閉トグル（＋/−）
- 工数かかるなら①でOK

---

## 4. ElevenLabs 連携

### 確認したいこと
- 任意の文章を ElevenLabs API に渡せる
- 見本音声を取得できる
- 取得した見本音声を再生できる
- APIレスポンスの中身を確認できる

### 挙動

#### 文章入力
- 固定文でも可
- 将来的には任意文でも可
- 毎回自動で送らない（ボタン押下時のみ）

#### 「ElevenLabsで見本音声生成」ボタン
押下時にだけ：
- 文章を ElevenLabs API に渡す
- 見本音声を取得する
- 音声データを保持する
- raw APIレスポンスも保持する（音声バイナリ本体は除く）

#### 「音声再生」ボタン
押下時にだけ：
- 取得済みの見本音声を再生する

### raw APIレスポンス表示
表示対象（音声データ本体は除外）：
- request text
- voice id
- model
- settings
- response headers相当
- 生成成功/失敗情報

---

## 設計の統一思想

| | Azure | ElevenLabs |
|---|---|---|
| アクション | 採点実行 | 音声生成 |
| 結果 | スコア表示 | 音声再生 |
| 確認 | raw response 表示 | raw response 表示（音声除く） |

---

## やらないこと（Phase 0）

- フィードバック文生成（Phase1）
- DB保存（Phase1）
- スコア推移グラフ（Phase1）
- UI作り込み
- ログ管理

---

## Phase 0 の成功条件

**Azure**
- 音声が送れる
- Azureからスコアが返る
- 各粒度のスコアが確認できる
- raw レスポンスが見れる

**ElevenLabs**
- 文章を送れる
- 見本音声を取得できる
- 取得した音声を再生できる
- raw レスポンス（メタ情報）が見れる

---

## 一言まとめ

> 「生成」と「再生」を分けて、両APIともraw responseを見られるようにする
