import s from "../notice.module.css";

// Guardrail 5: shown once a lead's expiresAt has passed. Names no business.
export function Expired() {
  return (
    <main className={s.notice}>
      <h1>This preview has expired</h1>
      <p>
        Concept previews from KRIV are available for a limited time. To see it again, contact KRIV at{" "}
        <a href="https://kriv.agency">kriv.agency</a>.
      </p>
    </main>
  );
}
