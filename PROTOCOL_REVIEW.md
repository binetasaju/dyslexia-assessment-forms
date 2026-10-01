# Protocol Review – Assessment Protocol v2 (final)

Updated: 2026-10-01. Applies to `frontend/js/assessment-data.js` (PROTOCOL_VERSION 2.1, session.json schema 2.1).

The website is a **raw data collection system only**. It calculates nothing (no accuracy %, WPM, fluency,
naming speed, digit span, totals or percentages) and makes no diagnosis or interpretation.

---

## 1. Decisions – CONFIRMED BY RESEARCHER

| Topic | Decision (CONFIRMED BY RESEARCHER) | Implementation |
|---|---|---|
| Core principle | Raw data collection only; no derived scores of any kind | No calculations anywhere in the code or in `session.json` |
| Reading | **Audio only**. Passage shown to the child exactly as supplied; title not shown | Passage + recording widget only. No score fields. Saved: passage id/title/text, audio file, recording start/end/duration |
| Reading – accent/dialect | Not evaluated; researchers analyse the audio later | No pronunciation fields |
| Phonological awareness | **No audio.** Questions exactly as supplied. Assessor enters the child's response and marks the whole question CORRECT = 1 / INCORRECT = 0 / NOT ATTEMPTED = null. No partial credit, no automatic evaluation | No record button; response box + 3 marks per question |
| Nonword answers | Keep `lant` and `pring` exactly as supplied | Shown as the protocol's expected answer, no flags |
| Notation / wording | Keep all supplied wording, notation and spelling | Questions copied verbatim (e.g. `cat without /k/`, `map /m/→/t/`, `bright first sound → /f/`, `/ʃ/`, `SHIP`) |
| Segmentation | Whole question CORRECT / INCORRECT / NOT ATTEMPTED; child's response as raw text; no phoneme-level scoring | Same layout as all other questions |
| Missing expected answers | No invented or "suggested" answers; assessor judges | Expected answer shown only where the protocol supplies one (`expected_answer_protocol: null` otherwise). All suggested answers removed |
| Grapheme–phoneme knowledge | Separate from PA; show the letter; assessor marks; no audio | Separate step and `grapheme_phoneme_knowledge` block; "Show letter to child" full-screen card |
| RAN sessions | RAN in **Session 1 and Session 2** for every age group | Same grid in both sessions |
| RAN data | **Audio** + raw completion time + the grid used. No naming speed, no score, no automatic evaluation | Grid + recording widget only. Saved: grid id, rows, columns, full item list, audio, recording start/end/duration |
| RAN grids | Implementation-created, fixed grids from the supplied stimulus categories; 14–15 = one mixed grid | See section 2 |
| RAN instruction | "Look at the items and name them from left to right as quickly and accurately as you can." + a natural start signal | Same instruction for every age; assessor says "Ready? Go." |
| Memory | **Audio only**; target sequence assessor-only; no marks, no span, no totals | Sequence (ASSESSOR ONLY) + recording widget per trial. Saved: level, trial, target sequence, audio, recording times |
| Memory sessions | Session 1 = forward (same order), Session 2 = backward (reverse order), all ages; sequences unchanged | As stated |
| Memory pace | Natural, consistent speaking pace; no "one digit per second" rule | As stated |
| Dictation | Assessor may read the sentence as many times as needed; sentence assessor-only | Rule shown on screen; optional `times_sentence_read` kept as information only |
| Copying | Passage displayed on the computer screen; child copies onto the writing sheet | Large on-screen text + optional full-screen view |
| Handwriting | Only copying + dictation; timing kept; no scores; images photographed separately | As stated (no H3, no v1 passages) |
| Memory instructions | Official wording: S1 "…in the same order.", S2 "…in reverse order." | Shown on the memory screen and saved in `session.json` |
| Category | Keep Dyslexic / Dysgraphic / Normal / Other as an assessor-entered research classification only | Unchanged; labelled "research classification entered by the assessor" wherever shown |
| Unmarked questions | `NOT_MARKED` (score null), distinct from `NOT_ATTEMPTED`, never converted to incorrect | As stated |
| Audio | Yes: reading, RAN, memory. No: PA, GPK, handwriting | Backend only accepts audio in `reading/`, `ran/`, `memory/` |

## 2. RAN stimulus grids – IMPLEMENTATION-CREATED (use CONFIRMED BY RESEARCHER)

The protocol supplies the **stimulus categories** but not the exact digits/letters, grid dimensions or arrangement.
The grids below were therefore **created by the developer** from those categories. They are **not**
researcher-supplied protocol content; the researcher has confirmed they are to be used.

- Fixed and deterministic: identical for every participant, session, page load and laptop (no random generation at run time).
- Administered in **Session 1 and Session 2** for every age group. Every age group uses a different grid in
  each session (researcher requests, 2026-10-01; these replaced the earlier V1 grids):
  ages 5–7 and 8–10 use a 5 × 3 grid in Session 1 and a 5 × 5 grid in Session 2; ages 11–13 and 14–15 use a 5 × 5 grid
  in both sessions with a different stimulus set in Session 2. For 8–10, Session 1 is numbers and Session 2 is letters;
  for 14–15, Session 1 is numbers + letter + colours and Session 2 is numbers + letter + words.
  In every grid each row contains all five stimuli once and no stimulus repeats in a column.
  A 5 × 5 grid can only use every stimulus equally often with exactly five stimuli, so the mixed grids use a
  selection of five stimuli from the requested categories.
- Saved with every session in `session.json`: `grid_id`, `grid_source` ("IMPLEMENTATION_CREATED …"),
  `grid_rows`, `grid_columns` and the full ordered `grid_items` list, so the record shows exactly what the child saw.
- Data collected: audio + recording start/end/duration only. No naming speed or score.

Design rules: every stimulus appears equally often, and no stimulus appears twice in a row (reading order,
left → right, top → bottom). Generated once with a fixed random seed, checked, and stored as literal lists in
`assessment-data.js`.

| Age | Protocol stimulus category | grid_id | Implementation choice | Layout |
|---|---|---|---|---|
| 5–7 Session 1 | apple, cat, dog, ball, sun emoji (supplied) | `RAN_5-7_S01_OBJECTS_5x3_V2` | the 5 supplied emoji; grid size 5 × 3 requested by the researcher | 3 rows × 5 = 15, each 3× |
| 5–7 Session 2 | same | `RAN_5-7_S02_OBJECTS_5x5_V2` | the 5 supplied emoji; grid size 5 × 5 requested by the researcher | 5 rows × 5 = 25, each 5× |
| 8–10 Session 1 | single-digit numbers | `RAN_8-10_S01_NUMBERS_5x3_V2` | digits 2, 4, 6, 7, 9; grid size 5 × 3 requested by the researcher | 3 rows × 5 = 15, each 3× |
| 8–10 Session 2 | letters (researcher request; the original protocol said numbers only for 8–10) | `RAN_8-10_S02_LETTERS_5x5_V2` | letters A, B, C, D, E; grid size 5 × 5 requested by the researcher | 5 rows × 5 = 25, each 5× |
| 11–13 Session 1 | numbers + letters (researcher request: also pictures) | `RAN_11-13_S01_MIXED_5x5_V2` | pictures apple, cat, sun + number 4 + letter B; grid size 5 × 5 requested by the researcher | 5 rows × 5 = 25, each 5× |
| 11–13 Session 2 | same mix, different set (researcher request) | `RAN_11-13_S02_MIXED_5x5_V2` | pictures fish, car, tree + number 5 + letter M | 5 rows × 5 = 25, each 5× |
| 14–15 Session 1 | mixed: numbers + letters + colours (example set 2, 5, 7, 9 / A, E, K, M / Red, Blue, Green, Yellow) | `RAN_14-15_S01_MIXED_5x5_V2` | numbers 2, 7 + letter A + colours Red, Blue (filled circles); grid size 5 × 5 requested by the researcher | 5 rows × 5 = 25, each 5× |
| 14–15 Session 2 | numbers + letters + words (researcher request) | `RAN_14-15_S02_MIXED_5x5_V2` | numbers 5, 9 + letter M + words "cup", "hat" (words chosen by the developer) | 5 rows × 5 = 25, each 5× |

Other implementation choices: 0, 1 and look-alike letters (e.g. O) were avoided. Emoji are drawn by the operating
system, so the 5–7 pictures look slightly different on Windows, macOS and Linux. If a grid is ever changed, give it a
new `grid_id` (e.g. `_V2`) so saved sessions remain traceable.

## 3. Open questions

None. All protocol questions have been confirmed by the researcher (2026-10-01):

- Memory instructions – CONFIRMED BY RESEARCHER as the official child-facing wording:
  Session 1 (forward) "I will say some numbers. Say them back to me in the same order.";
  Session 2 (backward) "I will say some numbers. Say them back to me in reverse order."
- RAN grids – CONFIRMED BY RESEARCHER for use, documented above as implementation-created.
- Category options – CONFIRMED BY RESEARCHER: Dyslexic, Dysgraphic, Normal, Other. An assessor-entered research
  classification only; the website never generates or interprets it and never presents it as a result.

Rule for anything not specified by the protocol: no clinical or scoring rule is invented; the simplest raw-data
collection approach is used and the implementation choice is documented here.

## 4. For information (implemented exactly as supplied, no action needed)

- Some items repeat across sessions (e.g. 8–10 `cat without /k/`, `plane without /p/`; `strength` in 14–15 S1 and S2;
  memory S2 reuses the S1 sequences; 14–15 uses the 11–13 sequences).
- Session 1 and Session 2 phonological sections are not parallel, and grapheme–phoneme knowledge exists only for 5–7 Session 2.
- 8–10 Session 1 reading passage ends in past tense ("Everyone was excited.") – kept exactly.
- Version 1 data (backed up in `backups/v1_before_protocol_v2_20261001/`) used different texts and tasks and should not be pooled with v2 data.
