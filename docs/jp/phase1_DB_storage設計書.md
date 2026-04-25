# Phase 1 DB/Storage 設計書

## 1. 目的

このドキュメントは、発音トレーニングアプリの Phase 1 における DB / Storage 設計を定義する。

Phase 1 では、以下を備えた最小限使える MVP を作る。

- 発音採点結果の永続化
- 固定定型文の複数管理
- browser-local identifier による簡易的なユーザー識別
- 最小限の見本音声永続化
- 固定定型文向けの TTS キャッシュ

目的は、構成を軽量に保ちつつ、デモ・自己トレーニング・面接説明に使える状態にすることである。

---

## 2. スコープ

### 対象範囲

- Phase 1 のDBとして Supabase PostgreSQL を利用する
- 生成済み見本音声の保存先として Supabase Storage を利用する
- 発音採点結果を保存する
- 固定定型文を保存する
- `user_id` として browser-local identifier を利用する
- Roger / Sarah の2つの固定見本音声を提供する
- 固定定型文に対して ElevenLabs で生成した MP3 を保存する
- 再生のたびに ElevenLabs を呼ばず、保存済み MP3 を再利用する
- 代表的なデモ用フレーズは事前生成する
- 事前生成されていない見本音声は初回再生時に生成する
- 見本音声ファイルは決定的な storage path で管理する
- 固定見本音声は Supabase Storage の Public URL から直接再生する

### 対象外

- 本格的な認証
- デバイス間同期
- ユーザー定型文
- ユーザー録音音声の保存
- 本格的な音声管理UI
- voice選択UI
- 再生成UI
- スピード変更
- 音声削除UI
- 複雑なアクセス制御
- Backendによる音声proxy配信
- `audio_assets` のような音声メタデータテーブル

これらは Phase 2 以降に延期する。

---

## 3. アーキテクチャ概要

Phase 1 では、DBとオブジェクトストレージに Supabase を利用する。

```text
Local Frontend / Local Backend
        |
        v
Supabase PostgreSQL
Supabase Storage

Production Frontend / Backend on AWS
        |
        v
Supabase PostgreSQL
Supabase Storage
```

この構成により、リリース後もローカル環境から同じDB/Storageに接続して検証でき、AWSの常時稼働コストを抑えやすくなる。

---

## 4. Database Design

### 4.1 `practice_phrases`

Phase 1で利用する固定定型文を保存する。

| Column | Type | Notes |
|---|---|---|
| `id` | uuid / bigint | Primary key |
| `text` | text | 練習用の定型文 |
| `display_order` | integer | 表示順 |
| `is_active` | boolean | 利用可能かどうか |
| `created_at` | timestamp | 作成日時 |
| `updated_at` | timestamp | 更新日時 |

#### 補足

- Phase 1 では固定定型文のみ対応する。
- ユーザー定型文は Phase 2 に延期する。

---

### 4.2 `training_attempts`

発音採点結果を保存する。

| Column | Type | Notes |
|---|---|---|
| `id` | uuid / bigint | Primary key |
| `user_id` | text | browser-local identifier |
| `phrase_id` | uuid / bigint | `practice_phrases` への参照 |
| `reference_text` | text | 採点対象の文 |
| `transcript` | text | 認識された文字列 |
| `recognition_status` | text | Azure の認識ステータス |
| `overall_score` | numeric | 総合発音スコア |
| `accuracy_score` | numeric | Accuracy score |
| `fluency_score` | numeric | Fluency score |
| `completeness_score` | numeric | Completeness score |
| `words_json` | jsonb | 単語・音節・音素レベルの詳細 |
| `raw_json` | jsonb | デバッグ用の Azure raw response |
| `created_at` | timestamp | 作成日時 |

#### 補足

- `user_id` は Phase 1 では認証済みユーザーIDではない。
- 初回アクセス時に生成される browser-local identifier を利用する。
- `words_json` には、Azure Speech が返す word-level / syllable-level / phoneme-level / NBest phoneme 情報を含める可能性がある。
- 本格的な認証は Phase 2 に延期する。

---

### 4.3 Phase 1では `audio_assets` テーブルを作らない

Phase 1 では `audio_assets` テーブルを作らない。

見本音声ファイルは、以下の決定的な storage path で管理する。

```text
preset/{phrase_id}/{voice_name}.mp3
```

固定定型文と2つの固定音声だけであれば、`phrase_id + voice_name` で見本音声ファイルを一意に特定できる。

Frontend は Public URL を直接再生しに行く。  
ファイルが存在しない場合、Frontend が Backend の音声生成APIを呼び出す。  
Backend は MP3 を生成し、決定的な path にアップロードする。

#### なぜ Phase 1 で audio metadata table を作らないか

`audio_assets` テーブルは本格的な音声管理には有用だが、Phase 1 では不要。

理由は以下。

- 固定定型文のみ対応
- 固定音声は Roger / Sarah の2つのみ
- storage path は `phrase_id + voice_name` から決定できる
- ユーザー定型文音声がない
- voice選択UIがない
- 再生成UIがない
- 音声の削除・置換フローがない

`audio_assets` を作らないことで、Phase 1 のDB設計をシンプルに保ち、DBメタデータとStorage実体の不整合リスクを減らす。

---

## 5. Storage Design

### 5.1 Bucket

Supabase Storage bucket:

```text
reference-audio
```

Bucket access:

```text
Public
```

この bucket には、固定定型文向けに生成した MP3 見本音声を保存する。

Phase 1 では、保存される音声は全ユーザー共通の固定見本音声である。  
ユーザー録音音声・個人情報・有料ユーザー固有コンテンツは含まれない。

そのため、Phase 1 では Public bucket を利用する。  
Backend proxy は、認証やユーザー固有音声管理が入る Phase 2 に延期する。

---

### 5.2 Storage Path

見本音声ファイルは以下の形式で保存する。

```text
preset/{phrase_id}/{voice_name}.mp3
```

例:

```text
preset/001/roger.mp3
preset/001/sarah.mp3
```

#### 補足

- Supabase Storage上で人間が見て分かりやすい path にする。
- Phase 1 では hash ベースの cache key は使わない。
- Phase 1 では `audio_assets` テーブルも使わない。
- Phase 2 でユーザー定型文を追加する場合、storage path 設計を拡張する。

---

## 6. Reference Voices

Phase 1 では2つの固定見本音声を使う。

| `voice_name` | Description |
|---|---|
| `roger` | 男声の見本音声 |
| `sarah` | 女声の見本音声 |

実際の ElevenLabs `voice_id` は Backend 設定で管理する。

例:

```text
roger -> ELEVENLABS_VOICE_ID_ROGER
sarah -> ELEVENLABS_VOICE_ID_SARAH
```

UIでは以下のように表示する想定。

```text
[ Roger ] [ Sarah ]
```

---

## 7. TTS Cache Flow

### 7.1 Playback Flow

ユーザーが Roger または Sarah をクリックした場合:

1. Frontend が `phrase_id` と `voice_name` から Supabase Storage の Public URL を組み立てる。
2. Frontend が Public URL から MP3 を直接再生しようとする。
3. 再生に成功した場合、Backend 呼び出しは不要。
4. ファイルが存在せず再生に失敗した場合、Frontend が Backend の音声生成APIを呼ぶ。

Phase 1 では Backend proxy は使わない。

---

### 7.2 Generation Flow

MP3ファイルが存在せず再生に失敗した場合:

1. Frontend が `phrase_id` と `voice_name` を指定して Backend の音声生成APIを呼ぶ。
2. Backend が `voice_name` が `roger` または `sarah` であることを検証する。
3. Backend が `practice_phrases` から定型文テキストを取得する。
4. Backend が `voice_name` から ElevenLabs の `voice_id` を解決する。
5. Backend が ElevenLabs TTS API を呼ぶ。
6. Backend が生成された MP3 を決定的な path で Supabase Storage にアップロードする。
7. Backend が Supabase Storage の Public URL を返す。
8. Frontend が生成された MP3 を Public URL から直接再生する。

Backend proxy は、認証導入後の Phase 2 に延期する。

---

## 8. Pre-generation Strategy

Phase 1 では hybrid generation strategy を採用する。

### 事前生成

代表的なデモ用フレーズは Roger / Sarah の両方で事前生成する。

目的:

- デモ体験を安定させる
- デモ時の初回TTS待ちを避ける
- 面接・プレゼン時の失敗リスクを下げる

### 初回再生時生成

事前生成していない固定定型文は、初回再生時に生成する。

目的:

- 使われない音声を生成しない
- ElevenLabs APIコストを抑える
- Phase 1 の実装を軽量に保つ

---

## 9. Error Handling

### Frontend Playback Failure

Frontend が Public MP3 URL を再生できない場合:

- Backend の音声生成APIを呼ぶ
- Backend から返されたURLで再生を再試行する

### ElevenLabs Generation Failure

ElevenLabs の生成に失敗した場合:

- Frontend にエラーレスポンスを返す
- ユーザー向けのエラーメッセージを表示する
- 壊れた音声ファイルは作成しない

### Supabase Storage Upload Failure

アップロードに失敗した場合:

- Storage エラーを返す
- 次回再生時に再試行できるようにする

### Missing Storage File

想定される MP3 ファイルが Storage に存在しない場合:

- Frontend の再生が失敗する
- Frontend が Backend の音声生成APIを呼ぶ
- Backend が音声を再生成する
- Backend が MP3 を同じ決定的 path に再アップロードする
- Backend が Public URL を返す

---

## 10. Environment Variables

Backendで必要な設定:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_STORAGE_BUCKET_REFERENCE_AUDIO

ELEVENLABS_API_KEY
ELEVENLABS_MODEL_ID
ELEVENLABS_VOICE_ID_ROGER
ELEVENLABS_VOICE_ID_SARAH
```

### Security Note

Supabase service role key は絶対に Frontend に出さない。

アップロード処理はすべて Backend 経由で行う。

Frontend は Backend の音声生成APIに対して、`reference_text`、`voice_id`、`model_id`、`storage_path` を直接送らない。

Frontend から送るのは以下のみ。

```json
{
  "phraseId": "001",
  "voiceName": "roger"
}
```

Backend が以下を導出する。

- phrase text
- ElevenLabs voice ID
- model ID
- storage path

---

## 11. Security Considerations

### SQL Injection

- Frontend から Supabase PostgreSQL に直接アクセスしない。
- すべてのDB操作は Spring Boot Backend で行う。
- SQLは JPA、Spring Data、`PreparedStatement`、`NamedParameterJdbcTemplate` などの parameter binding を使う。
- SQL文字列をユーザー入力で連結しない。
- `voice_name` は `roger` / `sarah` の固定値に制限する。

### Storage Path Safety

- Storage path は Backend 側で生成する、または信頼できるIDから決定的に導出する。
- 自由入力テキストを storage path に直接使わない。
- Phase 1 では `phrase_id` と `voice_name` を使って path を作る。

### Frontend Display Safety

- ユーザー入力テキストは通常のテキストとして描画する。
- 将来のユーザー定型文表示で `dangerouslySetInnerHTML` を使わない。

---

## 12. Phase 1 Design Decisions

### なぜ Supabase を使うか

Supabase PostgreSQL と Supabase Storage を使うことで、インフラを軽量に保ち、ローカル検証をしやすくする。

ローカルFrontend / Backend からも、デプロイ済みアプリと同じDB/Storageを使える。

### なぜ最小TTSキャッシュを入れるか

再生ボタンを押すたびに ElevenLabs API を呼ぶべきではない。

生成済み見本音声を保存することで、不要なAPI呼び出しを減らし、再生速度も改善できる。

### なぜ固定定型文のみか

Phase 1 は、発音採点のフィードバックループと固定定型文の練習フローに集中する。

ユーザー定型文は CRUD、バリデーション、所有権、音声管理が追加で必要になるため、Phase 2 に延期する。

### なぜ Phase 1 で `audio_assets` テーブルを作らないか

Phase 1 では見本音声の path が決定的に決まる。

固定定型文と2つの固定音声だけなら、`phrase_id + voice_name` でファイルを特定できる。

`audio_assets` テーブルは、ユーザー定型文や本格的な音声管理が入る Phase 2 で導入する。

### なぜ Phase 1 で Public URL を使うか

エンタープライズ文脈では、Storage URLを直接露出させないために Backend proxy や制御されたアクセスレイヤーを使うのが一般的。

ただし Phase 1 の音声ファイルは、全ユーザー共通の固定見本音声であり、ユーザー録音音声・個人情報・有料ユーザー固有コンテンツではない。

そのため Phase 1 では、実装を軽量に保つため Supabase Storage の Public URL を利用する。  
Backend proxy は、認証やユーザー固有音声管理が入る Phase 2 に延期する。

### なぜ本格的なvoice管理を入れないか

Phase 1 では Roger / Sarah の2つの固定音声だけを提供する。

voice選択UI、再生成UI、スピード変更、本格的な音声管理は Phase 2 に延期する。

---

## 13. Acceptance Criteria

Phase 1 DB / Storage 設計の完了条件:

- 固定定型文を Supabase PostgreSQL に保存できる
- 発音採点結果を保存できる
- 固定定型文に Roger / Sarah ボタンを表示できる
- 事前生成済みのデモ用フレーズ音声を再生できる
- Frontend が Supabase Storage Public URL を組み立てて再生できる
- 未生成の音声は、初回再生失敗時に Backend 経由で生成できる
- 生成済み MP3 を Supabase Storage に保存できる
- 保存済み MP3 を次回以降再利用できる
- Storageファイルがない場合に Backend の生成APIで再生成できる
- ユーザー録音音声を保存しない
- Phase 1 では `audio_assets` テーブルを不要とする

---

## 14. Deferred to Phase 2

以下は Phase 2 に延期する。

- 本格的な認証
- ユーザー定型文
- ユーザー固有音声管理
- `audio_assets` テーブル
- voice選択UI
- 再生成UI
- スピード変更
- 音声削除
- protected audio playback のための Backend proxy
- 必要に応じた private bucket / signed URL
- デバイス間同期

---

## 15. Phase 2 Notes

Phase 1 では、固定見本音声を決定的な path で特定できるため、意図的に `audio_assets` テーブルを作らない。

Phase 2 でユーザー定型文や高度な音声管理を入れる場合、`audio_assets` テーブルを導入する。

Phase 2で想定される用途:

- ユーザー定型文の音声
- ユーザーごとの音声所有権
- voice選択
- 再生成UI
- 音声ステータス管理
- 削除・置換処理
- private bucket / signed URL strategy
- protected audio playback のための Backend proxy

また、Phase 1 では固定見本音声に Public URL を使う。

Phase 2 で認証とユーザー定型文を導入する場合、音声アクセスモデルを再検討する。

Phase 2 の方向性:

- `audio_assets` テーブルを導入する
- 音声ファイルをユーザー定型文やユーザーに紐づける
- ユーザー固有音声を保護する必要がある場合、Public URL から Backend proxy または signed URL に移行する
- ユーザー録音音声は、明示的に追加するまでスコープ外のままとする
