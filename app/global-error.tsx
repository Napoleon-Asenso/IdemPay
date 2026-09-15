"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" data-theme="light">
      <body className="bg-background font-body-md text-on-surface h-screen flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto w-full bg-background">
          <div className="flex min-h-[50vh] flex-col items-center justify-center gap-space-md px-space-lg py-margin text-center">
            <div className="w-14 h-14 rounded-full bg-error-container text-on-error-container flex items-center justify-center">
              <span className="material-symbols-outlined">error</span>
            </div>
            <h2 className="font-headline-md text-headline-md text-on-surface">
              Something went wrong
            </h2>
            <p className="text-body-md text-text-muted max-w-md">
              We hit an unexpected problem. No charges were made and your
              subscription is unchanged. Please try again.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-space-md mt-space-md">
              <button
                type="button"
                onClick={() => reset()}
                className="bg-primary text-on-primary px-space-lg py-space-md rounded-lg font-label-lg hover:bg-primary-container transition-colors shadow-md"
              >
                Try Again
              </button>
              <a
                href="/"
                className="px-space-lg py-space-md bg-surface-container text-on-surface rounded-lg font-label-lg hover:bg-surface-container-high transition-colors"
              >
                Return to Plans
              </a>
            </div>
            {error?.digest && (
              <p className="text-body-sm text-text-muted mt-space-md">
                Error reference: {error.digest}
              </p>
            )}
          </div>
        </main>
      </body>
    </html>
  );
}