import Link from "next/link";

export function Brand() {
  return (
    <Link className="brand-lockup" href="/feed" aria-label="Pincrest home">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="none">
          <path
            d="M16 4.5 8.7 14h4.5l-5.1 6.2h6.1v6h3.6v-6h6.1L18.8 14h4.5L16 4.5Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
          <path d="M5 27.5h22" stroke="currentColor" strokeLinecap="round" />
        </svg>
      </span>
      <span className="brand-name">pincrest</span>
    </Link>
  );
}
