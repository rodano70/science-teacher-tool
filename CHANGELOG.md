# Changelog

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
