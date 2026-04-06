# Pronunciation Scoring API Design for Azure Speech (PoC)

## Overview

This document describes the API design for the pronunciation scoring PoC using Azure Speech.

This API is responsible for:

- accepting user audio and reference text
- evaluating pronunciation
- returning structured scoring results to the frontend

This API is **only for scoring**.

Speech generation is handled separately by another API based on ElevenLabs, so it is outside the scope of this document.

-----

## Scope

This document covers only the pronunciation scoring side of the application.

### In scope

- audio upload for scoring
- reference text input
- pronunciation assessment with Azure Speech
- structured response design
- frontend rendering strategy for scoring results

### Out of scope

- speech synthesis / TTS
- ElevenLabs integration

Those features belong to a separate API.

-----

## Goal

The goal of this PoC is to establish a clear API structure for pronunciation assessment.

This PoC is intended to confirm:

- what input is needed for scoring
- what scoring data can be returned
- how the frontend should display the returned scoring data

The goal is not to finalize a production-ready API yet.

-----

## Endpoint

`POST /api/pronunciation/score`

### Content-Type

`multipart/form-data`

-----

## Request Design

### Required fields

- `audio`
  - user audio file for pronunciation scoring
- `referenceText`
  - expected script text used for pronunciation assessment

### Deferred fields

The following fields are intentionally excluded from the initial PoC scope:

- `languageCode`
- `mode`
- `userId`
- other optional scoring parameters

These can be added later if needed.

-----

## Response Design

The response is organized into three groups:

1. data that is definitely used for scoring feedback
1. data that may become useful later
1. the original Azure response for debugging and future extraction

### Response fields

#### Core scoring fields

- `transcript`
- `overallScore`
- `sentenceScores`
- `words`
- `phonemes`

#### Optional/supporting fields

- `extras`

#### Original source data

- `rawJson`

-----

## Response Field Details

### `transcript`

Recognized text returned from Azure Speech.

This is useful both for debugging and for showing what the system actually heard.

### `overallScore`

Overall pronunciation score for the submitted audio.

### `sentenceScores`

Sentence-level scoring fields such as:

- `accuracy`
- `fluency`
- `completeness`
- `prosody`

### `words`

Word-level scoring result list.

Each item may include:

- word text
- score fields
- error type
- `offset`
- `duration`

### `phonemes`

Phoneme-level scoring result list.

Each item may include:

- related word
- phoneme
- score fields
- expected IPA
- candidate phonemes detected from speech, if available
- `offset`
- `duration`

### `extras`

Additional response values that may become useful later.

Examples:

- helper metadata
- Azure fields not yet mapped into the main scoring UI

`extras` is a temporary holding area for unmapped fields.  
Fields that become consistently useful should be promoted to named response fields.

This field should not duplicate timing data already stored in `words` or `phonemes`.

### `rawJson`

Original Azure Speech response payload kept for:

- debugging
- scoring verification
- future field extraction
- backend/frontend comparison during PoC development

-----

## Example Response

```json
{
  "transcript": "I want to improve my English speaking.",
  "overallScore": 78,
  "sentenceScores": {
    "accuracy": 80,
    "fluency": 72,
    "completeness": 90,
    "prosody": 68
  },
  "words": [
    {
      "word": "want",
      "scores": {
        "accuracy": 82
      },
      "errorType": "Mispronunciation",
      "offset": 1200000,
      "duration": 350000
    }
  ],
  "phonemes": [
    {
      "word": "want",
      "phoneme": "ɑː",
      "scores": {
        "accuracy": 70
      },
      "expectedIpa": "ɑː",
      "candidates": ["ɑː", "ʌ"],
      "offset": 1450000,
      "duration": 120000
    }
  ],
  "extras": {
    "someUnmappedField": "example"
  },
  "rawJson": {}
}
```

-----

## Data Relationship

Both `words` and `phonemes` are returned as top-level fields.

For frontend rendering, phoneme-level data is grouped under the related word using the shared word reference.

This keeps the API response explicit while still allowing a word-centered UI layout.

-----

## Frontend Rendering Strategy

The frontend should render all returned scoring data, but not all sections need the same visual weight.

### Summary section

Top-level scoring information shown first:

- `transcript`
- `overallScore`
- `sentenceScores`

### Word-level scoring section

Each word is displayed as its own block.

Each block includes:

- word text
- word-level scores
- error type
- phoneme list for that word

### Phoneme-level scoring section

Phoneme details are shown inside the related word block.

Each phoneme item may include:

- phoneme
- score fields
- expected IPA
- candidate phonemes

### Supporting sections

Lower-priority scoring-related data can be shown below:

- `extras`
- `rawJson`

These sections may be collapsible for readability.

-----

## UI Structure Idea

A simple and readable structure is preferred over heavy styling in the PoC phase.

Example structure:

- Summary
- Word blocks
  - word scoring information
  - phoneme scoring list
- Extras
- Raw JSON

This keeps the relationship between word-level and phoneme-level scoring data easy to understand.

-----

## Error Handling

The PoC should also return readable failure information.

### Expected error cases

- audio is missing or empty
- reference text is missing
- Azure Speech request fails
- transcript is returned but some scoring fields are missing

### Response approach

For validation or processing failures, the API should return:

- an appropriate HTTP status
- a readable error message
- partial scoring data only when it is meaningful to return it

### Error response example

```json
{
  "error": "Pronunciation scoring failed",
  "details": "Azure Speech request timed out"
}
```

A more detailed production-ready error model can be introduced later.

-----

## Design Principles

This PoC follows these principles:

- return all useful scoring data from the API early
- avoid hiding potentially useful scoring fields too soon
- keep the UI readable even without advanced styling
- improve layout incrementally during implementation
- preserve original Azure scoring response data for verification and expansion
- keep scoring responsibility separate from speech generation responsibility

-----

## Responsibility Boundary

### This API handles

- pronunciation scoring
- scoring result transformation
- scoring data delivery to the frontend

### This API does not handle

- speech synthesis
- generated sample audio
- voice selection

Those responsibilities belong to a separate ElevenLabs-based API.

-----

## Implementation Notes

### Backend

- Spring Boot receives `audio` and `referenceText`
- Azure Speech is called from the backend for pronunciation assessment
- structured scoring response DTO is returned to the frontend

### Frontend

- Next.js submits `multipart/form-data`
- scoring response is rendered in a readable layout
- word-level and phoneme-level scoring information are grouped together

-----

## PoC Exit Criteria

The PoC is considered successful when:

- the backend can call Azure Speech for pronunciation assessment
- the API can return structured scoring response data
- the frontend can display:
  - `transcript`
  - `overallScore`
  - sentence-level scores
  - at least one word-level result
  - at least one phoneme-level result
- the `rawJson` field can be inspected in the UI
- word-level and phoneme-level scoring feedback are visible in a readable layout

-----

## Future Improvements

Possible next steps after the PoC:

- stricter typing for score objects
- improved phoneme grouping logic
- better layout and visual hierarchy
- clearer explanations for scoring results
- history persistence and comparison views
- integration with broader pronunciation training workflows

Speech generation remains a separate concern and should continue to be designed independently.
