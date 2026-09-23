"use client";

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-space-md px-space-lg py-margin text-center">
      <div className="w-14 h-14 rounded-full bg-error-container text-on-error-container flex items-center justify-center">
        <span className="material-symbols-outlined">error</span>
      </div>
      <h2 className="font-headline-md text-headline-md text-on-surface">
        Something went wrong during checkout
      </h2>
      <p className="text-body-md text-text-muted max-w-md">
        Your payment was not completed and no charges were made. You can safely
        return to your plans and try again.
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
          href="/billing"
          className="px-space-lg py-space-md bg-surface-container text-on-surface rounded-lg font-label-lg hover:bg-surface-container-high transition-colors"
        >
          Go to Billing
        </a>
      </div>
      {error?.digest && (
        <p className="text-body-sm text-text-muted mt-space-md">
          Error reference: {error.digest}
        </p>
      )}
    </div>
  );
}