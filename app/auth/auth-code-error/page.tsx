import Link from "next/link";
import { Text } from "@/src/components/language-provider";

export default function AuthCodeErrorPage() {
  return (
    <main className="centered-shell">
      <section className="state-panel error-panel" role="alert">
        <p className="eyebrow"><Text id="interrupted"/></p>
        <h1><Text id="authError"/></h1>
        <p><Text id="retryLogin"/></p>
        <Link href="/"><Text id="returnHome"/></Link>
      </section>
    </main>
  );
}
