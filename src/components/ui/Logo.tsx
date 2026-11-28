/* eslint-disable @next/next/no-img-element */

// Reddy Anna brand logo (public/brand/reddy-logo.webp — gold wordmark on black).
const SRC = "/brand/reddy-logo.webp";
const RATIO = 342 / 960; // height / width of the artwork

// Full wordmark. `size` is the rendered width in px.
export function Logo({ size = 120, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src={SRC}
      alt="Reddy Anna"
      width={size}
      height={Math.round(size * RATIO)}
      className={`h-auto max-w-full select-none rounded-lg ${className}`}
      draggable={false}
    />
  );
}

// Square/round black tile with the wordmark centred — avatars, banners, small marks.
export function LogoTile({ size = 44, rounded = "rounded-xl" }: { size?: number; rounded?: string }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden bg-black shadow-sm ring-1 ring-[var(--gold-500)]/35 ${rounded}`}
      style={{ width: size, height: size }}
    >
      <img
        src={SRC}
        alt=""
        aria-hidden
        draggable={false}
        style={{ width: rounded === "rounded-full" ? "88%" : "94%", height: "auto" }}
      />
    </div>
  );
}

export function LogoBadge({ size = 40 }: { size?: number }) {
  return <LogoTile size={size} rounded="rounded-full" />;
}
