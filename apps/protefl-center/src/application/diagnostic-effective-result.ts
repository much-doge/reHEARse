import { convertedTotalRange } from "./diagnostic-scoring";

type Section = "listening" | "structure" | "reading";
type SectionSummary = { correct: number; incorrect: number; omitted: number; total: number; converted: [number, number] | null };
type ReviewItem = { section: Section; question: number; selected: string | null; correctAnswer: string; correct: boolean };
export type FullDiagnosticResult = {
  sections: Record<Section, SectionSummary>;
  total: { correct: number; incorrect: number; omitted: number; questions: number };
  convertedTotal: [number, number] | null;
  review: ReviewItem[];
  answers?: Record<string, string>;
};
export type CompletedSectionReset = {
  section: Section;
  result: { summary: SectionSummary; review: ReviewItem[]; answers?: Record<string, string> };
};

export function effectiveDiagnosticResult(original: FullDiagnosticResult, resets: CompletedSectionReset[]) {
  if (!resets.length) return original;
  const latest = new Map<Section, CompletedSectionReset>();
  for (const reset of resets) latest.set(reset.section, reset);
  const sections = { ...original.sections };
  let review = [...original.review];
  const answers = { ...(original.answers ?? {}) };
  for (const [section, reset] of latest) {
    sections[section] = reset.result.summary;
    review = [...review.filter((item) => item.section !== section), ...reset.result.review];
    for (const key of Object.keys(answers)) if (key.startsWith(`${section}:`)) delete answers[key];
    for (const [question, choice] of Object.entries(reset.result.answers ?? {})) answers[`${section}:${question}`] = choice;
  }
  const values = Object.values(sections);
  return {
    sections,
    total: {
      correct: values.reduce((sum, item) => sum + item.correct, 0),
      incorrect: values.reduce((sum, item) => sum + item.incorrect, 0),
      omitted: values.reduce((sum, item) => sum + item.omitted, 0),
      questions: values.reduce((sum, item) => sum + item.total, 0),
    },
    convertedTotal: convertedTotalRange([sections.listening.converted, sections.structure.converted, sections.reading.converted]),
    review: review.sort((a, b) => a.section.localeCompare(b.section) || a.question - b.question),
    answers,
  } satisfies FullDiagnosticResult;
}
