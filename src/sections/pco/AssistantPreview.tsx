"use client";

import { useState } from "react";
import styles from "./pco.module.css";

const prompts = [
  {
    label: "Location",
    question: "Where is the clinic?",
    answer: "You can find PCO Dental Clinic at Carlos Perez Building, Door 3, on A.C. Cortes Avenue in Barangay Ibabao-Estancia, Mandaue City.",
    result: "Answered from the clinic’s details",
  },
  {
    label: "Appointment",
    question: "Can I ask about a visit?",
    answer: "The clinic team can help you find a time and confirm your visit. I’d hand this request to the team.",
    result: "Clinic team confirms the appointment",
  },
  {
    label: "Dental concern",
    question: "Can you tell me what treatment I need?",
    answer: "A dentist can help with that question. I’d pass you to the clinic team so they can tell you how to speak with a dentist.",
    result: "Referred to the clinic team",
  },
];

export function AssistantPreview() {
  const [active, setActive] = useState(0);
  const prompt = prompts[active];
  return (
    <div className={styles.chat}>
      <div className={styles.chatHeader}>
        <strong>PCO inquiry assistant</strong>
        <span>Interactive demo</span>
      </div>
      <div className={styles.chatChoices} aria-label="Sample questions">
        {prompts.map(({ label }, index) => (
          <button key={label} type="button" aria-pressed={active === index} onClick={() => setActive(index)}>{label}</button>
        ))}
      </div>
      <div className={styles.chatMessages} aria-live="polite" aria-atomic="true">
        <p className={styles.chatQuestion}>{prompt.question}</p>
        <p className={styles.chatAnswer}>{prompt.answer}</p>
        <p className={styles.chatStatus}>{prompt.result}</p>
      </div>
      <p className={styles.chatPrivacy}>Sample questions only. This demo collects no information.</p>
    </div>
  );
}
