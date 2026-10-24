import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Concept preview by KRIV",
  // Guardrail 1: previews are never indexed. next.config.ts also sends X-Robots-Tag.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
