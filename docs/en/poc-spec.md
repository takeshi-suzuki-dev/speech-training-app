# Phase 0: Proof of Concept (PoC)

---

## Objective

The goal of this phase is to validate the technical feasibility of the core features:

- Pronunciation assessment using Azure AI
- Sample audio generation using ElevenLabs
- End-to-end data flow: audio input → API → result retrieval → display

---

## System Overview

```
Frontend → Backend → Azure AI   → Backend → Frontend
Frontend → Backend → ElevenLabs → Backend → Frontend
```

---

## Scope

### 1. Azure AI Integration

#### Input

- Display a fixed practice sentence
- Start recording when the "Start Recording" button is pressed
- Stop recording when the "Stop Recording" button is pressed
- Send recorded audio along with the practice sentence to the backend

#### Processing

- Send audio and text to Azure AI for pronunciation assessment
- Retrieve the evaluation results

#### Output

Display the following:

- Overall score
- Category scores (e.g., fluency)
- Word-level scores
- Phoneme-level scores
- First detected candidate for each phoneme

---

### 2. Raw Response Display (Azure)

- Display the full Azure API response
- This is used for inspection and validation of returned data

### 2.1 Azure Response Handling

The backend checks Azure responses in two steps:

- First, check HTTP status
- Second, when HTTP 200 is returned, check `RecognitionStatus`

Expected handling:

- `Success`
  - Display evaluation scores
  - Display transcript / word-level / phoneme-level results
- `InitialSilenceTimeout`
  - Show a no-speech message
  - Show score fields as `-`
- `BabbleTimeout`
  - Show a noise-detected message
  - Show score fields as `-`
- `NoMatch`
  - Show a not-recognized-clearly message
  - Show score fields as `-`
- `Error`
  - Show an internal scoring error message
  - Show score fields as `-`

Phase policy:

- Phase 1: no frontend pre-checks before sending audio
- Phase 2: add recording-time detection and pre-submit checks

---

### 3. ElevenLabs Integration

#### Generation

- Add a button: "Generate Sample Audio with ElevenLabs"
- Send the sentence to ElevenLabs only when the button is pressed
- Retrieve generated sample audio

#### Playback

- Add a button: "Play Sample Audio"
- Play the generated audio only when the button is pressed

---

### 4. Raw Response Display (ElevenLabs)

- Display the raw API response from ElevenLabs
- Exclude audio binary data from the display

---

## Audio Format (Tentative)

Preferred:

- `audio/wav; codecs=audio/pcm; samplerate=16000` (mono)

Alternative:

- `audio/ogg; codecs=opus`

The final format will be determined based on frontend recording capabilities.

---

## Out of Scope

The following features are intentionally excluded from this phase:

- Database integration
- Feedback generation
- Learning analytics
- UI/UX optimization
- Logging and monitoring

---

## Success Criteria

This phase is considered successful if:

- Audio can be recorded and sent to the backend
- Azure AI returns pronunciation assessment results
- All score levels (overall, category, word, phoneme) can be retrieved
- Raw Azure API response can be displayed
- ElevenLabs can generate sample audio successfully
- Generated audio can be played back
- Raw ElevenLabs response can be displayed

---

## Summary

This phase focuses solely on verifying that the core technologies work together.

No product-level features are implemented at this stage.
