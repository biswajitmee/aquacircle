import Link from "next/link";
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M37 15C31 6 16 8 12 19c-4 12 9 22 20 16M40 25c-1 9-12 14-21 9C9 29 9 19 14 14M17 13c-1 10 12 18 22 13M8 24c5 9 16 11 25 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link
      className={`brand ${light ? "brand-light" : ""}`}
      href="/"
      aria-label="AquaCircle home"
    >
      <BrandMark />
      <span>AquaCircle</span>
    </Link>
  );
}
