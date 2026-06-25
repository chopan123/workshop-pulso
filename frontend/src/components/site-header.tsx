/**
 * Site header — the official DeFindex horizontal logo on a glass surface.
 * The logo asset (media-kit Horizontal #01) carries its own white background,
 * so it is placed on a light/glass bar where the white blends in. Used
 * unmodified per the brand guidelines (min 40px).
 */
export function SiteHeader() {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        marginBottom: "1.75rem",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/logo-horizontal-light.svg"
        alt="DeFindex"
        height={44}
        style={{
          height: 44,
          width: "auto",
          borderRadius: 10,
          display: "block",
        }}
      />
    </header>
  );
}
