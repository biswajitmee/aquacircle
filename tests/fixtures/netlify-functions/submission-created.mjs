// Local Netlify Dev fixture only. Production functions live in netlify/functions/.
// Emulate the submission-created event without sending email or contacting Netlify.
import { mkdir, writeFile } from "node:fs/promises";
export async function handler(event) {
  const { payload } = JSON.parse(event.body);
  if (payload?.data?.["form-name"] !== "aquacircle-service-request") {
    return { statusCode: 400, body: "Unknown local test form" };
  }
  await mkdir(".data/netlify-forms-qa", { recursive: true });
  await writeFile(".data/netlify-forms-qa/latest.json", JSON.stringify(payload));
  return { statusCode: 200, body: "Local form submission captured; no email sent." };
}
