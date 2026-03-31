# Changelog

## v0.22f — Dedicated feedback page, correct pill colours, hero title consistency

- App.jsx: UploadPanel and output panels are now mutually exclusive — clicking either
  Generate button shows only the feedback panel; the upload form is hidden. A "Resume"
  bar appears below the upload form when prior output exists, letting the teacher jump
  back to it without regenerating. `onBack` prop added to IndividualFeedbackPanel;
  clicking "← Back to Setup" returns to the upload view with all state (studentData,
  feedbackData, form fields) intact. WCF panel can be resumed the same way.
  Removed the now-unnecessary scroll-to-view useEffect and outputRef.
- IndividualFeedbackPanel.jsx: added `normalizeName` helper that strips commas,
  lowercases, splits on whitespace and sorts words alphabetically; breakdownMap now
  stores both a direct key (classUtils format, e.g. "John Smith") and a normalized key
  (e.g. "john smith"); `getBreakdown` tries direct match first, then normalized — this
  fixes the all-red pills caused by classUtils producing "Firstname Lastname" while
  Claude returns "Surname, Firstname" per the prompt instruction
- IndividualFeedbackPanel.jsx: hero title redesigned to match UploadPanel exactly —
  11px/700 "Assessment Intelligence" eyebrow in --color-outline, 44px/800 h1 in
  --color-on-surface with primary-coloured "Feedback Review" accent span; exam/subject/
  topic context line kept as a smaller uppercase subtitle below the h1; wrapper
  border-top and marginTop removed (panel is now a full-page view, not appended below)
- IndividualFeedbackPanel.jsx: "← Back to Setup" button added to action bar (ghost
  style: transparent bg, outline-variant border); sits at left of action bar;
  action bar replaces old header row

## v0.22e — Bug fixes: panel navigation, pill colours, student counts

- App.jsx: added `outputRef` on the output section div and a `useEffect` that calls
  `scrollIntoView({ behavior: 'smooth', block: 'start' })` when `activeOutput` becomes
  non-null, so clicking Generate brings the feedback panel into view immediately
- IndividualFeedbackPanel.jsx: the Anthropic API response does not echo back the
  `breakdown` string; added `extractStudentsForFeedback(studentData)` call to build a
  `name → breakdown` map from the original Excel data; breakdown merged into each student
  object before passing to StudentCard so pills now correctly colour correct vs incorrect
- IndividualFeedbackPanel.jsx: "Total Students" and "No Submission" stats now derived from
  the classUtils-parsed `rawStudents` array (accurate Excel headcount) rather than
  `feedbackData.length`, which undercounts when API JSON lines fail to parse near the
  token limit; "Feedback Generated" still shows the live streamed count

## v0.22 — Individual feedback panel: instant navigation, question pills, click-to-edit, edited Word export

- App.jsx: `setActiveOutput('individual')` moved to top of `onClickGenerateFeedback` so the
  panel appears immediately on click (before the first streamed card arrives); render
  condition relaxed to `activeOutput === 'individual'` — panel handles null feedbackData
  gracefully via `|| []`
- AppPage.jsx: `activeStep` state added; `handleStepChange` callback passed to App as
  `onStepChange` and to AppShell as `activeStep`
- AppShell.jsx: accepts `activeStep` prop (default 0); stepper now highlights the correct
  step dynamically — step 0 ("1. Upload") when no output, step 1 ("2. Feedback") when
  either WCF or individual output is active
- App.jsx: `useEffect` wires `activeOutput` → step index and calls `onStepChange`;
  `questionTexts` and `onDownloadSuccess` (= `setFeedbackSuccess`) passed to
  IndividualFeedbackPanel
- IndividualFeedbackPanel.jsx: imports `useRef` and `downloadFeedbackDoc` directly; adds
  `editsRef` (useRef) seeded from student API values in a useEffect that runs whenever the
  students array grows; `onChange` callback passed to each StudentCard writes field edits
  into editsRef without triggering re-renders; `handleDownload` builds `exportData` from
  editsRef (normalising camelCase `toImprove` → snake_case `to_improve` for docUtils) and
  calls `downloadFeedbackDoc` directly; download button wired to `handleDownload`; CSS for
  `.sc-field-wrapper` / `.sc-field-pencil` hover reveal added to the panel's `<style>` block
- StudentCard.jsx: now stateful — accepts `questionTexts` and `onChange` props; local
  `wwwValue` / `ebiValue` / `toImproveValue` state initialised from student props;
  `isEditingWww` / `isEditingEbi` / `isEditingToImprove` booleans; textarea refs + useEffect
  auto-resize; click wrapper uses `.sc-field-wrapper` class; pencil icon uses `.sc-field-pencil`;
  onBlur commits edit via `onChange` callback; Escape key blurs the active textarea
- StudentCard.jsx — pill strip: renders below the score badge in the left column when
  `questionTexts` is a non-empty array; 18 × 18 px pills in a flex-wrap row (gap 3px);
  correct = `var(--color-primary-container)`, incorrect = `rgba(254,137,131,0.5)`; hover
  triggers a popover (position absolute, bottom calc(100% + 6px), z-index 100) showing
  question number + correct/incorrect label + full question text; non-completer cards
  unaffected

## v0.21 — Individual Feedback streaming and Academic Curator restyle

- useIndividualFeedback.js: switched from single awaited response to SSE streaming
  (`stream: true`); prompt now requests one JSON object per line (NDJSON) with no
  array wrapper; ReadableStream reader + TextDecoder accumulate SSE chunks; each
  complete `{...}` line on its own is parsed immediately and appended to the
  `feedbackData` array via functional setState so cards appear progressively
- Non-completer shape changed to `{"name":"...","isNonCompleter":true}`; completer
  shape adds `total` and `maxTotal` integer fields; `score` string computed from
  those fields for backward compat with docUtils
- `callClaude` transport no longer used for individual feedback — hook now makes its
  own `fetch` call (same pattern as usePdfExtraction) to support `stream: true`
- IndividualFeedbackPanel.jsx: full Academic Curator restyle — eyebrow label +
  h1 header with "Whole Class Feedback" (surface-container-high) and "Download Word
  Document" (btn-gradient) buttons; live stats bar (total / feedback generated /
  non-completers) in surface-container-low; "Generating…" spinner pill visible while
  streaming; filter pills (All Students / Needs Review / No Submission) with
  CSS max-height transition reveal of threshold range slider; loading block shown
  below arrived cards while stream is active
- Threshold slider: range 30–90; auto-set to class average % when streaming
  completes; label shows current value and class average; filters completers live
- StudentCard.jsx: two-column article layout (22% left / flex-1 right); completer
  card uses surface-container-lowest + shadow; left column has name, score pill,
  and optional "Needs Review" tag (error-container bg, on-error-container text);
  right column uses three-column CSS grid for WWW (primary) / EBI
  (on-surface-variant) / To Improve (on-tertiary-container) section labels;
  non-completer card uses surface-container-low + left border-left error-container,
  opacity 0.8, dashed placeholder box with error_outline icon
- App.jsx: IndividualFeedbackPanel gains feedbackLoading, onSwitchToWCF, examBoard,
  subject, topic props; onSwitchToWCF shows existing WCF data if available or
  regenerates; render condition changed from `feedbackData &&` to
  `feedbackData !== null` so panel appears immediately when streaming starts
- index.css: --color-on-error-container (#752121) added to shell token block

## v0.20
- Added EEF-aligned system prompt to useIndividualFeedback.js
- Feedback now targets subject-process level, requires specific concept references when question text is present, enforces 1–3 sentence limit per section

## v0.19.5 — Individual Signals redesign: score badges, ConcernSection, muted palette

- PraiseSection: score (X/Y) extracted from AI text and shown as a small neutral
  badge next to the student name in each block; description body uses content
  after the em-dash separator so the score never appears twice
- Students needing attention refactored as ConcernSection sub-component matching
  the praise layout: name pills on top, one block per student, click pill to
  highlight the respective block
- ConcernSection: parses each item into name, score, isNonCompleter, and
  description; non-completers show a neutral "non-completer" tag instead of a
  score; score badge uses very muted pink (rgba 0.10 background)
- Highlighted block state uses rgba(254,137,131,0.07) — much more refined than
  the previous strong error-container fill
- Separate "Non-completers" listing removed from the bottom of the card
- Concern pills styled with transparent border at rest, subtle pink border when active

## v0.19.4 — Praise in class: per-student blocks with click-to-highlight

- PraiseSection extracted as a sub-component with useState for active index
- Name pills stay at the top; each student gets an individual block (name bold,
  reason in normal weight — not italic)
- Clicking a pill highlights that student's block (primary-container background);
  clicking again deselects

## v0.19.3 — Reset Session, drag-and-drop marksheet, compact upload frame

- AppPage: manages appKey so Reset Session button remounts App entirely, clearing
  all state including FileUpload's internal filename display
- AppShell: accepts onReset prop; Reset Session button is now wired up
- FileUpload: onDragOver / onDragLeave / onDrop handlers added (files can now be
  dragged in, not just selected via file picker); drag-active visual state added
- FileUpload: idle layout restructured to horizontal row (icon + text) so height
  matches PdfDropZone; padding reduced to 28px 20px; icon reduced to 32px;
  Select File button removed (label is fully clickable)

## v0.19.2 — Fix Individual Signals grid and concern badge overflow

- signalsGrid: gridTemplateColumns changed to minmax(0,1fr) minmax(0,1fr) so
  both columns are truly equal regardless of content length
- concernRow: switched to flex-column so name and badge explanation stack cleanly
- concernBadge: removed whiteSpace nowrap; font-weight softened to 500

## v0.19.1 — Visual adjustments: upload frame, feedback layout, nav icons

- Marksheet drop zone height reduced to match Question Paper frame
- table_chart Material Symbol icon added to Student Marksheet card header
- "2. Grades" step removed from stepper; renumbered to 3 steps
- Sidebar emoji icons replaced with Material Symbols (biotech, edit_calendar,
  description, library_books, inventory_2); "Academic Curator" sub-label added
- Help Centre gains a help icon; top-bar avatar replaced with account_circle icon
- ClassFeedbackPanel Zone 1: stat tiles enlarged with micro-labels; Print button
  uses gradient; Individual button added beside Print
- ClassFeedbackPanel Zone 3: star / person_alert icons on signal card headings;
  concern rows use red pill badge
- PerformanceDashboard: Overview tab removed; Per Question (2/3) and Score
  Distribution (1/3) shown side-by-side permanently

## v0.19 — WCF Restyle, PDF Pre-population, Print Layout

- PDF extraction expanded: Haiku now returns examBoard, subject, topic
  alongside questions array (max_tokens bumped to 2000)
- App.jsx: pdfMeta state added; form fields pre-populate from PDF
- UploadPanel.jsx: WJEC added to exam board select; useEffect pre-populates
  Exam Board, Subject, and Topic from pdfMeta; italic detection hint shown
  beneath each pre-populated field
- ClassFeedbackPanel.jsx: five-zone layout fully redesigned — Zone 1 is a
  clean identity block (eyebrow/title/subtitle) with stat tiles (primary-
  container avg, surface-container-low completers/range, error-container/20
  absent) + print button; standalone printBar removed; Zone 3 praise shows
  name pills in flex-wrap with one shared italic note; Zone 5 analytics
  wrapped in no-print div
- DiagnosisZone.jsx: "Assessment Diagnosis" section label; filled verified
  (primary), psychology_alt (error), pending (outline-variant) icons; all
  cards restyled to surface-container-lowest, rounded-xl, border outline-
  variant/20, shadow-sm; misconception heading #752121; surface errors use
  dot-bullet list; body text uses on-surface-variant token
- ImplicationsZone.jsx: "Teaching Implications" section label; 5fr/40px/6fr
  CSS grid replaces flex columns; vRule as grid item with justifySelf:center;
  column labels uppercase + #54546f; long-term rendered as <p> paragraphs
- useClassFeedback.js: immediate_action field added to WCF prompt (7th key)
- PerformanceDashboard.jsx: restyled to design-system tokens; tab bar uses
  surface-container-low pill; chart panels use surface-container-lowest;
  colour-coded legend added beneath per-question chart
- index.css: @media print block expanded; .print-only/.no-print utility
  classes; sidebar/nav/aside hidden in print; .print-card ink-friendly white;
  .print-page-break triggers page-break before ImplicationsZone;
  .material-symbols-outlined.filled added for FILL=1 icon variant
- Print button in ClassFeedbackPanel.jsx calls window.print()
- PowerPoint export parked as future feature
- Version label updated to v0.19

## v0.18 — Upload Panel Restyle

- UploadPanel.jsx restyled to match Stitch "Academic Curator" design
- Bento grid layout: left column (marksheet + question paper), right column (form + generate buttons)
- Material Symbols Outlined font added to index.html and index.css
- Primary gradient and outlined button styles applied to generate buttons
- Bottom-bar input style applied to all form fields
- Grade boundaries rendered as styled card with bottom-bar inner input
- "Question Paper (Optional)" label corrected to "Question Paper"
- FileUpload: Material Symbols upload_file icon, drop zone redesigned to match Stitch reference
- PdfDropZone: drag_indicator icon added to extracted question rows (visual only); section wrapper and redundant header moved to UploadPanel section context
- App.jsx: main container widened to 1260px; white card wrapper removed (section cards provide visual containment)
- No logic, hook, or architectural changes

## v0.17 — New shell (parallel build)

- New persistent sidebar with TOOLS / LIBRARY navigation
- Redesigned top bar (tool name, Reset Session, user avatar)
- Horizontal numbered stepper (display only — no routing yet)
- Design tokens defined as CSS custom properties in index.css
- AppShell.jsx wraps existing app panels with no logic changes
- All existing functionality verified against Educake test file

## v0.16 — Feature Q (Password Gate) + Feature R (Landing Page)

- Added PasswordGate component — sessionStorage-based auth, reads VITE_ACCESS_PASSWORD env var
- Added React Router — two routes: / (LandingPage) and /app (PasswordGate → App)
- Added TeacherDesk landing page with video hero background, feature strip, and two CTAs
- Created .env.example documenting the VITE_ACCESS_PASSWORD pattern

## v0.15

- PDF question paper route (Future Feature B): always-visible "Question paper" section in the form with drag-and-drop / click-to-browse PDF upload
- `usePdfExtraction` hook: reads the PDF as base64 via `FileReader`, calls the Anthropic API with a `document` content block (model: `claude-haiku-4-5-20251001`, max_tokens 1000), strips any markdown fences, and `JSON.parse`s the result into a `questionTexts` string array
- `PdfDropZone` component: four visual states — idle (dashed drop zone with SVG document icon), loading (CSS spinner + "Extracting questions…"), error (red inline message with "try again" retry), ready (editable numbered list)
- Ready state: auto-resizing `<textarea>` per question (height:'auto' → scrollHeight pattern), Q1/Q2/… label column, edits update `questionTexts` state live via `updateQuestionText`
- Question context injected into both WCF and individual feedback prompts as `Question paper: Q1: … Q2: …` immediately after the grade-boundaries line; block is omitted entirely when no PDF is uploaded
- "✓ With question context" badge (muted green secondary line) on both Generate buttons when `questionTexts.length > 0`; hidden during generation and absent when no PDF is loaded
- `clearQuestionTexts` resets PDF state to idle; called on Start Over and available as a text link below the question list and in the error state

## v0.14

- Performance dashboard: Score Distribution tab — vertical histogram, one bar per total score achieved, blue bars, integer Y axis, tooltip showing student count
- Performance dashboard: Per Question tab — horizontal bar chart, % correct per question, colour-banded green/amber/red, dashed reference lines at 60% and 80%
- Performance dashboard: Overview tab — four stat cards (class average, completers, non-completers, score range)
- Tabbed PerformanceDashboard component added between stat cards and WCF sections
- Individual feedback: non-completers rendered as italic note in Word doc with no WWW/EBI labels
- Individual feedback: Word document title includes subject, topic, and date
- Individual feedback: generates and downloads a .docx file via the docx library
- WCF Sheet: six colour-coded sections render correctly
- WCF Sheet: JSON fence stripping before JSON.parse to handle markdown-wrapped responses
- WCF Sheet: max_tokens set to 4000 to prevent truncated responses
- Progress bar with asymptotic easing to 90% cap, jumps to 100% on resolve
- Loading messages cycling on a 2-second timer
- Start Over button with confirmation before wiping all state
- Single output panel — switching action clears previous output
- Two action buttons: Generate Class Feedback Sheet and Generate Individual Feedback
- Form fields: exam board, subject, topic, grade boundaries
- Shared FileUpload component
- Architecture refactored into components/, hooks/, and utils/ structure

## v0.13

- WCF stat cards: class average, completers, non-completers, and score range displayed above the feedback sheet
- UI and layout polish: Inter font via Google Fonts, custom CSS properties, global reset
- Dark navy header band, 860 px centred layout, off-white page background, white content card with shadow
- UploadPanel: exam board and subject in a two-column row; solid primary blue action buttons; ghost Start Over
- FileUpload: full-width dashed upload zone with hover (blue border/bg) and has-file (green) states
- ClassFeedbackPanel: header matches app navy; print button with hover; print styles moved to index.css

## v0.12

- Teacher feedback generator: individual per-student WWW/EBI/To Improve feedback generated via Claude API
- Word document download for individual feedback reports

## v0.11

- Non-completers (total = 0) tagged before prompt build; Claude writes a single "no submission recorded" sentence; Word doc renders an italic note with no WWW/EBI/To-Improve labels
- Start Over button: appears only after file upload, requires window.confirm, resets all state including form fields, outputs, and activeOutput
- Progress bar: asymptotic easing formula (prev + (90 − prev) × 0.04 per 250 ms tick), decelerates near 90% cap, jumps to 100% on API resolve; fixed phase label beneath bar
- Single output panel: activeOutput state (null | 'wcf' | 'individual') ensures only one result panel renders at a time; stale results no longer accumulate

## v0.10

- extractStudentsForFeedback() added to classUtils.js: mirrors Educake/generic detection, returns clean [{name, total, maxTotal, breakdown}] objects
- Individual feedback prompt now uses clean student list — removes UPNs, blank rows, class metadata, and __EMPTY_* keys
- Individual feedback max_tokens raised from 4000 to 8000 to accommodate full class output without truncation

## v0.9

- Diagnostic logging added for Educake score columns (exact __EMPTY_N keys, raw values, all __EMPTY* keys per row)
- Fixed Educake score column detection: correct columns selected based on Questions metadata value
- Resolved classTotalMax inflation caused by aggregate rows being included in score calculation

## v0.8

- WCF generation max_tokens raised from 2048 to 4000 to prevent truncated JSON responses

## v0.7

- Strip markdown fences (```json) from API response before JSON.parse() to prevent parse errors
- Fix Educake score column detection: use Questions metadata value to select exactly __EMPTY through __EMPTY_18 (Q1–Q19)
- Fix classTotalMax inflation: maxMark per question derived from student scores only, not aggregate rows
- Score columns now labelled Q1–Q19 instead of __EMPTY, __EMPTY_1, … for readable Claude output

## v0.6

- Strip markdown code fences from API response before JSON.parse()
- Remove __EMPTY exclusion in computeEducakeSummary so Q1–Q19 columns are correctly included as score columns
- Console logging of first student row keys added to aid column-name debugging

## v0.5

- Debug instrumentation added to WCF generation pipeline to surface column detection and API response issues

## v0.4

- Educake export format detected via presence of Start Date / End Date / Year / Class keys (SheetJS maps first data row as headers)
- computeEducakeSummary: filters real student rows by non-empty last-name field, skips date-valued and All Students rows
- First name and last name (Start Date + End Date columns) combined into full student name
- Score columns identified by excluding known Educake metadata keys and applying existing ≤20 numeric guard
- Shared buildSummary() helper used by both Educake and generic paths

## v0.3

- Version bump to v0.3

## v0.2

- UK science teacher prompt and system context applied to API call
- Version label added (bottom-right, fixed position)

## v0.1

- Vite + React (JavaScript) project scaffolded
- xlsx and docx added as runtime dependencies
- Single-page form: Exam Board dropdown (AQA/OCR/Edexcel), Subject dropdown (Biology/Chemistry/Physics/Combined Science), Topic text input, optional Grade Boundaries input, Excel file upload, Generate Feedback button
- Excel file parsed with SheetJS into array of student objects (one per row)
- Generate Feedback posts to Anthropic API (claude-sonnet-4-6) with UK science teacher prompt; displays raw response in scrollable box
- API key read from VITE_ANTHROPIC_API_KEY environment variable
- Inline error messages and loading state on the Generate Feedback button
