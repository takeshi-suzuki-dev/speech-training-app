# Phase 1 MVP Spec（日本語版）

## 1. 目的

このドキュメントは、発音トレーニングアプリの Phase 1 MVP の仕様を定義する。

Phase 1 の目的は、PoCで確認した技術要素を、最小限使える発音トレーニングアプリにまとめることである。

Phase 1 のゴールは、以下を満たす状態にすること。

- 固定定型文を選べる
- 見本音声を再生できる
- ユーザーが発話音声を送信できる
- Azure AI Speech による発音採点結果を表示できる
- 採点結果をDBに保存できる
- 履歴を最低限確認できる
- 公開URL、README、英語説明により応募・面接で説明できる

---

## 2. Phase 1 の位置づけ

Phase 1 は MVP（Minimum Viable Product）である。

PoC では、Azure AI Speech や ElevenLabs との技術連携を確認する。  
Phase 1 では、それを「ユーザーが最低限使えるアプリ」に整理する。

Phase 1 は完成版ではない。  
認証、ユーザー定型文、本格的な音声管理、進捗可視化などは Phase 2 以降に延期する。

---

## 3. スコープ

### 対象範囲

- 固定定型文の複数管理
- 固定定型文の選択
- Roger / Sarah の見本音声再生
- ElevenLabs生成音声の最小TTSキャッシュ
- Azure AI Speech による発音採点
- 採点結果の表示
- 採点結果のDB保存
- browser-local identifier による簡易的なユーザー識別
- 最低限の履歴表示
- AWS上での公開
- README / docs の整備
- 英語で設計意図を説明できる状態

### 対象外

- 本格的なログイン / 認証
- デバイス間同期
- ユーザー定型文追加
- ユーザー録音音声の保存
- voice選択UI
- 再生成UI
- スピード変更
- 音声管理画面
- 本格的な進捗グラフ
- 採点結果に基づく高度なアドバイス
- ユーザー固有音声の保護配信
- Backend proxy による音声配信

---

## 4. ユーザー識別

Phase 1 では本格的な認証を入れない。

代わりに、browser-local identifier を使って履歴を紐づける。

実装上は、初回アクセス時にUUIDを生成し、ブラウザのlocalStorageに保存する。

### 方針

- `user_id` は認証済みユーザーIDではない
- 同じブラウザ内では履歴を紐づけられる
- 別ブラウザ・別端末との同期はしない
- 認証は Phase 2 で導入する

### 面接説明

> Phase 1 does not include full authentication.  
> Instead, I use a browser-local identifier to keep user history with minimal complexity.  
> This allowed me to focus on the core scoring feedback loop first, while keeping the design flexible enough to add authentication in Phase 2.

---

## 5. 固定定型文

Phase 1 では、ユーザーが自由に定型文を追加する機能は入れない。

アプリ側で用意した固定定型文を複数管理し、ユーザーはその中から選択して練習する。

### 要件

- 固定定型文をDBに保存する
- 表示順を持つ
- 有効/無効を管理できる
- ユーザーは定型文を選択できる
- 選択された定型文を発音採点の reference text として使う

### Phase 2へ延期

- ユーザー定型文追加
- ユーザー定型文編集
- ユーザー定型文削除
- ユーザー定型文向けの音声管理

---

## 6. 見本音声

Phase 1 では、固定定型文に対して Roger / Sarah の2つの見本音声を用意する。

### UIイメージ

```text
Practice phrase

[ Roger ] [ Sarah ]
```

ユーザーは押した方の音声を再生できる。

### 方針

- Roger / Sarah は固定
- voice選択UIは入れない
- スピード変更は入れない
- 再生成ボタンは入れない
- 見本音声は Supabase Storage に保存する
- Public URL を Frontend から直接再生する
- Backend proxy は使わない

### TTSキャッシュ

- 代表的なデモ用フレーズは事前生成する
- それ以外は初回再生時に生成する
- 生成後は同じMP3を再利用する
- 再生のたびに ElevenLabs API を呼ばない

### Phase 2へ延期

- voice選択
- 再生成UI
- 音声管理画面
- ユーザー定型文向け音声管理
- Backend proxy / signed URL

---

## 7. 発音採点

Phase 1 では Azure AI Speech を使って発音採点を行う。

### 入力

- reference text
- ユーザーの発話音声

### 出力

- 認識テキスト
- recognition status
- overall score
- accuracy score
- fluency score
- completeness score
- word-level details
- phoneme-level details
- raw JSON

### 表示方針

Phase 1 では、結果を見やすい単一画面に整理する。

最低限、以下を表示する。

- 認識結果
- 総合スコア
- accuracy / fluency / completeness
- 単語ごとの評価
- エラー時の状態

---

## 8. 採点結果保存

採点結果は Supabase PostgreSQL に保存する。

主な保存対象:

- user_id
- phrase_id
- reference_text
- transcript
- recognition_status
- overall_score
- accuracy_score
- fluency_score
- completeness_score
- words_json
- raw_json
- created_at

`words_json` には、Azure Speech が返す word-level / phoneme-level の詳細を含める。

---

## 9. 履歴表示

Phase 1 では最低限の履歴表示を行う。

### 要件

- browser-local identifier に紐づく採点履歴を取得できる
- 日時、定型文、スコアを確認できる
- 詳細画面または同一画面上で過去結果を確認できる

### Phase 2へ延期

- グラフ表示
- 進捗可視化
- 弱点分析
- アドバイス生成

---

## 10. API要件

Phase 1 では、最低限以下のAPIを想定する。

### Practice phrases

```text
GET /api/practice-phrases
```

固定定型文一覧を取得する。

### Pronunciation assessment

```text
POST /api/assessments
```

発話音声を送信し、Azure AI Speech で採点する。

### Assessment history

```text
GET /api/assessments?userId={userId}
```

browser-local identifier に紐づく採点履歴を取得する。

### Reference audio generation

```text
POST /api/reference-audio/generate
```

見本音声が存在しない場合に、Roger / Sarah の音声を生成する。

Frontend から送る値は以下のみ。

```json
{
  "phraseId": "001",
  "voiceName": "roger"
}
```

Backend が以下を決定する。

- reference text
- ElevenLabs voice_id
- model_id
- storage path

---

## 11. DB / Storage

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
- 見本音声 path: `preset/{phrase_id}/{voice_name}.mp3`
- `audio_assets` テーブルは Phase 1 では作らない

---

## 12. エラー処理

### Azure AI Speech

- `RecognitionStatus` に応じて表示を切り替える
- NoMatch / timeout / error などをユーザーに分かる形で表示する
- raw JSON はデバッグ用に保持する

### ElevenLabs

- 生成失敗時はエラーを表示する
- 壊れた音声ファイルを保存しない
- 次回再生時に再試行できるようにする

### Supabase Storage

- アップロード失敗時はエラーを返す
- Public URL再生に失敗した場合は、Backendの生成APIを呼ぶ

---

## 13. セキュリティ方針

### SQL Injection

- Frontend からDBを直接触らせない
- DB操作は Backend で行う
- SQLは parameter binding を使う
- SQL文字列連結を避ける

### Storage Path

- 自由入力テキストをpathに使わない
- Phase 1では `phrase_id + voice_name` からpathを決める
- Backend側で安全に生成する

### XSS

- ユーザー入力をHTMLとして描画しない
- `dangerouslySetInnerHTML` を使わない
- 将来のユーザー定型文では文字数制限を入れる

### Secret管理

- Supabase service role key は Frontend に出さない
- ElevenLabs API key は Backend の環境変数で管理する

---

## 14. 受け入れ条件

Phase 1 MVP の完了条件:

- 固定定型文一覧を表示できる
- 固定定型文を選択できる
- Roger / Sarah の見本音声ボタンを表示できる
- 事前生成済みの見本音声を再生できる
- 未生成の見本音声を初回再生時に生成できる
- 生成済みMP3をSupabase Storageに保存できる
- 保存済みMP3を再利用できる
- ユーザー音声を送信してAzure AI Speechで採点できる
- 採点結果を画面に表示できる
- 採点結果をDBに保存できる
- 最低限の履歴を確認できる
- AWS上で公開できる
- READMEとdocsで設計意図を説明できる

---

## 15. Phase 2へ延期するもの

- 本格的な認証
- デバイス間同期
- ユーザー定型文
- ユーザー定型文向けの音声管理
- `audio_assets` テーブル
- voice選択UI
- 再生成UI
- スピード変更
- 音声削除
- Backend proxy / signed URL
- 進捗グラフ
- 採点結果に基づくアドバイス
- 高度な音声管理
- ユーザー録音音声保存

---

## 16. 面接での説明ポイント

### Phase 1 のスコープ判断

> Phase 1 focuses on the core scoring feedback loop.  
> I intentionally deferred authentication, user-defined phrases, and full audio management to keep the MVP focused.

### TTSキャッシュ

> I scoped audio persistence to reference audio only in Phase 1, treating it as a TTS cache rather than a full audio management feature.  
> This avoids unnecessary ElevenLabs API calls and improves playback speed, while keeping the scope focused.

### Public URL

> In an enterprise context, I would proxy audio through the backend or use signed URLs.  
> For Phase 1, since all reference audio is fixed and shared across users, I used public URLs to keep the scope focused.  
> I plan to reconsider protected audio delivery in Phase 2 when authentication and user-defined phrases are introduced.

### browser-local identifier

> Phase 1 does not include full authentication.  
> Instead, I use a browser-local identifier to keep user history with minimal complexity.  
> Authentication is deferred to Phase 2.
