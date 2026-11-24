import { serviceLabel } from "@/content/services";
import type { EnquiryInput } from "@/lib/validation";

export const NETLIFY_FORM_NAME = "aquacircle-service-request";
export const NETLIFY_FORM_ENDPOINT = "/__forms.html";
export const usesNetlifyForms =
  process.env.NEXT_PUBLIC_ENQUIRY_PROVIDER === "netlify";
export const SUBMISSION_ERROR =
  "Unable to submit your request right now. Please try again.";

export function serviceRequestSubject(
  name: string,
  service: EnquiryInput["service"],
) {
  return `New AquaCircle Service Request — ${name.replace(/[\r\n]+/g, " ")} — ${serviceLabel(service)}`;
}

export function netlifyFormData(
  values: EnquiryInput,
  requestId: string,
  submittedAt: Date,
) {
  const reference = `AC-${submittedAt.getUTCFullYear()}-${requestId.replace(/-/g, "").slice(0, 12).toUpperCase()}`;
  return new URLSearchParams({
    "form-name": NETLIFY_FORM_NAME,
    subject: serviceRequestSubject(values.name, values.service),
    reference,
    requestId,
    name: values.name,
    mobile: values.mobile,
    pin: values.pin,
    service: values.service,
    serviceType: serviceLabel(values.service),
    email: values.email || "",
    brand: values.brand || "",
    model: values.model || "",
    address: values.address || "",
    preferredDate: values.preferredDate || "",
    preferredTime: values.preferredTime || "",
    problem: values.problem || "",
    consent: values.consent
      ? "Agreed to be contacted about this request"
      : "Not agreed",
    submittedAt: submittedAt.toISOString(),
    submissionDate: new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "full",
      timeStyle: "long",
    }).format(submittedAt),
    source: "AquaCircle.in Website",
    sourceLocation: values.source,
    website: values.website || "",
  });
}

export async function submitEnquiry(
  values: EnquiryInput,
  requestId: string,
  submittedAt: Date,
  signal: AbortSignal,
  provider: "netlify" | "api" = usesNetlifyForms ? "netlify" : "api",
) {
  if (provider === "netlify") {
    const body = netlifyFormData(values, requestId, submittedAt);
    const response = await fetch(NETLIFY_FORM_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      signal,
    });
    // Netlify responds with HTML, not the JSON returned by the standalone API.
    if (!response.ok) throw new Error(SUBMISSION_ERROR);
    return body.get("reference")!;
  }

  const response = await fetch("/api/enquiries", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": requestId },
    body: JSON.stringify(values),
    signal,
  });
  if (!response.ok) throw new Error(SUBMISSION_ERROR);
  const data = await response.json();
  if (
    typeof data.reference !== "string" ||
    !/^AC-\d{4}-[A-F0-9]{12}$/.test(data.reference)
  ) {
    throw new Error(SUBMISSION_ERROR);
  }
  return data.reference as string;
}
