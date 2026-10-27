import s from "./sections.module.css";

// Responsive derivatives of the same credited hotlink; business-owned URLs stay intact.
export function photoSources(src?: string) {
  if (!src) return undefined;
  try {
    const url = new URL(src);
    if (url.hostname !== "images.unsplash.com") return undefined;
    return [640, 1080, 1800].map((width) => { const image = new URL(url); image.searchParams.set("w", String(width)); return `${image.href} ${width}w`; }).join(", ");
  } catch { return undefined; }
}

// A real photo when the site has one, otherwise a labelled placeholder.
// Mockups use placeholders; a client's own photos replace them after signing.
export function Photo({ src, label, className, priority = false, sizes }: { src?: string; label: string; className?: string; priority?: boolean; sizes?: string }) {
  return (
    <div className={`${s.photo} ${className ?? ""}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} srcSet={sizes ? photoSources(src) : undefined} sizes={sizes} alt={label} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" />
      ) : (
        <span>{label}</span>
      )}
    </div>
  );
}
