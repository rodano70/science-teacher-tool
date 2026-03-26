# Architecture

## Overview

UK Science Teacher Tool is a browser-based React application that helps secondary science teachers analyse class exam results and produce feedback. A teacher uploads an Excel spreadsheet of student scores, fills in a few form fields, and can generate either a structured Whole Class Feedback (WCF) sheet or personalised WWW/EBI/To-Improve feedback for every student. All AI analysis is performed by calling the Claude API directly from the browser.

---

## File Structure

```
src/
├── App.jsx
│   Root component. Owns all shared state (studentData, form fields, activeOutput),
│   the shared callClaude helper, and the reset handler. Composes UploadPanel,
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
│   │   Boundaries text inputs, the FileUpload component, action buttons (Generate
│   │   Class Feedback Sheet / Generate Individual Feedback), Start Over, and progress
│   │   bars. Purely presentational — all state and handlers come from App via props.
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
│   │   Builds the Claude prompt from the class summary, calls callClaude (max_tokens 4000),
│   │   strips JSON fences, and parses the response.
│   │
│   └── useIndividualFeedback.js
│       Custom hook for the individual feedback feature: feedbackData, feedbackLoading,
│       feedbackError, feedbackSuccess, feedbackProgress. Calls callClaude (max_tokens 8000),
│       strips JSON fences, parses the response. Also exposes handleDownloadWordDoc, which
│       delegates to docUtils.downloadFeedbackDoc.
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

`useClassFeedback` and `useIndividualFeedback` each own their feature's loading state, progress animation, API interaction, JSON parsing, and error handling. This keeps App.jsx lean: it is responsible only for shared state (student data, form fields, active output) and the `callClaude` transport helper. Moving API logic into hooks also makes each feature independently testable and prevents the root component from growing into a monolithic file as features are added.

### `classUtils.js` is kept untouched during refactors

The parsing logic in `classUtils.js` handles two structurally different Excel formats (Educake and generic) and contains several hard-won heuristics — column detection, name validation, metadata-row exclusion, and the Educake `__EMPTY_N` key offset calculation. These heuristics were developed incrementally and are not backed by a test suite. Refactoring this file risks introducing subtle regressions in data parsing that would silently corrupt every downstream calculation and Claude prompt. It is treated as a stable black box: its public exports (`computeClassSummary`, `extractStudentsForFeedback`, `formatSummaryForPrompt`) are a fixed contract; their internals are not changed unless a specific parsing bug is being fixed.

### Stateless design of `StudentCard.jsx`

`StudentCard` receives a single `student` object as its only prop and has no internal state. It was built this way because each card's content is fully determined by the API response stored in `feedbackData`; there is nothing in the card that the user can interact with or modify. Keeping it stateless means the component is pure and predictable — the same props always produce the same output — and it can be rendered cheaply in a list of any size without coordination between instances.

---

## Data Flow

1. **Upload**: The teacher selects an Excel file in `FileUpload`. SheetJS parses it into an array of row objects and calls `onDataParsed`, which sets `studentData` in App.

2. **WCF path**: The teacher clicks "Generate Class Feedback Sheet". App's `onClickGenerateWCF` clears any existing individual-feedback state, then calls `handleGenerateWCF` from `useClassFeedback`. The hook calls `computeClassSummary` and `formatSummaryForPrompt` (classUtils) to build a compact text summary, constructs a prompt requesting a JSON object with six specific keys, and calls `callClaude` (max_tokens 4000). The raw response text has any markdown JSON fences stripped before `JSON.parse`. The parsed object is stored in `wcfData` and `activeOutput` is set to `'wcf'`. App renders `ClassFeedbackPanel`, which passes pre-computed `questionStats` and `scoreDistribution` (derived in App from `studentData`) to `PerformanceDashboard`.

3. **Individual feedback path**: The teacher clicks "Generate Individual Feedback". App's `onClickGenerateFeedback` clears WCF state, then calls `handleGenerateFeedback` from `useIndividualFeedback`. The hook calls `extractStudentsForFeedback` (classUtils) to get a flat student list, constructs a prompt requesting a JSON array with one object per student (name, score, www, ebi, to_improve), and calls `callClaude` (max_tokens 8000). JSON fences are stripped and the array is parsed into `feedbackData`. `activeOutput` is set to `'individual'`. App renders `IndividualFeedbackPanel`, which maps `feedbackData` to `StudentCard` components.

4. **Word download**: The teacher clicks "Download as Word Document". `handleDownloadWordDoc` in `useIndividualFeedback` calls `downloadFeedbackDoc` (docUtils), which builds a `.docx` document using the docx library and triggers a browser download via a temporary anchor element.

---

## API Usage

- **Model**: `claude-sonnet-4-6`
- **max_tokens**: 4000 for WCF generation; 8000 for individual feedback (longer because it generates one entry per student)
- **JSON fence stripping**: Both hooks apply `rawText.replace(/^```(?:json)?\s*/m, '').replace(/```\s*$/, '').trim()` before `JSON.parse`. This handles cases where the model wraps its JSON response in a markdown code block despite being instructed not to.
- **Why JSON responses**: Both features need structured data to render UI (section bullet lists for WCF; per-student fields for individual feedback). Requesting JSON means the response can be parsed directly into state without additional text processing. The prompts explicitly forbid preamble, markdown fences, and extra text to maximise the chance of a clean parse on the first attempt.

---

## Do Not Touch

| File | Reason |
|------|--------|
| `src/classUtils.js` | Contains battle-tested heuristics for parsing both Educake and generic Excel formats. Do not refactor — changes risk silent data-parsing regressions. |
