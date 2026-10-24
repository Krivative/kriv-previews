import s from "./notice.module.css";

// Guardrail 6: the same page for every unknown slug, with no link to other previews.
export default function NotFound() {
  return (
    <main className={s.notice}>
      <h1>Nothing here</h1>
      <p>
        This link is not valid. If you were expecting a preview, contact KRIV at{" "}
        <a href="https://kriv.agency">kriv.agency</a>.
      </p>
    </main>
  );
}
