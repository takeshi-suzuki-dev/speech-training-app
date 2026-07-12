# Frontend Architecture (Pronunciation Page)

Last updated: 2026-07-12

## 1. Purpose

The pronunciation page is the largest screen in the app, and it grew to roughly 2,600 lines in a single component. This document records how that component is now organised, and the rules a change to it has to follow. It describes the shape of the code, not its history.

## 2. Shape

The page is split three ways:

- **Hooks** (`frontend/src/hooks/pronunciation/`) own state and side effects. They contain no JSX.
- **Components** (`frontend/src/components/pronunciation/`) own markup. They are presentational and own no state.
- **The page** (`frontend/src/app/pronunciation/page.tsx`) wires the two together and owns the decisions that belong to neither.

Pure helpers with no React involvement live in `frontend/src/lib/pronunciation/`.

## 3. Hooks

| Hook | Owns |
| --- | --- |
| `useCategoryTemplateManager` | Categories, sentences, favorites, latest scores, the current selection, the sidebar/sheet view, and category and sentence CRUD |
| `useRecordingSession` | The microphone, the recording, WAV encoding, and the auto-stop timer |
| `useSampleAudioPlayer` | Sample-audio generation, its cache, and playback |
| `useScoring` | The assessment run and its result |

### Passive by design

A hook does not reach out for the state it needs. It is given what it needs, and it reports what happened:

- Inputs arrive as arguments (`canRecord`, `submit({ audioFile, template, … })`).
- Failures are reported through an injected `reportError`, so every hook writes to the page's single error banner rather than owning its own.
- Consequences are reported through injected callbacks (`onRecordingStart`), rather than the hook acting on state it does not own.

This is what keeps the dependencies one-directional. `useScoring` does not know a recording exists; `useRecordingSession` does not know a score exists. The page knows both, and connects them.

### Ordering constraint

Hooks are called in dependency order, because a hook can only be passed something that already exists:

1. `useSampleAudioPlayer` — depends on nothing
2. `useCategoryTemplateManager` — is given the player's cache-eviction callbacks
3. `useScoring` — depends on nothing at init
4. `useRecordingSession` — is given `useScoring`'s `reset` as `onRecordingStart`

A hook whose `reset` is passed to another hook, or listed as an effect dependency, must have a stable identity (`useCallback` with an empty dependency array). Achieve that with functional setState updaters rather than by widening the dependency array.

### Refs, and a lint rule that matters

`react-hooks/refs` is enabled, and it forbids writing to a ref during render. Callbacks and latest props that a hook needs to read without re-subscribing are held in refs and synced **inside an effect**, never during render. Every hook here follows that pattern; a new one must too.

## 4. Components

`TemplateCard` and `CategoryCard` are each rendered by both the desktop sidebar and the mobile bottom sheet. Both layouts are kept: mobile is a supported surface, not a leftover.

A card takes a `variant` (`"sidebar" | "sheet"`) and keeps the difference between the two surfaces inside itself, in a config table. A call site passes data and callbacks; it never passes class names, and it never decides whether a chevron or a description is shown.

The two variants are not equivalent. The sheet is a touch surface, so nothing can be revealed on hover, and it has less room. `CategoryCard` therefore shows a description and a drill-in chevron on the sidebar only.

## 5. What the page still owns

The page keeps the decisions that are not any single hook's business:

- **When** to preload a sentence's sample audio (on selection change).
- **What** it means to switch sentences: discard the recording and the score.
- The shared error banner that every hook reports into.
- Domain-level refusals, such as declining to record when no sentence is selected. A hook reports device failures; whether the action makes sense is the page's judgement.

## 6. Editing rules

- Logic goes in a hook. Markup goes in a component. Neither belongs in the page.
- A hook receives what it needs; it does not import page state.
- A component receives what it needs; it does not import hooks.
- No state-management library. If Phase 3 adds enough state to justify one, revisit it then.
- Each step should leave `tsc --noEmit` and `eslint` clean.
- Components are covered by Vitest + React Testing Library (`*.test.tsx`, alongside the component). Those tests run under jsdom: they can prove which handler a button reaches and which classes a variant produces, but they cannot see layout, hover, or breakpoints. Anything visual is verified in the browser at both widths, against the manual testing checklist.
