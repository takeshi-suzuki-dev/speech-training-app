type SpinnerProps = {
  className?: string;
};

/**
 * The spinning-icon SVG already used inline for the TTS-loading and
 * template-saving indicators in app/pronunciation/page.tsx, pulled out here
 * because it's now also needed by AuthPanel and the auth route guards
 * (useRequireAuth consumers). Pass a Tailwind size/color className, e.g.
 * "w-4 h-4 text-purple-400".
 */
export function Spinner({ className = "w-4 h-4 text-purple-400" }: SpinnerProps) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden="true"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}
