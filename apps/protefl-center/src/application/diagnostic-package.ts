import { join } from "node:path";

export type DiagnosticSection = "listening" | "structure" | "reading";

export type DiagnosticPackageDescriptor = {
  code: string;
  directory: string;
  candidatePath: string;
  supportedSections: readonly DiagnosticSection[];
  questionCounts: Readonly<Record<DiagnosticSection, number>>;
  files: {
    manifest: string;
    instructions: string;
    questions: string;
    answerKey: string;
    scoreConversion: string;
    listeningPauses: string;
    listeningQuestionMap: string;
    listeningAudio: string;
  };
  privateSourceFiles: readonly string[];
  resultVersions: {
    full: string;
    sectionAssignment: string;
    sectionRetake: string;
    sectionReset: string;
  };
};

/**
 * The package catalogue is the boundary between resource rows and package
 * implementation files. A database resource is not candidate-routable until
 * it has an explicit descriptor here.
 */
const descriptors: Readonly<Record<string, DiagnosticPackageDescriptor>> = {
  "ets-volume3-practice-test-a": {
    code: "ets-volume3-practice-test-a",
    directory: "ets-volume3-practice-test-a-v1",
    candidatePath: "/test-center/diagnostic/ets-volume3-practice-test-a",
    supportedSections: ["listening", "structure", "reading"],
    questionCounts: { listening: 50, structure: 40, reading: 50 },
    files: {
      manifest: "package-manifest.json",
      instructions: "metadata/instructions-practice-test-a-v1.json",
      questions: "metadata/questions-practice-test-a-v1.json",
      answerKey: "metadata/answer-key-practice-test-a-v1.json",
      scoreConversion: "metadata/score-conversion-practice-test-a-v1.json",
      listeningPauses: "metadata/listening-pauses-v1.json",
      listeningQuestionMap: "metadata/listening-question-map-v1.json",
      listeningAudio: "source/practice-test-a-listening.m4a",
    },
    privateSourceFiles: ["source/ets-toefl-itp-volume-3.pdf", "source/ets-toefl-itp-volume-3-layout.txt"],
    resultVersions: {
      full: "ets-volume3-practice-test-a.result.v1",
      sectionAssignment: "ets-volume3-practice-test-a.section-assignment.v1",
      sectionRetake: "ets-volume3-practice-test-a.section-retake.v1",
      sectionReset: "ets-volume3-practice-test-a.section-reset.v1",
    },
  },
};

export function diagnosticPackage(code: string) {
  return descriptors[code];
}

export function diagnosticPackagePath(code: string) {
  const descriptor = diagnosticPackage(code);
  return descriptor ? join(process.cwd(), "apps/protefl-center/content", descriptor.directory) : null;
}

export function supportedDiagnosticPackage(code: string) {
  return diagnosticPackage(code) ?? null;
}

export function diagnosticPackageCodes() {
  return Object.keys(descriptors);
}
