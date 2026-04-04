# CLAUDE.md

> **Token-Saving Rule:** Consult this file before reading the directory tree or
> scanning source files. It contains all context needed to navigate the codebase
> efficiently. Only open a file when you need its exact contents.

## 1. Project Overview

A browser-based React 18 SPA for UK secondary science teachers that parses Excel
gradebooks (SheetJS), calls the Anthropic Claude API directly from the browser,
and generates class-wide and individual student feedback as downloadable Word docs.
Deployed on Vercel; password-gated at `/app`; no backend.

## 2. Architecture Map

```
src/
├── main.jsx                  # React Router entry; two routes: / and /app
├── App.jsx                   # Root tool component; owns all shared state
├── classUtils.js             # ⚠️ DO NOT TOUCH — Excel parsing heuristics (battle-tested)
├── FileUpload.jsx            # SheetJS-based Excel upload widget
├── pages/
│   ├── LandingPage.jsx       # Public marketing page (/)
│   └── AppPage.jsx           # Password-gate wrapper (/app)
├── components/
│   ├── AppShell.jsx          # Pure layout shell (sidebar, stepper) — zero logic
│   ├── PasswordGate.jsx      # sessionStorage auth; no lockout
│   ├── UploadPanel.jsx       # Exam metadata form + file inputs
│   ├── PdfDropZone.jsx       # Question paper PDF upload widget
│   ├── ClassFeedback/
│   │   ├── ClassFeedbackPanel.jsx    # WCF panel orchestrator (zones 1-5)
│   │   ├── ClassFeedbackHeader.jsx   # Hero block, action bar, print header
│   │   ├── DiagnosisZone.jsx         # Zone 2 — successes / misconceptions
│   │   ├── ImplicationsZone.jsx      # Zone 4 — immediate / long-term actions
│   │   └── IndividualSignalsZone.jsx # Zone 3 — praise / concern signals
│   ├── IndividualFeedback/
│   │   ├── IndividualFeedbackPanel.jsx # Per-student feedback view
│   │   └── StudentCard.jsx             # Individual student card
│   └── shared/
│       └── EditableItem.jsx  # Reusable click-to-edit textarea (wcf + card variants)
├── hooks/
│   ├── useClassFeedback.js      # WCF prompt + streaming logic + state
│   ├── useIndividualFeedback.js # Individual prompt + SSE streaming + state
│   ├── usePdfExtraction.js      # PDF → question text via Claude Haiku
│   ├── useProgressSimulation.js # Asymptotic progress animation (shared by all streaming hooks)
│   └── useAutoSizeTextarea.js   # Auto-resize textarea ref helper
└── utils/
    ├── docUtils.js     # Generates .docx download via `docx` library
    └── streamUtils.js  # SSE streaming transport: runStream (text streaming, WCF) + runToolStream (tool use streaming, individual feedback)
```

## 3. Critical Workflows

```bash
npm run dev        # Vite dev server (hot reload)
npm run build      # Production build → dist/
npm run preview    # Serve built dist/ locally
```

**No test runner. No linter config.** There are no `.test.js` or `.spec.js` files.

**Required env vars** (copy `.env.example`):
```
VITE_ACCESS_PASSWORD=...        # Password gate for /app
VITE_ANTHROPIC_API_KEY=...      # Direct browser API calls
```

## 4. Coding Standards

**S1 — State in hooks, not components.**
Feature state (loading, error, progress, data) lives in custom hooks
(`useClassFeedback`, `useIndividualFeedback`, `usePdfExtraction`).
`App.jsx` owns only shared cross-feature state (`studentData`, `activeOutput`,
form fields). Do not add feature state directly to `App.jsx`.

**S2 — Styling: CSS variables + inline objects.**
Use `var(--color-*)` tokens (defined in `index.css`) for new components.
Styles are inline JS objects at the bottom of each file (`const styles = {}`).
Do not introduce CSS-in-JS libraries or new `.css` files except for page-level styles.

**S3 — Direct Anthropic `fetch`, no SDK.**
All AI calls use raw `fetch` with headers `x-api-key`,
`anthropic-dangerous-direct-browser-access`, and `anthropic-version: 2023-06-01`.
Use `claude-sonnet-4-6` for generation (streaming SSE), `claude-haiku-4-5-20251001`
for extraction (low tokens). Do not add an Anthropic SDK dependency.
Individual feedback uses the Anthropic tool use API (`tool_choice: { type: 'any' }` with
`FEEDBACK_TOOL` schema); `runToolStream` in `streamUtils.js` handles `input_json_delta`
events and fires `onToolInput(parsedInput)` for each complete tool call block.
WCF still uses plain text streaming via `runStream`.

**S4 — Asymptotic progress bars.**
Long async operations animate progress with `setInterval` at 250 ms:
`step = Math.max((cap - progress) * 0.02, 0.5)`. This logic lives in
`useProgressSimulation.js` — import and reuse it for any new streaming feature;
do not duplicate the interval logic or use a library.

**S5 — Early-return validation.**
Input guards use a `validateInputs()` pattern that returns an error string or
`null`. Handle errors in `try/catch`, store in `*Error` state, display in a
styled red error box. No toast libraries.

## 5. Key Constraints

- `classUtils.js` must not be refactored — any change risks silent data-parsing
  regressions with real teacher spreadsheets.
- `activeOutput` (`null | 'wcf' | 'individual'`) enforces mutual exclusion of
  output panels. Maintain this invariant for any new output type.
- The app has **no backend**. Never suggest server-side solutions.
- No TypeScript. Keep all files as `.js` / `.jsx`.
