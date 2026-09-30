import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <main className="centered-shell">
      <section className="state-panel error-panel" role="alert">
        <p className="eyebrow">Sign-in interrupted</p>
        <h1>We could not finish signing you in.</h1>
        <p>Please return to the course catalog and try Google sign-in again.</p>
        <Link href="/">Return home</Link>
      </section>
    </main>
  );
}
