"use client";

import { useId, useRef, useState } from "react";
import m from "./signature.module.css";

type GalleryPhoto = { src: string; label: string };

// A small client boundary for the modal only. Native dialog handles focus and Escape.
export function GalleryViewer({ businessName, photos }: { businessName: string; photos: GalleryPhoto[] }) {
  const [current, setCurrent] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useId();
  const selected = Math.min(current, photos.length - 1);
  const active = photos[selected];
  if (!active) return null;
  const move = (direction: number) => setCurrent((index) => (Math.min(index, photos.length - 1) + direction + photos.length) % photos.length);
  return <>
    <div className={m.editorialGrid} data-count={photos.length}>{photos.map((photo, i) => <figure key={`${photo.src}-${i}`} className={m.editorialPhoto}>
      <button type="button" className={m.imageButton} aria-label={`Open image: ${photo.label}`} aria-haspopup="dialog" onClick={() => { setCurrent(i); dialog.current?.showModal(); }}>
        {/* Existing credited URLs remain hotlinked; no third-party image or animation SDK. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.src} alt={photo.label} loading="lazy" decoding="async" />
        <span className={m.imageOpen}>View image <span aria-hidden="true">↗</span></span>
      </button><figcaption><span>{String(i + 1).padStart(2, "0")}</span>{photo.label}</figcaption>
    </figure>)}</div>
    <dialog ref={dialog} className={m.galleryDialog} aria-labelledby={heading} onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }} onKeyDown={(event) => { if (photos.length > 1 && ["ArrowLeft", "ArrowRight"].includes(event.key)) { event.preventDefault(); move(event.key === "ArrowRight" ? 1 : -1); } }}>
      <div className={m.dialogContent}><div className={m.dialogToolbar}><h3 id={heading}>{businessName} · Gallery</h3><button type="button" onClick={() => dialog.current?.close()} aria-label="Close gallery">Close ×</button></div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={active.src} alt={active.label} decoding="async" />
        <div className={m.dialogFooter}><p aria-live="polite">{selected + 1} / {photos.length} · {active.label}</p>{photos.length > 1 ? <div><button type="button" onClick={() => move(-1)}>← Previous</button><button type="button" onClick={() => move(1)}>Next →</button></div> : null}</div><p className={m.photoNote}>Photography details and credits are in the concept footer.</p>
      </div>
    </dialog>
  </>;
}
