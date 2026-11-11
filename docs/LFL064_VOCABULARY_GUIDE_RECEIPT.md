# LFL-064 - Word Studio participant guide

Status: source-complete. Owner: integration lead.

## Purpose

This work adds an illustrated participant guide for the current Word Studio
contextual flashcard activity. The guide explains the signed-in Word desk,
teacher access code, contextual sentence, one-tap part-of-speech response,
immediate feedback, clean next-card state, controlled review queue, and
activity-only practice indicators.

The guide is deliberately written in formal, plain English to match the
English-only learner interface. It contains no repeated header or footer, no
score or proficiency language, and no motivational or marketing jargon.

## Source alignment

- Learner flow: `src/components/vocabulary/vocabulary.tsx`.
- Contextual queue and activity-only indicators: D049 in `docs/DECISIONS.md`.
- Visual tokens: `docs/DESIGN_SYSTEM.md` (Quiet Signal palette and typography).
- The guide does not introduce new runtime behavior, alter assignments, or
  expose teacher-only data.

## Artifact and verification

- Artifact: `output/pdf/reHEARse-word-studio-participant-guide.pdf`.
- Generator: `scripts/build_vocab_guide_pdf.py`.
- The PDF uses vector illustrations drawn by ReportLab; no external image or
  font dependency is required.
- `pdfinfo`, text extraction, and `pdftoppm` rendering were run. The rendered
  pages were visually inspected for clipping, overflow, missing glyphs, and
  accidental repeated headers/footers.
- Rollback is removal of the guide artifact and generator; the application and
  all learner records remain unchanged.
