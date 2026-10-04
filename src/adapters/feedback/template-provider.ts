import type { FeedbackProvider } from "@/application/feedback-provider";
import { parseListeningFeedback } from "@/domain/feedback";

export class TeacherTemplateFeedbackProvider implements FeedbackProvider {
  async review(request: Parameters<FeedbackProvider["review"]>[0]) {
    return {
      feedback: parseListeningFeedback(request.template),
      provider: "teacher_template",
      model: null,
      promptVersion: "teacher-template.v1",
    };
  }
}

