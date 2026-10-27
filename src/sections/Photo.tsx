import s from "./sections.module.css";

// A real photo when the site has one, otherwise a labelled placeholder.
// Mockups use placeholders; a client's own photos replace them after signing.
export function Photo({ src, label, className, priority = false }: { src?: string; label: string; className?: string; priority?: boolean }) {
  return (
    <div className={`${s.photo} ${className ?? ""}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={label} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" />
      ) : (
        <span>{label}</span>
      )}
    </div>
  );
}
