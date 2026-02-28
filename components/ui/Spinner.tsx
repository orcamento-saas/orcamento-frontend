export function Spinner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`inline-block h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent ${className}`}
      aria-hidden
    />
  );
}
