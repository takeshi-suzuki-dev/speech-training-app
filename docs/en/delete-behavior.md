# Delete Behavior

## 1. Purpose

This document defines how delete operations should behave in the speech training app.

The goal is to keep data consistent and prevent deleted data from remaining on the frontend after delete operations.

This document covers:

- sentence deletion
- category deletion
- voice option deletion
- generated audio cache deletion
- frontend state reset after deletion

## 2. Data Responsibilities

### `sentence_categories`

Represents a sentence category.

Deletion policy:

- logically deleted

### `sentence_templates`

Represents the main sentence template data.

Deletion policy:

- logically deleted

### `sentence_template_voice_options`

Represents sample voice options for a sentence template.

Deletion policy:

- logically deleted

### `sentence_template_audios`

Represents generated sample audio cache.

Deletion policy:

- physically deleted

Generated audio is cache. It can be deleted and regenerated.

### `template_favorites`

Represents a user's favorite sentence templates.

Deletion policy:

- physically deleted when the related sentence is deleted

### `training_attempts`

Represents past training history.

Deletion policy:

- not deleted when a sentence or category is deleted
- `training_attempts.sentence_id` remains unchanged

Training history should not be broken by deleting current sentence templates.

## 3. Sentence Deletion

When a sentence template is deleted:

- `sentence_templates` is logically deleted.
- Related `sentence_template_voice_options` records are logically deleted.
- Related `template_favorites` records are physically deleted.
- Related `sentence_template_audios` records are physically deleted.
- Related storage audio files are physically deleted.
- `training_attempts.sentence_id` remains unchanged.

### Frontend behavior after sentence deletion

After deleting a sentence:

- The current category remains selected.
- The deleted sentence disappears from the sentence list.
- If the deleted sentence was selected, selected sentence is cleared.
- Audio UI is reset.
- Practice state is reset.
- Deleted sentence text must not remain on the screen.
- Deleted audio must not remain playable from the UI.

If the deleted sentence was not selected:

- The current selected sentence remains selected.
- Audio UI remains unchanged.
- Practice state remains unchanged.

## 4. Category Deletion

When a category is deleted:

- `sentence_categories` is logically deleted.
- Sentence templates under the category are logically deleted.
- Voice options under deleted sentence templates are logically deleted.
- Related `template_favorites` records are physically deleted.
- Related `sentence_template_audios` records are physically deleted.
- Related storage audio files are physically deleted.
- `training_attempts.sentence_id` remains unchanged.

### Frontend behavior after category deletion

After deleting a category:

- The deleted category disappears from the category list.
- Sentences under the deleted category disappear from the sentence list.
- Selected sentence is cleared.
- Audio UI is reset.
- Practice state is reset.
- Deleted category data must not remain on the screen.
- Deleted sentence data must not remain on the screen.
- Deleted audio must not remain playable from the UI.

If the deleted category was selected:

- Select the next category if it exists.
- If there is no next category, select the previous category.
- If no categories remain, no category is selected.

If the deleted category was not selected:

- The current category remains selected.
- Current sentence/audio/practice state remains unchanged.

## 5. Voice Option Deletion

When a voice option is deleted or replaced:

- `sentence_template_voice_options` is logically deleted.
- Related generated audio cache may be physically deleted.
- Related storage audio files may be physically deleted.
- The sentence template itself remains unchanged.

Voice option deletion does not delete the sentence template.

## 6. Generated Audio Deletion

Generated audio is treated as cache.

When generated audio is deleted:

- `sentence_template_audios` records are physically deleted.
- Storage audio files are physically deleted.
- `sentence_templates` remain unchanged.
- `sentence_template_voice_options` remain unchanged unless the parent sentence is deleted.

Generated audio can be regenerated later from:

- sentence template text
- voice option settings

## 7. Confirmation Dialog

Delete operations must require confirmation.

### Cancel

When the user cancels deletion:

- No delete API should be executed.
- DB data remains unchanged.
- Frontend state remains unchanged.

### Confirm

When the user confirms deletion:

- Backend performs the delete operation.
- Frontend reloads or updates affected data.
- Deleted data must disappear from the UI.
- Related selected state must be reset according to this document.

## 8. Error Handling

If deletion fails:

- Frontend should show an error message.
- Frontend should not remove data optimistically unless backend deletion succeeded.
- Existing selected state should remain unchanged.
- Audio UI should remain unchanged.

## 9. Acceptance Criteria

Delete behavior is acceptable when:

- deleted sentences do not remain in the sentence list
- deleted categories do not remain in the category list
- deleted audio does not remain playable from the UI
- selected sentence is cleared when the selected sentence is deleted
- selected sentence/audio/practice state is cleared when the selected category is deleted
- deleting an unselected category does not affect the current selected category
- deleting an unselected sentence does not affect the current selected sentence
- generated audio cache is physically deleted
- training history remains unchanged
- confirmation cancel does not change data or UI state
