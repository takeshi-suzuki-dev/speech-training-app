# Phase 2 DB / Storage 設計書

## 1. 目的

このドキュメントは、複数の見本音声 option と、複数の見本音声再生ボタンに対応するための Phase 2 DB / Storage 設計を定義する。

Phase 1 では default の見本音声 option を1つだけ使用する。Phase 2 では、同じ定型文に対して複数の見本音声を再生できるように拡張する。

## 2. スコープ

### 対象範囲

- 1つの定型文に複数の見本音声 option を持たせる。
- 2つの見本音声再生ボタンに対応する。
- ユーザーが好きなタイミングでどちらの見本音声も再生できる。
- voice option を指定して見本音声を取得する。
- voice option ごとに生成済み音声をcacheする。
- 定型文、voice option、生成済みaudio cacheの責務を分離する。

### 対象外

- ユーザーアップロード音声。
- 高度な音声asset管理。
- スピード変更。
- 必要になるまでの手動再生成UI。
- エンドユーザー向けの本格的なvoice option管理UI。
- ユーザー固有のcustom voice。

## 3. Data Model Overview

Phase 2 では、見本音声の選択肢を `sentence_template_voice_options` で管理する。

```text
sentence_categories
  |
  v
sentence_templates
  |
  v
sentence_template_voice_options
  |
  v
sentence_template_audios

sentence_templates
  |
  v
training_attempts
```

## 4. Table Responsibilities

### 4.1 `sentence_templates`

`sentence_templates` は定型文の本体を管理する。

`voice_id_1` や `voice_id_2` のような固定voice列は持たせない。

見本音声の選択肢は `sentence_template_voice_options` で管理する。

生成済みaudio cacheは `sentence_template_audios` で管理する。

### 4.2 `sentence_template_voice_options`

`sentence_template_voice_options` は、各定型文で利用可能な見本音声 option を管理する。

1つの定型文は、`voice_a` や `voice_b` のように複数の見本音声 option を持てる。

このテーブルは論理削除する。

DDL案:

```sql
create table public.sentence_template_voice_options (
  id uuid not null default gen_random_uuid(),

  sentence_template_id uuid not null,

  slot_key text not null,

  voice_id text not null,

  voice_name text not null,

  voice_provider text not null default 'elevenlabs',

  model_id text null,

  sort_order integer not null default 0,

  is_default boolean not null default false,

  is_active boolean not null default true,

  created_at timestamp with time zone not null default now(),

  updated_at timestamp with time zone not null default now(),

  deleted_at timestamp with time zone null,

  constraint sentence_template_voice_options_pkey primary key (id),

  constraint sentence_template_voice_options_template_fkey
    foreign key (sentence_template_id)
    references public.sentence_templates(id)
    on delete restrict
);
```

推奨index:

```sql
create index idx_sentence_template_voice_options_template_id
on public.sentence_template_voice_options(sentence_template_id);

create unique index sentence_template_voice_options_active_slot_unique
on public.sentence_template_voice_options(sentence_template_id, slot_key)
where deleted_at is null;
```

Column notes:

| Column | Description |
| --- | --- |
| `id` | Primary key |
| `sentence_template_id` | `sentence_templates.id` への外部キー |
| `slot_key` | `voice_a` / `voice_b` のような安定したslot key |
| `voice_id` | 外部TTSのvoice ID |
| `voice_name` | 人が読めるvoice名 |
| `voice_provider` | ElevenLabsなどのTTS provider |
| `model_id` | TTS model ID |
| `sort_order` | 表示順 |
| `is_default` | default voice option |
| `is_active` | active flag |
| `deleted_at` | 論理削除日時 |

### 4.3 `sentence_template_audios`

`sentence_template_audios` は、各定型文・各voice optionに対する生成済み見本音声cacheを管理する。

このテーブルは生成済みaudio cacheであり、関連するsentenceまたはcategoryが削除される時には物理削除してよい。

変更案:

```sql
alter table public.sentence_template_audios
add column voice_option_id uuid null;
```

外部キー案:

```sql
alter table public.sentence_template_audios
add constraint sentence_template_audios_voice_option_fkey
foreign key (voice_option_id)
references public.sentence_template_voice_options(id)
on delete restrict;
```

推奨index:

```sql
create index idx_sentence_template_audios_voice_option_id
on public.sentence_template_audios(voice_option_id);
```

Notes:

- `voice_option_id` は、どのvoice optionから生成されたaudio cacheかを示す。
- `voice_id` と `model_id` は、生成時点のsnapshotとして `sentence_template_audios` に残してよい。
- `audio_path` は、生成済みMP3のSupabase Storage pathを保持する。
- 生成済みaudio cacheは削除・再生成できる。

## 5. Storage Path

見本音声ファイルは、安定したslot keyベースのpathを使う。

```text
preset/{sentence_template_id}/{slot_key}.mp3
```

Examples:

```text
preset/a1b2c3d4-e5f6-7890-abcd-ef1234567890/voice_a.mp3
preset/a1b2c3d4-e5f6-7890-abcd-ef1234567890/voice_b.mp3
```

このpathは `sentence_template_audios.audio_path` に保存する。

`voice_name` ではなく `slot_key` を使うことで、slotに割り当てるvoiceを後で変えても、UI構造を安定させられる。

## 6. UI Behavior

定型文画面には、2つの見本音声再生ボタンを表示する。

Example:

```text
[ Play Sample 1 ]
[ Play Sample 2 ]
```

各ボタンは異なるvoice optionに紐づく。

例:

| Button | Slot key | Meaning |
| --- | --- | --- |
| Play Sample 1 | `voice_a` | 1つ目の見本音声 |
| Play Sample 2 | `voice_b` | 2つ目の見本音声 |

ラベルは、できるだけ性別に固定しない。  
`Sample 1` / `Sample 2` のような中立的なラベルを使える。

## 7. Playback Flow

ユーザーが見本音声再生ボタンを押した時:

1. Frontend が `sentenceTemplateId` と voice option identifier を送る。
2. Backend が `sentence_template_voice_options` から選択されたactiveなvoice optionを取得する。
3. Backend が、選択されたvoice optionの `sentence_template_audios.audio_path` を確認する。
4. cache済みaudioがあれば、Backend はpublic URLを返す。
5. cache済みaudioがなければ、Backend は選択されたvoice optionでaudioを生成する。
6. Backend が生成済みMP3をSupabase Storageへuploadする。
7. Backend が `sentence_template_audios.audio_path` を更新する。
8. Backend がpublic URLを返す。
9. Frontend が返されたaudioを再生する。

## 8. Generation Flow

audio生成が必要な場合:

1. Backend が `sentence_templates` から定型文テキストを取得する。
2. Backend が `sentence_template_voice_options` から選択されたvoice optionを取得する。
3. Backend が選択されたvoice optionから `voice_id` と `model_id` を読む。
4. Backend がTTS providerを呼び出す。
5. Backend が決定的なpathで生成済みMP3をSupabase Storageにuploadする。
6. Backend が `sentence_template_audios` を作成または更新する。
7. Backend が `voice_option_id`, `voice_id`, `model_id`, `audio_path` を保存する。
8. Backend がpublic URLを返す。

## 9. Deletion Behavior

### 9.1 Sentence deletion

sentence templateを削除する時:

- `sentence_templates` は論理削除する。
- 関連する `sentence_template_voice_options` は論理削除する。
- 関連する `sentence_template_audios` は物理削除する。
- 関連するStorage上のaudio fileは物理削除する。
- 関連するfavoriteは物理削除してよい。
- `training_attempts.sentence_id` は維持する。

### 9.2 Category deletion

categoryを削除する時:

- `sentence_categories` は論理削除する。
- 配下の `sentence_templates` は論理削除する。
- 削除対象sentence配下の `sentence_template_voice_options` は論理削除する。
- 関連する `sentence_template_audios` は物理削除する。
- 関連するStorage上のaudio fileは物理削除する。
- 関連するfavoriteは物理削除してよい。
- `training_attempts.sentence_id` は維持する。

### 9.3 Voice option deletion or replacement

voice optionを削除または差し替える時:

- `sentence_template_voice_options` は論理削除する。
- 関連する生成済みaudio cacheは物理削除してよい。
- 関連するStorage上のaudio fileは物理削除してよい。
- sentence template本体は維持する。
- 新しいvoice optionに対するaudioは後で再生成できる。

## 10. Security Considerations

- Frontendから任意の外部 `voice_id` を送らせない。
- Frontendは既存のactiveなvoice optionのみを要求できるようにする。
- Backendは `sentence_template_voice_options` から `voice_id` と `model_id` を読む。
- 削除済みvoice optionは新規audio生成に使わない。
- 生成済みpublic audio URLは、想定されたStorage pathのみを指すようにする。

## 11. Design Decisions

### Why use `sentence_template_voice_options`?

1つの定型文は、複数の見本音声 option を必要とする可能性がある。

子テーブルを使うことで、`sentence_templates` に `voice_id_1` や `voice_id_2` のような固定列を追加せずに済む。

これにより、将来的にvoice optionが増えても柔軟に対応できる。

### Why keep generated audio separate?

生成済みaudioはcacheである。

sentence templateは元の練習文。  
voice optionは生成設定。  
audio recordは生成結果。

この責務を分離することで、削除や再生成を管理しやすくなる。

### Why use `slot_key`?

`slot_key` は、`voice_a` や `voice_b` のような安定したUI slotを表す。

slotに割り当てる実際のvoiceは後で変更できるが、UI構造は維持できる。

## 12. Acceptance Criteria

Phase 2は以下を満たした時に完了とする。

- 1つのsentence templateが少なくとも2つのactiveなsample voice optionを持てる。
- UIが2つの見本音声再生ボタンを表示できる。
- ユーザーが好きなタイミングでどちらの見本音声も再生できる。
- Frontendがvoice optionを指定してsample audioを要求できる。
- 生成済みaudioがvoice optionごとにcacheされる。
- sentenceまたはcategory削除時に、生成済みaudio cacheとStorage fileが削除される。
- sentenceまたはcategory削除時に、training historyが壊れない。
- Frontendが削除済みsentence、category、voice option、audioを表示しない。

## 13. Notes for Future Phases

将来的な改善候補:

- 本格的なvoice option管理UI。
- 3つ以上のsample voice option。
- ユーザーごとのvoice preference。
- 再生成UI。
- 音声スピード変更。
- より高度なaudio asset管理。
