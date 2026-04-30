# Phase 1 DB/Storage 設計書

## 1. 目的

このドキュメントは、発音トレーニングアプリの Phase 1 における DB / Storage 設計を定義する。

Phase 1 では、以下を備えた最小限使える MVP を作る。

- 発音採点結果の永続化
- カテゴリ管理された固定定型文の複数管理
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
- カテゴリ・定型文を保存する
- `client_id` として browser-local identifier（UUID）を利用する
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
- owner_type / owner_user_id によるカテゴリ所有権管理（Phase 2に延期）

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

Phase 1 では以下の3テーブルを使用する。

```text
sentence_categories
        |
        v
sentence_templates
        |
        v
training_attempts
```

外部キーは以下の方針で張る。

- `sentence_templates.category_id` → `sentence_categories.id`（ON DELETE RESTRICT）
- `training_attempts.sentence_id` → `sentence_templates.id`（ON DELETE SET NULL）

値の整合性チェックは原則アプリ側のEnumで管理し、DBのCHECK制約は mode のみ残す。

---

### 4.1 `sentence_categories`

定型文カテゴリを管理する。

```sql
create table public.sentence_categories (
  id uuid not null default gen_random_uuid(),
  category_key text null,
  display_name text not null,
  description text null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),

  constraint sentence_categories_pkey primary key (id),
  constraint sentence_categories_category_key_key unique (category_key)
);
```

| カラム         | 説明                                                                        |
| -------------- | --------------------------------------------------------------------------- |
| `id`           | 主キー                                                                      |
| `category_key` | systemカテゴリ用の安定キー（daily / interview / tech など）。一意またはnull |
| `display_name` | 画面表示名                                                                  |
| `description`  | カテゴリの説明                                                              |
| `sort_order`   | 表示順                                                                      |
| `is_active`    | 論理的な表示/非表示                                                         |
| `created_at`   | 作成日時                                                                    |

#### 補足

- Phase 1 ではsystem提供カテゴリのみ。owner_type / owner_user_id は Phase 2で検討する。
- category_key は seed データやテスト用の安定参照キーとして利用する。

---

### 4.2 `sentence_templates`

定型文マスタ。見本音声の管理もこのテーブルで行う。

```sql
create table public.sentence_templates (
  id uuid not null default gen_random_uuid(),
  category_id uuid not null,
  title text not null,
  display_text text not null,
  scoring_text text not null,
  sample_audio_text text not null,
  sample_audio_path text null,
  voice_id text null,
  model_id text null,
  difficulty text not null default 'easy',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),

  constraint sentence_templates_pkey primary key (id),

  constraint sentence_templates_category_id_fkey
    foreign key (category_id)
    references public.sentence_categories(id)
    on delete restrict
);
```

| カラム              | 説明                                                               |
| ------------------- | ------------------------------------------------------------------ |
| `id`                | 主キー                                                             |
| `category_id`       | sentence_categories.id への外部キー                                |
| `title`             | 一覧用タイトル                                                     |
| `display_text`      | 画面に表示する文                                                   |
| `scoring_text`      | Azure採点に使う文（Phase 1では wanna系など）                       |
| `sample_audio_text` | ElevenLabs音声生成に使う文                                         |
| `sample_audio_path` | Supabase Storage上のMP3パス                                        |
| `voice_id`          | ElevenLabs voice ID（Backendで解決するため通常不要）               |
| `model_id`          | ElevenLabs model ID                                                |
| `difficulty`        | easy / medium / hard 想定。DBではCHECKしない（アプリのEnumで管理） |
| `sort_order`        | 表示順                                                             |
| `is_active`         | 論理的な表示/非表示                                                |
| `created_at`        | 作成日時                                                           |

#### 補足

- difficulty の値制限はアプリ側のEnumで管理する。DBのCHECK制約は使わない。
- sample_audio_path は Supabase Storage の決定的なパスを格納する。

---

### 4.3 `training_attempts`

発音採点結果を保存する。

```sql
create table public.training_attempts (
  id uuid not null default gen_random_uuid(),
  client_id uuid not null,
  user_id uuid null,
  mode text not null,
  sentence_id uuid null,
  reference_text text not null,
  recognized_text text null,
  overall_score numeric null,
  accuracy_score numeric null,
  fluency_score numeric null,
  completeness_score numeric null,
  prosody_score numeric null,
  words_json jsonb null,
  audio_duration_ms integer null,
  scored_at timestamp with time zone not null default now(),
  created_at timestamp with time zone null default now(),

  constraint training_attempts_pkey primary key (id),

  constraint training_attempts_sentence_id_fkey
    foreign key (sentence_id)
    references public.sentence_templates(id)
    on delete set null,

  constraint training_attempts_mode_check check (
    mode = any (array['sentence'::text, 'free'::text])
  )
);
```

| カラム               | 説明                                                        |
| -------------------- | ----------------------------------------------------------- |
| `id`                 | 主キー                                                      |
| `client_id`          | browser-local identifier（UUID）。Phase 1の履歴紐づけに使う |
| `user_id`            | Phase 2以降の認証用。Phase 1ではnull                        |
| `mode`               | sentence / free。DBレベルでCHECKする                        |
| `sentence_id`        | sentence_templates.id への外部キー。free modeではnull       |
| `reference_text`     | 採点時に使った文のスナップショット                          |
| `recognized_text`    | Azure認識結果                                               |
| `overall_score`      | 総合発音スコア                                              |
| `accuracy_score`     | Accuracy score                                              |
| `fluency_score`      | Fluency score                                               |
| `completeness_score` | Completeness score                                          |
| `prosody_score`      | Prosody score                                               |
| `words_json`         | word-level結果。詳細表示用に保存                            |
| `audio_duration_ms`  | 音声長（ミリ秒）                                            |
| `scored_at`          | 採点日時。履歴グラフ・日次集計の基準                        |
| `created_at`         | DBレコード作成日時                                          |

#### 補足

- `client_id` は認証済みユーザーIDではない。初回アクセス時にUUIDを生成しlocalStorageに保存する。
- `mode` のCHECK制約は残す。sentence / free の2値であり仕様が固まっているため。
- `sentence_id` はON DELETE SET NULLを使う。定型文削除後も採点履歴は残す。
- `user_id` は Phase 2で認証を導入した際に利用する前向きカラム。Phase 1ではnull。

---

### 4.4 Phase 1 では `audio_assets` テーブルを作らない

Phase 1 では `audio_assets` テーブルを作らない。

見本音声のパスは `sentence_templates.sample_audio_path` で管理する。固定定型文と2つの固定音声だけであれば、テンプレートIDと voice_name で見本音声ファイルを一意に特定できる。

#### なぜPhase 1で audio metadata table を作らないか

- 固定定型文のみ対応
- 固定音声は Roger / Sarah の2つのみ
- storage pathは `sentence_template_id + voice_name` から決定できる
- ユーザー定型文音声がない
- voice選択UIがない
- 再生成UIがない

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

Phase 1 の音声ファイルは全ユーザー共通の固定見本音声であり、ユーザー録音音声・個人情報・有料ユーザー固有コンテンツは含まれない。そのため Phase 1 では Public bucket を利用する。

Backend proxy は、認証やユーザー固有音声管理が入る Phase 2 に延期する。

---

### 5.2 Storage Path

見本音声ファイルは以下の形式で保存する。

```text
preset/{sentence_template_id}/{voice_name}.mp3
```

例:

```text
preset/a1b2c3d4-e5f6-7890-abcd-ef1234567890/roger.mp3
preset/a1b2c3d4-e5f6-7890-abcd-ef1234567890/sarah.mp3
```

`sentence_templates.sample_audio_path` にこのパスを格納し、Frontendは Backend経由または直接 Public URL を構築して再生する。

---

## 6. Reference Voices

Phase 1 では2つの固定見本音声を使う。

| `voice_name` | Description    |
| ------------ | -------------- |
| `roger`      | 男声の見本音声 |
| `sarah`      | 女声の見本音声 |

実際の ElevenLabs `voice_id` は Backend 設定で管理する。

```text
roger -> ELEVENLABS_VOICE_ID_ROGER
sarah -> ELEVENLABS_VOICE_ID_SARAH
```

---

## 7. TTS Cache Flow

### 7.1 Playback Flow

ユーザーが Roger または Sarah をクリックした場合:

1. Frontend が `sentence_template_id` と `voice_name` から Supabase Storage の Public URL を組み立てる。
2. Frontend が Public URL から MP3 を直接再生しようとする。
3. 再生に成功した場合、Backend 呼び出しは不要。
4. ファイルが存在せず再生に失敗した場合、Frontend が Backend の音声生成APIを呼ぶ。

Phase 1 では Backend proxy は使わない。

---

### 7.2 Generation Flow

MP3ファイルが存在せず再生に失敗した場合:

1. Frontend が `sentenceTemplateId` と `voiceName` を指定して Backend の音声生成APIを呼ぶ。
2. Backend が `voice_name` が `roger` または `sarah` であることを検証する。
3. Backend が `sentence_templates` から定型文テキストを取得する。
4. Backend が `voice_name` から ElevenLabs の `voice_id` を解決する。
5. Backend が ElevenLabs TTS API を呼ぶ。
6. Backend が生成された MP3 を決定的な path で Supabase Storage にアップロードする。
7. Backend が `sentence_templates.sample_audio_path` を更新する。
8. Backend が Supabase Storage の Public URL を返す。
9. Frontend が生成された MP3 を Public URL から直接再生する。

---

## 8. Pre-generation Strategy

Phase 1 では hybrid generation strategy を採用する。

### 事前生成

代表的なデモ用フレーズは Roger / Sarah の両方で事前生成する。

### 初回再生時生成

事前生成していない固定定型文は、初回再生時に生成する。ElevenLabs APIコストを抑え、Phase 1 の実装を軽量に保つ。

---

## 9. Error Handling

### Frontend Playback Failure

Frontend が Public MP3 URL を再生できない場合:

- Backend の音声生成APIを呼ぶ
- Backend から返されたURLで再生を再試行する

### ElevenLabs Generation Failure

- Frontend にエラーレスポンスを返す
- ユーザー向けのエラーメッセージを表示する
- 壊れた音声ファイルは作成しない

### Missing Storage File

想定される MP3 ファイルが Storage に存在しない場合:

- Frontend の再生が失敗する
- Frontend が Backend の音声生成APIを呼ぶ
- Backend が音声を再生成し、同じ決定的 path に再アップロードする
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

Supabase service role key は絶対に Frontend に出さない。アップロード処理はすべて Backend 経由で行う。

Frontend から送るのは以下のみ。

```json
{
  "sentenceTemplateId": "a1b2c3d4-...",
  "voiceName": "roger"
}
```

Backend が phrase text、ElevenLabs voice ID、model ID、storage path を導出する。

---

## 11. Security Considerations

### SQL Injection

- Frontend から Supabase PostgreSQL に直接アクセスしない。
- すべてのDB操作は Spring Boot Backend で行う。
- SQLは JPA、Spring Data、`PreparedStatement` などの parameter binding を使う。
- `voice_name` は `roger` / `sarah` の固定値に制限する。

### Storage Path Safety

- Storage path は Backend 側で生成する、または信頼できるIDから決定的に導出する。
- 自由入力テキストを storage path に直接使わない。

---

## 12. Phase 1 Design Decisions

### なぜ3テーブル構成にしたか

`sentence_categories` → `sentence_templates` → `training_attempts` の階層構造により、定型文をカテゴリ単位で管理しやすくなる。また、FKを張ることでDB上でも関係を明示し、ER図が見やすくなる。

### なぜ外部キーを張るか

sentence_categories / sentence_templates / training_attempts の親子関係は明確であり、ポートフォリオとして面接官に見せる設計としてFKで関係を表現しておく価値がある。

### なぜdifficultyのCHECKを外したか

difficulty（easy / medium / hard）の値制限はアプリ側のEnumで管理する。DBのCHECK制約はアプリレイヤーと二重管理になるため使わない。

### なぜmodeのCHECKを残したか

mode（sentence / free）は2値であり仕様が固まっている。また、Phase 3の自由発話を見越した前向きカラムであり、DBレベルで値を保証しておく意味がある。

### なぜowner_type / owner_user_idをPhase 1に入れないか

Phase 1はsystem提供カテゴリのみであり、所有権の概念が不要。カラム自体をPhase 2以降で追加する方針にすることで、Phase 1のテーブル設計をシンプルに保つ。

### なぜ Supabase を使うか

インフラを軽量に保ち、ローカル検証をしやすくするため。ローカルFrontend / Backend からも、デプロイ済みアプリと同じDB/Storageを使える。

### なぜ最小TTSキャッシュを入れるか

再生ボタンを押すたびに ElevenLabs API を呼ぶべきではない。生成済み見本音声を保存することで、不要なAPI呼び出しを減らし、再生速度も改善できる。

### なぜ Phase 1 で `audio_assets` テーブルを作らないか

Phase 1 では見本音声の path が決定的に決まる。`sentence_template_id + voice_name` でファイルを特定できるため、`audio_assets` テーブルは不要。Phase 2 で導入する。

---

## 13. Acceptance Criteria

Phase 1 DB / Storage 設計の完了条件:

- sentence_categories にカテゴリを保存できる
- sentence_templates に定型文を保存できる
- 発音採点結果を training_attempts に保存できる
- Roger / Sarah ボタンを表示できる
- 事前生成済みのデモ用フレーズ音声を再生できる
- Frontend が Supabase Storage Public URL を組み立てて再生できる
- 未生成の音声は、初回再生失敗時に Backend 経由で生成できる
- 生成済み MP3 を Supabase Storage に保存できる
- 保存済み MP3 を次回以降再利用できる
- ユーザー録音音声を保存しない

---

## 14. Deferred to Phase 2

以下は Phase 2 に延期する。

- 本格的な認証（user_id カラムは前向きに残す）
- ユーザー定型文
- owner_type / owner_user_id によるカテゴリ所有権管理
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

Phase 2 では以下を検討する。

- `sentence_categories` に `owner_type` / `owner_user_id` を追加し、system/user 区別を管理する
- ユーザー定型文追加に伴う `sentence_templates` の所有権管理
- `audio_assets` テーブルの導入（ユーザー定型文音声・音声ステータス管理）
- Private bucket / signed URL への移行（ユーザー固有音声保護が必要になった場合）
- Backend proxy による音声配信
- CHECK制約の追加要否を、そのフェーズの設計時に改めて判断する
