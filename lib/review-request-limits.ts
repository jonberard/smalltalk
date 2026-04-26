export const REVIEW_REQUEST_HOURLY_CAP = 50;
export const REVIEW_REQUEST_HOURLY_WINDOW_SECONDS = 60 * 60;

export function getReviewRequestHourlyCapLabel() {
  return `${REVIEW_REQUEST_HOURLY_CAP} review requests per hour per business`;
}

export function getReviewRequestHourlyCapCopy() {
  return `To protect deliverability, live sending is capped at ${getReviewRequestHourlyCapLabel()}.`;
}
