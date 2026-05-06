# Phase 1 MVP Spec（日本語版）

## 1. 目的

このドキュメントは、発音トレーニングアプリの Phase 1 MVP の仕様を定義する。

Phase 1 の目的は、PoCで確認した技術要素を、最小限使える発音トレーニングアプリにまとめることである。

Phase 1 のゴールは、以下を満たす状態にすること。

- 固定定型文を選べる
- 見本音声を再生できる
- ユーザーが発話音声を送信できる
- Azure AI Speech による発音採点結果を表示できる
- 認識・採点が成立した結果だけをDBに保存できる
- 定型文ごとの最新scoreを確認できる
- 総合得点（Pron）の履歴グラフを確認できる
- sentence-level score項目の履歴グラフを確認できる
- 公開URL、README、英語説明により応募・面接で説明できる

---

## 2. Phase 1 の位置づけ

Phase 1 は MVP（Minimum Viable Product）である。

PoC では、Azure AI Speech や ElevenLabs との技術連携を確認した。  
Phase 1 では、それを「ユーザーが最低限使えるアプリ」に整理する。

Phase 1 は完成版ではない。  
本格的な認証、ユーザー定型文、本格的な音声管理、詳細分析、アドバイス生成などは Phase 2 以降に延期する。

---

## 3. スコープ

### 対象範囲

- 固定定型文カテゴリの取得
- 固定定型文の複数管理
- 固定定型文の選択
- `display_text` と `scoring_text` の使い分け
- Roger の見本音声再生
- ElevenLabs生成音声の最小TTSキャッシュ
- Supabase Storage への見本音声保存
- Azure AI Speech による発音採点
- 採点結果の表示
- 採点結果のDB保存
- 認識・採点が成立していない結果を履歴保存しない制御
- browser-local `client_id` による簡易的なユーザー識別
- 定型文ごとの最新score表示
- 履歴グラフ表示
- 総合得点（Pron）の daily last-5 average / 5日移動平均 / 20日移動平均
- sentence-level score breakdown の日別推移
- README / docs の整備
- 英語で設計意図を説明できる状態

### 対象外

- 本格的なログイン / 認証
- デバイス間同期
- ユーザー定型文追加
- ユーザー録音音声の保存
- voice選択UI
- Sarahなど複数voiceの切り替え
- 再生成UI
- スピード変更
- 音声管理画面
- 日付範囲フィルタ
- sentence/category別フィルタ
- 弱点分析
- 採点結果に基づく高度なアドバイス
- ユーザー固有音声の保護配信
- Backend proxy による音声配信
- 自由入力TTS API

---

## 4. ユーザー識別

Phase 1 では本格的な認証を入れない。

代わりに、browser-local `client_id` を使って履歴を紐づける。

実装上は、初回アクセス時にUUIDを生成し、ブラウザのlocalStorageに保存する。

### 方針

- `client_id` はブラウザローカルの識別子である
- `user_id` は将来の認証済みユーザー用として残す
- 同じブラウザ内では履歴を紐づけられる
- 別ブラウザ・別端末との同期はしない
- 認証は Phase 2 以降で導入する

### 面接説明

> Phase 1 does not include full authentication.  
> Instead, I use a browser-local client ID to keep user history with minimal complexity.  
> This allowed me to focus on the core scoring feedback loop first, while keeping the design flexible enough to add authentication later.

---

## 5. 固定定型文

Phase 1 では、ユーザーが自由に定型文を追加する機能は入れない。

アプリ側で用意した固定定型文をカテゴリ別に管理し、ユーザーはその中から選択して練習する。

### 要件

- 固定定型文カテゴリをDBに保存する
- 固定定型文をDBに保存する
- カテゴリごとに固定定型文を取得できる
- 表示順を持つ
- 有効/無効を管理できる
- ユーザーは定型文を選択できる
- 画面表示には `display_text` を使う
- Azure採点には `scoring_text` を使う
- ElevenLabsの見本音声生成には `sample_audio_text` を使う

### Phase 2へ延期

- ユーザー定型文追加
- ユーザー定型文編集
- ユーザー定型文削除
- ユーザー定型文向けの音声管理
- user-specific categories/templates

---

## 6. 見本音声

Phase 1 では、固定定型文に対して Roger の見本音声を用意する。

### UIイメージ

```text
Practice phrase

[ Play sample · Roger ]
```

ユーザーは選択した定型文のRoger見本音声を再生できる。

### 方針

- Phase 1ではRoger固定
- voice選択UIは入れない
- Sarahなど複数voiceの切り替えは入れない
- スピード変更は入れない
- 再生成ボタンは入れない
- 見本音声は Supabase Storage に保存する
- Public URL を Frontend から直接再生する
- Backend proxy は使わない

### TTSキャッシュ

- 見本音声は `POST /api/sentence-templates/{templateId}/sample-audio` 経由で生成または再利用する
- 既に `audio_path` がある場合は、保存済みMP3のpublic URLを返す
- `audio_path` がない場合は、ElevenLabsで生成してSupabase Storageへ保存する
- 生成後は同じMP3を再利用する
- 再生のたびに ElevenLabs API を呼ばない

### Phase 2へ延期

- Sarah対応
- voice選択
- 再生成UI
- 音声管理画面
- ユーザー定型文向け音声管理
- Backend proxy / signed URL

---

## 7. 発音採点

Phase 1 では Azure AI Speech を使って発音採点を行う。

### 入力

- 採点対象テキスト
- ユーザーの発話音声

現在の発音練習画面では、選択中の固定定型文がある場合は `scoring_text` を採点対象として使う。

### 出力

- 認識テキスト
- recognition status
- overall / Pron score
- accuracy score
- fluency score
- completeness score
- prosody score
- word-level details
- phoneme-level details
- phoneme candidate

### 表示方針

Phase 1 では、結果を見やすい単一画面に整理する。

最低限、以下を表示する。

- 認識結果
- 総合スコア
- accuracy / fluency / completeness / prosody
- 単語ごとの評価
- タップした単語のphoneme details
- エラー時の状態

PoCで使用したraw Azure JSON viewerは開発・デバッグ用の位置づけであり、Phase 1の主要UI要件には含めない。

---

## 8. 採点結果保存

採点結果は Supabase PostgreSQL の `training_attempts` に保存する。

主な保存対象:

- `client_id`
- `user_id`
- `mode`
- `sentence_id`
- `reference_text`
- `recognized_text`
- `overall_score`
- `accuracy_score`
- `fluency_score`
- `completeness_score`
- `prosody_score`
- `words_json`
- `audio_duration_ms`
- `scored_at`
- `created_at`

`words_json` には、Azure Speech が返す word-level / phoneme-level の詳細を含める。

Phase 1では、ユーザー録音音声そのものは保存しない。  
また、raw Azure JSON全体のDB保存はPhase 1の必須要件には含めない。

### 保存しないケース

以下の場合は `training_attempts` に保存しない。

- `RecognitionStatus` が `Success` ではない
- sentence-level score が存在しない
- PronScore / overall が存在しない
- PronScore / overall が 0 以下である

これにより、認識失敗や採点不成立のデータが履歴グラフに混ざることを防ぐ。

---

## 9. 履歴表示

Phase 1 では、専用の履歴画面を実装する。

### 画面構成

履歴画面は以下の2つのタブを持つ。

- Overall
- Score Breakdown

共通データは `GET /api/training-attempts/history-trends` から取得する。

### Overallタブ

Overallタブでは、総合得点（Pron）の推移を表示する。

表示する折れ線:

- 各日の最後5回平均
- 5日移動平均
- 20日移動平均

集計ルール:

- 対象期間は直近1年
- `scored_at` を `Asia/Tokyo` 基準の日付に変換する
- 各日について、その日の最後5回の採点結果を使う
- その日の試行が5回未満の場合は、その日の全件を使う
- 5日移動平均と20日移動平均は、日別平均に対して計算する

表示補助:

- 直近の平均が過去最高なら、ハイスコア達成メッセージを表示する
- 直近の平均が過去2位なら、2位メッセージを表示する
- 直近の平均が過去3位なら、3位メッセージを表示する
- 直近の平均が5日移動平均以上なら、好調メッセージを表示する
- 5日移動平均が20日移動平均以上なら、グラフ背景を強調する

### Score Breakdownタブ

Score Breakdownタブでは、sentence-level score項目の推移を表示する。

表示する折れ線:

- overall / Pron
- accuracy
- fluency
- completeness
- prosody

集計ルール:

- 各項目とも、各日の最後5回平均を表示する
- 5日移動平均と20日移動平均は表示しない

### Phase 2以降へ延期

- 日付範囲フィルタ
- sentence/category別フィルタ
- 20日以外の長期平均設定
- 弱点分析
- アドバイス生成

---

## 10. 現在の実装状況

Phase 1実装は完了した。

実装済み:

- 固定定型文カテゴリをbackendから取得できる
- カテゴリごとに固定定型文を取得できる
- frontendでは画面表示に `display_text` を使う
- Azure採点には `scoring_text` を使う
- ブラウザ録音をWAVに変換して採点に送信する
- 発音採点は `POST /api/pronunciation/score` 経由で実行する
- 認識・採点が成立していない結果は `training_attempts` に保存しない
- 採点結果は `training_attempts` に保存する
- Rogerの見本音声は `POST /api/sentence-templates/{templateId}/sample-audio` 経由で生成または再利用する
- 生成した見本音声はSupabase Storageに保存する
- 保存済みの見本音声はpublic URLで再利用する
- 定型文ごとの最新scoreは `GET /api/sentence-latest-scores` で取得する
- 発音練習画面では、各定型文の最新scoreを表示する
- 履歴画面は `GET /api/training-attempts/history-trends` からグラフ用データを取得する
- Overallタブで総合得点グラフを表示する
- Score Breakdownタブでscore項目別グラフを表示する
- Practice / History 間のナビゲーションを表示する
- backend project directory は `backend/` に整理済みである

---

## 11. API要件

Phase 1 では、現在以下のAPIを使用する。

### Practice phrases

```text
GET /api/sentence-categories
GET /api/sentence-templates?categoryId={categoryId}
```

固定定型文カテゴリと、カテゴリごとの固定定型文を取得する。

### Pronunciation assessment

```text
POST /api/pronunciation/score
```

ユーザーの発話音声を送信し、Azure AI Speech で発音採点を行う。

backendは、認識・採点が成立した場合のみ採点結果を `training_attempts` に保存する。

### Latest score by sentence

```text
GET /api/sentence-latest-scores?clientId={clientId}
```

定型文ごとの最新採点結果を取得する。

発音練習画面で、各定型文の最新scoreを表示するために使用する。

### History trends

```text
GET /api/training-attempts/history-trends?clientId={clientId}
```

履歴グラフ用の日別集計データを取得する。

返却データには以下を含める。

- practice date
- daily last-5 average overall
- daily last-5 average accuracy
- daily last-5 average fluency
- daily last-5 average completeness
- daily last-5 average prosody
- 5-practice-day moving average for overall
- 20-practice-day moving average for overall

### Reference audio generation

```text
POST /api/sentence-templates/{templateId}/sample-audio
```

固定定型文のRoger見本音声を生成または再利用する。

frontendから送る値は `templateId` のみ。

backendが以下を決定する。

- sample audio text
- ElevenLabs voice ID
- model ID
- storage path

---

## 12. DB / Storage

詳細は以下の設計書に定義する。

```text
docs/en/phase1-db-storage-design.md
docs/jp/phase1-db-storage-design.md
```

Phase 1 の基本方針:

- DB: Supabase PostgreSQL
- Storage: Supabase Storage
- Storage bucket: `reference-audio`
- Bucket access: Public
- 見本音声 path: `preset/{sentence_template_id}/roger.mp3`
- 見本音声メタデータは `sentence_template_audios` で管理する
- 採点結果は `training_attempts` で管理する
- `audio_assets` テーブルは Phase 1 では作らない

---

## 13. エラー処理

### Azure AI Speech

- `RecognitionStatus` に応じて表示を切り替える
- NoMatch / timeout / error などをユーザーに分かる形で表示する
- 認識・採点が成立していない結果は履歴保存しない
- backend側の予期しないエラーはログに出す
- raw JSON は必要に応じて開発・デバッグ用に扱う

### ElevenLabs

- 生成失敗時はエラーを表示する
- 壊れた音声ファイルを保存しない
- `audio_path` が存在しない場合は、次回再生時に再試行できるようにする

### Supabase Storage

- アップロード失敗時はエラーを返す
- Public URL再生に失敗した場合は、Backendの生成APIを再度呼ぶ

---

## 14. セキュリティ方針

### SQL Injection

- Frontend からDBを直接触らせない
- DB操作は Backend で行う
- SQLは parameter binding を使う
- SQL文字列連結を避ける

### Storage Path

- 自由入力テキストをpathに使わない
- Phase 1では `sentence_template_id + voice_name` からpathを決める
- Backend側で安全に生成する

### XSS

- ユーザー入力をHTMLとして描画しない
- `dangerouslySetInnerHTML` を使わない
- 将来のユーザー定型文では文字数制限を入れる

### Secret管理

- Supabase service role key は Frontend に出さない
- ElevenLabs API key は Backend の環境変数で管理する
- Azure Speech key は Backend の環境変数で管理する

---

## 15. 受け入れ条件

Phase 1 MVP の完了条件:

- 固定定型文カテゴリを表示できる
- カテゴリごとの固定定型文一覧を表示できる
- 固定定型文を選択できる
- Roger の見本音声を再生できる
- 未生成の見本音声を初回再生時に生成できる
- 生成済みMP3をSupabase Storageに保存できる
- 保存済みMP3を再利用できる
- ユーザー音声を送信してAzure AI Speechで採点できる
- 採点結果を画面に表示できる
- 認識・採点が成立した結果だけをDBに保存できる
- 定型文ごとの最新scoreを表示できる
- 総合得点（Pron）の履歴グラフを表示できる
- sentence-level score breakdown の履歴グラフを表示できる
- Practice / History 間を移動できる
- READMEとdocsで設計意図を説明できる

---

## 16. Phase 2へ延期するもの

- 本格的な認証
- デバイス間同期
- ユーザー定型文
- ユーザー定型文向けの音声管理
- `audio_assets` テーブル
- Sarah対応
- voice選択UI
- 再生成UI
- スピード変更
- 音声削除
- Backend proxy / signed URL
- 日付範囲フィルタ
- sentence/category別フィルタ
- 弱点分析
- 採点結果に基づくアドバイス
- 高度な音声管理
- ユーザー録音音声保存

---

## 17. 面接での説明ポイント

### Phase 1 のスコープ判断

> Phase 1 focuses on the core pronunciation training loop: choosing a fixed sentence, listening to sample audio, recording speech, receiving assessment results, and reviewing progress.  
> I intentionally deferred authentication, user-defined phrases, and full audio management to keep the MVP focused.

### TTSキャッシュ

> I scoped audio persistence to reference audio only in Phase 1, treating it as a TTS cache rather than a full audio management feature.  
> This avoids unnecessary ElevenLabs API calls and improves playback speed, while keeping the scope focused.

### Roger固定の判断

> In Phase 1, I use one fixed sample voice to keep the user flow simple and reduce implementation complexity.  
> Multiple voices and voice selection can be added later, but they are not required to validate the core pronunciation training flow.

### 履歴グラフ

> The history screen aggregates pronunciation scores by practice day.  
> For each day, it uses the last five attempts to calculate the daily average.  
> The overall chart shows daily average, 5-practice-day moving average, and 20-practice-day moving average.  
> The score breakdown chart shows trends for overall, accuracy, fluency, completeness, and prosody.

### Public URL

> In an enterprise context, I would proxy audio through the backend or use signed URLs.  
> For Phase 1, since all reference audio is fixed and shared across users, I used public URLs to keep the scope focused.  
> I plan to reconsider protected audio delivery when authentication and user-defined phrases are introduced.

### browser-local identifier

> Phase 1 does not include full authentication.  
> Instead, I use a browser-local client ID to keep user history with minimal complexity.  
> Authentication is deferred to a later phase.
