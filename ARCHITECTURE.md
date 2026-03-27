# Architecture

## Overview

TeacherDesk is a browser-based React application that helps UK secondary science teachers analyse class exam results and produce feedback. The app is split into two routes: a public landing page at `/` and the password-gated tool at `/app`. Once inside, a teacher uploads an Excel spreadsheet of student scores, fills in a few form fields, and can optionally upload an exam question paper PDF. They can then generate either a structured Whole Class Feedback (WCF) sheet or personalised WWW/EBI/To-Improve feedback for every student. All AI analysis is performed by calling the Claude API directly from the browser.

---

## File Structure

```
vercel.json
│   Catch-all rewrite ({ "source": "/(.*)", "destination": "/index.html" })
│   so React Router routes resolve correctly on Vercel after a hard refresh
│   or direct URL navigation.
│
src/
├── main.jsx
│   Router root. Wraps the app in BrowserRouter with two Routes:
│     /    → <LandingPage />  (public, no auth)
│     /app → <AppPage />      (password-gated tool)
│
├── App.jsx
│   Root component of the tool itself (rendered inside AppPage). Owns all
│   shared state (studentData, form fields, activeOutput). Uses
│   usePdfExtraction for PDF question state (questionTexts, questionPdfStatus).
│   Holds the shared callClaude helper and the reset handler. Composes
│   UploadPanel, ClassFeedbackPanel, and IndividualFeedbackPanel. Derives
│   chart data (questionStats, scoreDistribution) from studentData without
│   additional API calls.
│
├── FileUpload.jsx
│   Self-contained file-input component. Reads the selected .xlsx/.xls file
│   with SheetJS (xlsx), converts the first sheet to JSON rows, and calls
│   onDataParsed with the result. Displays the file name and parsed row count.
│
├── classUtils.js
│   Core data-parsing module. Exports computeClassSummary,
│   extractStudentsForFeedback, and formatSummaryForPrompt. Handles both the
│   Educake export format (detected by column names) and a generic format.
│   All prompt data and chart data originates here.
│   *** DO NOT REFACTOR — see "Do Not Touch" section below. ***
│
├── pages/
│   │
│   ├── AppPage.jsx
│   │   Thin wrapper rendered at /app. Composes PasswordGate around App so
│   │   the password check applies only to the /app route and App itself
│   │   remains unaware of authentication.
│   │
│   ├── LandingPage.jsx
│   │   Public marketing page rendered at /. Full-viewport video hero: a
│   │   <video autoPlay muted loop playsInline> pointing at /hero-bg.mp4
│   │   sits position:fixed at z-index 0; a dark overlay (rgba(8,12,28,0.58))
│   │   at z-index 1 dims it; hero content (eyebrow, TeacherDesk h1, payoff
│   │   line, CTA button, privacy note) sits at z-index 2. Below the fold:
│   │   a "How It Works" strip on a solid #0f172a background (z-index 1,
│   │   scrolls over the fixed video) with four glassmorphism feature cards
│   │   and a second CTA. Footer shows copyright and version. Both CTAs call
│   │   useNavigate('/app'). Styles split between LandingPage.css (responsive
│   │   grid, hover states, fluid clamp() sizes) and inline style objects.
│   │
│   └── LandingPage.css
│       Responsive styles for LandingPage. .td-features-grid collapses from
│       repeat(4, 1fr) to repeat(2, 1fr) at ≤900 px. .td-cta-btn defines
│       background, hover colour, and transition. .td-hero-title and
│       .td-hero-payoff use clamp() for fluid font scaling. Card and section
│       padding reduce at ≤640 px.
│
├── components/
│   │
│   ├── PasswordGate.jsx
│   │   Full-screen password gate rendered by AppPage. On mount, checks
│   │   sessionStorage key td_auth; if 'true', renders children immediately
│   │   without showing the gate. Otherwise renders a centred white card on
│   │   a dark navy (#0f172a) background with a password <input> and Enter
│   │   button. Reads the correct password from
│   │   import.meta.env.VITE_ACCESS_PASSWORD. On correct entry calls
│   │   sessionStorage.setItem('td_auth', 'true') and renders children. On
│   │   wrong entry shows inline error: "Incorrect password — please try
│   │   again" and clears the input. No lockout logic.
│   │
│   ├── UploadPanel.jsx
│   │   Form panel containing the Exam Board and Subject selects, Topic and
│   │   Grade Boundaries text inputs, the PdfDropZone, the FileUpload
│   │   component, action buttons (Generate Class Feedback Sheet / Generate
│   │   Individual Feedback), Start Over, and progress bars. Purely
│   │   presentational — all state and handlers come from App via props.
│   │
│   ├── PdfDropZone.jsx
│   │   Always-visible "Question paper" section rendered between Grade
│   │   Boundaries and the Excel upload. Manages drag-over highlight state
│   │   locally; all other state (questionPdfStatus, questionTexts) comes
│   │   from App via props.
│   │   Four display states driven by questionPdfStatus:
│   │     idle    — dashed drop zone with SVG document icon; accepts PDF only
│   │     loading — CSS spinner (.pdf-spinner) + "Extracting questions…"
│   │     error   — red inline message with "try again" retry link
│   │     ready   — success banner, numbered auto-resize textareas (one per
│   │               question), "Clear question paper" link below the list
│   │   Contains a private AutoResizeTextarea helper that uses a ref +
│   │   useEffect to set height:'auto' then scrollHeight on every value change.
│   │
│   ├── ClassFeedback/
│   │   │
│   │   ├── ClassFeedbackPanel.jsx
│   │   │   Renders the full WCF sheet: a dark header with exam metadata, the
│   │   │   PerformanceDashboard, and six FeedbackSection instances. Derives
│   │   │   stat-card values from studentData by calling computeClassSummary
│   │   │   directly.
│   │   │
│   │   ├── PerformanceDashboard.jsx
│   │   │   Tabbed chart panel (Overview / Per Question / Score Distribution)
│   │   │   rendered between the WCF header and the written sections. Uses
│   │   │   Recharts BarChart. Overview shows four stat cards; Per Question
│   │   │   shows a horizontal colour-banded bar chart with 60 % and 80 %
│   │   │   reference lines; Score Distribution shows a vertical histogram.
│   │   │
│   │   └── FeedbackSection.jsx
│   │       Stateless component. Renders a single numbered, colour-coded WCF
│   │       section (numbered badge, title, bullet list) from an items array.
│   │       Colour theme passed entirely via props (color, bg, border).
│   │
│   └── IndividualFeedback/
│       │
│       ├── IndividualFeedbackPanel.jsx
│       │   Renders the individual feedback panel: a header row with student
│       │   count and "Download as Word Document" button, followed by a list
│       │   of StudentCard components, one per student.
│       │
│       └── StudentCard.jsx
│           Stateless component. Receives a single student object and renders
│           either a WWW / EBI / To Improve card (completers) or an italic
│           non-completer note. Non-completer detection: ebi and to_improve
│           are both absent or empty.
│
├── hooks/
│   │
│   ├── useClassFeedback.js
│   │   Custom hook encapsulating all WCF feature state: wcfData, wcfLoading,
│   │   wcfError, wcfProgress. Runs an asymptotic progress animation via
│   │   setInterval while loading. Accepts questionTexts from App; if
│   │   non-empty, prepends a "Question paper: Q1: …" line to the prompt.
│   │   Calls callClaude (max_tokens 4000), strips JSON fences, parses.
│   │
│   ├── useIndividualFeedback.js
│   │   Custom hook for individual feedback: feedbackData, feedbackLoading,
│   │   feedbackError, feedbackSuccess, feedbackProgress. Accepts
│   │   questionTexts from App; if non-empty, prepends the same
│   │   "Question paper:" line. Calls callClaude (max_tokens 8000), strips
│   │   JSON fences, parses. Also exposes handleDownloadWordDoc, which
│   │   delegates to docUtils.downloadFeedbackDoc.
│   │
│   └── usePdfExtraction.js
│       Custom hook owning PDF question extraction state: questionTexts
│       (string[]) and questionPdfStatus ('idle'|'loading'|'ready'|'error').
│       Exposes:
│         extractQuestionsFromPdf(file) — reads as base64 via FileReader,
│           strips data-URL prefix, POSTs to Anthropic API with a document
│           content block (claude-haiku-4-5-20251001, max_tokens 1000).
│           Strips markdown fences, JSON.parses into questionTexts.
│         updateQuestionText(index, text) — functional setState for editing.
│         clearQuestionTexts() — resets both state values to initial.
│
└── utils/
    └── docUtils.js
        Exports downloadFeedbackDoc. Builds a .docx file using the docx
        library: a TITLE paragraph with subject, topic, and date, then one
        HEADING_1 per student followed by WWW/EBI/To-Improve paragraphs
        (completers) or an italic non-completer note. Triggers a browser
        download via a temporary <a> element.
```

---

## Key Design Decisions

### Routing: public landing page at `/`, gated tool at `/app`

`main.jsx` installs `BrowserRouter` and declares two `<Route>` entries. The `/` route renders `LandingPage` with no authentication requirement — it is intentionally public so teachers can be directed to the product without needing the password first. The `/app` route renders `AppPage`, which wraps `App` in `PasswordGate`. Keeping the gate in `AppPage` rather than inside `App` means `App` itself remains unaware of authentication; the gate can be removed or swapped without touching the tool's core component. A `vercel.json` catch-all rewrite ensures both routes resolve correctly on Vercel after a hard refresh or direct URL navigation.

### PasswordGate: sessionStorage-based, env-var secret

`PasswordGate` stores successful authentication in `sessionStorage` (key `td_auth`, value `'true'`) rather than in React state alone, so the gate does not re-appear if the teacher reloads the page within the same browser session. The correct password is read from `import.meta.env.VITE_ACCESS_PASSWORD` at module evaluation time; no network call is made. The gate has no lockout logic — it is a lightweight access barrier, not a security system.

### The `activeOutput` mutual-exclusion pattern in App.jsx

`activeOutput` is a single state string — `null`, `'wcf'`, or `'individual'` — that determines which output panel is visible. Only one panel renders at a time. When either action button is clicked, the wrapper handler in App (`onClickGenerateWCF` / `onClickGenerateFeedback`) first clears the *other* feature's data and error before delegating to the hook handler. This prevents two large output panels from appearing simultaneously and keeps the UI unambiguous about what the current result represents.

### Separation of API logic into hooks

`useClassFeedback`, `useIndividualFeedback`, and `usePdfExtraction` each own their feature's state, API interaction, and error handling. This keeps App.jsx lean: it is responsible only for shared state (student data, form fields, active output) and the `callClaude` transport helper. `usePdfExtraction` makes its own `fetch` call directly (rather than using `callClaude`) because it sends a multi-part `content` array with a document block — a structure that `callClaude`'s simple text-only signature does not accommodate.

### `classUtils.js` is kept untouched during refactors

The parsing logic in `classUtils.js` handles two structurally different Excel formats (Educake and generic) and contains several hard-won heuristics — column detection, name validation, metadata-row exclusion, and the Educake `__EMPTY_N` key offset calculation. These heuristics were developed incrementally and are not backed by a test suite. Refactoring this file risks introducing subtle regressions in data parsing that would silently corrupt every downstream calculation and Claude prompt. It is treated as a stable black box: its public exports (`computeClassSummary`, `extractStudentsForFeedback`, `formatSummaryForPrompt`) are a fixed contract; their internals are not changed unless a specific parsing bug is being fixed.

### Stateless design of `StudentCard.jsx`

`StudentCard` receives a single `student` object as its only prop and has no internal state. It was built this way because each card's content is fully determined by the API response stored in `feedbackData`; there is nothing in the card that the user can interact with or modify. Keeping it stateless means the component is pure and predictable — the same props always produce the same output.

---

## Data Flow

1. **Landing**: The teacher visits `/`. `LandingPage` renders with no authentication. Clicking "Log in to TeacherDesk" navigates to `/app`.

2. **Password gate**: `AppPage` renders `PasswordGate` wrapping `App`. On mount, `PasswordGate` checks `sessionStorage.getItem('td_auth')`; if already `'true'`, children render immediately. Otherwise the gate UI is shown. On correct password entry, `sessionStorage` is set and children render.

3. **Upload**: The teacher selects an Excel file in `FileUpload`. SheetJS parses it into an array of row objects and calls `onDataParsed`, which sets `studentData` in App.

4. **PDF route (optional)**: The teacher drops or selects a PDF in `PdfDropZone`. The component calls `extractQuestionsFromPdf` from `usePdfExtraction`. The hook reads the file as a base64 data URL, strips the prefix, and POSTs to the Anthropic API with a document content block (`claude-haiku-4-5-20251001`, max_tokens 1000). The response is parsed into `questionTexts`. Status transitions: `idle` → `loading` → `ready` (or `error`).

5. **WCF path**: The teacher clicks "Generate Class Feedback Sheet". App's `onClickGenerateWCF` clears any existing individual-feedback state, then calls `handleGenerateWCF` from `useClassFeedback`. The hook calls `computeClassSummary` and `formatSummaryForPrompt` (classUtils) to build a compact text summary, prepends question context if present, calls `callClaude` (max_tokens 4000), strips JSON fences, and parses into `wcfData`.

6. **Individual feedback path**: The teacher clicks "Generate Individual Feedback". App's `onClickGenerateFeedback` clears WCF state, then calls `handleGenerateFeedback` from `useIndividualFeedback`. The hook calls `extractStudentsForFeedback` (classUtils), prepends question context if present, calls `callClaude` (max_tokens 8000), and parses into `feedbackData`.

7. **Word download**: The teacher clicks "Download as Word Document". `handleDownloadWordDoc` in `useIndividualFeedback` calls `downloadFeedbackDoc` (docUtils), which builds a `.docx` file and triggers a browser download.

---

## API Usage

| Purpose | Model | max_tokens | Transport |
|---------|-------|-----------|-----------|
| WCF generation | `claude-sonnet-4-6` | 4000 | `callClaude` (text-only) |
| Individual feedback | `claude-sonnet-4-6` | 8000 | `callClaude` (text-only) |
| PDF question extraction | `claude-haiku-4-5-20251001` | 1000 | Direct `fetch` with document block |

- **PDF document block**: `usePdfExtraction` sends a multi-part `content` array with a `{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: <base64> } }` block followed by a text prompt. This format is not compatible with `callClaude`, so the hook makes its own `fetch` call.
- **JSON fence stripping**: All three hooks apply `rawText.replace(/^```(?:json)?\s*/m, '').replace(/```\s*$/, '').trim()` before `JSON.parse`.

---

## Dependencies

| Package | Purpose |
|---------|---------|
| `react`, `react-dom` | UI framework |
| `react-router-dom` | Client-side routing (BrowserRouter, Routes, Route, useNavigate) |
| `recharts` | Bar charts in PerformanceDashboard |
| `xlsx` | Excel file parsing in FileUpload |
| `docx` | Word document generation in docUtils |

---

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_ANTHROPIC_API_KEY` | Yes | Anthropic API key used by all three AI features |
| `VITE_ACCESS_PASSWORD` | Yes | Password checked by PasswordGate on the /app route |

See `.env.example` for the template.

---

## Do Not Touch

| File | Reason |
|------|--------|
| `src/classUtils.js` | Contains battle-tested heuristics for parsing both Educake and generic Excel formats. Do not refactor — changes risk silent data-parsing regressions. |
