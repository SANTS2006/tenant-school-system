interface BrandMarkProps {
  logo?: string | null;
  name?: string;
}

/** School icon (or a school's own uploaded logo) shown above the login title. */
export function BrandMark({ logo, name = "NTS School System" }: BrandMarkProps) {
  if (logo) {
    return (
      <img
        src={logo}
        alt={name}
        className="size-14 rounded-2xl object-cover shadow-[0_10px_30px_-8px_rgba(21,101,192,0.65)]"
      />
    );
  }
  return (
    <span className="flex h-14 items-center rounded-2xl border border-[var(--color-border)] bg-white px-3 shadow-[0_10px_30px_-12px_rgba(21,101,192,0.5)]">
      <img src="/nts-logo.webp" alt="NTS School System" className="h-8 w-auto" />
    </span>
  );
}
