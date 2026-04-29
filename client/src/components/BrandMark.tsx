type BrandMarkSize = "xs" | "sm" | "md" | "lg";

const box: Record<BrandMarkSize, string> = {
  xs: "h-8 w-8",
  sm: "h-12 w-12",
  md: "h-16 w-16",
  lg: "h-24 w-24",
};

/** Served from `client/public/brand/` (no bundler resolution of `attached_assets`). */
function publicBrandUrl(filename: string): string {
  const base = import.meta.env.BASE_URL;
  return `${base}${filename.replace(/^\//, "")}`;
}

/** Main navbar / default mark — PNG (`luminiaeo-logo2.png`). */
const brandLogoUrl = publicBrandUrl("brand/luminiaeo-logo2.png");
/** Favicon-style art — JPEG (`luminiaeo-logo1.jpg`), e.g. login/signup. */
const brandFaviconUrl = publicBrandUrl("brand/luminiaeo-logo1.jpg");

export const brandLogo = brandLogoUrl;
export const brandFavicon = brandFaviconUrl;

type BrandMarkProps = {
  /** Default `lg` site-wide (`h-24 w-24`). */
  size?: BrandMarkSize;
  /** `logo` = main mark PNG; `artwork="favicon"` = JPEG thumb for auth screens. */
  artwork?: "logo" | "favicon";
  /**
   * `light` — no faux background so PNG alpha stays visible on nav/footer (not a painted tile behind the image).
   * `card` — primary-colored tile (auth splash screens).
   */
  variant?: "light" | "card";
  className?: string;
  alt?: string;
};

/**
 * App mark: default main logo, or the favicon artwork when `artwork="favicon"`.
 */
export function BrandMark({
  size = "lg",
  artwork = "logo",
  variant = "light",
  className = "",
  alt = "Lumini AEO",
}: BrandMarkProps) {
  const src = artwork === "favicon" ? brandFaviconUrl : brandLogoUrl;
  const rounded = size === "xs" || size === "sm" ? "rounded-md" : "rounded-xl";
  const padding =
    size === "lg" ? "p-2" : size === "md" ? "p-1.5" : "p-1";
  const tile =
    variant === "card"
      ? "bg-primary flex items-center justify-center"
      : // Avoid bg-white/shadow — that reads as “image has a grey/white backdrop” behind a transparent PNG.
        "border-0 bg-transparent shadow-none";
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden ${rounded} ${padding} ${box[size]} ${tile} ${className}`.trim()}
    >
      <img src={src} alt={alt} className="h-full w-full object-contain" />
    </div>
  );
}
