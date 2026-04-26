import brandLogo from "@assets/generated_images/luminiaeo-logo2.jpg";
import brandFavicon from "@assets/generated_images/luminiaeo-logo1.jpg";

export { brandLogo, brandFavicon };

type BrandMarkSize = "xs" | "sm" | "md" | "lg";

const box: Record<BrandMarkSize, string> = {
  xs: "h-5 w-5",
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

type BrandMarkProps = {
  size?: BrandMarkSize;
  /** `logo` = main mark (luminiaeo-logo2); `favicon` = tab icon art (luminiaeo-logo1) — e.g. login/signup. */
  artwork?: "logo" | "favicon";
  /** `card` = primary-colored tile (auth screens); `light` = white bordered tile (nav). */
  variant?: "light" | "card";
  className?: string;
  alt?: string;
};

/**
 * App mark: default main logo, or the favicon artwork when `artwork="favicon"`.
 */
export function BrandMark({
  size = "md",
  artwork = "logo",
  variant = "light",
  className = "",
  alt = "Lumini AEO",
}: BrandMarkProps) {
  const src = artwork === "favicon" ? brandFavicon : brandLogo;
  const rounded = size === "xs" || size === "sm" ? "rounded-md" : "rounded-lg";
  const padding = size === "lg" ? "p-1" : "p-0.5";
  const tile =
    variant === "card"
      ? "bg-primary flex items-center justify-center"
      : "border border-slate-100/80 bg-white shadow-sm";
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden ${rounded} ${padding} ${box[size]} ${tile} ${className}`.trim()}
    >
      <img src={src} alt={alt} className="h-full w-full object-contain" />
    </div>
  );
}
