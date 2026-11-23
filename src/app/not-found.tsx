import Link from "next/link";
export default function NotFound() {
  return (
    <section className="container error-page">
      <p className="eyebrow">404 — PAGE NOT FOUND</p>
      <h1>
        Let’s get you
        <br />
        back on course.
      </h1>
      <p>This page may have moved. Find the water care you need below.</p>
      <Link className="button" href="/">
        Back to AquaCircle
      </Link>
    </section>
  );
}
