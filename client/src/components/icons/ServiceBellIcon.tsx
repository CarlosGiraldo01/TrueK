// (Heroicons has no equivalent icon for "servicios" so we put it manually).

export function ServiceBellIcon({
  className = "size-6",
  strokeWidth = 1.8,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 5.2V7" />
      <path d="M10.4 5.2h3.2" />
      <path d="M4.2 15.2a7.8 7.8 0 0 1 15.6 0" />
      <path d="M2.2 15.2h19.6" />
      <rect x="2.6" y="17.7" width="18.8" height="2.2" rx="1.1" />
    </svg>
  );
}