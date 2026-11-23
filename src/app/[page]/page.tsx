import Link from "next/link";
import { notFound } from "next/navigation";
import { policies } from "@/content/policies";
import { PageIntro } from "@/components/page-intro";
import { pageMetadata } from "@/lib/metadata";
function getPolicy(page: string) {
  return Object.prototype.hasOwnProperty.call(policies, page)
    ? policies[page as keyof typeof policies]
    : null;
}
export function generateStaticParams() {
  return Object.keys(policies).map((page) => ({ page }));
}
export const dynamicParams = false;
export async function generateMetadata({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  const policy = getPolicy(page);
  return policy
    ? pageMetadata(policy.title, policy.description, `/${page}`)
    : {};
}
export default async function Policy({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  const policy = getPolicy(page);
  if (!policy) notFound();
  return (
    <>
      <PageIntro
        eyebrow="Information"
        title={policy.title}
        description={policy.description}
      />
      <article className="container prose">
        {policy.sections.map((section) => (
          <section
            key={section.title}
            id={"id" in section ? section.id : undefined}
          >
            <h2>{section.title}</h2>
            <p>{section.text}</p>
          </section>
        ))}
        <p className="policy-note">
          Have a question? <Link href="/contact">Contact AquaCircle</Link> and
          include your enquiry reference if you have one.
        </p>
      </article>
    </>
  );
}
