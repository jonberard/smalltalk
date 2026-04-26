import * as Sentry from "@sentry/nextjs";

type CaptureServerExceptionContext = {
  route: string;
  tags?: Record<string, string | number | boolean | null | undefined>;
  extras?: Record<string, unknown>;
};

export function captureServerException(
  error: unknown,
  context: CaptureServerExceptionContext,
) {
  Sentry.withScope((scope) => {
    scope.setTag("route", context.route);

    for (const [key, value] of Object.entries(context.tags ?? {})) {
      if (value !== undefined && value !== null) {
        scope.setTag(key, String(value));
      }
    }

    for (const [key, value] of Object.entries(context.extras ?? {})) {
      scope.setExtra(key, value);
    }

    if (error instanceof Error) {
      Sentry.captureException(error);
      return;
    }

    Sentry.captureException(new Error(typeof error === "string" ? error : "Unknown server error"));
  });
}
