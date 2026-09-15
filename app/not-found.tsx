import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-space-md px-space-lg py-margin text-center">
      <div className="w-14 h-14 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center">
        <span className="material-symbols-outlined">search_off</span>
      </div>
      <h2 className="font-headline-md text-headline-md text-on-surface">
        Page not found
      </h2>
      <p className="text-body-md text-text-muted max-w-md">
        The page you are looking for does not exist or may have moved. Your
        subscription and billing status are unaffected.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-space-md mt-space-md">
        <Link
          href="/"
          className="bg-primary text-on-primary px-space-lg py-space-md rounded-lg font-label-lg hover:bg-primary-container transition-colors shadow-md"
        >
          Return to Plans
        </Link>
        <Link
          href="/?view=billing"
          className="px-space-lg py-space-md bg-surface-container text-on-surface rounded-lg font-label-lg hover:bg-surface-container-high transition-colors"
        >
          Go to Billing
        </Link>
      </div>
    </div>
  );
}