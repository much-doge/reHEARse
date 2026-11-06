export function attemptSaveError(code: unknown): string {
  switch (code) {
    case "learner_role_required":
      return "This account can preview the activity. To save a response, sign in with a learner account. Your text is still here.";
    case "authentication_required":
      return "Your session has ended. Sign in again in another tab, then return here to save your response. Your text is still here.";
    case "invalid_attempt":
      return "Enter a nickname of up to 40 characters and a response. Notes and responses can each contain up to 12,000 characters. Your text is still here.";
    case "origin_rejected":
      return "Open this activity at rehearse.najala.org to save your response. Your text is still here.";
    case "activity_not_found":
      return "This activity is no longer available for new responses. Your text is still here.";
    case "save_unconfirmed":
    case "confirmation_unavailable":
      return "We couldn’t confirm the save. Your text is still here. When the connection returns, try saving this same response again.";
    case "submission_changed":
      return "This submission has already been saved with different text. Your current text is still here; start a new response to save a revision.";
    default:
      return "Saving could not be confirmed. Your text is still here. Check your practice history in another tab before trying again.";
  }
}
