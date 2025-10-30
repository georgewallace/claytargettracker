export function ClayTargetIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.9" />
      <circle cx="12" cy="12" r="7" fill="currentColor" opacity="0.7" />
      <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  )
}

