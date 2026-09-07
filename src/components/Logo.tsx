import Link from "next/link";

export function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="32" height="32" rx="3" fill="#0e1c2c" />
      <path
        d="M7 11h18M7 16h12M7 21h15"
        stroke="#c5d0de"
        strokeWidth="1.75"
        strokeLinecap="square"
      />
      <path
        d="M22 14l3 3-3 3"
        stroke="#2a8a8a"
        strokeWidth="1.75"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

export function Logo({
  href = "/",
  size = "md",
}: {
  href?: string;
  size?: "sm" | "md" | "lg";
}) {
  const text =
    size === "lg" ? "text-lg" : size === "sm" ? "text-[13px]" : "text-[15px]";
  const mark = size === "lg" ? "h-7 w-7" : size === "sm" ? "h-5 w-5" : "h-6 w-6";

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 font-semibold tracking-tight text-ink"
    >
      <LogoMark className={mark} />
      <span className={`${text} font-sans`}>
        Appeal<span className="text-accent">Clinic</span>
      </span>
    </Link>
  );
}
