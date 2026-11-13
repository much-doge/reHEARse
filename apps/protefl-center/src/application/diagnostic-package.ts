import { join } from "node:path";

export type DiagnosticSection = "listening" | "structure" | "reading";

export type DiagnosticPackageDescriptor = {
  code: string;
  directory: string;
  candidatePath: string;
  supportedSections: readonly DiagnosticSection[];
  questionCounts: Readonly<Record<DiagnosticSection, number>>;
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
