import type { ListeningFeedback } from "@/domain/feedback";

export type FeedbackRequest = {
  activityVersionId: string;
  transcript: string;
  teacherGuide: string;
  notes: string;
  reconstruction: string;
  previousReconstruction: string | null;
  template: unknown;
};

export type FeedbackResult = {
  feedback: ListeningFeedback;
  provider: string;
  model: string | null;
  promptVersion: string;
  providerResponseId?: string | null;
  usage?: Record<string, number>;
};

export interface FeedbackProvider {
  review(request: FeedbackRequest): Promise<FeedbackResult>;
}

export class FeedbackProviderError extends Error {
  constructor(
    message: string,
    readonly safeCode: string,
    readonly providerResponseId: string | null = null,
    readonly usage: Record<string, number> = {},
  ) {
    super(message);
    this.name = "FeedbackProviderError";
  }
}
