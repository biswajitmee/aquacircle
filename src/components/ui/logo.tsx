import Image from "next/image";
import Link from "next/link";
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/images/brand/aquacircle-mark.png"
      className={className}
      width={256}
      height={256}
      alt=""
      aria-hidden="true"
      loading="eager"
      unoptimized
    />
  );
}
export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link
      className={`brand ${light ? "brand-light" : ""}`}
      href="/"
      aria-label="AquaCircle home"
    >
      {light ? (
        <Image
          src="/images/brand/aquacircle-logo.webp"
          className="brand-full"
          width={440}
          height={340}
          alt="AquaCircle.in — Water purifier installation & servicing"
          unoptimized
        />
      ) : (
        <>
          <BrandMark className="brand-symbol" />
          <Image
            src="/images/brand/aquacircle-wordmark.webp"
            className="brand-wordmark"
            width={672}
            height={143}
            alt="AquaCircle.in — Water purifier installation & servicing"
            loading="eager"
            unoptimized
          />
        </>
      )}
    </Link>
  );
}
