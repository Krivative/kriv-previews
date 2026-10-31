"use client";

import { useId, useRef, useState } from "react";
import { Photo } from "./Photo";
import m from "./signature.module.css";

type GalleryPhoto = { src?: string; label: string };

// A small client boundary for the modal only. Native dialog handles focus and Escape.
export function GalleryViewer({ businessName, photos, layout = "editorial" }: { businessName: string; photos: GalleryPhoto[]; layout?: "editorial" | "mosaic" | "strip" }) {
  const [current, setCurrent] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const heading = useId();
  const slides = photos.filter((photo) => photo.src);
  const selected = Math.min(current, slides.length - 1);
  const active = slides[selected];
  if (!photos.length) return null;
  const move = (direction: number) => setCurrent((index) => (Math.min(index, slides.length - 1) + direction + slides.length) % slides.length);
  return <>
    <div ref={grid} role="group" tabIndex={-1} aria-label={`${businessName} gallery`} className={`${m.editorialGrid} ${layout === "editorial" ? "" : m[layout]}`} data-count={photos.length} data-gallery-layout={layout}>{photos.map((photo, i) => <figure key={`${photo.src}-${i}`} className={m.editorialPhoto}>
      {photo.src ? <button type="button" className={m.imageButton} aria-label={`Open image: ${photo.label}`} aria-haspopup="dialog" onClick={(event) => { opener.current = event.currentTarget; setCurrent(slides.indexOf(photo)); dialog.current?.showModal(); }}>
        {/* Existing credited URLs remain hotlinked; no third-party image or animation SDK. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.src} alt={photo.label} loading="lazy" decoding="async" />
        <span className={m.imageOpen}>View image <span aria-hidden="true">↗</span></span>
      </button> : <Photo label={photo.label} className={m.galleryPlaceholder} />}<figcaption><span>{String(i + 1).padStart(2, "0")}</span>{photo.label}</figcaption>
    </figure>)}</div>
    {active ? <dialog ref={dialog} className={m.galleryDialog} aria-labelledby={heading} onClose={() => { const target = opener.current?.isConnected ? opener.current : grid.current?.querySelector("button") ?? grid.current; target?.focus(); }} onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }} onKeyDown={(event) => { if (slides.length > 1 && ["ArrowLeft", "ArrowRight"].includes(event.key)) { event.preventDefault(); move(event.key === "ArrowRight" ? 1 : -1); } }}>
      <div className={m.dialogContent}><div className={m.dialogToolbar}><h3 id={heading}>{businessName} · Gallery</h3><button type="button" onClick={() => dialog.current?.close()} aria-label="Close gallery">Close ×</button></div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={active.src} alt={active.label} decoding="async" />
        <div className={m.dialogFooter}><p aria-live="polite">{selected + 1} / {slides.length} · {active.label}</p>{slides.length > 1 ? <div><button type="button" onClick={() => move(-1)}>← Previous</button><button type="button" onClick={() => move(1)}>Next →</button></div> : null}</div><p className={m.photoNote}>Photography details and credits are in the concept footer.</p>
      </div>
    </dialog> : null}
  </>;
}
