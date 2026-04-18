# Parse Report — survey.v1-draft.json

Generated: 2026-04-18T02:33:01.594Z
Questions: 320 across 27 sections

## TODOs requiring manual review

- **q72**: Q72 converted to single_select (was likert+N/A). Verify this is OK for analysis.

## Checklist before promoting to v1

- [ ] Review all show_if conditions against the source .txt
- [ ] Verify Q72 single_select treatment is acceptable for analysis
- [ ] Verify SF9a email type and show_if values match SF9 option slugs
- [ ] Verify Section 22 questions have correct Q6 show_if
- [ ] Verify Q59 and Q104 matrix sub-questions are correct
- [ ] Run: npm run lint:schema
- [ ] All lint errors resolved
- [ ] Human sign-off
- [ ] Bump version from "v1-draft" to "v1" in the JSON