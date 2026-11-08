import Link from "next/link";

export function BrandSymbol() {
  return (
    <span className="brand-symbol" aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`brand-mark ${className}`.trim()} aria-label="reHEARse">
      <BrandSymbol />
      <span>reHEARse</span>
    </Link>
  );
}
