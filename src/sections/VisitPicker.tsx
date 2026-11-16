"use client";

import { useState } from "react";
import c from "./clinic-journey.module.css";

// Level two's opening question (2026-11-16, premium tour): "What brings you in?" The answer changes one
// line and points to one next step. No clinical claims: each line only says what to do when booking.
const reasons = [
  { id: "checkup", label: "A check-up or cleaning", line: "Book a regular visit. The clinic checks each tooth and cleans what brushing misses." },
  { id: "pain", label: "Tooth pain", line: "Say it hurts when you book, so the clinic can see you as soon as it can." },
  { id: "smile", label: "A brighter smile", line: "Ask about the options at your visit. The dentist explains each one before anything starts." },
  { id: "kids", label: "My child's teeth", line: "Book a visit for your child. Early, gentle visits make the next ones easier." },
  { id: "other", label: "Something else", line: "Send a message with your question, and the clinic will tell you where to start." },
];

export function VisitPicker({ book }: { book: React.ReactNode }) {
  const [pick, setPick] = useState("checkup");
  const reason = reasons.find((r) => r.id === pick) ?? reasons[0];
  return <div className={c.picker}>
    <p className={c.pickerLabel}>What brings you in?</p>
    <div role="group" aria-label="What brings you in?" className={c.pickerChips}>
      {reasons.map((r) => <button key={r.id} type="button" aria-pressed={pick === r.id} onClick={() => setPick(r.id)}>{r.label}</button>)}
    </div>
    <p className={c.pickerLine} aria-live="polite">{reason.line}</p>
    <p className={c.next}>{book}</p>
  </div>;
}
