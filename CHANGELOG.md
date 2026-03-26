# Changelog

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
