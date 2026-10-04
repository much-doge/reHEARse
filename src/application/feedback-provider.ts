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
};

export interface FeedbackProvider {
  review(request: FeedbackRequest): Promise<FeedbackResult>;
}

