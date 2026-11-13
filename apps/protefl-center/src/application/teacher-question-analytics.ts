import { diagnosticPackage } from "./diagnostic-package";

type Section = "listening" | "structure" | "reading";
type Choice = "A" | "B" | "C" | "D";
type SectionSummary = { correct: number; incorrect: number; omitted: number; total: number };
type ReviewItem = { section: Section; question: number; selected?: string | null; correctAnswer?: string; correct?: boolean; source?: { candidateActorId: string; attemptId: string } };

export type TeacherQuestionResult = {
  sections?: Partial<Record<Section, SectionSummary>>;
  summary?: SectionSummary;
  section?: Section;
  review?: ReviewItem[];
};

export type TeacherQuestionRow = {
  question: number;
  seen: number;
  correct: number;
  incorrect: number;
  omitted: number;
  choices: Record<Choice, number>;
  source?: { candidateActorId: string; attemptId: string };
};

export type TeacherQuestionSection = {
  questions: number;
  correct: number;
  incorrect: number;
  omitted: number;
  rows: TeacherQuestionRow[];
};

export type TeacherQuestionAnalytics = {
  completedAttempts: number;
  hasQuestionReview: boolean;
  sections: Record<Section, TeacherQuestionSection>;
};

const sections: Section[] = ["listening", "structure", "reading"];
const choices: Choice[] = ["A", "B", "C", "D"];

function emptyRow(question: number): TeacherQuestionRow {
  return { question, seen: 0, correct: 0, incorrect: 0, omitted: 0, choices: { A: 0, B: 0, C: 0, D: 0 } };
}

function emptySection(section: Section, questionCounts: Record<Section, number>): TeacherQuestionSection {
  return {
    questions: questionCounts[section], correct: 0, incorrect: 0, omitted: 0,
    rows: Array.from({ length: questionCounts[section] }, (_, index) => emptyRow(index + 1)),
  };
}

export function aggregateTeacherQuestionAnalytics(results: TeacherQuestionResult[], packageCode = "ets-volume3-practice-test-a"): TeacherQuestionAnalytics {
  const descriptor = diagnosticPackage(packageCode);
  if (!descriptor) throw new Error("package_not_registered");
  const questionCounts = descriptor.questionCounts as Record<Section, number>;
  const output: TeacherQuestionAnalytics = {
    completedAttempts: results.length,
    hasQuestionReview: false,
    sections: { listening: emptySection("listening", questionCounts), structure: emptySection("structure", questionCounts), reading: emptySection("reading", questionCounts) },
  };

  results.forEach((result) => {
    sections.forEach((section) => {
      const summary = result.sections?.[section] ?? (result.section === section ? result.summary : undefined);
      if (summary) {
        output.sections[section].correct += Number(summary.correct) || 0;
        output.sections[section].incorrect += Number(summary.incorrect) || 0;
        output.sections[section].omitted += Number(summary.omitted) || 0;
      }
    });
    result.review?.forEach((item) => {
      if (!sections.includes(item.section) || !Number.isInteger(item.question) || item.question < 1 || item.question > questionCounts[item.section]) return;
      output.hasQuestionReview = true;
      const row = output.sections[item.section].rows[item.question - 1];
      row.seen += 1;
      if (!row.source && item.source) row.source = item.source;
      const selected = item.selected?.toUpperCase() as Choice | undefined;
      if (!selected) row.omitted += 1;
      else {
        if (choices.includes(selected)) row.choices[selected] += 1;
        if (item.correct === true || (item.correctAnswer && selected === item.correctAnswer.toUpperCase())) row.correct += 1;
        else row.incorrect += 1;
      }
    });
  });

  // Result payloads from old or section-only attempts may not include section
  // summaries. In that case, keep the table truthful by deriving only the
  // counts that are actually present in the question review.
  sections.forEach((section) => {
    const value = output.sections[section];
    const hasSummary = results.some((result) => Boolean(result.sections?.[section] ?? (result.section === section ? result.summary : undefined)));
    if (!hasSummary) {
      value.correct = value.rows.reduce((total, row) => total + row.correct, 0);
      value.incorrect = value.rows.reduce((total, row) => total + row.incorrect, 0);
      value.omitted = value.rows.reduce((total, row) => total + row.omitted, 0);
    }
  });
  return output;
}

