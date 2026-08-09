# Coding Guidelines

These guidelines describe the patterns **already established** in this codebase.
They exist to keep AI-assisted and human changes consistent with what's already
here — not to introduce a new "ideal" style. When in doubt, copy the closest
existing example rather than inventing a new pattern.

This project is near release. Do not refactor existing code to match these
guidelines unless you're already touching that code for another reason.

---

## 1. General Principles

- **Prefer simple, readable code over clever code.** This codebase favors
  straightforward imperative logic (loops, early returns, explicit null checks)
  over dense functional chains or generic abstractions.
- **DRY, but don't over-engineer.** Extract a helper only once a pattern is
  clearly repeated (e.g. `SentenceTemplateService#requireText`,
  `defaultIfBlank`). Don't build a generic framework for a one-off need.
- **Match the nearest existing pattern.** Before writing new code, find the
  most similar existing controller/service/hook/component and follow its
  shape, naming, and error handling — even if you'd personally do it
  differently.
- **No new dependencies without a clear reason.** The backend runs on plain
  Spring Boot + Spring Data JPA with no MapStruct, Lombok, or extra web
  frameworks. The frontend has a deliberately small dependency list
  (`firebase`, `next`, `react`, `recharts`, `zod`, `zustand`). `zustand` is
  used in exactly one place, for genuinely cross-component shared state —
  see §3.3 — not as a general state-management layer. Don't add a new
  dependency (React Query, MapStruct, Lombok, etc.), and don't broaden
  `zustand`'s use beyond §3.3's scope, without discussing it first.
- **Comments explain "why", not "what".** This codebase consistently uses
  short doc comments to explain *non-obvious reasoning* (why a check exists,
  why an order matters), not to restate the code. See
  `UpstreamApiException`, `UserIdentity`, `parseResponse.ts` for the tone to
  match.

---

## 2. Backend (Spring Boot / Java)

### 2.1 Layering

- **Controller**: HTTP concerns only — request/response mapping, calling one
  service, choosing status codes. No business logic, no repository calls.
  Example: `TrainingAttemptController`, `TemplateFavoriteController`.
- **Service**: owns business logic, validation, and transaction boundaries.
  Services call repositories and other services, never the reverse.
  Example: `SentenceTemplateService`, `AppAccessService`.
- **Repository**: Spring Data JPA interfaces only. Derived query methods or
  `@Query` (JPQL for entity queries, native SQL for reporting/aggregation
  queries like `TrainingAttemptRepository#findDailyScoreTrends`). No logic
  beyond the query itself.
- Constructor injection everywhere, no `@Autowired` field injection. Follow
  `TrainingAttemptService`'s pattern of `private final` fields set in the
  constructor.
  > **Inconsistency found:** `SentenceTemplateService` declares three of its
  > six dependencies without `final`. This is a slip, not an intentional
  > pattern — treat `private final` (as in every other service) as the
  > default, and fix it opportunistically if you're already editing that
  > file, but don't do a standalone pass just for this.

### 2.2 DTOs / Entities

- **DTOs are Java `record`s.** Request DTOs live in `dto/request`, response
  DTOs in `dto/response`. Response records provide a static `from(Entity)`
  factory method (see `SentenceTemplateResponse.from`,
  `TrainingAttemptResponse.from`). Follow this for any new response type.
- **Entities are plain JPA classes**, not records (they need mutability, a
  protected no-arg constructor, and lazy-loading semantics that records don't
  support well). Keep the existing shape: private fields, `@Column`
  annotations with explicit `name=`, a public constructor for creation, a
  protected no-arg constructor for JPA, getters, and small intention-revealing
  mutators (`deactivate()`, `update(...)`, `linkFirebaseUid(...)`) rather than
  public setters for everything. See `SentenceTemplate`, `AppAllowedUser`.
- Controllers and services **never return entities directly** — always map to
  a response DTO first.

### 2.3 Business Logic Placement

- Business rules (validation, default values, authorization decisions) belong
  in the **service** layer, next to the persistence calls they guard. See
  `SentenceTemplateService#createUserTemplate` for the pattern: validate →
  compute defaults → construct entity → save → map to response.
- Cross-cutting authorization logic (e.g. "is this Firebase user allowed to
  use the app at all") lives in a dedicated service (`AppAccessService`),
  invoked from an interceptor (`FirebaseAuthenticationInterceptor`), not
  duplicated per-controller.

### 2.4 Exception Handling

- `GlobalExceptionHandler` (`@RestControllerAdvice`) is the intended single
  place for translating exceptions to HTTP responses. It already handles:
  `UpstreamApiException` (third-party API failures → 429/502),
  `IllegalArgumentException` (→ 400), `ResponseStatusException` (status
  passed through), and a catch-all `Exception` (→ 500). **New service-level
  errors should throw one of these rather than adding a new
  `@ExceptionHandler` elsewhere.**
- Prefer `ResponseStatusException` with an explicit `HttpStatus` when the
  status genuinely varies (400 vs 404 vs 409) — see
  `SentenceTemplateService`. Prefer plain `IllegalArgumentException` when
  it's simple input validation that always maps to 400 — see
  `TrainingAttemptService#validateCreateRequest`.
  > **Inconsistency found:** `TemplateFavoriteController` and
  > `AuthController` each define their own local `@ExceptionHandler` +
  > `ErrorResponse` record for `IllegalArgumentException`/
  > `FirebaseAuthException`, duplicating what `GlobalExceptionHandler` already
  > does (with a different JSON shape: `{error, message}` vs. `GlobalExceptionHandler`'s
  > `{error, message, statusCode}`). **Recommendation:** treat
  > `GlobalExceptionHandler` as the default and don't add more local
  > `@ExceptionHandler`s. Consolidating the two existing ones is a small,
  > low-risk cleanup worth doing before release since it's just deleting
  > ~10 lines from each controller.
- Custom exceptions that wrap a third-party failure extend `UpstreamApiException`
  (see `AzureSpeechApiException`, `ElevenLabsApiException`) — follow this base
  class for any new external API integration.

### 2.5 Null / Optional Handling

- **Repositories**: return `Optional<T>` for single-result lookups that may
  legitimately not exist (`findByEmailIgnoreCase`,
  `findByIdAndOwnerFirebaseUidAndActiveTrue`), resolved with
  `.orElseThrow(() -> new ResponseStatusException(...))` in the service.
  This is the established pattern — use it for new single-row lookups.
  Plain aggregate/list queries return `List<T>` (never `Optional<List<T>>`).
- **Entity fields and DTOs**: plain nullable types (`String`, `UUID`,
  `Boolean`), not `Optional<T>` fields. `Optional` is a return-type-only tool
  here — don't put it on fields, method parameters, or record components.
- Blank-string handling uses small private helpers (`requireText`,
  `defaultIfBlank`, `blankToNull` in `SentenceTemplateService`) rather than a
  generic string-utils library. Reuse these if you're extending that service;
  don't add Apache Commons / Guava for this.

### 2.6 Transactions

- `@Transactional(readOnly = true)` on every read-only service method,
  `@Transactional` on every mutating one. Apply at the **service** method
  level, never on controllers or repositories.
- Multi-step writes that must succeed or fail together (e.g. deactivating a
  category, cascading deactivation to its templates, deleting favorites and
  audio rows) are done inside one `@Transactional` service method — see
  `SentenceTemplateService#deleteUserCategory`. Don't split a multi-step
  mutation across multiple public service calls from the controller.

### 2.7 Naming Conventions

- Packages: `controller`, `service`, `repository`, `entity`, `dto.request`,
  `dto.response`, `exception`, `auth`, `config` — put new classes in the
  matching package rather than inventing new ones.
- Repository methods use Spring Data derived-query naming
  (`findByXAndYOrderByZAsc`) for simple lookups, and `@Query` with a
  descriptive method name (`findVisibleTemplatesByCategoryId`,
  `findDailyScoreTrends`) once the query needs a join, filter, or native SQL.
- Request/response DTOs are named `<Noun><Verb?>Request` /
  `<Noun>Response` (`SaveSentenceTemplateRequest`,
  `SentenceTemplateResponse`, `DailyScoreTrendResponse`).
- Constants for external API field names (Azure JSON keys, etc.) are
  `UPPER_SNAKE_CASE` `static final` fields grouped at the top of the class —
  see `PronunciationService`. Follow this instead of inline string literals
  when integrating a new external API.

### 2.8 Reuse

- Auth/user-identity resolution: use `UserIdentity.resolve(httpServletRequest)`
  for anything under the authenticated `/api/**` surface guarded by
  `FirebaseAuthenticationInterceptor`, rather than re-verifying the Firebase
  token by hand.
  > **Inconsistency found:** Several endpoints in `SentenceTemplateController`,
  > `TemplateFavoriteController`, and `AuthController` bypass the interceptor
  > pattern and manually call `FirebaseAuthService.verifyIdToken(authorizationHeader)`
  > on an injected `Authorization` header, re-implementing what the
  > interceptor already does. This looks like it predates the interceptor.
  > **Recommendation:** for **new** endpoints, default to the interceptor +
  > `UserIdentity.resolve(...)` pattern (used by `PronunciationController`,
  > `TrainingAttemptController`) — it's less code per endpoint and centralizes
  > auth failure handling. Leave the existing manual-verification endpoints
  > as-is; migrating them is a real behavior-touching change this late in
  > development and isn't worth the risk before release.
- Upstream API failures: extend `UpstreamApiException`, not a fresh
  `RuntimeException` subclass, so `GlobalExceptionHandler` and
  `UpstreamAlertService` pick them up automatically.
- File storage: go through `SupabaseStorageService` rather than talking to
  storage directly from a new service.

---

## 3. Frontend (Next.js / React / TypeScript)

### 3.1 Layer Separation

The app follows a 4-layer split — keep new code in the matching layer:

| Layer | Location | Responsibility |
|---|---|---|
| API access | `lib/api/*.ts` | `fetch` calls, request/response shape (zod schema), one function per endpoint |
| Hooks | `hooks/**/*.ts` | Stateful logic: calls the API layer, owns `useState`/`useEffect`, exposes data + actions |
| Components | `components/**/*.tsx` | Presentational. Receive data and callbacks as props; no `fetch`, no business rules |
| Pages | `app/**/page.tsx` | Compose hooks + components for a route; minimal logic of their own |

Example chain to copy: `lib/api/sentenceTemplates.ts` (fetch + zod validation)
→ `hooks/pronunciation/useCategoryTemplateManager.ts` (state + orchestration)
→ `components/pronunciation/CategoryCard.tsx` (pure rendering) →
`app/pronunciation/page.tsx` (wiring).

### 3.2 API Access Layer (`lib/api`)

- Every request goes through `apiFetch` (`lib/api/apiFetch.ts`), which
  attaches the Firebase ID token and JSON headers. Don't call `fetch`
  directly from a hook or component.
- Every response is parsed and validated with `parseJsonResponse` + a `zod`
  schema (`lib/api/parseResponse.ts`), not just `response.json()` cast to a
  type. This is a hard boundary check the codebase relies on — keep it for
  any new endpoint.
- Non-2xx responses throw a plain `Error` with a short, user-facing message;
  use `readApiErrorMessage` / `getAccessDeniedMessage` (`lib/api/apiError.ts`)
  when the backend's own message should be surfaced instead of a generic one.
- One file per resource (`sentenceTemplates.ts`, `templateFavorites.ts`,
  `tts.ts`, ...), each exporting its zod schema(s), inferred type(s), and the
  functions that use them.
  > **Inconsistency found:** `types/pronunciation.ts` centralizes the zod
  > schemas/types for the pronunciation-assessment domain, while every other
  > domain (`sentenceTemplates`, `templateFavorites`, `assessmentResults`,
  > ...) defines its schema/types directly inside its `lib/api/*.ts` file.
  > **Recommendation:** treat "schema lives next to the API function that
  > uses it" (the majority pattern) as the default for new resources, and
  > only pull a schema into `types/` if it's genuinely shared by more than
  > one `lib/api` module, as `SpeechEvaluateResponse` is. Not worth moving
  > the existing pronunciation types out of `types/` — that's churn with no
  > behavior change this close to release.

### 3.3 State Management — Zustand only for genuinely shared state

This project does **not** use Zustand, Redux, or any global-state library for
page- or feature-local state. That state is managed entirely with local
component/hook state (`useState`/`useReducer`) inside domain-specific
"manager" hooks, with props passed down to presentational components. See
`hooks/pronunciation/useCategoryTemplateManager.ts` as the canonical example
of this pattern: it owns all the state for a feature area and returns a flat
object of `{ data, actions }` for the page to spread into its JSX. This stays
the default — don't reach for Zustand just because a hook has a lot of
`useState` calls; see `useCategoryTemplateManager` for how much a single hook
is expected to own on its own.

**One deliberate exception: `useAuthStore` (`hooks/useAuthStore.ts`).**
Firebase's signed-in user is state that genuinely needs to be shared by
multiple, unrelated parts of the tree (`AppNav`, `AuthPanel`,
`useCategoryTemplateManager`). Those three used to each run their own
`onAuthStateChanged` listener and local `user` state — a real duplication,
not just a stylistic one. `useAuthStore` replaces all three with a single
Zustand store and a single subscription, started once when the module loads.

This is the **only** case in the project where Zustand is used, and the
distinction that justifies it: the store holds data that is truly shared
across independent components (an actual cross-component synchronization
problem), not a big chunk of state that merely happens to live in one place.
Do not use `useAuthStore` as precedent for pulling other feature state (e.g.
the sentence-template editor state in `useCategoryTemplateManager`) into
Zustand — that state isn't shared outside its own hook, so the existing
local-state pattern is still the right one for it. If a genuinely new
cross-component sharing need comes up, treat it the same way: a small,
narrowly-scoped store for that one piece of shared data, not a general
migration.

Conventions inside manager hooks:
- Group related `useState` calls together with a `// ── Section ──` comment
  banner (data / selection / view state / forms), as in
  `useCategoryTemplateManager`.
- Callback props passed into a hook that are read inside a `useEffect` are
  captured in a `useRef` and kept fresh via a plain (no-dependency-array)
  effect, rather than added to the effect's dependency array — this avoids
  re-running effects when the parent passes a new inline function. See the
  `resetSampleAudioStateRef` pattern.
- Use the `let ignore = false` / cleanup-sets-`ignore` pattern in any
  `useEffect` that fetches data, to avoid a stale response overwriting newer
  state after unmount or a fast re-trigger.

### 3.4 Component Conventions

- Function declarations with **named exports** for anything in `components/`
  (`export function CategoryCard(...)`), matching `AuthPanel.tsx`,
  `CategoryCard.tsx`, `TemplateCard.tsx`. `app/**/page.tsx` and
  `app/layout.tsx` use `export default function ...` because Next.js's App
  Router requires a default export there — that's a framework constraint,
  not a stylistic exception.
  > **Inconsistency found:** `components/AppNav.tsx` uses `export default
  > function AppNav()` even though it's a regular component, not a Next.js
  > page. **Recommendation:** named export is the default going forward
  > (3 of 4 non-page components already use it); leave `AppNav` as-is rather
  > than changing its export style purely for consistency.
- Components take a single typed props object (`type XProps = {...}`)
  declared just above the component.
- Variant-driven styling uses a `Record<Variant, {...}>` config object (see
  `CategoryCard`'s `VARIANT_CONFIG`) rather than conditional Tailwind class
  concatenation sprinkled through JSX. Follow this when a component needs to
  render differently in 2–3 known contexts.
- Small page-local presentational helpers (e.g. `SectionLabel`, `Card` in
  `app/pronunciation/page.tsx`) are defined inline in the page file when
  they're only used on that one page. Only promote a helper to
  `components/` once it's needed by more than one page/component — don't
  pre-emptively extract single-use helpers.
- Tailwind utility classes are written inline on the element; no CSS
  modules, no styled-components, no new CSS-in-JS library.

### 3.5 TypeScript Typing

- Use `type`, not `interface`, for all type declarations — this is an
  explicit, deliberate project convention (see the comment in
  `eslint.config.mjs` under "Deliberately not enabled"). Don't introduce
  `interface` for new code.
- Prefer types **inferred from zod schemas** (`z.infer<typeof schema>`) for
  any data crossing the API boundary, rather than hand-written duplicate
  types — see every file in `lib/api/`.
- Avoid `any`; the project runs `typescript-eslint`'s
  `recommendedTypeChecked` config plus `no-unsafe-*` rules specifically to
  catch `any` leaking in from untyped JSON. If you must bypass this locally
  (e.g. in a test mock), do it narrowly and prefer `unknown` + a type guard
  over `any`.
- Nullish coalescing (`??`) and optional chaining (`?.`) are enforced by
  lint (`prefer-nullish-coalescing`, `prefer-optional-chain`) — use them
  over `||`/manual null checks for new code.

### 3.6 Naming Conventions

- Files: `PascalCase.tsx` for components (`CategoryCard.tsx`), `camelCase.ts`
  for hooks/libs (`useCategoryTemplateManager.ts`, `apiFetch.ts`).
- Hooks are always named `use<Thing>` and live under `hooks/<domain>/`.
- API functions are named `fetch<Noun>` for GET, `create<Noun>` /
  `update<Noun>` / `delete<Noun>` for mutations, matching the backend's own
  verbs (`fetchSentenceTemplates`, `createSentenceTemplate`, ...).

### 3.7 When to Extract

- Extract a component when the same markup/behavior is needed in more than
  one place (`CategoryCard`/`TemplateCard` are each used from both the
  sidebar and the mobile sheet).
- Extract a hook when a page's `useState`/`useEffect` block becomes hard to
  scan, or when the same stateful logic would otherwise be copy-pasted
  across pages — not simply because a function is "long". The manager hooks
  in `hooks/pronunciation/` are large (up to ~700 lines) by design: they
  intentionally keep everything about one feature area in one place instead
  of splitting into many tiny hooks with cross-cutting state.
- Don't add a new abstraction layer (context provider, generic form
  framework, custom hook factory) to remove a small amount of duplication —
  the project consistently favors a bit of repetition over a new generic
  mechanism.

---

## 4. Testing

- Backend: no meaningful unit/integration test suite exists today beyond a
  context-loads smoke test (`BackendApplicationTests`). Don't feel obligated
  to backfill full coverage before release, but if you add non-trivial logic
  to a service (especially validation or scoring math), a focused test for
  that logic is worth adding.
- Frontend: tests are colocated with the file they test, `*.test.tsx` /
  `*.test.ts` next to the component/module (`CategoryCard.tsx` +
  `CategoryCard.test.tsx`, `apiError.ts` + `apiError.test.ts`). Use Vitest +
  Testing Library, following the existing style:
  - `describe` block per component/module, `it` names phrased as behavior
    (`"fires onSelect (and NOT onEdit) when the category is clicked"`).
  - A local `render<Thing>(overrides)` helper that returns the rendered root
    plus any mocked callbacks (`vi.fn()`), as in `CategoryCard.test.tsx`.
  - A short comment at the top of the file stating what the tests do and do
    not cover (e.g. "Layout, hover and breakpoints are not covered — those
    still need a browser").
- **When behavior changes, update or add the corresponding test in the same
  change** — don't leave a `.test.tsx` file asserting the old behavior.
- Favor tests that assert real behavior (a click reaches the right handler,
  a variant hides the right affordance) over tests written just to bump a
  coverage number. A component with no meaningful branching doesn't need a
  test just because its neighbor has one.

---

## 5. AI-Assisted Development Workflow

When using an AI assistant (or when acting as one) to modify this codebase:

1. **Find the closest existing implementation first.** Before writing a new
   controller/service/hook/component, locate the most similar one already in
   the project and use it as the template for structure, naming, and error
   handling.
2. **Don't introduce a new architectural or coding pattern without a clear
   reason.** If the nearest existing example does something in a way that
   seems suboptimal, that's not license to do it differently — raise it
   separately rather than silently diverging in the change you're making.
3. **Self-review against similar code before finishing.** After writing the
   change, diff it mentally against the pattern you copied: same layer
   boundaries? same null-handling style? same DTO/entity mapping approach?
   same error type? same export style?
4. **Don't touch unrelated code for style reasons alone.** Fixing an
   unrelated inconsistency while working on a feature increases review risk
   for no functional benefit — call it out (e.g. in the PR description or to
   the person you're working with) instead of silently "fixing" it.
5. **No new libraries, frameworks, layers, or abstractions without explicit
   approval** — this includes state-management libraries (§3.3), Java
   annotation-processing libraries (Lombok/MapStruct), new HTTP client
   libraries, and new architectural layers (e.g. a "use case" layer between
   controller and service).
6. **All generated code still needs human review** for correctness, security
   (especially anything touching auth, in `auth/` and
   `FirebaseAuthenticationInterceptor`), maintainability, and consistency
   with this document — an AI assistant following these guidelines reduces
   drift but doesn't remove the need for review.

---

## Appendix: Known Inconsistencies Summary

| # | Where | Issue | Recommended default | Fix before release? |
|---|---|---|---|---|
| 1 | `TemplateFavoriteController`, `AuthController` | Local `@ExceptionHandler` duplicates `GlobalExceptionHandler`, with a different JSON error shape | Use `GlobalExceptionHandler` only | Worth fixing — small, low-risk |
| 2 | `SentenceTemplateController`, `TemplateFavoriteController`, `AuthController` vs. `PronunciationController`, `TrainingAttemptController` | Two auth patterns: manual `FirebaseAuthService.verifyIdToken` vs. interceptor + `UserIdentity.resolve` | Interceptor + `UserIdentity.resolve` for new endpoints | Leave as-is — touches request flow/behavior, too risky pre-release |
| 3 | `SentenceTemplateService` | 3 of 6 dependency fields not `final` | `private final` everywhere | Low priority — fix only if editing that file anyway |
| 4 | `types/pronunciation.ts` vs. other `lib/api/*.ts` files | Schema location: centralized vs. colocated-with-API-function | Colocate with the API module (majority pattern); only centralize truly shared schemas | Document only — no behavior impact |
| 5 | `components/AppNav.tsx` | Uses `export default`, unlike other non-page components | Named export for new components | Document only — cosmetic |

None of these require large-scale refactoring. Items 1 and 3 are safe,
mechanical, low-risk cleanups if you want to do them before release; items 2,
4, and 5 are best simply documented (as above) and left alone.

**Update:** the duplicated `onAuthStateChanged` subscriptions in `AppNav.tsx`,
`AuthPanel.tsx`, and `useCategoryTemplateManager.ts` (a related inconsistency
found during discussion, not in the original table above) have since been
consolidated into `hooks/useAuthStore.ts`, a single small Zustand store. This
was a deliberate, narrowly-scoped exception to §3.3 — see that section for
the reasoning and its limits. `lib/api/apiFetch.ts`'s own
`onAuthStateChanged` call was left untouched: it's a one-shot promise used to
resolve the current user for an API call, not shared UI state, so it isn't
the same problem.
