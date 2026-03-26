# Architecture

## Overview

UK Science Teacher Tool is a browser-based React application that helps secondary science teachers analyse class exam results and produce feedback. A teacher uploads an Excel spreadsheet of student scores, fills in a few form fields, and can optionally upload an exam question paper PDF. They can then generate either a structured Whole Class Feedback (WCF) sheet or personalised WWW/EBI/To-Improve feedback for every student. All AI analysis is performed by calling the Claude API directly from the browser.

---

## File Structure

```
src/
├── App.jsx
│   Root component. Owns all shared state (studentData, form fields, activeOutput).
│   Uses usePdfExtraction for PDF question state (questionTexts, questionPdfStatus).
│   Holds the shared callClaude helper and the reset handler. Composes UploadPanel,
│   ClassFeedbackPanel, and IndividualFeedbackPanel. Derives chart data (questionStats,
│   scoreDistribution) from studentData without additional API calls.
│
├── FileUpload.jsx
│   Self-contained file-input component. Reads the selected .xlsx/.xls file with
│   SheetJS (xlsx), converts the first sheet to JSON rows, and calls onDataParsed
│   with the result. Displays the file name and parsed row count.
│
├── classUtils.js
│   Core data-parsing module. Exports computeClassSummary, extractStudentsForFeedback,
│   and formatSummaryForPrompt. Handles both the Educake export format (detected by
│   column names) and a generic format. All prompt data and chart data originates here.
│   *** DO NOT REFACTOR — see "Do Not Touch" section below. ***
│
├── components/
│   │
│   ├── UploadPanel.jsx
│   │   Form panel containing the Exam Board and Subject selects, Topic and Grade
│   │   Boundaries text inputs, the PdfDropZone, the FileUpload component, action
│   │   buttons (Generate Class Feedback Sheet / Generate Individual Feedback), Start
│   │   Over, and progress bars. Purely presentational — all state and handlers come
│   │   from App via props.
│   │
│   ├── PdfDropZone.jsx
│   │   Always-visible "Question paper" section rendered between Grade Boundaries and
│   │   the Excel upload. Manages drag-over highlight state locally; all other state
│   │   (questionPdfStatus, questionTexts) comes from App via props.
│   │   Four display states driven by questionPdfStatus:
│   │     idle   — dashed drop zone with SVG document icon; accepts PDF files only
│   │     loading — CSS spinner (.pdf-spinner) + "Extracting questions…"
│   │     error  — red inline message with "try again" retry link (resets to idle)
│   │     ready  — success banner, numbered auto-resize textareas (one per question),
│   │              "Clear question paper" link below the list
│   │   Contains a private AutoResizeTextarea helper that uses a ref + useEffect to
│   │   set height:'auto' then scrollHeight on every value change.
│   │
│   ├── ClassFeedback/
│   │   │
│   │   ├── ClassFeedbackPanel.jsx
│   │   │   Renders the full WCF sheet: a dark header with exam metadata, the
│   │   │   PerformanceDashboard, and six FeedbackSection instances. Derives stat-card
│   │   │   values from studentData by calling computeClassSummary directly.
│   │   │
│   │   ├── PerformanceDashboard.jsx
│   │   │   Tabbed chart panel (Overview / Per Question / Score Distribution) rendered
│   │   │   between the WCF header and the written sections. Uses Recharts BarChart.
│   │   │   Overview shows four stat cards; Per Question shows a horizontal colour-banded
│   │   │   bar chart with 60 % and 80 % reference lines; Score Distribution shows a
│   │   │   vertical histogram of total scores.
│   │   │
│   │   └── FeedbackSection.jsx
│   │       Stateless component. Renders a single numbered, colour-coded WCF section
│   │       (numbered badge, title, bullet list) from an items array. Colour theme is
│   │       passed entirely via props (color, bg, border).
│   │
│   └── IndividualFeedback/
│       │
│       ├── IndividualFeedbackPanel.jsx
│       │   Renders the individual feedback panel: a header row with student count and
│       │   "Download as Word Document" button, followed by a list of StudentCard
│       │   components, one per student.
│       │
│       └── StudentCard.jsx
│           Stateless component. Receives a single student object and renders either a
│           WWW / EBI / To Improve card (completers) or an italic non-completer note.
│           Non-completer detection: ebi and to_improve are both absent or empty.
│
├── hooks/
│   │
│   ├── useClassFeedback.js
│   │   Custom hook encapsulating all WCF feature state: wcfData, wcfLoading, wcfError,
│   │   wcfProgress. Runs an asymptotic progress animation via setInterval while loading.
│   │   Accepts questionTexts from App; if non-empty, prepends a "Question paper: Q1: …"
│   │   line to the prompt before the class data block. Calls callClaude (max_tokens 4000),
│   │   strips JSON fences, and parses the response.
│   │
│   ├── useIndividualFeedback.js
│   │   Custom hook for the individual feedback feature: feedbackData, feedbackLoading,
│   │   feedbackError, feedbackSuccess, feedbackProgress. Accepts questionTexts from App;
│   │   if non-empty, prepends the same "Question paper: Q1: …" line before the student
│   │   data block. Calls callClaude (max_tokens 8000), strips JSON fences, parses the
│   │   response. Also exposes handleDownloadWordDoc, which delegates to
│   │   docUtils.downloadFeedbackDoc.
│   │
│   └── usePdfExtraction.js
│       Custom hook that owns PDF question extraction state: questionTexts (string[]) and
│       questionPdfStatus ('idle' | 'loading' | 'ready' | 'error'). Exposes:
│         extractQuestionsFromPdf(file) — reads the File as a base64 data URL via
│           FileReader, strips the data-URL prefix, POSTs to the Anthropic API with a
│           document content block (type:'document', source.type:'base64',
│           media_type:'application/pdf') plus a text extraction prompt. Model is
│           claude-haiku-4-5-20251001 (hardcoded), max_tokens 1000. Strips markdown
│           fences, JSON.parses the result, and sets questionTexts + status:'ready'.
│           On any error: logs to console and sets status:'error'.
│         updateQuestionText(index, text) — functional setState update for live editing.
│         clearQuestionTexts() — resets both state values to their initial values.
│
└── utils/
    └── docUtils.js
        Exports downloadFeedbackDoc. Builds a .docx file using the docx library: a TITLE
        paragraph with subject, topic, and date, then one HEADING_1 per student followed
        by WWW/EBI/To-Improve paragraphs (completers) or an italic non-completer note.
        Triggers a browser download via a temporary <a> element.
```

---

## Key Design Decisions

### The `activeOutput` mutual-exclusion pattern in App.jsx

`activeOutput` is a single state string — `null`, `'wcf'`, or `'individual'` — that determines which output panel is visible. Only one panel renders at a time. When either action button is clicked, the wrapper handler in App (`onClickGenerateWCF` / `onClickGenerateFeedback`) first clears the *other* feature's data and error before delegating to the hook handler. This prevents two large output panels from appearing simultaneously, avoids stale results from a previous action remaining on screen while a new one loads, and keeps the UI unambiguous about what the current result represents.

### Separation of API logic into hooks

`useClassFeedback`, `useIndividualFeedback`, and `usePdfExtraction` each own their feature's state, API interaction, and error handling. This keeps App.jsx lean: it is responsible only for shared state (student data, form fields, active output) and the `callClaude` transport helper. `usePdfExtraction` makes its own `fetch` call directly (rather than using `callClaude`) because it sends a multi-part `content` array with a document block — a structure that `callClaude`'s simple text-only signature does not accommodate. Moving API logic into hooks also makes each feature independently testable and prevents the root component from growing into a monolithic file as features are added.

### `classUtils.js` is kept untouched during refactors

The parsing logic in `classUtils.js` handles two structurally different Excel formats (Educake and generic) and contains several hard-won heuristics — column detection, name validation, metadata-row exclusion, and the Educake `__EMPTY_N` key offset calculation. These heuristics were developed incrementally and are not backed by a test suite. Refactoring this file risks introducing subtle regressions in data parsing that would silently corrupt every downstream calculation and Claude prompt. It is treated as a stable black box: its public exports (`computeClassSummary`, `extractStudentsForFeedback`, `formatSummaryForPrompt`) are a fixed contract; their internals are not changed unless a specific parsing bug is being fixed.

### Stateless design of `StudentCard.jsx`

`StudentCard` receives a single `student` object as its only prop and has no internal state. It was built this way because each card's content is fully determined by the API response stored in `feedbackData`; there is nothing in the card that the user can interact with or modify. Keeping it stateless means the component is pure and predictable — the same props always produce the same output — and it can be rendered cheaply in a list of any size without coordination between instances.

---

## Data Flow

1. **Upload**: The teacher selects an Excel file in `FileUpload`. SheetJS parses it into an array of row objects and calls `onDataParsed`, which sets `studentData` in App.

2. **PDF route (optional)**: The teacher drops or selects a PDF in `PdfDropZone`. The component calls `extractQuestionsFromPdf` from `usePdfExtraction`. The hook reads the file as a base64 data URL, strips the prefix, and POSTs to the Anthropic API with a document content block (`claude-haiku-4-5-20251001`, max_tokens 1000). The response is stripped of markdown fences and parsed into `questionTexts`. Status transitions: `idle` → `loading` → `ready` (or `error`). In the ready state, `PdfDropZone` renders an editable numbered list; each keystroke calls `updateQuestionText`, which updates `questionTexts` in the hook via functional setState. Both Generate buttons show a "✓ With question context" badge while `questionTexts.length > 0`.

3. **WCF path**: The teacher clicks "Generate Class Feedback Sheet". App's `onClickGenerateWCF` clears any existing individual-feedback state, then calls `handleGenerateWCF` from `useClassFeedback`. The hook calls `computeClassSummary` and `formatSummaryForPrompt` (classUtils) to build a compact text summary. If `questionTexts` is non-empty, a `Question paper: Q1: … Q2: …` line is prepended before the class data block. The hook calls `callClaude` (max_tokens 4000). The raw response text has any markdown JSON fences stripped before `JSON.parse`. The parsed object is stored in `wcfData` and `activeOutput` is set to `'wcf'`. App renders `ClassFeedbackPanel`, which passes pre-computed `questionStats` and `scoreDistribution` (derived in App from `studentData`) to `PerformanceDashboard`.

4. **Individual feedback path**: The teacher clicks "Generate Individual Feedback". App's `onClickGenerateFeedback` clears WCF state, then calls `handleGenerateFeedback` from `useIndividualFeedback`. The hook calls `extractStudentsForFeedback` (classUtils) to get a flat student list. If `questionTexts` is non-empty, the same `Question paper:` line is prepended before the student data block. The hook calls `callClaude` (max_tokens 8000). JSON fences are stripped and the array is parsed into `feedbackData`. `activeOutput` is set to `'individual'`. App renders `IndividualFeedbackPanel`, which maps `feedbackData` to `StudentCard` components.

5. **Word download**: The teacher clicks "Download as Word Document". `handleDownloadWordDoc` in `useIndividualFeedback` calls `downloadFeedbackDoc` (docUtils), which builds a `.docx` document using the docx library and triggers a browser download via a temporary anchor element.

---

## API Usage

| Purpose | Model | max_tokens | Transport |
|---------|-------|-----------|-----------|
| WCF generation | `claude-sonnet-4-6` | 4000 | `callClaude` (text-only) |
| Individual feedback | `claude-sonnet-4-6` | 8000 | `callClaude` (text-only) |
| PDF question extraction | `claude-haiku-4-5-20251001` | 1000 | Direct `fetch` with document block |

- **PDF document block**: `usePdfExtraction` sends a multi-part `content` array: a `{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: <base64> } }` block followed by a text block with the extraction prompt. This format is not compatible with the `callClaude` helper (which accepts only a plain string prompt), so the hook makes its own `fetch` call with the same API headers.
- **JSON fence stripping**: All three hooks apply `rawText.replace(/^```(?:json)?\s*/m, '').replace(/```\s*$/, '').trim()` before `JSON.parse`. This handles cases where the model wraps its response in a markdown code block despite being instructed not to.
- **Why JSON responses**: All three features need structured data. Requesting JSON means responses can be parsed directly into state without additional text processing. The prompts explicitly forbid preamble, markdown fences, and extra text to maximise the chance of a clean parse on the first attempt.

---

## Do Not Touch

| File | Reason |
|------|--------|
| `src/classUtils.js` | Contains battle-tested heuristics for parsing both Educake and generic Excel formats. Do not refactor — changes risk silent data-parsing regressions. |
