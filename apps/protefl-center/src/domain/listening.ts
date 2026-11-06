export const LISTENING_FORM_CODE = "ptc-listening-2000-10-v2";
export const LISTENING_CONTRACT = "protefl-listening-attempt.v1";

export type Option = "A" | "B" | "C" | "D";

export type ListeningAction =
  | { kind: "start"; key: string; mode: "full"; parentAttemptId?: never }
  | { kind: "start"; key: string; mode: "remedial"; parentAttemptId: string }
  | { kind: "listen_start"; key: string; attemptId: string; revision: number; itemId: string }
  | { kind: "choose"; key: string; attemptId: string; revision: number; itemId: string; choice: Option }
  | { kind: "timeout"; key: string; attemptId: string; revision: number; itemId: string };

export type ResultItem = {
  number: number;
  part: "A" | "B" | "C";
  options: Record<Option, string>;
  choice: Option | null;
  answer: Option;
  correct: boolean;
};

export type ListeningView = {
  contractVersion: typeof LISTENING_CONTRACT;
  form: { code: string; title: string; itemCount: number; responseWindowMs: number };
  attempt: null | {
    id: string;
    kind: "full" | "remedial";
    parentAttemptId: string | null;
    status: "in_progress" | "submitted";
    revision: number;
    position: number;
    totalItems: number;
    current: null | {
      id: string;
      number: number;
      part: "A" | "B" | "C";
      options: Record<Option, string>;
      mediaUrl: string;
      durationMs: number;
      startedAt: string | null;
      answerOpensAt: string | null;
      deadline: string | null;
    };
    result: null | {
      correct: number;
      wrong: number;
      omitted: number;
      items: ResultItem[];
      canRemediate: boolean;
    };
  };
  serverTime: string;
};

export class ListeningPilotError extends Error {
  constructor(
    public readonly code: string,
    public readonly status = 409,
  ) {
    super(code);
  }
}
