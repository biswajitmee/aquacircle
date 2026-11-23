import Link from "next/link";
import { Eyebrow } from "./ui/eyebrow";
export function PageIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="container page-intro">
      <div className="breadcrumbs">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span>{eyebrow}</span>
      </div>
      <Eyebrow>{eyebrow.toUpperCase()}</Eyebrow>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
  );
}
